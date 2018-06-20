var mysql  = require('mysql');

function createDBConnection(){
	return mysql.createConnection({
		host: 'localhost',
		user: 'root',
		password: '',
		database: 'findpeople'
	});
}

module.exports = function() {
	return createDBConnection;
}
