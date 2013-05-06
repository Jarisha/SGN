var nodeUtil = require('util');

/*var AbstractError = function (msg) {
  Error.captureStackTrace(this, constr || this);
  this.message = msg || 'Error';
}
util.inherits(AbstractError, Error)
AbstractError.prototype.name = 'Abstract Error'*/

//Riak returns a 404
function NotFoundError(msg){
  //get stack
  Error.captureStackTrace(this, NotFoundError);
  this.message = msg;
}
nodeUtil.inherits(NotFoundError, Error);
NotFoundError.prototype.name = 'Not Found';

//Obj does not pass validation tests or does not conform to schema
function InvalidError(msg){
  Error.captureStackTrace(this, NotFoundError);
  this.message = msg;
}
nodeUtil.inherits(InvalidError, Error);
InvalidError.prototype.name = 'Invalid';

module.exports = {
  NotFoundError: NotFoundError,
  InvalidError: InvalidError
}