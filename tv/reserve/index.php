<?php
include dirname(__FILE__).'/../../common/settings.php';
include dirname(__FILE__).'/../../common/functions.php';

$id = $_POST['id'];
$status = reserveProgram($id);
if ($status == 200) {
	$res = 'OK';
} else {
	$res = 'NG';
}
header('Content-Type: text/plain;charset=UTF-8');
echo $res;
?>
