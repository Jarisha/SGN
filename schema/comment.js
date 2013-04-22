/*  Schema for commnet obj. Key: NodeflakeID
 */

var comment_count = 0;

var comment = function comment(){
  comment_count++;
  this.version = '0.0.1';
  this.pin = '103';
  this.posterId = 'user1@gmail.com';
  this.posterName = 'user1';
  this.content = 'This is comment ' + comment_count;
}

module.exports = {
  comment: comment
}