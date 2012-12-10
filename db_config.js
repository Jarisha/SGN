var mongoose = exports.mongoose = require('mongoose');
var config = require('./config');

exports.init = function(){
  var db = exports.db = mongoose.createConnection(config.db_host, config.db);
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', function () {
    console.log('mongodb connected on ' + config.db);
  });
  
  //User schema
  var userSchema = exports.userSchema = mongoose.Schema({
    email: { type: String, unique: true },
    name: { type: String, unique: true},
    passHash: String,
    gender: String,
    bio: String,
    fbConnect: Boolean,
    favCategories: []
  });
  //index using name
  userSchema.index({name: 1});
  //userSchema.set('autoIndex', false);
  var User = exports.User = db.model('sgnuser', userSchema);
  
  //Gamepin schema
  var gamepinSchema = exports.gamepinSchema = mongoose.Schema({
    content: String,
    //image: GridFS image
    gameName: String,
    publisher: String,
    description: String,
    category: String
  });
  gamepinSchema.index({category: 1});
  var GamePin = exports.GamePin = db.model('sgnpins', gamepinSchema);
}