<?php
include dirname(__FILE__).'/../../common/settings.php';
include dirname(__FILE__).'/../../common/functions.php';
$channels = findChannel();
header('Content-Type: application/json;charset=UTF-8');
echo json_encode($channels, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
?>
