<?php
define('OUTPUT_DIR', '/var/www/video/contents/');

function md5ToPath($md5) {
	$split = array();
	for ($i = 0; $i < 4; ++$i) {
		$split[] = substr($md5, ($i * 2), 2);
	}
	$path = OUTPUT_DIR.implode($split, '/').'/'.$md5.'.mp4';
	return $path;
}

function md5VttPath($md5) {
	$split = array();
	for ($i = 0; $i < 4; ++$i) {
		$split[] = substr($md5, ($i * 2), 2);
	}
	$path = VTT_PATH.implode($split, '/').'/'.$md5.'.vtt';
	return $path;
}

function createLink($fromPath) {
	$md5 = md5($fromPath);
	$linkPath = md5ToPath($md5);
	if (!file_exists(dirname($linkPath))) {
		mkdir(dirname($linkPath), 0755, true);
	}
	if (file_exists($linkPath)) {
		unlink($linkPath);
	}
	symlink($fromPath, $linkPath);
	return $linkPath;
}

function countIn($path) {
	$dp = opendir($path);
	$count = 0;
	if ($dp === false) {
		return 0;
	}
	while (false !== ($file = readdir($dp))) {
		if (strpos($file, '.') !== 0 && is_dir($path.'/'.$file)) {
			$count += countIn($rootDir.'/'.$file);
		} else if (isMp4($path.'/'.$file) || isMkv($path.'/'.$file)) {
			$count += 1;
		}
	}
	closedir($dp);
	return $count;
}

function sizeIn($path) {
	$dp = opendir($path);
	$size = 0;
	if ($dp === false) {
		return 0;
	}
	while (false !== ($file = readdir($dp))) {
		if (strpos($file, '.') !== 0 && is_dir($path.'/'.$file)) {
			$size += sizeIn($path.'/'.$file);
		} else if (isMp4($path.'/'.$file) || isMkv($path.'/'.$file)) {
			$size += filesize($path.'/'.$file);
		}
	}
	closedir($dp);
	return number_format($size / 1024 / 1024);
}

function searchByName($titles, $str) {
	$newTitles = [];
	
	foreach ($titles as $t) {
		if (mb_strpos($t->name, $str) !== false) {
			$newTitles[] = $t;
		}
	}
	return $newTitles;
}

function findVideo($path) {
	$dp = opendir($path);
	$files = [];
	if ($dp === false) {
		return [];
	}
	while (false !== ($file = readdir($dp))) {
		if (isMp4($path.'/'.$file) || isMkv($path.'/'.$file)) {
			$files[] = $file;
		}
	}
	closedir($dp);
	usort($files, 'sortByName');
	return $files;
}

function isPlayable($path) {
	$command = FFMPEG_BINARY.' -i "'.$path.'" 2>&1';
	$pattern = 'h264 (High 10)';
	if (isMp4($path)) {
		if (strpos($path, '/ts/') !== false) {
			return true;
		}
		exec($command, $output);
		foreach ($output as $line) {
			if (strpos($line, $pattern) !== false) {
				return false;
			}
		}
		return true;
	}
	return false;
}

function isMp4($path) {
	if (is_file($path) && (strpos($path, '.mp4') !== false)) {
		return true;
	}
	return false;
}

function isMkv($path) {
	if (is_file($path) && (strpos($path, '.mkv') !== false)) {
		return true;
	}
	return false;
}

function sortByUpdateDate($a, $b) {
	return strtotime($a->updateDate) < strtotime($b->updateDate);
}

function sortByFileName($a, $b) {
	$movies = array('.mp4', '.mkv', '.ts', '.avi');
	$ax = 0;
	$bx = 0;
	foreach ($movies as $mov) {
		if (strpos($a->name, $mov) !== false) {
			$ax = -1;
			break;
		}
	}
	foreach ($movies as $mov) {
		if (strpos($b->name, $mov) !== false) {
			$bx = -1;
			break;
		}
	}
	if ($ax < $bx) {
		return -1;
	} else if ($ax > $bx) {
		return 1;
	}
	return strcmp($a->name, $b->name);
}

function sortByName($a, $b) {
	return strcmp($a, $b);
}

function sortByStartDate($a, $b) {
	return strtotime($a->date['start']) > strtotime($b->date['start']);
}

function playUrl($path) {
	$path = str_replace('//', '/', $path);
	$md5 = md5($path);
	$url = '/play/?c='.$md5;
	createLink($path);
	return $url;
}

function realAnimeUrl($path) {
	$path = str_replace('//', '/', $path);
	$path = str_replace('/mnt/anime/', '', $path);
	$path = str_replace('/', '##', $path);
	$c = rawurlencode($path);
	$url = '/realanime/'.$c.'/watch.webm';
	return $url;
}

function parseDir($rootDir, $sortBy) {
	$rawFiles = scandir($rootDir);
	$titles = [];
	foreach ($rawFiles as $t) {
		if (strpos($t, '.') !== 0) {
			if (is_dir($rootDir.'/'.$t)) {
				$count = countIn($rootDir.$t);
				if ($count > 0) {
					$titles[$k] = new StdClass;
					$titles[$k]->name = $t;
					$titles[$k]->subName = null;
					$titles[$k]->fullPath = realpath($rootDir.'/'.$t).'/';
					$titles[$k]->playUrl = null;
					$titles[$k]->count = $count;
					$titles[$k]->size = sizeIn($rootDir.$t);
					$titles[$k]->updateDate = date(
						'Y-m-d H:i:s', filemtime($rootDir.$t)
					);
					$titles[$k]->files = findVideo($rootDir.$t);
					$titles[$k]->isFile = false;
					$titles[$k]->realAnimeUrl = null;
					$titles[$k]->isPlayable = false;
					++$k;
				}
			} else {
				$size = filesize($rootDir.'/'.$t);
				if ($size < 1024 * 1024) {
					continue;
				}
				$titles[$k] = new StdClass;
				$titles[$k]->name = replaceName($t);
				$titles[$k]->subName = getSubName($titles[$k]->name);
				$titles[$k]->fullPath = $rootDir.$t;
				$titles[$k]->playUrl = playUrl($rootDir.'/'.$t);
				$titles[$k]->count = 1;
				$titles[$k]->size = number_format($size / 1024 / 1024);
				$titles[$k]->updateDate = date(
					'Y-m-d H:i:s', filemtime($rootDir.'/'.$t)
				);
				$titles[$k]->files = [];
				$titles[$k]->isFile = true;
				$titles[$k]->isPlayable = isPlayable($rootDir.$t);
				if (!$titles[$k]->isPlayable) {
					$titles[$k]->realAnimeUrl = realAnimeUrl($rootDir.$t);
				} else {
					$titles[$k]->realAnimeUrl = null;
				}
				++$k;	
			}
		}
	}
	usort($titles, $sortBy);
	return $titles;
}

function parseRules($rules) {
	$titles = array();

	foreach ($rules as $k => $rule) {
		$titles[$k] = new StdClass;
		$titles[$k]->name = implode(' ', $rule->reserve_titles);
		$titles[$k]->channel = findChannel(reset($rule->channels));
	}
	return $titles;
}

function parsePrograms($programs) {
	$reserves = getReserves();
	$titles = array();
	$k = 0;
	foreach ($programs as $program) {
		$name = '';
		$name = mb_convert_kana($program->fullTitle, 'KVnsr');
		if (trim($name) == '') {
			$name = mb_convert_kana($program->title, 'KVnsr');
		}
		if (trim($name) == '') {
			continue;
		}
		$startTime = intval($program->start / 1000);
		if ($startTime < time() + (60 * 3)) {
			continue;
		}
		$titles[$k] = new StdClass;
		$titles[$k]->id = $program->id;
		$titles[$k]->name = $name;
		$titles[$k]->date = array(
			'start' => date('Y-m-d H:i', intval($program->start / 1000)),
			'end' => date('Y-m-d H:i', intval($program->end / 1000))
		);
		$titles[$k]->duration = round($program->seconds / 60).'分';
		$titles[$k]->channel = findChannel($program->channel->id);
		$titles[$k]->isReserve = in_array($program->id, $reserves);
		++$k;
	}
	 usort($titles, 'sortByStartDate');
	 return $titles;
}

function findChannel($id = false) {
	$key = 'channels';
	$data = apcu_fetch($key);
	if ($id == false) {
		$channelIds = json_decode(
			file_get_contents(dirname(__FILE__).'/channels.json')
		);
		$data = array();
		foreach ($channelIds as $cid => $n) {
			$data[$cid] = findChannel($cid);
		}
		apcu_store($key, $data, 86400 * 2);
		return $data;
	}
	if (isset($data[$id])) {
		return $data[$id];
	}
	$url = CHINACHU_CHANNEL.$id.'.json';
	$channel = getChinachu($url);
	$data[$id] = new StdClass;
	$data[$id]->id = $id;
	$data[$id]->name = mb_convert_kana($channel->name, 'KVnsr');
	$data[$id]->channel = $channel->channel;
	$data[$id]->type = $channel->type;
	if ($channel->hasLogoData) {
		if (!file_exists(CHANNEL_DIR.$id.'.png')) {
			file_put_contents(CHANNEL_DIR.$id.'.png', getChannelLogo($id));
		}
		$data[$id]->logo = '/img/channels/'.$id.'.png';
	} else {
		if (file_exists(CHANNEL_DIR.$id.'.png')) {
			$data[$id]->logo = '/img/channels/'.$id.'.png';
		} else {
			$data[$id]->logo = '/img/channels/unknown.png';
		}
	}
	apcu_store($key, $data, 86400 * 2);
	return $data[$id];
}

function replaceName($str) {
	$str = mb_convert_kana($str, 'KVns');
	$str = preg_replace(
		array(
			'/\[[0-9]+\-[0-9]+\]/',
			'/\[[GR|BS].*\]/',
			'/GR[0-9]+_[0-9]+_/'
		),
		'',
		$str
	);
	if (preg_match('/#\.(mp4|ts|mkv|avi)$/', $str, $matches)) {
		return mb_convert_kana($matches[1], 'KVa');
	}
	return mb_convert_kana($str, 'KVa');
}

function getSubName($str) {
	$tmp = explode('.', $str);
	$name = str_replace('.'.$tmp[1], '', $str);
	$tmp = explode('#', $name);
	if (isset($tmp[1]) && strlen($tmp[1]) > 0) {
		return $tmp[1];
	}
	return null;
}

function replaceUnknown($string) {
	return preg_replace (
		'/[^\x{0009}\x{000a}\x{000d}\x{0020}-\x{D7FF}\x{E000}-\x{FFFD}]+/u',
		' ',
		$string
	);
}

function getChinachu($url) {
	$user = CHINACHU_USER;
	$pass = CHINACHU_PASS;
	$url = CHINACHU_HOST.$url;
	$options = array(
		'http' => array(
			'method' => 'GET',
			'header' => 'Authorization: Basic '.base64_encode("$user:$pass")
		)
	);
	$context = stream_context_create($options);
	$str = file_get_contents($url, false, $context);
	return json_decode(replaceUnknown($str));
}

function putChinachu($url) {
	$user = CHINACHU_USER;
	$pass = CHINACHU_PASS;
	$url = CHINACHU_HOST.$url;
	$options = array(
		'http' => array(
			'ignore_errors' => true,
			'method' => 'PUT',
			'header' => 'Authorization: Basic '.base64_encode("$user:$pass")
		)
	);
	$context = stream_context_create($options);
	$str = file_get_contents($url, false, $context);
	preg_match(
		'/HTTP\/1\.[0|1|x] ([0-9]{3})/',
		$http_response_header[0],
		$matches
	);
	$statusCode = $matches[1];
	return $statusCode;
}

function getChannelLogo($id) {
	$user = CHINACHU_USER;
	$pass = CHINACHU_PASS;
	$url = CHINACHU_HOST.CHINACHU_LOGO.$id.'/logo.png';
	$options = array(
		'http' => array(
			'method' => 'GET',
			'header' => 'Authorization: Basic '.base64_encode("$user:$pass")
		)
	);
	$context = stream_context_create($options);
	return file_get_contents($url, false, $context);
}

function getReserves() {
	$user = CHINACHU_USER;
	$pass = CHINACHU_PASS;
	$url = CHINACHU_HOST.CHINACHU_RESERVES;
	$options = array(
		'http' => array(
			'method' => 'GET',
			'header' => 'Authorization: Basic '.base64_encode("$user:$pass")
		)
	);
	$context = stream_context_create($options);
	$str = file_get_contents($url, false, $context);
	$reserves = json_decode(replaceUnknown($str));
	$id = [];
	foreach ($reserves as $r) {
		$id[] = $r->id;
	}
	return $id;
}

function getProgram($id) {
	$url = CHINACHU_PROGRAM.$id.'.json';
	return getChinachu($url);
}

function reserveProgram($id) {
	$url = CHINACHU_PROGRAM.$id.'.json';
	return putChinachu($url);
}

function getAudioType($file) {
	$explode = explode('.', $file);
	$ext = strtolower(end($explode));
	if (in_array($ext, array('mp4', 'm4a'))) {
		return 'audio/mp4';
	} else if (in_array($ext, array('mp3'))) {
		return 'audio/mpeg';
	}
	return null;
}

function esEncodeUrl($str) {
	return preg_replace('/%/','_',
		rawurlencode(base64_encode(gzcompress($str, 9))));
}

function esDecodeUrl($str) {
	return gzuncompress(base64_decode(
		rawurldecode(preg_replace('/_/', '%', $str))));
}

function findShortUrl($urls, $value) {
	foreach ($urls as $k => $v) {
		if ($v === $value) {
			return $k;
		}
	}
	return false;
}

function eszEncodeUrl($str) {
	try {
		if (!file_exists(URL_SHORTER_FILE)) {
			file_put_contents(URL_SHORTER_FILE, '{}');
		}
		$urls = json_decode(file_get_contents(URL_SHORTER_FILE), true);
	} catch (Exception $e) {
		$urls = array();
	}
	$base64 = base64_encode($str);
	if (($exist = findShortUrl($urls, $base64)) !== false) {
		return $exist;
	}
	$seeds = array_merge(range('a', 'z'), range('A', 'Z'), range('0', '9'));
	$c = '';
	for ($i = 0; $i < URL_SHORTER_LENGTH; ++$i) {
		$c .= $seeds[mt_rand(0, count($seeds) - 1)];
	}
	while (isset($urls[$c])) {
		$c .= $seeds[mt_rand(0, count($seeds) - 1)];
	}
	$urls[$c] = $base64;
	file_put_contents(URL_SHORTER_FILE, json_encode($urls));
	return $c;
}

function eszDecodeUrl($c) {
	try {
		$str = file_get_contents(URL_SHORTER_FILE);
		$urls = json_decode($str, true);
	} catch (Exception $e) {
		$urls = array();
	}
	if (isset($urls[$c])) {
		return base64_decode($urls[$c]);
	}
	return false;
}

function searchFromPlaylist($playlist, $keyword) {
	$res = array();
	foreach ($playlist as $k => $pl) {
		if (strpos($pl['artist'], $keyword) !== false) {
			$res[] = $playlist[$k];
			continue;
		}
		if (strpos($pl['album'], $keyword) !== false) {
			$res[] = $playlist[$k];
			continue;
		}
		foreach ($pl['files'] as $fl) {
			if (strpos($fl['title'], $keyword) !== false) {
				$res[] = $playlist[$k];
				break;
			}
			if (
				isset($fl['artist']) &&
				strpos($fl['artist'], $keyword) !== false
			) {
				$res[] = $playlist[$k];
				break;
			}
		}
	}
	return $res;
}
?>
