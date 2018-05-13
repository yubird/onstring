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
/*
$start = 0;
$end = $size - 1;
$etag = md5_file($file);
$lastModified = date('D, d M Y H:i:s T', filemtime($file));
$modSince = filter_input(INPUT_SERVER, 'HTTP_IF_MODIFIED_SINCE');
$ifNoneMatch = filter_input(INPUT_SERVER, 'HTTP_IF_NONE_MATCH');
if ($modSince === $lastModified || $ifNoneMatch === $etag) {
	header('HTTP/1.1 304 Not Modified');
	exit;
}
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
header('Etag: '.$etag);
header('Last-Modified: '.$lastModified);
*/
header('Content-Type: '.$type);
/*
header('Accept-Ranges: 0-'.$length);
header("Content-Range: bytes $start-$end/$size");
header("Content-Length: ".$length);
header('X-Sendfile2: '
	.str_replace(' ', '%20', $file).' '.$start.'-'.$end
);
*/
$tmp = str_replace('/mnt/home/yubird/iTunes/Music', '/itunes/', $file);
$tmp = str_replace(' ', '%20', $tmp);
header('X-Accel-Redirect: '.$tmp);
exit;
?>
