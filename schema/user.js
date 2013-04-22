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
  this.email = 'user1@gmail.com';
  this.passHash = null;
  this.username = 'user1';
  this.fbConnect = null;
  this.favCat = null;
  this.profileImg = '/images/profile/profile19.png';
  this.gender = null;
  this.bio = null;
  this.dateJoined = '10/13/2012';
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
  this.username = 'user1';
  this.imgUrl = '/images/profile/profile19.png';
}

module.exports = {
  user: user,
  userRef: userRef
}