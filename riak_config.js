var app = require('./app');
var util = require('./utility');
var http = require('http');
var config = require('./config');
var outlog = app.outlog;
var errlog = app.errlog;
var evtlog = app.evtlog;

exports.init = function(){
console.log('\
********  *********  **       *\n\
*         *          * *      *\n\
*         *          *  *     *\n\
********  *    ****  *   *    *\n\
       *  *       *  *    *   *\n\
       *  *       *  *     *  *\n\
       *  *       *  *      * *\n\
********  *********  *       **\n\
');
  util.generateId(function(id){
    var idNum;
    if(id){
      console.log('Ping to nodeflake success: ' + id);
      outlog.info('Connection to nodeflake OK!');
      next();
    }
  });
  function next(){
    app.riak.ping(function(err, response){
     if(err) return errlog.info('app.riak.ping: ' + response);
     console.log('Riak Connected');
     outlog.info('app.riak.ping: ' + response + ' !!!!!!');
     evtlog.info('app.riak.ping: ' + response);
     return;
    });
  }
}