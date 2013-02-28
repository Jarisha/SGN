var app = require('./app');
var util = require('./utility');

exports.init = function(){
  app.riak.ping(function(err, response){
    console.log('Connection to riak db: ' + response);
  });
  util.generateId(function(id){
    var idNum;
    if(id){
      console.log('Connection to nodeflake OK!');
    }
  });
}