/*  Schema for gamepin obj. Key: NodeflakeID
*/
var gamepin_count = 0;

var gamepin = function gamepin(){
  gamepin_count++;
  this.version = '0.0.1';
  this.posterId = '104';
  this.posterName = 'user1';
  this.likedBy = null;
  this.repinVia = null;
  this.category = 'Shooters';
  this.sourceUrl = '/images/game_images/images%20%2823%29.jpg';
  this.videoEmbed = null;
  this.cloudPath = null;
  this.gameName = 'StarCraft 2';
  this.publisher = 'Blizzard';
  this.description = 'This is Gamepin ' + gamepin_count;
  this.datePosted = '11/13/2012';
  this.returnAll = 'y';
  this.comments = [];
  this.changes = {
    likedBy: { add:[], remove:[] },
    comments: { add:[], remove:[] }
  }
}

module.exports = {
  gamepin: gamepin
}