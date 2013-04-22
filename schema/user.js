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

var user = function user(){
  this.version = '0.0.1';
  this.email = null;
  this.passHash = null;
  this.username = null;
  this.fbConnect = null;
  this.favCat = null;
  this.profileImg = null;
  this.gender = null;
  this.bio = null;
  this.dateJoined = null;
  this.posts = [];
  this.likes =[];
  this.followers = [];
  this.following = [];
  this.changes = {
    posts: {add:[], remove:[]},
    likes: {add:[], remove:[]},
    followers: {add:[], remove:[]},
    following: {add:[], remove:[]}
  }
}

var userRef = function userRef(){
  this.version = '0.0.1';
  this.username = null;
  this.imgUrl = null;
}

var pendingUser = function pendingUser(){
  this.version = '0.0.1';
  this.email = null;
  this.userName = null;
  this.company = false;
}

//usage:
//userSchema = require('../users.js');
//user = new userSchema.user();

module.exports = {
  user: user,
  userRef: userRef,
  pendingUser: pendingUser
}