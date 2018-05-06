<?php
include dirname(__FILE__).'/../common/settings.php';
include dirname(__FILE__).'/../common/functions.php';

$subject = isset($_POST['subject'])? $_POST['subject']: null;
$user = isset($_POST['address'])? $_POST['address']: null;
$body = isset($_POST['body'])? $_POST['body']: null;

header('Content-Type: text/plain;charset=UTF-8');
if ($subject == null || $user == null || $body == null) {
	echo 'Invalid request';
} else {

}
?>
