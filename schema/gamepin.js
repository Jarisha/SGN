/*  Schema for gamepin obj. Key: NodeflakeID
*/

var gamepin = function gamepin(){
  this.version = '0.0.1';
  this.posterId = null;
  this.posterName = null;
  this.likedBy = null;
  this.repinVia = null;
  this.category = null;
  this.sourceUrl = null;
  this.videoEmbed = null;
  this.cloudPath = null;
  this.gameName = null;
  this.publisher = null;
  this.description = null;
  this.datePosted = null;
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