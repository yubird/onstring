<?php
include dirname(__FILE__).'/../../common/settings.php';
include dirname(__FILE__).'/../../common/functions.php';
$res = new StdClass;
$programs = getChinachu(CHINACHU_SCHEDULES);
$res = new StdClass;
$titles = parsePrograms($programs);
$maxCount = LIST_MAX;
$offset = 0;
$pages = 0;
$n = 0;
if (isset($_GET['s']) && strlen($_GET['s']) > 0) {
	$titles = searchByName($titles, rawurldecode($_GET['s']));
}
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
header('Content-Type: application/json;charset=UTF-8');
echo json_encode($res, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
?>
