var mongoose = exports.mongoose = require('mongoose');
var config = require('./config');

exports.init = function(){
  var db = exports.db = mongoose.createConnection(config.db_host, config.db);
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', function () {
    console.log('mongodb connected on ' + config.db);
  });
  
  //define schema
  var userSchema = exports.userSchema = mongoose.Schema({
    name: { type: String, unique: true},
    password: String
  });
  //exports.userSchema = userSchema;
  //index using name
  userSchema.index({name: 1});
  //userSchema.set('autoIndex', false);
  exports.User = db.model('sgnuser', userSchema);
}