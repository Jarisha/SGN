/* This script is to set up bucket properties.
 * It should only need to be run once, or when changes
 * to bucket props are made.
 */
var config = require('./config');
var riak = require('nodiak').getClient('http', config.db_host, config.db_port);

riak.ping(function(err, response){
  console.log('Connection to riak db: ' + response);
  console.log('Setting Bucket Properties');
  
  //Setup bucket properties, such as search precommit hooks
  //note: can't seem to remove search precommit, so need to do that via curl for now
  var users = riak.bucket('users');
  var gamepins = riak.bucket('gamepins');
  
  users.props.allow_mult = true;
  users.props.last_write_wins = false;
  users.props.precommit = [];
  
  gamepins.props.allow_mult = true;
  gamepins.props.last_write_wins = false;
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