/* This script is to set up bucket properties.
 * It should only need to be run once, or when changes
 * to bucket props are made.
 */

var config = require('./config');

console.log('mode: '+process.env.NODE_ENV);

if(process.env.NODE_ENV === 'dev')
  var riak = require('nodiak').getClient('http', config.dev_db_host, config.dev_db_port);
else if(process.env.NODE_ENV === 'coleman')
  var riak = require('nodiak').getClient('http', '127.0.0.1', 8091);
else if(process.env.NODE_ENV === 'production')
  var riak = require('nodiak').getClient('http', config.production_db_host, config.production_db_port);


riak.ping(function(err, response){
  console.log('Connection to riak db: ' + response);
  console.log('Setting Bucket Properties');
  
  // Enable search and conflict resolution for specified buckets
  // note-1: can't seem to remove search precommit, so need to do that via curl for now
  // note-2: MUST specify conflict resolution via allow_mult = true and last_write_wins = false
  // MUST specify search via precommit hook
  var users = riak.bucket('users');
  var gamepins = riak.bucket('gamepins');
  
  users.props.allow_mult = false;
  users.props.last_write_wins = true;
  users.props.precommit = [];
  
  gamepins.props.allow_mult = false;
  gamepins.props.last_write_wins = true;
  gamepins.props.precommit = [{"mod":"riak_search_kv_hook","fun":"precommit"}];
  
  //configure properties for each bucket
  users.saveProps(true, function(err, props){
    console.log("users");
    console.log(props.props.precommit);
  });
  gamepins.saveProps(true, function(err, props){
    console.log("gamepins");
    console.log(props.props.precommit);
  });
});