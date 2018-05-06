<?php
require_once(dirname(__FILE__).'/settings.php');
class DbConnection {
	private $_connection = null;
	
	public __construct() {
	}

	private function _connect() {
		$this->_connection = mysqli_connect(
			DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
		);
		if (!$this->_connection) {
			throw new Exception('DB Connection failed');
		}
	}

	private function _disconnect() {
		
	}


}
?>
