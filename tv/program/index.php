<?php
include dirname(__FILE__).'/../../common/settings.php';
include dirname(__FILE__).'/../../common/functions.php';
$reserves = getReserves();
$res = new StdClass;
$program = getProgram($_GET['id']);
$res = new StdClass;
$res->id = $program->id;
$name = '';
$name = mb_convert_kana($program->fullTitle, 'KVnsr');
if (trim($name) == '') {
	$name = mb_convert_kana($program->title, 'KVnsr');
}
$res->name = $name;
$res->detail = str_replace(
	"\n", "<br>", str_replace("\r\n", '<br>', $program->detail)
);
$res->date = array(
	'start' => date('Y-m-d H:i', intval($program->start / 1000)),
	'end' => date('Y-m-d H:i', intval($program->end / 1000))
);
$res->duration = round($program->seconds / 60).'分';
$res->channel = findChannel($program->channel->id);
$res->isReserve = in_array($program->id, $reserves);

header('Content-Type: application/json;charset=UTF-8');
echo json_encode($res, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
?>
