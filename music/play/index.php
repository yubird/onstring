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

$etag = md5_file($file);
$lastModified = date('D, d M Y H:i:s T', filemtime($file));
$modSince = filter_input(INPUT_SERVER, 'HTTP_IF_MODIFIED_SINCE');
$ifNoneMatch = filter_input(INPUT_SERVER, 'HTTP_IF_NONE_MATCH');
if ($modSince === $lastModified || $ifNoneMatch === $etag) {
	header('HTTP/1.1 304 Not Modified');
	exit;
}
header('Etag: '.$etag);
header('Last-Modified: '.$lastModified);
header('Content-Type: '.$type);
header("Content-Length: ".$length);
header('X-Sendfile2: '
	.str_replace(' ', '%20', $file).' 0-'.($length-1)
);
//header('X-LIGHTTPD-send-file: '.$file);
exit;
?>
