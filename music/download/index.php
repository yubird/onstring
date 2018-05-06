<?php
include dirname(__FILE__).'/../../common/settings.php';
include dirname(__FILE__).'/../../common/functions.php';
ob_end_clean();
$file = isset($_GET['c'])? $_GET['c']: 'x';
$filePath = MUSIC_DL_PATH.$file;
if (!file_exists($filePath)) {
	header('HTTP/1.0 404 Not Found');
	exit;
}
$fileName = basename($filePath);
$length = filesize($filePath);
header('Content-Type: application/octet-stream');
header('Content-Disposition: attachment; filename="'.$fileName.'"');
header('Content-Length: '.$length);
ob_flush();
$fp = fopen($filePath, 'rb');
while (!feof($fp)) {
	echo fread($fp, 8192);
	ob_flush();
}
fclose($fp);
unlink($filePath);
exit;
?>
