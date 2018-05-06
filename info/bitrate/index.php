<?php
include dirname(__FILE__).'/../../common/settings.php';
include dirname(__FILE__).'/../../common/functions.php';

if (isset($_GET['c'])) {
	$md5 = $_GET['c'];
	$file = md5ToPath($_GET['c']);
} else {
	header('HTTP/1.0 404 Not Found');
	exit;
}
if (isset($_GET['s']) && is_numeric($_GET['s'])) {
	$start = intval($_GET['s']) + 0.2;
} else {
	$start = 0.2;
}
$uuid = uniqid('', true);
$tmpFile = '/ramdisk/'.$uuid.'.ts';
$command1 = FFMPEG_BINARY.' '
	.'-ss '.$start.' -i "'.$file.'" '
	.'-t 1.3 -v quiet -an -vcodec copy '
	.$tmpFile;
$command2 = FFPROBE_BINARY.' -i '.$tmpFile.' -v quiet '
	.'-print_format json -show_entries '
	.'format=bit_rate 2>/dev/null';

exec($command1);
$output = array();
exec($command2, $output);
if (file_exists($tmpFile)) {
	unlink($tmpFile);
}
$json = json_decode(implode('', $output), true);
header('Content-Type: text/plain;charset=UTF-8');
if (isset($json['format']['bit_rate'])) {
	$rate = intval($json['format']['bit_rate']);
	echo number_format($rate / 1000, 1).' kbps';
} else {
	echo '0.0 kbps';
}
?>
