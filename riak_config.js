var app = require('./app');

exports.init = function(){
  app.riak.ping(function(err, response){
    console.log('Connection to riak db: ' + response);
  });
}