<?php
include dirname(__FILE__).'/../../../common/settings.php';
include dirname(__FILE__).'/../../../common/functions.php';
$path = false;
if (isset($_GET['c'])) {
	$path = eszDecodeUrl($_GET['c']);
}
if ($path === false) {
	header('HTTP/1.0 404 Not Found');
	exit;
}

$zip = new ZipArchive;
$uid = $_GET['c'];
$filePath = MUSIC_DL_PATH.$uid.'.zip';
if (file_exists($filePath)) {
	unlink($filePath);
}
$res = $zip->open($filePath, ZipArchive::CREATE);
if ($res !== true) {
	header('HTTP/1.0 500 Internal Server Error');
}
$dirName = basename($path);
$zipPath = $dirName.'/';
$items = scandir($path);
$zip->addEmptyDir($zipPath);
foreach ($items as $item) {
	if (strpos($item, '.') === 0) {
		continue;
	}
	$file = $path.$item;
	if (getAudioType($file) === null) {
		continue;
	}
	$zip->addFile($file, $zipPath.$item);
}
$zip->close();
header('Content-Type: text/plain;charset=UTF-8');
echo $uid.'.zip';
?>
