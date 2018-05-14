<?php
ini_set('apc.enabled', 0);
ini_set('opcache.enable', 0);
include dirname(__FILE__).'/../common/settings.php';
include dirname(__FILE__).'/../common/functions.php';

$expires = 60 * 60 * 24 * 14;
if (isset($_GET['f'])) {
	$file = realpath(rawurldecode($_GET['f']));
} else if (isset($_GET['c'])) {
	$md5 = $_GET['c'];
	$file = md5ToPath($md5);
} else {
	header('HTTP/1.0 404 Not Found');
	exit;
}
if (isset($_GET['name'])) {
	$fileName = rawurldecode($_GET['name']);
} else {
	$fileName = basename($file);
}
if (isset($_GET['m']) && $_GET['m'] == 'dl') {
	header('Content-Type: application/octet-stream');
	header('Content-Disposition: attachment; filename="'.$fileName.'"');
} else {
	header('Content-Type: video/mp4');
}
header('X-Accel-Expires: '.$expires);
header('X-Accel-Redirect: '.str_replace('/var/www/video', '', $file));
exit;
?>
