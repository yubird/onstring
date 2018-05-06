<?php
include dirname(__FILE__).'/../common/settings.php';
include dirname(__FILE__).'/../common/functions.php';
ini_set('zlib.output_compression','Off');

$existsOnly = false;
if (isset($_GET['e'])) {
	$existsOnly = true;
}
if (isset($_GET['c'])) {
	$md5 = $_GET['c'];
	$vttFile = md5VttPath($md5);
	$contentFile = md5ToPath($md5);
} else {
	header('HTTP/1.0 404 Not Found');
	exit;
}

if (file_exists($vttFile)) {
	if ($existsOnly) {
		header('Content-Type: text/vtt;charset=UTF-8');
		echo '';
		exit;
	}
	$vtt = file_get_contents($vttFile);
	$vtt = gzencode(mb_convert_encoding($vtt, 'UTF-8'), 9);
} else if (file_exists($contentFile)) {
	// todo:アニメ等の対応
	header('HTTP/1.0 404 Not Found');
	exit;
} else {
	header('HTTP/1.0 404 Not Found');
	exit;
}
header('Content-Type: text/vtt;charset=UTF-8');
header('Content-Encoding: gzip');
header('Content-Length: '.strlen($vtt));
echo $vtt;
?>
