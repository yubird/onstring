<?php
include dirname(__FILE__).'/../common/settings.php';
include dirname(__FILE__).'/../common/functions.php';

$outDir = THUMBNAIL_DIR;
$md5 = $_GET['c'];
$link = md5ToPath($md5);
$outFile = $md5.'.jpg';
$s = '';

for ($i = 0; $i < 6; $i += 2) {
	$s .= substr($md5, $i, 2).'/';
}
if (!file_exists($outDir.$s)) {
	mkdir($outDir.$s, 0755, true);
}
if (!file_exists($link)) {
	header('HTTP/1.0 404 Not Found');
	exit;
}
if (!file_exists($outDir.$s.$outFile)) {
	$command = FFMPEG_BINARY.' '
		.'-y -ss 14 -i "'.$link.'" '
		.'-vframes 1 '
		.'-s '.THUMBNAIL_SIZE.' '
		.'-q 3 -f image2 '
		.$outDir.$s.$outFile;
	exec($command, $output, $ret);
	if ($ret !== 0) {
		if (file_exists($outDir.$s.$outFile)) {
			unlink($outDir.$s.$outFile);
		}
		header('Content-Type: image/png');
		header('X-LIGHTTPD-send-file: '
			.realpath(dirname(__FILE__).'/../img/channels/unknown.png'));
		exit;
	}
}
header('Content-Type: image/jpeg');
header('X-LIGHTTPD-send-file: '.realpath($outDir.$s.$outFile));
?>
