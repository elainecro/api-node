function UserDao(connection) {
	this._connection = connection;
}

UserDao.prototype.save = function(user,callback) {
	this._connection.query('INSERT INTO users SET ?', user, callback);
}

UserDao.prototype.lista = function(callback) {
	this._connection.query('select * from users',callback);
}

UserDao.prototype.buscaPorId = function (id,callback) {
	this._connection.query("select * from users where id = ?",[id],callback);
}

module.exports = function(){
	return UserDao;
};
