/* utility.js contains conflict resolution, nodeflake ID generation, and other useful
 * functions used here and there.
 */

//TODO: Give Quyay API callback in callback(err, success) format
var app = require('./app');
var http = require('http');
var random = require('secure_random');
var bcrypt = require('bcrypt-nodejs');
var config = require('./config');
var errlog = app.errlog;
var evtlog = app.evtlog;
var outlog = app.outlog;

var clone = exports.clone = function(obj){
  if(obj == null || typeof(obj) != 'object')
      return obj;

  var temp = obj.constructor(); // changed

  for(var key in obj)
      temp[key] = clone(obj[key]);
  return temp;
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
  evtlog.info('last_write_wins');
  outlog.info('last_write_wins');
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
    evtlog.info('pin_resolve called on non pin: calling default resolver');
    outlog.info('pin_resolve called on non pin: calling default resolver');
    return last_write_wins(siblings);
  }
  evtlog.info('pin_resolve');
  outlog.info('pin_resolve');
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
    evtlog.info('user_resolve called on non user: calling default resolver');
    outlog.info('user_resolve called on non user: calling default resolver');
    return last_write_wins(siblings);
  }
  evtlog.info('user_resolve()');
  outlog.info('user_resolve()');
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
                      following: {add:[], remove:[]}
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
  return siblings[0];
}

//12 categories
var categories = ['Casino', 'Casual', 'Shooter', 'Action',
                  'Simulation', 'Racing', 'Puzzle', 'Fighting',
                  'Social', 'Space', 'Horror', 'Strategy'];

//adds gamepin to user's posts
var link = exports.link = function(userId, pinId){
  usr = app.riak.bucket('users').objects.new(userId);
  usr.fetch(user_resolve, function(err, obj){
    if(err) return errlog.info('err');
    clearChanges(obj);

    //add this pin to the user object
    if(obj.data.posts.indexOf(pinId) === -1){
      obj.data.posts.push(pinId);
      obj.data.changes.posts.add.push(pinId);
    }
    obj.save(function(err, saved){
      evtlog.info('added gamepin: '+ pinId + 'to ' + userId);
      outlog.info('added gamepin: '+ pinId + 'to ' + userId);
    });
  });
}

//Like a pin.  Sets up 2 way link between gamepin and user.
var like = exports.like = function(userId, pinId){
  //check if pin exists
  app.riak.bucket('gamepins').object.exists(pinId, function(err, result){
    if(err) return errlog.info('like error -> pin Exists: ' + err);
    next();
  });
  //add pinId to user's likes[]
  function next(){
    usr = app.riak.bucket('users').objects.new(userId);
    usr.fetch(user_resolve, function(err, obj){
      if(err) return errlog.info('fetch user error: ' + err);
      clearChanges(obj);
      if(obj.data.likes.indexOf(pinId) === -1){
        obj.data.likes.push(pinId);
        obj.data.changes.likes.add.push(pinId);
      }
      else return errlog.info('like error: '+ userId + ' already liked this pin');
      obj.save(function(err, saved){
        if(err) return errlog.info('like error: ' + err);
        evtlog.info('like added to '+userId+': [' +saved.data.likes + ']');
        outlog.info('like added to '+userId+': [' +saved.data.likes + ']');
        next2();
      });
    });
  }
  //add like to the gamepin's likedBy[]
  function next2(){
    var pin = app.riak.bucket('gamepins').object.new(pinId);
    pin.fetch(pin_resolve, function(err, obj){
      if(err) return errlog.info("fetch pin: " +err);
      //clear changes
      clearChanges(obj);
      if(obj.data.likedBy.indexOf(userId) === -1){
        obj.data.likedBy.push(userId);
        obj.data.changes.likedBy.add.push(userId);
      }
      else return errlog.info('error: ' + userId + 'already in pin '+ pinId + 's likedBy list');
      obj.save(function(err, saved){
        outlog.info("gamepin's likedBy list updated [" + saved.data.likedBy + "]");
      });
    });
  }
}

//Unlike a pin.  Removes 2 way between gamepin and user.
var unlike = exports.unlike = function(userId, pinId){
  //check if pin exists
  app.riak.bucket('gamepins').object.exists(pinId, function(err, result){
    if(err) return errlog.info('gamePin exists: ' + err);
    if(result) next();
  });
  //remove pinId from user's likes
  function next(){
    usr = app.riak.bucket('users').objects.new(userId);
    usr.fetch(user_resolve, function(err, obj){
      if(err) return errlog.info('Fetch User:' + err);
      //clear changes
      clearChanges(obj);
      if(obj.data.likes.indexOf(pinId) !== -1){
        obj.data.likes.splice(obj.data.likes.indexOf(pinId), 1);
        obj.data.changes.likes.remove.push(pinId);
      }
      obj.save(function(err, saved){
        evtlog.info('like removed from '+userId+': [' +saved.data.likes + ']');
        outlog.info('like removed from '+userId+': [' +saved.data.likes + ']');
        next2();
      });
    });
  }
  //remove userId from pin's likedBy
  function next2(){
    pin = app.riak.bucket('gamepins').objects.new(pinId);
    pin.fetch(pin_resolve, function(err, obj){
      if(err) return errlog.info('Fetch Pin:' + err);
      //clear changes
      clearChanges(obj);
      outlog.info('Pin #'+pinId + ' removed ' +userId+ 'from likedBy list');
      evtlog.info('Pin #'+pinId + ' removed ' +userId+ 'from likedBy list');
      if(obj.data.likedBy.indexOf(userId) !== -1){
        obj.data.likedBy.splice(obj.data.likedBy.indexOf(userId), 1);
        obj.data.changes.likedBy.remove.push(userId);
      }
      obj.save(function(err, saved){
        if(err) return errlog.info('Gamepin save error: ' + err);
        outlog.info('result liked list: [' + saved.data.likedBy +  ']');
      });
    });
  }
}

//Follow sets up 2 way link from user to user.
//TODO: move follow and unfollow into user.js
var follow = exports.follow = function(sourceId, targetId){
  var src = app.riak.bucket('users').objects.new(sourceId);
  var targ = app.riak.bucket('users').objects.new(targetId);
  //source user adds target to following
  src.fetch(user_resolve, function(err, obj){
    if(err) return errlog.info("Fetch User: " + err);
    clearChanges(obj);
    if(sourceId === targetId) return errlog.info("Error: cannot follow yourself");
    if(obj.data.following.indexOf(targetId) === -1){
      obj.data.following.push(targetId);
      obj.data.changes.following.add.push(targetId);
      obj.save(function(err,saved){
        outlog.info(sourceId + " following ["+ saved.data.following +"]");
        evtlog.info(sourceId + " following ["+ saved.data.following +"]");
        next();
      });
    }
    else return errlog.info("User " + targetId + " aready on following list");
  });
  function next(){
    //target user adds source to followers
    targ.fetch(user_resolve, function(err, obj){
      if(err) return outlog.info("Fetch User " + err);
      clearChanges(obj);
      if(sourceId === targetId) return errlog.info("Error: cannot follow yourself");
      if(obj.data.followers.indexOf(sourceId) === -1){
        obj.data.followers.push(sourceId);
        obj.data.changes.followers.add.push(sourceId);
        obj.save(function(err, saved){
          outlog.info(targetId + " followers ["+ saved.data.followers +"]");
          evtlog.info(targetId + " followers ["+ saved.data.followers +"]");
        });
      }
      else return errlog.info("User " + sourceId + " aready on followers list");
    });
  } 
}

//Unfollow remotes 2 way link from user to user.
var unfollow = exports.unfollow = function(sourceId, targetId){
  var src = app.riak.bucket('users').objects.new(sourceId);
  var targ = app.riak.bucket('users').objects.new(targetId);
  //source user removes target from following
  src.fetch(user_resolve, function(err, obj){
    if(err) return errlog.info("Fetch User: " + err);
    clearChanges(obj);
    if(sourceId === targetId) return errlog.info("Error: cannot unfollow yourself");
    if(obj.data.following.indexOf(targetId) !== -1){
      obj.data.following.splice(obj.data.following.indexOf(targetId), 1);
      obj.data.changes.following.remove.push(targetId);
      obj.save(function(err,saved){
        outlog.info(sourceId + " following ["+ saved.data.following +"]");
        evtlog.info(sourceId + " following ["+ saved.data.following +"]");
        next();
      });
    }
    else return errlog.info("User " + targetId + " not on following list");
  });
  function next(){
    //target user removes source from followers
    targ.fetch(user_resolve, function(err, obj){
      if(err) return errlog.info("Fetch User: " + err);
      clearChanges(obj);
      if(sourceId === targetId) return errlog.info("Error: cannot unfollow yourself");
      if(obj.data.followers.indexOf(sourceId) !== -1){
        obj.data.followers.splice(obj.data.followers.indexOf(sourceId), 1);
        obj.data.changes.followers.remove.push(sourceId);
        obj.save(function(err, saved){
          outlog.info(targetId + " followers ["+ saved.data.followers +"]");
          evtlog.info(targetId + " followers ["+ saved.data.followers +"]");
        });
      }
      else return errlog.info("User " + sourceId + " not on followers list");
    });
  }
}


//Remove poster reference, like references, and then delete the gamepin
//TODO: move this into user.js
deletePin = exports.deletePin = function(pinId){
  old_pin = app.riak.bucket('gamepins').object.new(pinId);
  old_pin.fetch(pin_resolve, function(err, pin_obj){
    if(err) return errlog.info("Fetch Pin: " + err);
    clearChanges(pin_obj);
    usr = app.riak.bucket('users').object.new(pin_obj.data.posterId);
    //remove reference from pin owner
    usr.fetch(user_resolve, function(err, usr_obj){
      if(err){
        errlog.info("Fetch User: " + err);
        //if pin owner does not exist, delete the pin anyways
        if(err.status_code === 404) next();
        return;
      }
      clearChanges(usr_obj);
      if(usr_obj.data.posts.indexOf(pinId) === -1) return errlog.info("Error: User does not own this pin");
      usr_obj.data.posts.splice(usr_obj.data.posts.indexOf(pinId), 1);
      usr_obj.data.changes.posts.remove.push(pinId);
      usr_obj.save(function(err, saved){
        outlog.info('pin #' + pinId + 'removed from '+ saved.key);
        evtlog.info('pin #' + pinId + 'removed from '+ saved.key);
        next();
      });
    });
    function next(){
      //get all users, if any, who liked this pin and remove those likes
      var clock = 0;
      if(pin_obj.data.likedBy.length === 0) next2();
      for(var i = 0; i < pin_obj.data.likedBy.length; i++){
        (function(i){
          var usr = app.riak.bucket('users').objects.new(pin_obj.data.likedBy[i]);
          usr.fetch(user_resolve, function(err, obj){
            if(err) return errlog.info('Fectch user error: ' + err);
            clearChanges(obj);
            obj.data.likes.splice(obj.data.likes.indexOf(pinId), 1);
            obj.data.changes.likes.remove.push(pinId);
            usr.save(function(err, saved){
              if(err) return errlog.info( 'User save error: ' + err );
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
        if(err) return errlog.info('delete gamepin: ' + err);
        evtlog.info('Pin ' + pinId + 'deleted');
        outlog.info('Pin ' + pinId + 'deleted');
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
    if(err) return errlog.info("Fetch "+ userId + ": " + err);
    clearChanges(obj);
    //delete all pins
    clock = 0;
    for(var p in obj.data.posts){
      (function(p){
        //TODO deletePin a callback
        deletePin(obj.data.posts[p].toString());
        if(clock === obj.data.posts.length-1) next();
        clock++;
      })(p);
    }
    function next(){
      outlog.info('pinsDeleted');
      //find people following user and remove user from their following list
      clock = 0;
      if(obj.data.followers.length === 0) next2();
      for(var f in obj.data.followers){
        (function(f){
          var usr = app.riak.bucket('users').objects.new(obj.data.followers[f]);
          usr.fetch(user_resolve, function(err, obj){
            if(err) return errlog.info('user fetch error: ' + err);
            obj.data.following.splice(obj.data.following.indexOf(userId), 1);
            obj.data.changes.following.remove.push(userId);
            obj.save(function(err, saved){
              if(err) return errlog.info('user save error:' + err);
              if(clock === obj.data.followers.length-1) next2();
              clock++;
            });
          });
        })(f);
      }
    }
    //find people who user has followed and remove user from followers
    function next2(){
      clock = 0;
      if(obj.data.followers.length === 0) next3();
      for(var f in obj.data.following){
        (function(f){
          var usr = app.riak.bucket('users').objects.new(obj.data.following[f]);
          usr.fetch(user_resolve, function(err, obj){
            if(err) return errlog.info('user fetch error: ' + err);
            obj.data.followers.splice(obj.data.followers.indexOf(userId), 1);
            obj.data.changes.followers.remove.push(userId);
            obj.save(function(err, saved){
              if(err) return errlog.info('user save error: ' + err);
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
        if(err) return errlog.info('Delete error: ' + err);
        outlog.info('User ' +userId+ ' and all connected references wiped from db. This is the end.');
      });
    }
  });
  
}


//TODO: Make nodeflake return in nodejs style, callback(err, result)
//Get unique, roughly sequential ID from nodeflake server
var nodeflake_prev = '';
var generateId = exports.generateId = function(callback){
  var ID_obj;
  //do GET request to nodeflake
  var options = {
    host: app.nodeflake_host,
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
      nodeflake_prev = ID_obj.id;
      next();
    });
  });
  R.on('error', function(e){
    errlog.info('Nodeflake error: ' + e);
  });
  R.end();
  function next(){
    //invert values allowing us to sort from new (low #) to old (high #)
    var val = "999999999999999999" - ID_obj.id;
    callback(val);
  }
}

//Removes link to pin, then deletes comment.
//TODO: Remove link from user's 'recent activity'
var deleteComment = exports.deleteComment = function(commentId){
  var cmt = app.riak.bucket('comments').objects.new(commentId);
  cmt.fetch(function(err, cmt_obj){
    if(err) return errlog.info("Fetch Comment: " + err);
    var pinId = cmt_obj.data.pin;
    var pin = app.riak.bucket('gamepins').objects.new(pinId);
    pin.fetch(pin_resolve, function(err, pin_obj){
      if(err) return outlog.info("Fetch Pin: " + err);
      //remove comment from pin
      if(pin_obj.data.comments.indexOf(cmt_obj.key) !== -1){
        pin_obj.data.comments.splice(pin_obj.data.comments.indexOf(cmt_obj.key), 1);
        pin_obj.data.changes.comments.remove.push(cmt_obj.key);
      }
      pin_obj.save(function(err, saved){
        if(err) return errlog.info('Gamepin save error: ' + err);
        outlog.info('Comment #' +cmt_obj.key+ " removed from list");
        evtlog.info('Comment #' +cmt_obj.key+ " removed from list");
        next();
      });
    });
    function next(){
      //delete the comment
      cmt_obj.delete(function(err, deleted){
        if(err) errlog.info('Delete comment error: ' + err);
        outlog.info("Comment #"+deleted.key+ " deleted!");
        evtlog.info("Comment #"+deleted.key+ " deleted!");
      });
    }
  });
}
