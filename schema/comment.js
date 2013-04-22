/*  Schema for commnet obj. Key: NodeflakeID
 */

var comment = function comment(){
  this.version = '0.0.1';
  this.pin = null;
  this.posterId = null;
  this.posterName = null;
  this.content = null;
}

module.exports = {
  comment: comment
}