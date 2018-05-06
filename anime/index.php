<?php
include dirname(__FILE__).'/../common/settings.php';
include dirname(__FILE__).'/../common/functions.php';
$rootDir = ROOT_ANIME;
$res = new StdClass;
$titles = [];
$k = 0;
$sortBy = LIST_DEFAULT_SORT;
$t = 'x';
if (isset($_GET['p']) && strlen($_GET['p'])) {
	$t = $_GET['p'];
	$sortBy = LIST_SUB_SORT;
	$rootDir .= rawurldecode($_GET['p']).'/';
}
$titles = apcu_fetch('list_'.md5($rootDir.$sortBy));
if ($titles === false) {
	$titles = parseDir($rootDir, $sortBy);
	apcu_store('list_'.md5($rootDir.$sortBy), $titles, 60 * 20);
}

if (isset($_GET['s']) && strlen($_GET['s']) > 0) {
	$titles = searchByName($titles, rawurldecode($_GET['s']));
}

$maxCount = LIST_MAX;
$offset = 0;
$pages = 0;
$n = 0;
if (isset($_GET['n']) && is_numeric($_GET['n'])) {
	$n = $_GET['n'];
	if ($n <= 0) {
		$n = 1;
	}
	$pages = ceil(count($titles) / $maxCount);
	$offset = $maxCount * ($n - 1);
	$titles = array_slice($titles, $offset, $offset + $maxCount);
}

$res->count = count($titles);
$res->pages = $pages;
$res->page = $n;
$res->titles = $titles;
$data = json_encode($res, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
header('Content-Type: application/json;charset=UTF-8');
echo $data;
?>
