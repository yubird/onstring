<?php
include dirname(__FILE__).'/../../common/settings.php';
include dirname(__FILE__).'/../../common/functions.php';

function liked($words, $word) {
	foreach ($words as $key => $v) {
		if ($v !== $word && strpos($v->word, $word) !== false) {
			return $key;
		}
	}
	return false;
}

$tags = apcu_fetch('tags');
if ($tags !== false) {
	header('Content-Type: application/json;charset=UTF-8');
	header('Cache-Control: no-cache');
	echo json_encode($tags, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
	exit;
}

$rootDir = ROOT_TV;
$files = scandir($rootDir);
usort($files, function($a, $b) {
	$lenA = strlen($a);
	$lenB = strlen($b);
	if ($lenA == $lenB) {
		return 0;
	} else if ($lenA < $lenB) {
		return 1;
	}
	return -1;
});
$words = array();
$seps = array(
	'▽', '・', '／', ' ', '『'
);
$after = array(
	'？'
);

foreach ($files as $file) {
	if ($file === '.' || $file === '..' || strpos($file, '.') === 0) {
		continue;
	}
	if (!is_file($rootDir.$file)) {
		continue;
	}
	$name = str_replace(
		array('.mp4', '.ts', '「', '」'),
		'',
		replaceName($file)
	);
	foreach ($seps as $s) {
		$tmp = explode($s, $name);
		$name = @current($tmp);
		unset($tmp);
	}
	foreach ($after as $af) {
		$pos = mb_strpos($name, $af);
		if ($pos > 13) {
			$name = mb_substr($name, 0, $pos + 1);
		}
	}
	$deleted = 0;
	if (($t = liked($words, $name)) !== false) {
		$key2 = md5($name);
		if (isset($words[$t])) {
			$deleted = $words[$t]->count;
		}
		unset($words[$t]);
	}
	$key = md5($name);
	$updated = time() - filemtime($rootDir.$file);
	if (isset($words[$key])) {
		if ($words[$key]->updated > $updated) {
			$words[$key]->updated = $updated;
		}
		$words[$key]->count = $words[$key]->count + 1 + $deleted;
	} else {
		$words[$key] = new StdClass;
		$words[$key]->updated = $updated;
		$words[$key]->word = $name;
		$words[$key]->count = 1 + $deleted;
	}
}
usort($words, function($a, $b) {
	$rates = array(
		'a' => 0,
		'b' => 0
	);
	$x = 0.6;
	if ($a->updated < $b->updated) {
		$rates['a'] += $x;
	} else if ($a->updated > $b->updated) {
		$rates['b'] += $x;
	}
	$x = 0.3;
	if ($a->count > $b->count) {
		$rates['a'] += $x;
	} else if ($a->count < $b->count) {
		$rates['b'] += $x;
	}
	
	if ($rates['a'] > $rates['b']) {
		return -1;
	} else if ($rates['a'] < $rates['b']) {
		return 1;
	}
	return 0;
});
$tags = array();
$count = 0;
foreach ($words as $v) {
	$tags[] = array(
		'tag' => $v->word,
		'updated' => $v->updated,
		'count' => $v->count
	);
	if (++$count >= 34) {
		break;
	}
}
apcu_store('tags', $tags, 3600);
header('Content-Type: application/json;charset=UTF-8');
header('Cache-Control: no-cache');
echo json_encode($tags, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
?>
