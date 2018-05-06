<?php
include dirname(__FILE__).'/../common/settings.php';
include dirname(__FILE__).'/../common/functions.php';
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
$size   = filesize($file); // File size
$length = $size;           // Content length
$start  = 0;               // Start byte
$end    = $size - 1;       // End byte

if (isset($_GET['m']) && $_GET['m'] == 'dl') {
	header('Content-Type: application/octet-stream');
	header('Content-Disposition: attachment; filename="'.$fileName.'"');
	//header('X-LIGHTTPD-send-file: '.$file);
	header("Content-Length: ".$length);
	header('X-Sendfile2: '
		.str_replace(' ', '%20', $file).' '.$start.'-'.$end
	);
	/*
	$fp = fopen($file, 'rb');
	while (!feof($fp)) {
		echo fread($fp, 16384);
	}
	fclose($fp);
	*/
	exit;
}

header('Content-Type: video/mp4');
header('Accept-Ranges: 0-'.$length);
if (isset($_SERVER['HTTP_RANGE'])) {

	$c_start = $start;
	$c_end   = $end;

	list(, $range) = explode('=', $_SERVER['HTTP_RANGE'], 2);
	if (strpos($range, ',') !== false) {
		header('HTTP/1.1 416 Requested Range Not Satisfiable');
		header("Content-Range: bytes $start-$end/$size");
		exit;
	}
	if ($range == '-') {
		$c_start = $size - substr($range, 1);
	}else{
		$range  = explode('-', $range);
		$c_start = $range[0];
		$c_end   = (isset($range[1]) && is_numeric($range[1])) ?
			$range[1] : $size;
	}
	$c_end = ($c_end > $end) ? $end : $c_end;
	if ($c_start > $c_end || $c_start > $size - 1 || $c_end >= $size) {
		header('HTTP/1.1 416 Requested Range Not Satisfiable');
		header("Content-Range: bytes $start-$end/$size");
		exit;
	}
	$start  = $c_start;
	$end    = $c_end;
	$length = $end - $start + 1;
	header('HTTP/1.1 206 Partial Content');
}

header("Content-Range: bytes $start-$end/$size");
header("Content-Length: ".$length);
header('X-Sendfile2: '
	.str_replace(' ', '%20', $file).' '.$start.'-'.$end
);
exit();
?>
