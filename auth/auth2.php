<?php
include dirname(__FILE__).'/../common/settings.php';
$seeds = array(
	'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K',
	'L', 'M', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
	'Y', 'Z',
	'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k',
	'm', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x',
	'y', 'z',
	'2', '3', '4', '5', '6', '7', '8', '9'
);
$seed = 
		intval(crc32(AUTH_KEYWORD) / 2)
	+ intval(date('Ym'))
	+ crc32($_SERVER['HTTP_X_FORWARDED_FOR'])
	+ crc32($_SERVER['REMOTE_ADDR']);
$secret = hash_hmac(
	'haval128,5',
	strrev(hash_hmac(
		'sha256',
		$_SERVER['HTTP_X_FORWARDED_FOR']
		.$_SERVER['REMOTE_ADDR']
		.$_SERVER['HTTP_USER_AGENT'],
		AUTH_KEYWORD
	)),
	md5(implode('$', $seeds))
);
srand($seed);
shuffle($seeds);
$key = '';
for ($i = 0; $i < 10; ++$i) {
	$key .= $seeds[$i];
}
$data = array(
	'secret' => $secret,
	'password' => $key,
	'mail' => '',
	'expires' => 10
);
header('Content-Type: application/json;charset=UTF-8');
echo json_encode($data);
?>
