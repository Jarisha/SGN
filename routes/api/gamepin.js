/*************************************** Gamepin ***************************************/
var http = require('http');

var httpGet = require('http-get');
var async = require('async');

var util = require('../../utility');
var app = require('../../app');
var gamepinSchema = require('../../schema/gamepin');
var userAPI = require('./user');
var base = require('./base.js');
var E = require('../../customErrors');

var errlog = app.errlog;
var evtlog = app.evtlog;
var outlog = app.outlog;

/********************************************* DB Level - Level 1 *******************************/

// Reindex Riak Object ~ gamepin to gamepinSchema.
// Cases: Error - Success. callback(error, RO_usr)
var reindexGamepin = function(ROgamepin, callback){
  ROgamepin.data['version'] = gamepinSchema.gamepinInstance.version;
  //hard code data transfers
  
  var new_gamepin = new gamepinSchema.gamepin(ROgamepin.data);
  //console.log(new_gamepin);
  var invalid = new_gamepin.validate();
  if(invalid) return callback(invalid, null);
  ROgamepin.data = new_gamepin;
  //console.log('reindexGamepin');
  base.save_RO(ROgamepin, 'gamepins', function(err, savedRO){
    if(err) return callback(err, null);
    return callback(null, savedRO);
  });
}

// Get Riak Object ~ Gamepin. Tested - No
// Cases: Error - Out of Date - Success.  callback(error, RO_gamepin)
var get_RO_gamepin = exports.get_RO_gamepin = function(key, callback){
  app.riak.bucket('gamepins').object.get(key, function(err, pin){
    if(err){
      if(err.status_code === 404) return callback(new E.NotFoundError('get_RO_gamepin: '+err.data+' not found'), null);
      return callback(new Error('get_RO_gamepin: '+err.message), null);
    }
    if(!pin.data.version || pin.data.version !== gamepinSchema.gamepinInstance.version){
      reindexGamepin(pin, function(_err, updated_pin){
        if(_err) return callback(_err, null);
        return callback(null, updated_pin);
      });
    }
    else return callback(null, pin);
  });
}

// Get Riak Object Array ~ Gamepin. Tested - No
// Cases: Error - Out of Date - Success. callback(errors, RO_gamepins)
var get_RO_gamepins = function(keys, callback){
  var gamepins = [];
  var outdated = [];
  var outdated_index = {};
  
  async.waterfall([
    //eliminate all not found keys
    function(callback){
      base.RO_exists(keys, 'gamepins', function(err, not_found, found){
        if(err) callback(err, null);
        keys = found;
        callback(null, keys);
     });
    },
    //fetch user RObjects
    function(keys, callback){
      app.riak.bucket('gamepins').objects.get(keys, util.last_write_wins, function(err, usrs){
        if(err) return callback(new Error('get_RO_gamepins: '+err.message), null);
        return callback(null, usrs);
      });
    }
  ], function(err, pins){
    if(err) return callback(err, null);
    gamepins = pins;
    next();
  });
  
  function next(){
    //find all outdated gamepins
    for(i = 0, len = gamepins.length; i < len; i++){
      if(gamepins[i].data.version !== userSchema.userInstance.version){
        outdated.push(gamepins[i]);
        outdated_index[gamepins[i]] = i;
      }
    }
    if(outdated.length === 0) next2();
    //reindex outdated gamepins, then overwrite their outdated counterparts
    async.map(outdated, reindexUser, function(err, results){
      if(err) callback(err, null);
      for(i = 0, len = results.length; i < len; i++){
        gamepins[outdated_index[results[i]]] = results[i];
      }
      next2();
    });
  }
  function next2(){
    return callback(null, gamepins);
  }
}

//add userId to gamepin's likedBy list, then save
// callback(error, updatedPin)
var addLike = function(pin,  callback){
 //console.log('gamesGRABBR');
 
}

/********************************************* CRUD & Validation Level - Level 2 ********************************/
//create new gamepin data, callback(error, pin_data);
function createGamepin(input, callback){
  var pin = new gamepinSchema.gamepin(input);
  var invalid = pin.validate();
  if(invalid) return callback(invalid);
  return callback(null, pin);
}

//merge input into validData, modifies validData, callback(error);
function updateGamepin(validData, input, callback){
  var result = util.overwrite(validData, input);
  if(result) return callback(result);
  var pin = new gamepinSchema.gamepin(validData);
  var invalid = pin.validate();
  invalid ? callback(invalid) : callback(false);
}

/***************************************************** API Level - Level 3 *****************************************/

exports.fetchGamepin = function(req, res){
  get_RO_gamepin(req.body.pinId, function(err, pin){
    if(err) return res.json({ error: err.message });
    else return res.send(JSON.stringify(pin.data));
  });
}

exports.fetchGamepins = function(req, res){
  
}

exports.createWrap = function(req, res){
  if(!req.body.posterId) return res.json({ error: 'posterId missing' });
  var poster;
  var pinId;
  
  async.waterfall([
   //verify user is valid
    function(callback){
      app.riak.bucket('users').object.exists(req.body.posterId, function(err, result){
        if(err) return callback(err, null);
        if(!result) return res.json({ error: 'posterId not found in DB' });
        poster = req.body.posterId;
        callback(null);
      });
    },
    //create gamepin
    function(callback){
      createGamepin(req.body, function(err, pinData){
        if(err) return callback(err, null);
        callback(null, pinData);
      });
    },
    //generate nodeflake ID
    function(pinData, callback){
      util.generateId(function(id){
        pinId = id;
        callback(null, id, pinData);
      });
    },
    //save gamepin to DB
    function(id, data, callback){
      var RO_pin = app.riak.bucket('gamepins').object.new(id, data);
      base.save_RO(RO_pin, 'gamepins', function(err, saved){
        if(err) return callback(err, null);
        callback(null);
      });
    },
    //add gamepin to user posts, save usr
    function(callback){
      userAPI.addPinToUser(poster, pinId, function(err, result){
        if(err) callback(err, null);
        return callback(null);
      });
    }
  ], function(err, result){
    if(err){
      errlog.info('createGamePin error: '+err.message);
      return res.json({ error: err.message });
    }
    return res.json({ success: poster+' posted '+pinId+' successfully' });
  });
}

exports.editWrap = function(req, res){
  var input = {};
  if(!req.body.pinId) return res.json({ error: 'pinId missing' });
  var pinId = req.body.pinId;
  delete req.body.pinId;
  for(a in req.body){
    if(!req.body[a]) delete req.body[a];
  }
  async.waterfall([
    //get gamepin
    function(callback){
      get_RO_gamepin(pinId, function(err, pin){
        if(err) return callback(err);
        return callback(err, pin);
      });
    },
    //update gamepin data
    function(pin, callback){
      updateGamepin(pin.data, req.body, function(err){
        if(err) return callback(err, null);
        return callback(null, pin);
      });
    },
    //save gamepin
    function(pin, callback){
      pin.save(function(err, saved){
        if(err) return callback(err, null);
        return callback(null, saved);
      });
    }
  ], function(err, result){
    if(err){
      errlog.info('Edit Gamepin error: '+err.messsage);
      return res.json({ error: 'Edit Gamepin error: '+err.message });
    }
    return res.json({ success: 'pin: '+pinId+' edited successfully!' });
  });
}

exports.deleteWrap = function(req, res){
  if(!req.body.pinId) res.json({ error: 'pinID missing' });
  var pinId = req.body.pinId;
  var userId;
  
  async.waterfall([
    //check if gamepin exists
    function(callback){
      app.riak.bucket('gamepins').object.exists(pinId, function(err, exists){
        if(err) callback(err);
        else if(!exists) callback(new Error('delete error: gamepin'+pinId+' does not exist'));
        else callback(null);
      });
    },
    //get RO_gamepin, extract userId
    function(callback){
      app.riak.bucket('gamepins').objects.get(pinId, function(err, pin){
        if(err) callback(err);
        else{
          userId = pin.data.posterId;
          callback(null);
        }
      });
    }
  ], function(err, result){
    if(err){
      errlog.info('delete gamepin error: '+err.message);
      return res.json({ error: err.message });
    }
    next();
  });
  
  function next(){
    async.parallel([
      //delete gamepin
      function(callback){
        base.get_and_delete({key: pinId, bucket: 'gamepins'}, function(err){
          if(err) return callback(err);
          callback(null);
        });
      },
      //remove reference from user and save
      function(callback){
        userAPI.removePinFromUser(userId, pinId, function(err, usr){
          if(err) return callback(err);
          if(usr) callback(null);
        });
      }
    ], function(err, result){
      if(err){
        errlog.info('delete gamepin error: '+err.messsage);
        return res.json({ error: 'delete gamepin error: '+err.messsage });
      }
      return res.json({ success: 'gamepin '+pinId+' deleted' });
    });
  }
}

/********************************************** API Level - Redacted  *************************************/

exports.authenticateCDN = function(req, res){
  console.log('authenticate CDN');
  console.log(app.rackit);
  
  app.rackit.reAuth(function(err){
    if(err) console.log(err);
    console.log('reAuth was a success?'); 
  });
  
  /*app.rackit.init({
    user: 'happyspace',
    key: '1b5a100b899c44633dbda1aa93ea6237',
    prefix: 'gamepin',
    tempURLKey : null,
    useSNET : false,
    useCDN : true,
    useSSL : false, // Specifies whether to use SSL (https) for CDN links
    verbose : false, // If set to true, log messages will be generated
    logger : console.log // Function to receive log messages
    }, function(err){
      if(err) return res.json({ error: err.message });
      else return res.json({ success: 'Rackspace authentication success' });
  });*/
}

//Create gamepin and "post" to relevant areas
exports.postImageUpload = function(req, res){
  //validate data
  if(!req.body.name || !req.body.description || !req.body.category || !req.files.image){
    errlog.info("Error: Required fields missing or left blank");
    return res.json({ error: "Required fields missing or left blank" });
  }
  
  var IE = false;
  if(req.get('X-Requested-With') != 'XMLHttpRequest') IE = true;
  
  //get blank gamepin obj
  //var post_data = util.clone(gamepin_obj);
  var post_data = new gamepinSchema.gamepin();
  post_data.posterId = req.session.loggedIn;
  post_data.posterName = req.session.userName;
  post_data.category = req.body.category;
  post_data.gameName = req.body.name;
  post_data.publisher = req.body.publisher || null;
  post_data.description = req.body.description;
  post_data.datePosted = util.getDate();
  
  //Push content onto rackspace CDN, retreive URL
  
  tryThis();
  
  //need to retry the CDN request in case we get a 401
  function tryThis(){
    app.rackit.add(req.files.image.path, {type: req.files.image.type}, function(err, cloudpath){
      if(err){
        errlog.info('rackspace error:' + err);
        //reset rackit when it dares to give me a 401, and fricking call the function again (recursive strategy)
        if(err.message.indexOf('401') !== -1){
          app.rackit.reAuth(function(err){
            if(err){
              console.log('reAuth failure: ');
              console.log(err);
            }
            console.log('reAuth was a success, hopefully. calling this action again');
            errlog.info('trying again');
            return tryThis();
          });
        }
        if(IE){
          res.contentType('text/plain');
          return res.send(JSON.stringify({error: "CDN error"}));
        }
        return res.json({error: err});
      }
      var viewUrl = app.rackit.getURI(cloudpath);
      post_data.sourceUrl = viewUrl;
      post_data.cloudPath = cloudpath;
      postGamePin(post_data, function(err, data){
        if(err){
          errlog.info('postGamePin error: ' + err);
          if(IE){
            res.contentType('text/plain');
            return res.send(JSON.stringify({ error: "Fetch user error" }));
          }
          return res.json({error: err});
        }
        outlog.info(post_data.posterName + ' uploaded image onto ' + post_data.category);
        evtlog.info(post_data.posterName + ' uploaded image onto ' + post_data.category);
        
        if(IE){
         res.contentType('text/plain');
         return res.send(JSON.stringify(data));
        }
        return res.json(data);
      });
    });
  }
}

exports.postImageUrl = function(req, res){
  //validate data
  if(!req.body.name || !req.body.description || !req.body.category){
    errlog.info("Error: Required fields missing or left blank");
    return res.json({ error: "Required fields missing or left blank" });
  }
  
  //get blank gamepin obj
  var post_data = new gamepinSchema.gamepin();
  
  post_data.posterId = req.session.loggedIn;
  post_data.posterName = req.session.userName;
  post_data.category = req.body.category;
  post_data.gameName = req.body.name;
  post_data.publisher = req.body.publisher || null;
  post_data.description = req.body.description;
  post_data.datePosted = util.getDate();
  
  var content_type = req.body.type;
  var file_extension;
  var imgPath;
  outlog.info(content_type);
  switch(content_type){
    case 'image/png':
      file_extension = '.png';
      break;
    case 'image/gif':
      file_extension = '.gif';
      break;
    case 'image/jpeg':
      file_extension = '.jpg';
      break;
  }
  //hack to detect https, TODO: try to upload https using nodejs htps module;
  if(req.body.url.indexOf('https://') !== -1){
    errlog.info('cannot upload https url');
    return res.json({ error: 'cannot upload https url' });
  };
  
  //stream url for image directly into rackspace...rackmagic!
  http.get(req.body.url, function(resp){
    
    tryThis();
    
    function tryThis(){
      app.rackit.add(resp, function(err, cloudpath){
        if(err) return errlog.info('Rackspace url stream error ' + err);
        post_data.sourceUrl = app.rackit.getURI(cloudpath);
        post_data.cloudPath = cloudpath;
        postGamePin(post_data, function(err, data){
          if(err){
            errlog.info('postGamePin error' + err);
            if(err.message.indexOf('401') !== -1){
              app.rackit.reAuth(function(err){
                if(err){
                  console.log('reAuth failure: ');
                  console.log(err);
                }
                console.log('reAuth was a success, hopefully. calling this action again');
                errlog.info('trying again');
                return tryThis();
              });
            }
            return res.json({error: err});
          }
          outlog.info(post_data.posterName + ' posted image via url onto ' + post_data.category);
          evtlog.info(post_data.posterName + ' posted image via url onto ' + post_data.category);
          return res.json(data);
        });
      });
    }
  });
}

exports.postYoutubeUrl = function(req, res){
  //validate data
  if(!req.body.name || !req.body.description || !req.body.category || !req.body.imgUrl || !req.body.embedHtml){
    errlog.info('Error: Required fields missing or left blank');
    return res.json({ error: "Required fields missing or left blank" });
  }
  //create data to be saved
  //get blank gamepin obj
  var post_data = new gamepinSchema.gamepin();
  post_data.posterId = req.session.loggedIn;
  post_data.posterName = req.session.userName;
  post_data.category = req.body.category;
  post_data.sourceUrl = req.body.imgUrl;
  post_data.videoEmbed = req.body.embedHtml;
  post_data.gameName = req.body.name;
  post_data.publisher = req.body.publisher || null;
  post_data.description = req.body.description;
  post_data.datePosted = util.getDate();
  
  postGamePin(post_data, function(err, data){
    if(err){
      errlog.info('postGamePin Error: ' + err);
      return res.json({ error: err });
    }
    outlog.info(post_data.posterName + ' posted Youtube link onto ' + post_data.category);
    evtlog.info(post_data.posterName + ' posted Youtube link onto ' + post_data.category);
    
    return res.json(data);
  });
}

//generate ID, save into DB, and link to user
function postGamePin(post_data, callback){
  var user;
  var post_id;
  var postEventId;
  var postEvent = { date: util.getDateObj(),
                    sourceUser: post_data.posterId,
                    action: 'gamepinPosted',
                    target: post_data.category,
                    targetLink: null
                  };
                    
  //Generate nodeflake ID for gamepin
  util.generateId(function(id){
    outlog.info('nodeflake ID: ' + id);
    post_id = id;
    postEvent.targetLink = '/post/'+id;
    next();
  });
  //create gamepin and store into Riak db + create post gamepin event
  function next(){
    var gamepin = app.riak.bucket('gamepins').objects.new(post_id, post_data);
    gamepin.save(function(err, saved){
      if(err){
        errlog.info('Gamepin save error: ' + err);
        return callback('Save gamepin failed', null);
      }
      outlog.info('Gamepin ' + saved.key + ' created');
      console.log(saved);
      base.createEvent(postEvent, function(err, eventId){
        if(err) return res.json('wtf');
        console.log('eventId: ' + eventId);
        postEventId = eventId;
        next2();
      });
    });
  }
  //add gamepin ID to author's post array + add event to Timeline
  function next2(){
    userAPI.get_RO_user(post_data.posterId, function(err, usr){
      if(err){
        errlog.info('postGamePin: Fetch User failed');
        return callback('postGamePin: Fetch User failed', null);
      }
      //add this gamepin ID to the user's posts + timeline
      usr.data.posts.push(post_id);
      usr.data.timelineEvents.push(postEventId);
      
      usr.save(function(err, saved){
        if(err) return errlog.info('user update error: ' + err); 
        outlog.info('gamepin ID added to user posts[]');
        next3();
      });
    });
  }
  
  //add gamepin id to author's groups and activity...... timeline
  function next3(){
    app.riak.bucket('users').objects.get(post_data.posterId + '-groups', function(err, obj){
      if(err && err.status_code === 404){
        errlog.info('user-group not found');
        return callback('Error: user does not have groups list', null);
      }
      if(!obj.data[post_data.category]) obj.data[post_data.category] = [post_id];
      else obj.data[post_data.category].push(post_id);
      obj.save(function(err, saved){
        if(err) return errlog.info('user save error: ' + err);
        outlog.info('gamepin id added to '+ post_data.posterId +'\'s ' + post_data.category + ' group');
        next4();
      });
    });
  }
  
  //add gamepin event to recent activity
  function next4(){
    app.riak.bucket('users').objects.get(post_data.posterId + '-activity', function(err, obj){
      if(err && err.status_code === 404){
        errlog.info('user-activity not found');
        return callback('Error: user does not have an activity list', null);
      }
      obj.data['evtIds'].push(post_id);
      obj.save(function(err, saved){
        if(err) return errlog.info('activity save error: ' + err);
        outlog.info('gamepin id added to '+ post_data.posterId +'\'s recent activity');
        return callback(null, {gamepin: post_data});
      });
    });
  }
}

//edit
exports.edit = function(req, res){
  outlog.info(req.body);
  return res.json({
    success: true
  })
}

//remove
exports.remove = function(req, res){
  outlog.info(req.body);
  return res.json({
    success: true
  })
}

//take array of comments, get comment obj, sort them, return sorted list of objs.
exports.getComments = function(req, res){
  var commentList = [];
  app.riak.bucket('comments').objects.get(req.body.commentIds, function(err, objs){
    if(err){
      errlog.info('getComments error: ' + err);
      return res.json({ error: err });
    }
    //TODO: update nodiak and get rid of this mess
    //if nodiak gives us a single object, convert that into an array with 1 element.
    if(objs && Object.prototype.toString.call( objs ) !== '[object Array]')
      objs = [objs];
    for(var o = 0; objs && o < objs.length; o++){
      commentList.push({  id: objs[o].key,
                          pin: objs[o].data.pin,
                          poster: objs[o].data.poster,
                          content: objs[o].data.content
                      });
    }
    //sort based on ID
    commentList.sort(function(a,b){
      return a.id - b.id;
    });
    outlog.info('getComments success');
    return res.json({ success:true, list: commentList });
  });
}

//TODO: Abstract comment functionality better.
//add comment, given pinId and poster.   EVENTS ATTACHED!
exports.addComment = function(req, res){
  console.log('start');
  var pinId = req.body.pinId,
      posterId = req.body.posterId,
      poster = req.body.posterName,
      text = req.body.content;
  
  //you posted a comment onto sports
  var postEvent = { date: util.getDateObj(),
                    sourceUser: posterId,
                    action: 'commentPosted',
                    target: null,
                    targetLink: null
                  }
  //user1 posted a comment onto your post on sports
  var notifyEvent = { date: util.getDate(),
                      sourceUser: posterId,
                      action: 'commentRecieved',
                      target: null,
                      targetLink: null
                    }
  
  var commentId;
  var comment_data;
  var comment_poster = req.body.posterId;
  var gamepin_owner;

  //validations
  if(req.body.content === '' || req.body.content === null || req.body.content === undefined){
    errlog.info('Text is empty');
    return res.json({ error: "Error: text is empty" });
  }
  comment_data = {};
  comment_data.pin = req.body.pinId;
  comment_data.posterID = req.body.posterId;
  comment_data.posterName = req.body.posterName;
  comment_data.content = req.body.content;
  util.generateId(function(id){
    commentId = id;
    outlog.info(id);
    next();
  });
  function next(){
    var cmt = app.riak.bucket('comments').objects.new(commentId,
      {pin: pinId, posterId: posterId, posterName: poster,  content: text});
    //save comment
    cmt.save(function(err, saved_cmt){
      if(err) return errlog.info('comment save error: ' + err);
      var pin = app.riak.bucket('gamepins').objects.new(pinId);
      //get and update gamepin
      pin.fetch(util.pin_resolve, function(err, obj){
        if(err){
          errlog.info('Fetch Pin error: ' + err);
          return res.json({ error: 'Fetch Pin: ' + err });
        }
        gamepin_owner = obj.data.posterId;
        //update events
        postEvent.target = obj.data.category;
        notifyEvent.target = obj.data.category;
        postEvent.targetLink = '/post/'+obj.key;
        notifyEvent.targetLink = '/post/'+obj.key;
        
        obj.data.comments.push(saved_cmt.key);
        obj.save(function(err, saved_pin){
          if(err) return errlog.info('save gamepin error: ' + err);
          outlog.info('Comment #' + saved_cmt.key + ' written to pin #' + saved_pin.key);
          next2();
        });
      });
    });
  }
  //deal with events
  function next2(){
    var postId;
    var notifyId;
    async.parallel([
      function(callback){
        base.createEvent(postEvent, function(err, id){
          if(err) return callback(err.message);
          postId = id;
          return callback(null);
        });
      },
      function(callback){
        base.createEvent(notifyEvent, function(err, id){
          if(err) return callback(err.message);
          notifyId = id;
          return callback(null);
        });
      }
    ],
    function(err){
      if(err) return res.json({ error: err.message });
      next3(postId, notifyId);
    });
  }
  function next3(postId, notifyId){
    //post event to timeline
    async.waterfall([
      //get user, add evtId to timeline
      function(callback){
        userAPI.get_RO_user(comment_poster, function(err, usr){
          if(err) return callback(err.message, null);
          if(usr.data.timelineEvents.indexOf(postId) === -1) usr.data.timelineEvents.push(postId);
          else return callback(new Error('Event already exists in user\'s timeline'), null);
          return callback(null, usr);
        });
      },
      //save user. If we posted to our own gamepin, done. Else, continue
      function(usr, callback){
        base.save_RO(usr, 'users', function(err, saved){
          if(err) return callback(err.message, null);
          if(comment_poster !== gamepin_owner) return next4(notifyId);
          return callback(null, null);
        });
      }
    ],
    //done
    function(err, result){
      if(err) return res.json({ error: err.message });
      return res.json({ success: true, notify: 'Post comment success!' });
    });
  }
  //post notification to pin owner
  function next4(notifyId){
    async.waterfall([
      function(callback){
        userAPI.get_RO_user(gamepin_owner, function(err, usr){
          if(err) return res.json({ error: err.message });
          if(usr.data.pinEvents.indexOf(notifyId) === -1) usr.data.pinEvents.push(notifyId);
          else return callback(new Error('Event already exists in user\'s pinEvents'), null);
          return callback(null, usr);
        });
      },
      function(usr, callback){
        base.save_RO(usr, 'users', function(err, saved){
          if(err) return callkback(err.message, null);
          return callback(null, null);
        });
      }
    ],
    function(err, result){
      if(err) return res.json({ error: err.message });
      return res.json({ success: true, notify: 'posts comment success!' });
    });
  }
}

//Retrieve all data for a single gamepin, get comments too.
exports.getPinData = function(req, res){
  var commentData = [];
  get_RO_gamepin( req.body.pinId, function(err, pin){
    if(err){
      errlog.info('getPinData error ' + err.message);
      return res.json({ error: err.message });
    }
    //fetch posterName + posterImg, attach to comment
    base.get_userRef(pin.data.posterId, function(e, ref_obj){
      if(e){
        errlog.info('getPinData error ' + e.message);
        return res.json({ error: e.message });
      }
      //fetch userName and profileImage
      pin.data.userName = ref_obj.userName;
      pin.data.profileImg = ref_obj.profileImg;
      //get comment_ROs
      var commentIds = pin.data.comments;
      async.map(commentIds, function(cmtId, callback){
        app.riak.bucket('comments').objects.get(cmtId, function(err, cmt_obj){
          if(err){
            if(err.status_code === 404) return callback(null, null);
            return callback(new Error('getPinData error: '+err.message), null);
          }
          //fetch posterName + posterImg, attach to comment
          base.get_userRef(cmt_obj.data.posterId, function(_err, usr_ref){
            if(_err) return callback(new Error('getPinData error: '+err.message), null);
            cmt_obj.data.posterName = usr_ref.userName;
            cmt_obj.data.posterImg = usr_ref.profileImg;
            return callback(null, cmt_obj.data);
          });
        });
      }
      , function(err, results){
        if(err) return res.json({ error: err.message });
        next(results);
      });
      function next(results){
        pin.data.comments = results;
        return res.json({ gamepin: pin.data });
      }
    });
  });
}

//editComment
exports.editComment = function(req, res){
  outlog.info(req.body);
  return res.json({
    success: true
  })
}

//like - link gamepin and user together through love <3
exports.like = function(req, res){
  outlog.info(req.body);
  if(!req.body.pinId) return res.json({ error: 'Post not specified' });
  if(!req.body.email) return res.json({ error: 'User not specified' });
  var email = req.body.email;
  var pinId = req.body.pinId;
  
  var RO_user;
  var RO_gamepin;
  
  async.waterfall([
    //fetch user and gamepin
    function(callback){
      get_RO_gamepin(pinId, function(err, pin){
        if(err) return callback(err.message)//return res.json({ error: err.message });
        RO_gamepin = pin;
        userAPI.get_RO_user(email, function(_err, usr){
          if(_err) return callback(_err.message); // return res.json({ error: err.message });
          RO_user = usr;
          return callback(null);
        });
      });
    },
    //add links to both, and then save
    function(callback){
      if(RO_user.data.likes.indexOf(pinId) === -1) RO_user.data.likes.push(pinId);
      else return callback(new Error('Already liked this post'));
      base.save_RO(RO_user, 'users', function(err, saved){
        if(err) return callback(err.message);
        if(RO_gamepin.data.likedBy.indexOf(email) === -1) RO_gamepin.data.likedBy.push(email);
        else return callback(new Error('Post already liked by you'));
        base.save_RO(RO_gamepin, 'gamepins', function(_err, _saved){
          if(_err) return callback(_err.message);
          return callback(null);
        });
      });
    }
  ],
  function(err){
    if(err) return res.json({ error: err.message });
    return res.json({ success: 'You liked this post' });
  });
}

exports.unlike = function(req, res){
  console.log(req.body);
  if(!req.body.pinId) return res.json({ error: 'Post not specified' });
  if(!req.body.email) return res.json({ error: 'User not specified' });
  var email = req.body.email;
  var pinId = req.body.pinId;
  
  var RO_user;
  var RO_gamepin;
  
  async.waterfall([
    //fetch user and gamepin
    function(callback){
      get_RO_gamepin(pinId, function(err, pin){
        if(err) return callback(err.message)//return res.json({ error: err.message });
        RO_gamepin = pin;
        userAPI.get_RO_user(email, function(_err, usr){
          if(_err) return callback(_err.message); // return res.json({ error: err.message });
          RO_user = usr;
          return callback(null);
        });
      });
    },
    //delete links to both, and then save
    function(callback){
      var pin_index = RO_user.data.likes.indexOf(pinId);
      if(pin_index !== -1) RO_user.data.likes.splice(pin_index, 1);
      else return callback(new Error('Post not one of your likes'));
      base.save_RO(RO_user, 'users', function(err, saved){
        if(err) return callback(err.message);
        var usr_index = RO_gamepin.data.likedBy.indexOf(email);
        if(usr_index !== -1) RO_gamepin.data.likedBy.splice(usr_index, 1);
        else return callback(new Error('Post holds no reference to you liking it'));
        base.save_RO(RO_gamepin, 'gamepins', function(_err, _saved){
          if(_err) return callback(_err.message);
          return callback(null);
        });
      });
    }
  ],
  function(err){
    if(err) return res.json({ error: err.message });
    return res.json({ success: 'You unliked this post' });
  });
}
//share
exports.share = function(req, res){
  outlog.info(req.body);
  return res.json({
    success: true
  })
}

//search
exports.search = function(req, res){
  outlog.info(req.body);
  return res.json({
    success: true
  })
}