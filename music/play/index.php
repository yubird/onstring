<?php
include dirname(__FILE__).'/../../common/settings.php';
include dirname(__FILE__).'/../../common/functions.php';
if (isset($_GET['c'])) {
	$file = ITUNES_PATH.eszDecodeUrl($_GET['c']);
} else {
	header('HTTP/1.0 404 Not Found');
	exit;
}
if (!file_exists($file)) {
	header('HTTP/1.0 404 Not Found');
	exit;
}
$type = getAudioType($file);
$size   = filesize($file); // File size
$length = $size;           // Content length
header('Content-Type: '.$type);
$tmp = str_replace('/mnt/home/yubird/iTunes/Music', '/itunes/', $file);
$tmp = rawurlencode($tmp);
header('X-Accel-Redirect: '.$tmp);
exit;
?>
