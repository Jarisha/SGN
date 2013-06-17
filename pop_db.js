var http = require('http');
var bcrypt = require('bcrypt-nodejs');

var config = require('./config');

if(process.argv.length !== 4){
  console.log('invalid number of arguments, exiting');
  process.exit(1);
}

if(process.env.NODE_ENV === 'dev'){
  var riak = require('nodiak').getClient('http', config.dev_db_host, config.dev_db_port);
  var nodeflake_host = config.dev_nodeflake_host;
}
else if(process.env.NODE_ENV === 'production'){
  var riak = require('nodiak').getClient('http', config.production_db_host, config.production_db_port);
  var nodeflake_host = config.production_nodeflake_host;
}
 
riak.ping(function(err, response){
  if(err) console.log('error'+err.message);
  else console.log('connection to riak success');

  var cmd = process.argv[2];
  var amt = parseInt(process.argv[3]);
  if(cmd === 'post')
    genPosts(amt);
  else if(cmd === 'user')
    genUsers(amt);
});

function genPosts(amt){
  console.log('generating '+amt+' posts');
  var postIds = [];
  var numIds = 0;
  (function genId(){
    generateId(function(id){
      postIds.push(id);
      numIds++;
      if(numIds !== amt)
        genId();
      else
        genPost_2(postIds, amt);
    });
  })();
}

var cat_list = [
  'Action & Adventure',
  'Arcade',
  'Board & Card',
  'Casino & Gambling',
  'Educational',
  'Family & Kids',
  'Music & Rhythm',
  'Puzzle',
  'Racing',
  'Role Playing',
  'Simulation',
  'Sports',
  'Strategy',
  'Trivia & Word'
]

function genPost_2(postIds, amt){
  console.log(postIds);
  postObjs = [];
  numPosts = 0;
  (function createPost(){
    var cat = cat_list[numPosts%cat_list.length];
    postData = {
      version: '0.0.3',
      posterId: 'populate@u.u',
      likedBy: [],
      category: cat,
      sourceUrl: 'http://d45c79c0838c7014df33-00861601181b32db2671b5497da6d8c8.r84.cf1.rackcdn.com/YoAeQAnfWqQT2ONUz6l8lFgv',
      videoEmbed: null,
      cloudPath: null,
      gameName: cat+' Game',
      publishser: cat+' Publisher',
      description: 'This is a generic '+cat+' Game',
      datePosted: null,
      returnAll: 'y',
      comments: [],
      
      dateEdited: null,
      repostVia: null,
      originUrl: null
    };
    var postObj = riak.bucket('gamepins').object.new(postIds[numPosts], postData);
    postObj.save(function(err, saved){
      if(err) console.log('save post error: '+err.message);
      else console.log('save post success');
      numPosts++;
      if(numPosts !== amt) createPost();
      else console.log(amt+' posts created and saved into DB ');
    });
  })();
}

function genUsers(amt){
  console.log('generating '+amt+' users');
  var numUsers = 0;
  
  (function createUser(){
    var userName = 'pop'+numUsers;
    var userData = {
      version: '0.0.7',
      email: userName+'@p.p',
      passHash: bcrypt.hashSync(userName),
      userName: userName,
      fbConnect: false,
      favCat: null,
      profileImg: null,
      gender: null,
      bio: null,
      dateJoined: new Date(),
      posts: [],
      likes: [],
      followers: [],
      following: [],
      friends: [],
      pendingRequests: {},
      timelineEvents: [],
      userEvents: [],
      pinEvents: [],
      conversations: []
    }
    var usr_obj = riak.bucket('users').object.new(userData.email, userData);
    usr_obj.save(function(err, data){
      if(err) console.log('save user error: '+err.message);
      else console.log('save user success');
      numUsers++;
      if(numUsers !== amt) createUser();
      else console.log(amt+' users created and saved into DB');
    });
    
  })();
}

//TODO: Make nodeflake return in nodejs style, callback(err, result)
//Get unique, roughly sequential ID from nodeflake server
var nodeflake_prev = '';
var generateId = exports.generateId = function(callback){
  var ID_obj;
  //do GET request to nodeflake
  var options = {
    host: nodeflake_host,
    port: 1337,
    path: '/',
    method: 'GET',
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:17.0) Gecko/40100101 Firefox/17.0" }
  };
  var R = http.request(options, function(response) {
    var ID = "";
    response.on('data', function(data) {
      ID += data;
    });
    response.on('end', function() {
      ID_obj = JSON.parse(ID);
      //if we get duplicate, retry
      if(ID_obj.id === nodeflake_prev){
        errlog.info('dupId: ' +ID_obj.id);
        //recursive function
        return generateId(callback);
      }
      else{
        nodeflake_prev = ID_obj.id;
        next();
      }
    });
  });
  R.on('error', function(e){
    errlog.info('Nodeflake error: ' + e);
  });
  R.end();
  function next(){
    //invert values allowing us to sort from new (low #) to old (high #) via Riak search
    //this is madness.....THIS.....IS......JAVASCRIPT!
    var str1 = ('999999999' - ID_obj.id.substr(0,9)).toString();
    var str2 = ('999999999' - ID_obj.id.substr(9,9)).toString();
    var str3 = str1.concat(str2);
    callback(str3);
  }
}