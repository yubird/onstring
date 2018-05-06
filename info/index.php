<?php
include dirname(__FILE__).'/../common/settings.php';
include dirname(__FILE__).'/../common/functions.php';

if (isset($_GET['f'])) {
	$file = realpath(rawurldecode($_GET['f']));
} else if (isset($_GET['c'])) {
	$md5 = $_GET['c'];
	$file = md5ToPath($_GET['c']);
} else {
	header('HTTP/1.0 404 Not Found');
	exit;
}

$command = FFMPEG_BINARY.' -i "'.$file.'" 2>&1';
exec($command, $output);
$res = new StdClass;

$patterns = array(
	'duration' => '/Duration: ([0-9]{2}:[0-9]{2}:[0-9]{2})/',
	'profile1' => '/Video: h264 \((.[^\)]+)\) /',
	'profile2' => '/Video: hevc \(([^\)]+)\)/',
	'size' => '/Video:.* ([0-9]+)x([0-9]+)([ ,]?) /',
	'bitrate' => '/Video:.* ([0-9]+) kb\/s,/',
	'fps' => '/Video:.* ([0-9]+\.[0-9]+) fps/'
);

foreach ($output as $line) {
	if (preg_match($patterns['duration'], $line, $matches)) {
		$res->duration = $matches[1];
	}
	if (preg_match($patterns['profile1'], $line, $matches)) {
		$res->profile = $matches[1];
		$codec = 'H.264';
	}
	if (preg_match($patterns['profile2'], $line, $matches)) {
		$res->profile = $matches[1];
		$codec = 'H.265';
	}
	if (preg_match($patterns['size'], $line, $matches)) {
		$res->size = array('width' => intval($matches[1]), 'height' => intval($matches[2]));
	}
	if (preg_match($patterns['bitrate'], $line, $matches)) {
		$res->bitrate = number_format($matches[1] / 1024, 2).' Mbps';
	}
	if (preg_match($patterns['fps'], $line, $matches)) {
		$res->fps = round($matches[1]).' ('.$matches[1].')';
	}
}

$command = MP4BOX_BINARY.' -info "'.$file.'" 2>&1';
$output = array();
exec($command, $output);
$pattern = '/AVC Info:.* @ Level ([1-5]+\.?[0-2]?)/';
foreach ($output as $line) {
	if (preg_match($pattern, $line, $matches)) {
		$res->level = $matches[1];
		break;
	}
}

$res->codec = $codec;
if ($res->size['height'] < 720) {
	$res->type = 'SD';
} else if ($res->size['height'] < 1080) {
	$res->type = 'HD720';
} else {
	$res->type = 'HD1080';
}
header('Content-Type: application/json;charset=UTF-8');
echo json_encode($res);
?>
