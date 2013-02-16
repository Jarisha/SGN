/* contains riak utility functions such as conflict resolution, etc */
var app = require('./app');
var http = require('http');
var random = require('secure_random');
var bcrypt = require('bcrypt-nodejs');
var config = require('./config');

/* map reduce functions */
exports.listObjects = function(bucket, callback){
  app.riak.mapred.inputs(bucket)
    .map({
        language: 'erlang',
        module: 'riak_mapreduce_utils',
        function: 'map_id' })

    .execute(function(err, results) {
        if(!err){
          if(callback) callback();
        }
    }
  );
}

exports.listKeys = function(bucket, callback){
  app.riak.mapred.inputs(bucket)
    .map({
        language: 'erlang',
        module: 'riak_mapreduce_utils',
        function: 'map_key' })

    .execute(function(err, results) {
        if(!err){
          callback(results);
        }
    }
  );
}

exports.deleteObjects = function(bucket, callback){
  app.riak.mapred.inputs(bucket)
    .map({
        language: 'erlang',
        module: 'riak_mapreduce_utils',
        function: 'map_delete',
        keep: false })
    
    .reduce({
        language: 'erlang',
        module: 'riak_kv_mapreduce',
        function: 'reduce_sum'}) 
    
    .execute(function(err, results) {
        if(!err){
          console.log(results);
          if(callback) callback();
        }
        if(err){
          console.log(err);
        }
    }
  );
}

//Takes in array and returns new one with duplicate entries removed
function arrNoDupe(a) {
    var temp = {};
    for (var i = 0; i < a.length; i++)
        temp[a[i]] = true;
    var r = [];
    for (var k in temp)
        r.push(k);
    return r;
}

//clears changes array. Should be called immediately after a succesful read.
var clearChanges = exports.clearChanges = function(obj){
  var ch = obj.data.changes;
  for(var o in ch){
    for(var a in ch[o]){
      if(ch[o][a]) ch[o][a].length = 0;
    }
  }
}

//returns date in mm/dd/yyyy format
//TODO: Evaluate if this is good enough
var getDate = exports.getDate = function(){
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth()+1;
  var yyyy = today.getFullYear();
  today = mm+'/'+dd+'/'+yyyy;
  return today;
}

//Default conflict resolution, returns latest sibling
var last_write_wins = exports.last_write_wins = function(siblings){
  console.log('last_write_wins()');
  function siblingLastModifiedSort(a, b) {
    if(!a.metadata.last_modified || new Date(a.metadata.last_modified) < new Date(b.metadata.last_modified)) {
      return 1;
    }
    else {
      return -1;
    }
  }
  siblings.sort(siblingLastModifiedSort);
  return siblings[0];
}

//Conflict resolution for gamepins
var pin_resolve = exports.pin_resolve = function(siblings){
  if(!siblings[0].data.posterId){
    console.log('pin_resolve called on non pin: calling default resolver');
    return last_write_wins(siblings);
  }
  console.log('pin_resolve');
  function siblingLastModifiedSort(a, b) {
    if(!a.metadata.last_modified || new Date(a.metadata.last_modified) < new Date(b.metadata.last_modified))
      return 1;
    else
      return -1;
  }
  //sort by timestamp to get last written user at siblings[0]
  siblings.sort(siblingLastModifiedSort);
  var net_changes = { likedBy: {add:[], remove:[], edit:[]},
                      comments: {add:[], remove:[], edit:[]}
                    };
  
  //join sibling changes into net changes
  for(var s = 0; s < siblings.length; s++){
    net_changes.likedBy.add = net_changes.likedBy.add.concat(siblings[s].data.changes.likedBy.add);
    net_changes.likedBy.remove = net_changes.likedBy.remove.concat(siblings[s].data.changes.likedBy.remove);
    net_changes.comments.add = net_changes.comments.add.concat(siblings[s].data.changes.comments.add);
    net_changes.comments.remove = net_changes.comments.remove.concat(siblings[s].data.changes.comments.remove);
  }
  //Add LikedBy
  siblings[0].data.likedBy = siblings[0].data.likedBy.concat(net_changes.likedBy.add);
  siblings[0].data.likedBy = arrNoDupe(siblings[0].data.likedBy);
  //Delete LikedBy
  for(var p in net_changes.likedBy.remove){
    if(siblings[0].data.likedBy.indexOf(net_changes.likedBy.remove[p]) !== -1)
      siblings[0].data.likedBy.splice(siblings[0].data.likedBy.indexOf(net_changes.likedBy.remove[p]), 1);
  }
  //Add Comments
  siblings[0].data.comments = siblings[0].data.comments.concat(net_changes.comments.add);
  siblings[0].data.comments = arrNoDupe(siblings[0].data.comments);
  //Delete Comments
  for(var p in net_changes.comments.remove){
    if(siblings[0].data.comments.indexOf(net_changes.comments.remove[p]) !== -1)
      siblings[0].data.comments.splice(siblings[0].data.comments.indexOf(net_changes.comments.remove[p]), 1);
  }
  return siblings[0];
  
}

//Conflict resolution for user
var user_resolve = exports.user_resolve = function(siblings){
  //Check to make sure our obj is a user, else call default resolver
  if(!siblings[0].data.email){
    console.log('user_resolve called on non user: calling default resolver');
    return last_write_wins(siblings);
  }
  console.log('user_resolve()');
  function siblingLastModifiedSort(a, b) {
    if(!a.metadata.last_modified || new Date(a.metadata.last_modified) < new Date(b.metadata.last_modified))
      return 1;
    else
      return -1;
  }
  siblings.sort(siblingLastModifiedSort);
  var net_changes = { posts: {add:[], remove:[], edit:[]},
                      likes: {add:[], remove:[], edit:[]},
                      followers: {add:[], remove:[]},
                      following: {add:[], remove:[]},
                      friends: {add:[], remove:[]}
                    };
  
  //join sibling changes into net changes
  for(var s = 0; s < siblings.length; s++){
    net_changes.posts.add = net_changes.posts.add.concat(siblings[s].data.changes.posts.add);
    net_changes.posts.remove = net_changes.posts.remove.concat(siblings[s].data.changes.posts.remove);
    net_changes.likes.add = net_changes.likes.add.concat(siblings[s].data.changes.likes.add);
    net_changes.likes.remove = net_changes.likes.remove.concat(siblings[s].data.changes.likes.remove);
    net_changes.followers.add = net_changes.followers.add.concat(siblings[s].data.changes.followers.add);
    net_changes.followers.remove = net_changes.followers.remove.concat(siblings[s].data.changes.followers.remove);
    net_changes.following.add = net_changes.following.add.concat(siblings[s].data.changes.following.add);
    net_changes.following.remove = net_changes.following.remove.concat(siblings[s].data.changes.following.remove);
    net_changes.friends.add = net_changes.friends.add.concat(siblings[s].data.changes.friends.add);
    net_changes.friends.remove = net_changes.friends.remove.concat(siblings[s].data.changes.friends.remove);
  }
  //resolve posts
  siblings[0].data.posts = siblings[0].data.posts.concat(net_changes.posts.add);
  siblings[0].data.posts = arrNoDupe(siblings[0].data.posts);
  for(var p in net_changes.posts.remove){
    if(siblings[0].data.posts.indexOf(net_changes.posts.remove[p]) !== -1)
      siblings[0].data.posts.splice(siblings[0].data.posts.indexOf(net_changes.posts.remove[p], 1));
  }
  //resolve likes
  siblings[0].data.likes = siblings[0].data.likes.concat(net_changes.likes.add);
  siblings[0].data.likes = arrNoDupe(siblings[0].data.likes);
  for(var p in net_changes.posts.remove){
    if(siblings[0].data.likes.indexOf(net_changes.likes.remove[p]) !== -1)
      siblings[0].data.likes.splice(siblings[0].data.likes.indexOf(net_changes.likes.remove[p]), 1);
  }
  //resolve followers
  siblings[0].data.followers = siblings[0].data.followers.concat(net_changes.followers.add);
  siblings[0].data.followers = arrNoDupe(siblings[0].data.followers);
  for(var p in net_changes.followers.remove){
    if(siblings[0].data.followers.indexOf(net_changes.followers.remove[p]) !== -1)
      siblings[0].data.followers.splice(siblings[0].data.followers.indexOf(net_changes.followers.remove[p]), 1);
  }
  //resolve following
  siblings[0].data.following = siblings[0].data.following.concat(net_changes.following.add);
  siblings[0].data.following = arrNoDupe(siblings[0].data.following);
  for(var p in net_changes.following.remove){
    if(siblings[0].data.following.indexOf(net_changes.following.remove[p]) !== -1)
      siblings[0].data.following.splice(siblings[0].data.following.indexOf(net_changes.following.remove[p]), 1);
  }
  //resolve friends
  siblings[0].data.friends = siblings[0].data.friends.concat(net_changes.friends.add);
  siblings[0].data.friends = arrNoDupe(siblings[0].data.friends);
  for(var p in net_changes.friends.remove){
    if(siblings[0].data.friends.indexOf(net_changes.friends.remove[p]) !== -1)
      siblings[0].data.friends.splice(siblings[0].data.friends.indexOf(net_changes.friends.remove[p]), 1);
  }
  return siblings[0];
}

//12 categories
var categories = ['Casino', 'Casual', 'Shooter', 'Action',
                  'Simulation', 'Racing', 'Puzzle', 'Fighting',
                  'Social', 'Space', 'Horror', 'Strategy'];

//generate n users. Range s to n-1.
var generateUsers = exports.generateUsers = function(s, n, callback){
  var userArray = [];
  var userIds = [];
  var clock = s;
  for(var i = s; i < n; i++){
    userIds.push('user' + i + '@gmail.com');
    //user schema
    userArray.push(
      { email: 'user' + i + '@gmail.com',
        //passHash: bcrypt.hashSync('user'+i),
        passHash: 'user'+i,
        name: 'user' + i,
        fbConnect: i%2==0 ? true : false,
        favCat: null,
        profileImg: '/images/profile/profile'+i%10+'.png',
        gender: null,
        bio:null,
        dateJoined:null,
        currXP:0,
        nextXP:100,
        level:1,
        posts:[],
        likes:[],
        followers:[],
        following:[],
        friends:[],
        recentActivity:[],
        changes:{ posts: {add:[], remove:[]},
                  likes: {add:[], remove:[]},
                  followers: {add:[], remove:[]},
                  following: {add:[], remove:[]},
                  friends: {add:[], remove:[]}
                }
      }
    );
  }
  //set random favorite category
  for(var i = s; i < n; i++){
    (function(i){
      random.getRandomInt(0, 11, function(err, rand) {
        userArray[i].favCat = categories[rand];
        if(i === n-1) next();
      });
    })(i);
  }
  //create new user. If one exists with given key, overwrite it.
  function next(){
    //Returns an array of err objects for users not found, and objs for found users
    app.riak.bucket('users').objects.get(userIds, user_resolve, function(err, objs){
      var sub;
      //if nodiak gives us a single object, convert that into an array with 1 element.
      if(err && Object.prototype.toString.call( err ) !== '[object Array]')
        err = [err];
      //loop through all not found keys and create objects for these
      for(var e = 0; err && e < err.length; e++){
        if(err[e].status_code === 404){
          sub = err[e].data.substring(err[e].data.indexOf('r') + 1, err[e].data.indexOf('@'));
          key = parseInt(sub, 10);
          var new_usr = app.riak.bucket('users').objects.new(err[e].data, userArray[key]);
          new_usr.data.dateJoined = getDate();
          new_usr.save(function(err, saved){
            console.log('User not found. New user created: ');
            console.log(saved.data.email);
          });
        }
      }
      //if nodiak gives us a single object, convert that into an array with 1 element
      if(objs && Object.prototype.toString.call( objs ) !== '[object Array]')
        objs = [objs];
      //loop through all found objects and overwrite them
      for(var o = 0; objs && o < objs.length; o++){
        clearChanges(objs[o]);
        sub = objs[o].key.substring(objs[o].key.indexOf('r') + 1, objs[o].key.indexOf('@'));
        key = parseInt(sub, 10);
        if(objs[o].siblings) console.log('siblings found and resolved');
        var merge_user = app.riak.bucket('users').objects.new(objs[o].key, userArray[key]);
        merge_user.metadata.vclock = objs[o].metadata.vclock;
        merge_user.save(function(err, saved){
          console.log('User updated');
          console.log(saved.data.email);
        });
      }
      callback();
    });
  }
}

//generate n pins. range s to n-1
var generatePins = exports.generatePins = function(s, n){
  var pinArray = [];
  var pinIds = [];
  var clock;
  var user_keys = [];
  
  //get user keys
  mr.listKeys('users', function(results){
    user_keys = results.data;
    if(user_keys.length > 0) next();
    else{
      console.log('No users in db. Unable to generate pins without owners.');
      return 0;
    }
  });
  function next(){
    var clock = s;
    for(var i = s; i < n; i++){
      pinIds.push(100 + i);
      //gamepin schema
      pinArray.push(
        { posterId: null,
          likedBy: [],
          repinVia: null,
          category: null,
          content: null,
          sourceUrl: null,
          gameName: null,
          publisher: null,
          description: 'This is pin ' + i,
          datePosted: null,
          groupId: null,
          returnAll: 'y',
          comments: [],
          changes:{ likedBy: {add:[], remove:[]},
                    comments:{add:[], remove:[] }
                  }
        }
      );
    }
    //set random category
    for(var i = s; i < n; i++){
      (function(i){
        random.getRandomInt(0, 11, function(err, rand) {
          pinArray[i].category = categories[rand];
          if(i === n-1) next2();
        });
      })(i);
    }
  }
  //set random posterId
  function next2(){
    clock = s;
    for(var i = s; i < n; i++){
      (function(i){
        random.getRandomInt(0, user_keys.length-1, function(err, rand) {
          pinArray[i].posterId = user_keys[rand];
          if(i === n-1) next3();
        });
      })(i);
    }
  }
  //create new pin.  If one exists with current key, overwrite it.
  function next3(){
    clock = s;
    console.log(pinIds);
    app.riak.bucket('gamepins').objects.get(pinIds, pin_resolve, function(err, objs){
      //if nodiak gives us a single object, convert that into an array with 1 element.
      if(err && Object.prototype.toString.call( err ) !== '[object Array]')
        err = [err];
      //loop through all not found keys and create objects for these
      for(var e = 0; err && e < err.length; e++){
        if(err[e].status_code === 404){
          var new_pin = app.riak.bucket('gamepins').objects.new(err[e].data, pinArray[err[e].data - 100]);
          new_pin.data.datePosted = getDate();
          new_pin.save(function(err, saved){
            console.log('new gamepin created');
            link(saved.data.posterId, saved.key);
          });
        }
      }
      //if nodiak gives us a single object, convert that into an array with 1 element.
      if(objs && Object.prototype.toString.call( objs ) !== '[object Array]')
        objs = [objs];
      //loop through all found objects and overwrite them
      for(var o = 0; objs && o < objs.length; o++){
        clearChanges(objs[o]);
        var merge_pin = app.riak.bucket('gamepin').objects.new(objs[o].key, pinArray[objs[o].key - 100]);
        merge_pin.metadata.vclock = objs[o].metadata.vclock;
        merge_pin.save(function(err, saved){
          console.log('gamepin updated');
          link(saved.data.posterId, saved.key);
        });
      }
    });
  }
  //fetch owner and add this post to his posts list
  function userLink(ownerId, postId){
    var update_user = app.riak.bucket('users').objects.new(ownerId);
    update_user.fetch(user_resolve, function(err, obj){
      if(err){
        console.log("Fetch User: " + err);
        return;
      }
      //clear changes
      clearChanges(obj);
      if(obj.siblings) console.log('siblings found and resolved');
      console.log(obj);
      update_user.data.posts.push(postId);
      update_user.data.changes.posts.add.push(postId);
      update_user.save(function(err, saved){
        console.log('link');
      });
    });
  }
}

//adds gamepin to user's posts
var link = exports.link = function(userId, pinId){
  usr = app.riak.bucket('users').objects.new(userId);
  usr.fetch(user_resolve, function(err, obj){
    if(err){
      console.log('err');
      console.log(err);
    }
    clearChanges(obj);
  
    console.log('userId: '+userId + ' pinId:' + pinId);
    console.log('before: [' + obj.data.posts + ']');
    //add this pin to the user object
    if(obj.data.posts.indexOf(pinId) === -1){
      obj.data.posts.push(pinId);
      obj.data.changes.posts.add.push(pinId);
      console.log('happening');
    }
    obj.save(function(err, saved){
      console.log('after: [' +saved.data.posts + ']');
      console.log('linked '+ pinId + 'to ' + userId);
    });
  });
}

//clear all posts from a user
var clearLinks = exports.clearLinks = function(userId){
  usr = app.riak.bucket('users').objects.new(userId);
  usr.fetch(user_resolve, function(err, obj){
    if(err){
      console.log("Fetch User: " + err);
      return;
    }
    //clear changes
    clearChanges(obj);
    obj.data.posts = [];
    obj.save(function(err, saved){
      console.log('after: [' +saved.data.posts + ']');
    });
  });
}

//Like a pin.  Sets up 2 way link between gamepin and user.
var like = exports.like = function(userId, pinId){
  //check if pin exists
  app.riak.bucket('gamepins').object.exists(pinId, function(err, result){
    if(err){
      console.log('Pin Exists: ' + err);
      return;
    }
    if(result) next();
    else console.log('Error: pin ' + pinId + 'not found in db');
  });
  //add pinId to user's likes[]
  function next(){
    usr = app.riak.bucket('users').objects.new(userId);
    usr.fetch(user_resolve, function(err, obj){
      if(err){
        console.log('Fetch User:' + err);
        return;
      }
      clearChanges(obj);
      console.log(userId + ' liked pin #'+pinId);
      if(obj.data.likes.indexOf(pinId) === -1){
        obj.data.likes.push(pinId);
        obj.data.changes.likes.add.push(pinId);
      }
      else
        console.log('Error: '+ userId + 'already liked this pin');
      obj.save(function(err, saved){
        console.log('like added to '+userId+': [' +saved.data.likes + ']');
        next2();
      });
    });
  }
  //add like to the gamepin's likedBy[]
  function next2(){
    var pin = app.riak.bucket('gamepins').object.new(pinId);
    pin.fetch(pin_resolve, function(err, obj){
      if(err){
        console.log("Fetch Pin: " +err);
        return;
      }
      //clear changes
      clearChanges(obj);
      if(obj.data.likedBy.indexOf(userId) === -1){
        obj.data.likedBy.push(userId);
        obj.data.changes.likedBy.add.push(userId);
      }
      else
        console.log('Error: ' + userId + 'already in pin '+ pinId + 's likedBy list');
      obj.save(function(err, saved){
        console.log("gamepin's likedBy list [" + saved.data.likedBy + "]");
      });
    });
  }
}

//Unlike a pin.  Removes 2 way between gamepin and user.
var unlike = exports.unlike = function(userId, pinId){
  //check if pin exists
  app.riak.bucket('gamepins').object.exists(pinId, function(err, result){
    if(err){
      console.log('GamePin Exists: ' + err);
      return;
    }
    if(result) next();
    else console.log('Error: pin ' + pinId + 'not found in db');
  });
  //remove pinId from user's likes
  function next(){
    usr = app.riak.bucket('users').objects.new(userId);
    usr.fetch(user_resolve, function(err, obj){
      if(err){
        console.log('Fetch User:' + err);
        return;
      }
      //clear changes
      clearChanges(obj);
      console.log(userId + ' unliked pin #'+pinId);
      if(obj.data.likes.indexOf(pinId) !== -1){
        obj.data.likes.splice(obj.data.likes.indexOf(pinId), 1);
        obj.data.changes.likes.remove.push(pinId);
      }
      obj.save(function(err, saved){
        console.log('like removed from '+userId+': [' +saved.data.likes + ']');
        next2();
      });
    });
  }
  //remove userId from pin's likedBy
  function next2(){
    pin = app.riak.bucket('gamepins').objects.new(pinId);
    pin.fetch(pin_resolve, function(err, obj){
      if(err){
        console.log('Fetch Pin:' + err);
        return;
      }
      //clear changes
      clearChanges(obj);
      console.log('Pin #'+pinId + ' removed ' +userId+ 'from likedBy list');
      if(obj.data.likedBy.indexOf(userId) !== -1){
        obj.data.likedBy.splice(obj.data.likedBy.indexOf(userId), 1);
        obj.data.changes.likedBy.remove.push(userId);
      }
      obj.save(function(err, saved){
        console.log('result liked list: [' + saved.data.likedBy +  ']');
      });
    });
  }
}

//Follow sets up 2 way link from user to user.
var follow = exports.follow = function(sourceId, targetId){
  var src = app.riak.bucket('users').objects.new(sourceId);
  var targ = app.riak.bucket('users').objects.new(targetId);
  //source user adds target to following
  src.fetch(user_resolve, function(err, obj){
    if(err){
      console.log("Fetch User: " + err);
      return;
    }
    clearChanges(obj);
    if(sourceId === targetId){
      console.log("Error: cannot follow yourself");
      return;
    }
    if(obj.data.following.indexOf(targetId) === -1){
      obj.data.following.push(targetId);
      obj.data.changes.following.add.push(targetId);
      obj.save(function(err,saved){
        console.log(sourceId + " following ["+ saved.data.following +"]");
        next();
      });
    }
    else{
      console.log("User " + targetId + " aready on following list");
      return;
    }
  });
  function next(){
    //target user adds source to followers
    targ.fetch(user_resolve, function(err, obj){
      if(err){
        console.log("Fetch User " + err);
        return;
      }
      clearChanges(obj);
      if(sourceId === targetId){
        console.log("Error: cannot follow yourself");
        return;
      }
      if(obj.data.followers.indexOf(sourceId) === -1){
        obj.data.followers.push(sourceId);
        obj.data.changes.followers.add.push(sourceId);
        obj.save(function(err, saved){
          console.log(targetId + " followers ["+ saved.data.followers +"]");
        });
      }
      else{
        console.log("User " + sourceId + " aready on followers list");
        return;
      }
    });
  } 
}

//Unfollow remotes 2 way link from user to user.
var unfollow = exports.unfollow = function(sourceId, targetId){
  var src = app.riak.bucket('users').objects.new(sourceId);
  var targ = app.riak.bucket('users').objects.new(targetId);
  //source user removes target from following
  src.fetch(user_resolve, function(err, obj){
    if(err){
      console.log("Fetch User: " + err);
      return;
    }
    clearChanges(obj);
    if(sourceId === targetId){
      console.log("Error: cannot unfollow yourself");
      return;
    }
    if(obj.data.following.indexOf(targetId) !== -1){
      obj.data.following.splice(obj.data.following.indexOf(targetId), 1);
      obj.data.changes.following.remove.push(targetId);
      obj.save(function(err,saved){
        console.log(sourceId + " following ["+ saved.data.following +"]");
        next();
      });
    }
    else{
      console.log("User " + targetId + " not on following list");
      return;
    }
  });
  function next(){
    //target user removes source from followers
    targ.fetch(user_resolve, function(err, obj){
      if(err){
        console.log("Fetch User: " + err);
        return;
      }
      clearChanges(obj);
      if(sourceId === targetId){
        console.log("Error: cannot unfollow yourself");
        return;
      }
      if(obj.data.followers.indexOf(sourceId) !== -1){
        obj.data.followers.splice(obj.data.followers.indexOf(sourceId), 1);
        obj.data.changes.followers.remove.push(sourceId);
        obj.save(function(err, saved){
          console.log(targetId + " followers ["+ saved.data.followers +"]");
        });
      }
      else{
        console.log("User " + sourceId + " not on followers list");
        return;
      }
    });
  }
}

//TODO
var friend = exports.friend = function(sourceId, targetId){
  
}

//Create new gamepin or overwrite existing one. 
var postPin = exports.postPin = function(pinId, pinData){
  //check if pin exists
  app.riak.bucket('gamepins').object.exists(pinId, function(err, result){
    if(err){
      console.log('Fetch Pin: ' + err);
      return;
    }
    if(result){
      overwrite();
      console.log('Pin already exists in db. Overwriting pin #' + pinId);
    }
    else{
      create();
      console.log('Creating new pin # ' + pinId);
    }
  });
  function create(){
    new_pin = app.riak.bucket('gamepins').object.new(pinId, pinData);
    new_pin.data.datePosted = getDate();
    new_pin.save(function(err, saved){
      console.log(saved.data.posterId +' posted pin #'+pinId);
      link(saved.data.posterId, pinId);
    });
  }
  function overwrite(){
    var old_pin = app.riak.bucket('gamepins').object.new(pinId);
    var new_pin = app.riak.bucket('gamepins').object.new(pinId, pinData);
    old_pin.fetch(pin_resolve, function(err, obj){
      if(err){
        console.log('Fetch Pin: ' + err);
        return;
      }
      clearChanges(obj);
      new_pin.metadata.vclock = obj.metadata.vclock;
      new_pin.save(function(err, saved){
        console.log('Pin #' + pinId + 'overwritten');
        link(saved.data.posterId, pinId);
      });
    });
    
  }
}

//same as postPin, but given a repinVia param
var repin = exports.repin = function(pinId, pinData){
  //check if pin exists
  app.riak.bucket('gamepins').object.exists(pinId, function(err, result){
    if(err){
      console.log('Pin Exists: ' + err);
      return;
    }
    if(!result) next();
    else console.log('Error: pin ' + pinId + 'already exists in db');
  });
  function next(){
    new_pin = app.riak.bucket('gamepins').object.new(pinId, pinData);
    new_pin.save(function(err, saved){
      console.log(saved.data.posterId +' repinned pin #'+pinId+ 'via '+saved.data.repinVia);
      link(saved.data.posterId, pinId);
    });
  }
}

//TODO
/*editPin = exports.editPin = function(pinId, pinData){
  //check if pin exists
  app.riak.bucket('gamepins').object.exists(pinId, function(err, result){
    if(err){
      console.log('Pin Exists: ' + err);
      return;
    }
    if(result) next();
    else console.log('Error: pin ' + pinId + 'does not exist in db');
  });
  function next(){
    var old_pin = app.riak.bucket('gamepins').object.new(pinId);
    var new_pin = app.riak.bucket('gamepins').object.new(pinId, pinData);
    old_pin.fetch(pin_resolve, function(err, obj){
      if(err){
        console.log('Fetch Pin: ' + err);
        return;
      }
      clearChanges(obj);
      new_pin.metadata.vclock = obj.metadata.vclock;
      new_pin.save(function(err, saved){
        console.log('Pin #' + pinId + 'overwritten');
      });
    });
  }
}*/

//Remove poster reference, like references, and then delete the gamepin
deletePin = exports.deletePin = function(pinId){
  old_pin = app.riak.bucket('gamepins').object.new(pinId);
  old_pin.fetch(pin_resolve, function(err, pin_obj){
    if(err){
      console.log("Fetch Pin: " + err);
      return;
    }
    clearChanges(pin_obj);
    usr = app.riak.bucket('users').object.new(pin_obj.data.posterId);
    //remove reference from pin owner
    usr.fetch(user_resolve, function(err, usr_obj){
      if(err){
        console.log("Fetch User: " + err);
        //if pin owner does not exist, delete the pin anyways
        if(err.status_code === 404) next();
        return;
      }
      clearChanges(usr_obj);
      if(usr_obj.data.posts.indexOf(pinId) === -1){
        console.log("Error: User does not own this pin");
        return;
      }
      usr_obj.data.posts.splice(usr_obj.data.posts.indexOf(pinId), 1);
      usr_obj.data.changes.posts.remove.push(pinId);
      usr_obj.save(function(err, saved){
        console.log('pin #' + pinId + 'removed from '+ saved.key);
        console.log('result array [' + saved.data.posts + ']');
        next();
      });
    });
    function next(){
      console.log('TREEHORNS');
      //get all users, if any, who liked this pin and remove those likes
      var clock = 0;
      if(pin_obj.data.likedBy.length === 0) next2();
      for(var i = 0; i < pin_obj.data.likedBy.length; i++){
        (function(i){
          var usr = app.riak.bucket('users').objects.new(pin_obj.data.likedBy[i]);
          usr.fetch(user_resolve, function(err, obj){
            clearChanges(obj);
            obj.data.likes.splice(obj.data.likes.indexOf(pinId), 1);
            obj.data.changes.likes.remove.push(pinId);
            usr.save(function(err, saved){
              if(clock === pin_obj.data.likedBy.length-1) next2();
              clock++;
            });
          });
        })(i);
      }
    }
    function next2(){
      //delete the pin itself
      pin_obj.delete(function(err, obj){
        console.log(pinId + 'deleted');
      });
    }
  });
}

//Delete all pins, remove follower links, and then delete the user
//TODO: Where will likes go?
var deactivateUser = exports.deactivateUser = function(userId){
  var temp_usr = app.riak.bucket('users').objects.new(userId);
  var clock;
  temp_usr.fetch(user_resolve, function(err, obj){
    if(err){
      console.log("Fetch "+ userId + ": " + err);
      return;
    }
    console.log('feched');
    clearChanges(obj);
    //delete all pins
    clock = 0;
    for(var p in obj.data.posts){
      (function(p){
        deletePin(obj.data.posts[p].toString());
        if(clock === obj.data.posts.length-1)next();
        clock++;
      })(p);
    }
    function next(){
      console.log('pinsDeleted');
      //find people following user and remove user from their following list
      clock = 0;
      if(obj.data.followers.length === 0) next2();
      for(var f in obj.data.followers){
        (function(f){
          var usr = app.riak.bucket('users').objects.new(obj.data.followers[f]);
          usr.fetch(user_resolve, function(err, obj){
            obj.data.following.splice(obj.data.following.indexOf(userId), 1);
            obj.data.changes.following.remove.push(userId);
            obj.save(function(err, saved){
              if(clock === obj.data.followers.length-1) next2();
              clock++;
            });
          });
        })(f);
      }
    }
    //find people who user has followed and remove user from followers
    function next2(){
      console.log('next');
      clock = 0;
      if(obj.data.followers.length === 0) next3();
      for(var f in obj.data.following){
        (function(f){
          var usr = app.riak.bucket('users').objects.new(obj.data.following[f]);
          usr.fetch(user_resolve, function(err, obj){
            obj.data.followers.splice(obj.data.followers.indexOf(userId), 1);
            obj.data.changes.followers.remove.push(userId);
            obj.save(function(err, saved){
              if(clock === obj.data.following.length-1) next3();
              clock++;
            });
          });
        })(f);
      }
    }
    //delete the user. This is the end.
    function next3(){
      obj.delete(function(err, deleted){
        console.log('User ' +userId+ ' and all connected references wiped from db. This is the end.');
      });
    }
  });
  
}

//Get unique, roughly sequential ID from nodeflake server
var prev = '';
var generateId = exports.generateId = function(callback){
  var ID_obj;
  //do GET request to nodeflake
  var options = {
    host: config.nodeflake_host,
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
      if(ID_obj.id === prev){
        console.log('dupId: ' +ID_obj.id);
        //recursive function
        return generateId(callback);
      }
      prev = ID_obj.id;
      next();
    });
  });
  R.end();
  function next(){
    callback(ID_obj.id);
  }
}

//Creates new comment obj. 2 way link from comment to gamepin.
//TODO: Link to user via 'recent activity'
var addComment = exports.addComment = function(pinId, posterId, text){
  var commentId;
  console.log('addComment()');
  //validations
  //test if empty
  if(text === '' || text === null || text === undefined){
    console.log("Error: text is empty");
    return;
  }
  //swear word filter
  //comment length limit.
  generateId(function(id){
    commentId = id;
    console.log(id);
    next();
  });
  function next(){
    var cmt = app.riak.bucket('comments').objects.new(commentId, {pin: pinId, poster: posterId, content: text});
    cmt.save(function(err, saved_cmt){
      var pin = app.riak.bucket('gamepins').objects.new(pinId);
      pin.fetch(pin_resolve, function(err, obj){
        if(err){
          console.log("Fetch Pin: " + err);
          return;
        }
        obj.data.comments.push(saved_cmt.key);
        obj.data.changes.comments.add.push(saved_cmt.key);
        obj.save(function(err, saved_pin){
          console.log("Comment #" + saved_cmt.key + " written to pin #" + saved_pin.key);
        });
      });
    });
  }
}

//Removes link to pin, then deletes comment.
//TODO: Remove link from user's 'recent activity'
var deleteComment = exports.deleteComment = function(commentId){
  console.log("DeleteComment()");
  var cmt = app.riak.bucket('comments').objects.new(commentId);
  cmt.fetch(function(err, cmt_obj){
    if(err){
      console.log("Fetch Comment: " + err);
      return;
    }
    var pinId = cmt_obj.data.pin;
    var pin = app.riak.bucket('gamepins').objects.new(pinId);
    pin.fetch(pin_resolve, function(err, pin_obj){
      if(err){
        console.log("Fetch Pin: " + err);
        return;
      }
      //remove comment from pin
      if(pin_obj.data.comments.indexOf(cmt_obj.key) !== -1){
        pin_obj.data.comments.splice(pin_obj.data.comments.indexOf(cmt_obj.key), 1);
        pin_obj.data.changes.comments.remove.push(cmt_obj.key);
      }
      pin_obj.save(function(err, saved){
        console.log('Comment #' +cmt_obj.key+ " removed from list");
        console.log('Pin #'+pin_obj.key+' comment list['+ saved.data.comments +']');
        next();
      });
    });
    function next(){
      //delete the comment
      cmt_obj.delete(function(err, deleted){
        console.log("Comment #"+deleted.key+ " deleted!");
      });
    }
  });
}

//deletes all data from known buckets, effectively clearing the DB
var wipeDb = exports.wipeDb = function(){
  mr.deleteObjects('gamepins');
  mr.deleteObjects('users');
  mr.deleteObjects('comments');
}

//fill DB with users and gamepins. For testing purposes.
var populateDb = exports.populateDb = function(){
  generateUsers(0,10, function(){
    generatePins(0,20);
  });
}