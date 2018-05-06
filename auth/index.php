<?php
include dirname(__FILE__).'/../common/settings.php';
$key = AUTH_KEYWORD.date('Ym');

header('Content-Type: text/plain;charset=UTF-8');
if (isset($_POST['k']) && strlen($_POST['k'])) {
	if ($_POST['k'] == $key) {
		echo "OK";
		exit;
	}
}
echo "NG";
?>
