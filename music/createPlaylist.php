<?php
include dirname(__FILE__).'/../common/settings.php';
include dirname(__FILE__).'/../common/functions.php';

$blackList = array(
	'湯バード', 'string.tokyo', 'yubird.com'
);

$fource = isset($argv[1])? true: false;

function isPlayableMusic($str) {
	if (strpos($str, '.m4a') !== false ||
			strpos($str, '.mp3') !== false ||
			strpos($str, '.mp4') !== false
	) {
		return true;
	}
	return false;
}

function isDotFile($fileName) {
	$dotExp = '/^\./';
	if (preg_match($dotExp, $fileName)) {
		return true;
	}
	return false;
}

function scanItems($path, $type) {
	$items = array();
	$dp = opendir($path);
	if ($type == 'dir') {
		while (($p = readdir($dp)) !== false) {
			if (is_dir($path.'/'.$p) && !isDotFile($p)) {
				$items[] = $p;
			}
		}
	} else {
		while (($p = readdir($dp)) !== false) {
			if (is_file($path.'/'.$p) && isPlayableMusic($p)) {
				$items[] = $p;
			}
		}
	}
	closedir($dp);
	usort($items, 'strnatcmp');
	return $items;
}

function getMusicInfo($file) {
	global $blackList;
	$shortFile = str_replace(ITUNES_PATH, '', $file);
	$info = array(
		'size' => filesize($file),
		'title' => null,
		'track' => null,
		'duration' => null,
		'artist' => null,
		'albumArtist' => null,
		'album' => null,
		'created' => null,
		'year' => null,
		'updated' => date('Y-m-d H:i', filemtime($file)),
		'file' => '/music/play/?c='.eszEncodeUrl($shortFile),
		'type' => null,
		'bitrate' => null
	);
	$command = FFPROBE_BINARY.' -hide_banner -i "'.$file.'" 2>&1';
	exec($command, $output, $ret);
	if ($ret !== 0) {
		var_dump($file);exit;
	}
	$y = explode('.', $file);
	$ext = strtolower(end($y));
	foreach ($output as $line) {
		$tmpLine = trim($line);
		$maches = array();
		$regExp = '/title.[^:]+: (.*)$/';
		if ($info['title'] == null &&
				preg_match($regExp, $tmpLine, $matches)
		) {
			$info['title'] = $matches[1];
		}
		$regExp = '/track.[^:]+: (.*)$/';
		if ($info['track'] == null &&
				preg_match($regExp, $tmpLine, $matches)
		) {
			$info['track'] = $matches[1];
		}
		$regExp = '/album .[^:]+: (.*)$/';
		if ($info['album'] == null &&
				preg_match($regExp, $tmpLine, $matches)
		) {
			$info['album'] = $matches[1];
		}
		$regExp = '/Duration: ([0-9|:|\.]+)/';
		if (preg_match($regExp, $tmpLine, $matches)) {
			$d = explode('.', $matches[1]);
			$info['duration'] = current($d);
		}
		$regExp = '/^album_artist.[^:]+: (.*)$/';
		if ($info['albumArtist'] == null &&
				preg_match($regExp, $tmpLine, $matches)
		) {
			$info['albumArtist'] = $matches[1];
		}
		$regExp = '/^artist.[^:]+: (.*)$/';
		if ($info['artist'] == null &&
				preg_match($regExp, $tmpLine, $matches)
		) {
			$info['artist'] = $matches[1];
		}
		$regExp = '/^purchase_date.[^:]+: '
			.'([0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2})$/';
		if ($ext == 'm4a' &&
				preg_match($regExp, $tmpLine, $matches)
		) {
			$info['created'] = $matches[1];
		}
		$regExp = '/^date .[^:]+: ([0-9]{4}\/[0-9]{2}\/[0-9]{2})$/';
		if ($ext == 'm4a' && preg_match($regExp, $tmpLine, $matches)) {
			$info['created'] = $matches[1].' 00:00:00';
		}
		$regExp = '/^creation_time.[^:]+: (.*)$/';
		if (($ext == 'mp4' || $ext == 'm4a') &&
				$info['created'] == null &&
				preg_match($regExp, $tmpLine, $matches)
		) {
			$x = explode('.', str_replace('T', ' ', $matches[1]));
			$info['created'] = current($x);
		}
		$regExp = '/^TYER .[^:]+: ([0-9]{4}\/[0-9]{2}\/[0-9]{2})$/';
		if (($ext === 'mp3' || $ext === 'm4a') &&
				$info['created'] == null &&
				preg_match($regExp, $tmpLine, $matches)
		) {
			$info['created'] = $matches[1].' 00:00:00';
		}
		$regExp = '/^TYER .[^:]+: ([0-9]{4}-[0-9]{2}-[0-9]{2})$/';
		if (($ext === 'mp3' || $ext === 'm4a') &&
				$info['created'] == null &&
				preg_match($regExp, $tmpLine, $matches)
		) {
			$info['created'] = $matches[1].' 00:00:00';
		}
		$regExp = '/^date .[^:]+: ([0-9]{4}\.[0-9]{2}\.[0-9]{2})$/';
		if (preg_match($regExp, $tmpLine, $matches)) {
			$info['created'] = $matches[1].' 00:00:00';
		}
		$regExp = '/^date .[^:]+: ([0-9]{4})$/';
		if ($info['year'] == null &&
				preg_match($regExp, $tmpLine, $matches)
		) {
			$info['year'] = $matches[1];
		}
		$regExp = '/^Stream.*Audio: (aac|mp3).*, ([0-9]{2,3}) kb\/s/';
		if ($info['type'] == null &&
			preg_match($regExp, $tmpLine, $matches)
		) {
			$info['type'] = strtoupper($matches[1]);
			$info['bitrate'] = $matches[2];
		}
	}
	if ($info['title'] == null || $info['duration'] == null) {
		return false;
	}
	if ($info['artist'] == null && $info['albumArtist'] != null) {
		$info['artist'] = $info['albumArtist'];
	} else if ($info['albumArtist'] == null && $info['artist'] != null) {
		$info['albumArtist'] = $info['artist'];
	}

	foreach ($blackList as $bl) {
		if (strpos($info['albumArtist'], $bl) !== false) {
			return false;
		}
		if (strpos($info['artist'], $bl) !== false) {
			return false;
		}
		if (strpos($info['title'], $bl) !== false) {
			return false;
		}
		if (strpos($info['album'], $bl) !== false) {
			return false;
		}
	}
	if ($info['created'] !== null && $info['year'] !== null) {
		$info['created'] = $info['year'].'-'.substr(
			date('Y-m-d H:i-s', strtotime($info['created'])), 5
		);
	}
	if (date('Y', strtotime($info['created'])) > date('Y')) {
		$lastY = date('Y', strtotime('updated'));
		$info['created'] = $lastY.'-'.substr(
			date('Y-m-d H:i-s', strtotime($info['created'])), 5
		);
	}
	if (date('Y', strtotime($info['created'])) > date('Y')) {
		$info['created'] = '2007-'
			.date('m-d H:i:s', strtotime($info['created']));
	}
	return $info;
}

function moveCover($from, $to) {
	$command = FFMPEG_BINARY.' -y -i "'.$from.'" '
		.'-vf scale=-1:320 -q 4 '.$to.' 2>&1';
	exec($command, $output, $res);
	unlink($from);
	return ($res == 0);
}

function getCover($albumPath, $file) {
	$explode = explode('.', $file);
	$ext = strtolower(end($explode));
	$md5 = md5($albumPath);
	$path = COVERART_DIR;
	$split = [];
	for ($i = 0; $i < 4; ++$i) {
		$split[] = substr($md5, ($i * 2), 2);
	}
	$path .= implode($split, '/').'/';
	$image = null;
	if (file_exists($path)) {
		$files = glob($path.'*.{jpg,png,JPG,PNG}', GLOB_BRACE);
		foreach ($files as $file) {
			$tFile = basename($file);
			if (strpos(strtolower($tFile), $md5) !== false) {
				$image = $tFile;
				break;
			}
		}
	} else {
		mkdir($path, 0755, true);
	}
	if ($image == null) {
		if ($ext === 'm4a' || $ext === 'mp4') {
			$command = MP4BOX_BINARY.' -dump-cover "'
				.$albumPath.$file.'" 2>&1';
			exec($command, $output, $ret);
			if ($ret == 0) {
				$dp = opendir($albumPath);
				$files = array();
				while (($px = readdir($dp)) !== false) {
					if (is_file($albumPath.'/'.$px)) {
						$files[] = $albumPath.'/'.$px;
					}
				}
				closedir($dp);
				foreach ($files as $file) {
					$lower = strtolower($file);
					$explode = explode('.', $lower);
					$ext = end($explode);
					if ($ext == 'png' || $ext == 'jpg') {
						$image = $md5.'.jpg';
						$toPath = $path.$image;
						moveCover($file, $toPath);
						break;
					}
				}
			}
		} else if ($ext === 'mp3') {
			$image = $md5.'.jpg';
			$toPath = $path.$image;
			$command = FFMPEG_BINARY.' -y -i "'
				.$albumPath.$file.'" -an -f image2 '
				.'-vf scale=-1:320 '.$toPath.' 2>&1';
			exec($command, $output, $ret);
			if ($ret != 0) {
				$image = null;
			}
		}
	}
	if ($image != null) {
		return '/img/cover/'.implode($split, '/').'/'.$image;
	}
	return null;
}

if (file_exists(dirname(__FILE__).'/playlist.json')) {
	$playlist = json_decode(file_get_contents(
		dirname(__FILE__).'/playlist.json'
	), true);
} else {
	$playlist = array();
}
$dirTime = filemtime(ITUNES_PATH.'.');
if ($fource || !isset($playlist['updated'])) {
	$playlist = array(
		'updated' => date('Y-m-d H:i:s', $dirTime),
		'countFiles' => 0,
		'items' => array()
	);
} else {
	$playlistTime = strtotime($playlist['updated']);
	if ($dirTime > $playlistTime) {
		$playlist['updated'] = date('Y-m-d H:i:s');
	} else {
		exit;
	}
}
$items = array();
$artists = scanItems(ITUNES_PATH, 'dir');
$countFiles = 0;
$k = 0;
$path1 = null;
$totalSize = 0;
foreach ($artists as $k1 => $v1) {
	$path1 = ITUNES_PATH.$v1.'/';
	$albums = scanItems($path1, 'dir');
	foreach ($albums as $k2 => $v2) {
		$path2 = $path1.$v2.'/';
		$tmpFiles = scanItems($path2, 'file');
		$files = array();
		$image = null;
		$items[$k] = array();
		$albumUpdated = 0;
		$titles = array();
		foreach ($tmpFiles as $k3 => $v3) {
			$file = $path2.$v3;
			$tmp = getMusicInfo($file);
			if ($tmp === false) {
				continue;
			}
			if (in_array($tmp['title'], $titles)) {
				continue;
			}
			$titles[] = $tmp['title'];
			$albumName = $tmp['album'];
			unset($tmp['album']);
			$artistName = $tmp['albumArtist'];
			unset($tmp['albumArtist']);
			if ($albumUpdated < strtotime($tmp['created'])) {
				$albumUpdated = strtotime($tmp['created']);
			}
			$files[$k3] = $tmp;
			if ($image == null) {
				$image = getCover($path2, $v3);
				$items[$k]['image'] = $image;
			}
			$totalSize += $tmp['size'];
		}
		if ($image == null) {
			$items[$k]['image'] = '/img/cover/unknown.png';
		}
		if (count($files) == 0) {
			unset($items[$k]);
			continue;
		}
		$items[$k]['id'] = eszEncodeUrl($path2);
		$items[$k]['album'] = $albumName;
		$items[$k]['artist'] = $artistName;
		$items[$k]['files'] = $files;
		$items[$k]['updated'] = $albumUpdated;
		$items[$k]['date'] = date('Y-m', $albumUpdated);
		$countFiles += count($files);
		++$k;
	}
}

usort($items, function($a, $b) {
	if ($a['updated'] < $b['updated']) {
		return 1;
	} else if ($a['updated'] > $b['updated']) {
		return -1;
	}
	return 0;
});

$playlist['totalSize'] = number_format(
	$totalSize / 1024 / 1024 / 1024, 2
);
$playlist['items'] = $items;
$playlist['countFiles'] = strval($countFiles);
$json = json_encode(
	$playlist,
	JSON_UNESCAPED_UNICODE|
	JSON_HEX_AMP|
	JSON_HEX_QUOT|
	JSON_HEX_APOS|
	JSON_UNESCAPED_SLASHES|
	JSON_BIGINT_AS_STRING|
	JSON_PARTIAL_OUTPUT_ON_ERROR
);
if ($json === false) {
	echo json_last_error_msg()."\n";
	exit;
}
file_put_contents(dirname(__FILE__).'/playlist.json', $json);
?>
