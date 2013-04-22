/*************************************** Gamepin ***************************************/
var http = require('http')
var httpGet = require('http-get');
var util = require('../../utility');
var app = require('../../app');
var gamepinSchema = require('../../schema/gamepin');
var commentSchema = require('../../schema/comment');

var errlog = app.errlog;
var evtlog = app.evtlog;
var outlog = app.outlog;

//Create gamepin and "post" to relevant areas
//exports.postGamePin = function(req, res){
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
  console.log(post_data);
  post_data.posterId = req.session.loggedIn;
  post_data.posterName = req.session.userName;
  post_data.category = req.body.category;
  post_data.gameName = req.body.name;
  post_data.publisher = req.body.publisher || null;
  post_data.description = req.body.description;
  post_data.datePosted = util.getDate();
  
  //Push content onto rackspace CDN, retreive URL
  app.rackit.add(req.files.image.path, {type: req.files.image.type}, function(err, cloudpath){
    if(err){
      errlog.info('rackspace error:' + err);
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

exports.postImageUrl = function(req, res){
  //validate data
  if(!req.body.name || !req.body.description || !req.body.category){
    errlog.info("Error: Required fields missing or left blank");
    return res.json({ error: "Required fields missing or left blank" });
  }
  
  //get blank gamepin obj
  var post_data = new gamepinSchema.gamepin();
  
  console.log(post_data);
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
  //hack to detect https, TODO: try to upload https using nodejs htps module
  console.log(req.body.url);
  if(req.body.url.indexOf('https://') !== -1){
    errlog.info('cannot upload https url');
    return res.json({ error: 'cannot upload https url' });
  };
  
  //stream url for image directly into rackspace...rackmagic!
  http.get(req.body.url, function(resp){
    app.rackit.add(resp, function(err, cloudpath){
      if(err) return errlog.info('Rackspcae url stream error ' + err);
      post_data.sourceUrl = app.rackit.getURI(cloudpath);
      post_data.cloudPath = cloudpath;
      postGamePin(post_data, function(err, data){
        if(err){
          errlog.info('postGamePin error' + err);
          return res.json({error: err});
        }
        outlog.info(post_data.posterName + ' posted image via url onto ' + post_data.category);
        evtlog.info(post_data.posterName + ' posted image via url onto ' + post_data.category);
        
        return res.json(data);
      });
    });
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
  var post_id;
  //Generate nodeflake ID
  util.generateId(function(id){
    outlog.info('nodeflake ID: ' + id);
    post_id = id;
    next();
  });
  //create gamepin and store into Riak db
  function next(){
    var gamepin = app.riak.bucket('gamepins').objects.new(post_id, post_data);
    gamepin.save(function(err, saved){
      if(err){
        errlog.info('Gamepin save error: ' + err);
        return callback('Save gamepin failed', null);
      }
      outlog.info('Gamepin ' + saved.key + ' created');
      next2();
    });
  }
  //add gamepin ID to author's post array
  function next2(){
    app.riak.bucket('users').objects.get(post_data.posterId, util.user_resolve, function(err, usr){
      if(err){
        errlog.info('postGamePin: Fetch User failed');
        return callback('postGamePin: Fetch User failed', null);
      }
      util.clearChanges(usr);
      //add this gamepin ID to the user object
      usr.data.posts.push(post_id);
      usr.data.changes.posts.add.push(post_id);
      usr.save(function(err, saved){
        if(err) return errlog.info('user update error: ' + err); 
        outlog.info('gamepin ID added to user posts[]');
        next3();
      });
    });
  }
  
  //add gamepin id to author's groups and activity
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

//add comment
exports.addComment = function(req, res){
  var commentId;
  var comment_data;
  var pinId = req.body.pinId,
      posterId = req.body.posterId,
      poster = req.body.posterName,
      text = req.body.content;
  //validations
  if(req.body.content === '' || req.body.content === null || req.body.content === undefined){
    errlog.info('Text is empty');
    return res.json({ error: "Error: text is empty" });
  }
  comment_data = new commentSchema.comment();
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
    cmt.save(function(err, saved_cmt){
      if(err) return errlog.info('comment save error: ' + err);
      var pin = app.riak.bucket('gamepins').objects.new(pinId);
      pin.fetch(util.pin_resolve, function(err, obj){
        if(err){
          errlog.info('Fetch Pin error: ' + err);
          return res.json({ error: 'Fetch Pin: ' + err });;
        }
        util.clearChanges(obj);
        obj.data.comments.push(saved_cmt.key);
        obj.data.changes.comments.add.push(saved_cmt.key);
        obj.save(function(err, saved_pin){
          if(err) return errlog.info('save gamepin error: ' + err);
          outlog.info('Comment #' + saved_cmt.key + ' written to pin #' + saved_pin.key);
          return res.json({ success: true });
        });
      });
    });
  }
}

//Retrieve all data for a single gamepin
exports.getPinData = function(req, res){
  //req.pinId
  app.riak.bucket('gamepins').objects.get(req.body.pinId, util.pin_resolve, function(err, obj){
    if(err){
      errlog.info('getPinData error: ' + error);
      return res.json({error: err});
    }
    util.clearChanges(obj);
    outlog.info('getPInData for pin: ' + obj.key);
    return res.json({ gamepin: obj.data });
  });
}

//editComment
exports.editComment = function(req, res){
  outlog.info(req.body);
  return res.json({
    success: true
  })
}

//like
exports.like = function(req, res){
  outlog.info(req.body);
  return res.json({
    success: true
  })
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