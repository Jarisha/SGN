/*
 * Serve JSON to our AngularJS client
 */
var dbconfig = require('../db_config');

exports.name = function (req, res) {
  res.json({
  	name: 'Bob'
  });
};

exports.login = function(req, res) {
  req.session.loggedIn = 'loggedIn';
  console.log(req.session.loggedIn);
  res.json({
    success: 'true'
  });
}

exports.register = function(req, res){
  res.json({
    data: 'register'
  });
}