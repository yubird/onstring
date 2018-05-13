<?php
include dirname(__FILE__).'/../../common/settings.php';
include dirname(__FILE__).'/../../common/functions.php';

$dir = THUMBNAIL_DIR;
header('Content-Type: image/png');
if (isset($_GET['c'])) {
	$md5 = $_GET['c'];
	$file = md5ToPath($md5);
} else {
	$image = $dir.'p/black.png';
	header('X-Accel-Redirect: '.str_replace('/var/www/video', '', $image));
	exit;
}
if (!isset($_GET['t'])) {
	$t = 0;
} else {
	$t = $_GET['t'];
}
$split = array();
for ($i = 0; $i < 4; ++$i) {
	$split[] = substr($md5, ($i * 2), 2);
}
$baseDir = $dir.'p/'.implode($split, '/').'/';
$fileName = $md5.'_'.$t.'.png';
if (!file_exists($baseDir)) {
	mkdir($baseDir, 0755, true);
}
if (file_exists($baseDir.$fileName)) {
	$image = $baseDir.$fileName;
	header('X-Accel-Redirect: '.str_replace('/var/www/video', '', $image));
	exit;
}
$command = FFMPEG_BINARY.' -r 15 -ss '.$t.' -i "'.$file.'" '
	.'-vframes 1 '
	.'-f image2 -s '.PLAYER_THUMBNAIL_SIZE.' '
	.$baseDir.$fileName;
exec($command);
if (!file_exists($baseDir.$fileName)) {
	$image = $dir.'p/black.png';
} else {
	$image = $baseDir.$fileName;
}
header('X-Accel-Redirect: '.str_replace('/var/www/video', '', $image));
exit;
?>
