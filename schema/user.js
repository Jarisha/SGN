/*  Schema for user objs:
 *  user
 *    user-group
 *    user-activity
 *  userReference
 *  pendingUser
 *
 *  user-group and user-activity currently reside in the users bucket, and can be considered extentions of that schema
 *  they are not currently changeable
 */
var util = require('../utility');
var app = require('../app');
var E = require('../customErrors');

var errlog = app.errlog;
var evtlog = app.evtlog;
var outlog = app.outlog;

//Constructs a new user object.  Accepts no args, or one arg containing data
var user = function user(userInput){
  //set userInput to empty if no args
  if(Object.keys(arguments).length === 0) userInput = {};
  
  console.log('new user');
  
  // Set object's properties to userInput if declared, else set them to default values
  this.version = userInput.version       || '0.0.5';        //friends added
  this.email = userInput.email           || null;           //required, email regex, 5 < chars < 50,... TODO: More validations
  this.passHash = userInput.passHash     || null;           //required, 
  this.userName = userInput.userName     || null;           //required
  this.fbConnect = userInput.fbConnect   || false;
  this.favCat = userInput.favCat         || null;
  this.profileImg = userInput.profileImg || null;
  this.gender = userInput.gender         || null;
  this.bio = userInput.bio               || null;
  this.dateJoined = userInput.dateJoined || util.getDate(); //required
  this.posts = userInput.posts           || [];
  this.likes = userInput.likes           || [];
  this.followers = userInput.followers   || [];
  this.following = userInput.following   || [];
  this.friends = userInput.friends       || [];

  this.timelineEvents = userInput.timelineEvents || [];
  this.userEvents = userInput.userEvents || [];
  this.pinEvents = userInput.pinEvents   || [];
  
  this.lastLogin = userInput.lastLogin   || null;
}

//validate a user argument
user.prototype.validate = function(){
  //validate user input
  if(!this.email) return new E.InvalidError('user email missing');
  if(!this.userName) return new E.InvalidError('user name missing');
  if(!this.dateJoined) return new E.InvalidError('user date joined missing');
  
  //TODO: Logical / Data driven validations
  //return callback(false);
  return false;
}

//returns array with userReference, userGroups, and userActivity
user.prototype.getUserAssets = function(){
  var assets = [];
  assets.push({ userName: this.userName, profileImg: this.profileImg }); //userReference
  assets.push({});                                                       //groups
  assets.push({ evtIds: [] });                                           //evtIds
  return assets;
}

//blank objects used for cloning only
var userReference = { key: null,
                      value: { userName: null, profileImg: null }
                    };
var userGroups =  {  key: null,
                     value: {}
                  };
var userActivity =  { key: null,
                      value: { evtIds: [] }
                    };

//use this blank user instance to compare to others
var userInstance = new user();

var pendingUser = function pendingUser(input){
  if(Object.keys(arguments).length === 0) input = {};
  
  this.version = input.version    || '0.0.1';
  this.email = input.email        ||  null;
  this.userName = input.userName  ||  null;
  this.company = input.company    ||  false;
}

var pendingInstance = new pendingUser();

//export public members
module.exports = {
  user: user,
  userInstance: userInstance,
  pendingUser: pendingUser
}