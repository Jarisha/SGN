/*************************************** Gamepin ***************************************/
var util = require('../../utility');
var http = require('http');
var httpGet = require('http-get');
var app = require('../../app');

//Create gamepin and "post" to relevant areas
//exports.postGamePin = function(req, res){
exports.postImageUpload = function(req, res){
  //validate data
  if(!req.body.name || !req.body.description || !req.body.category || !req.files.image){
    console.log("Error: Required fields missing or left blank");
    return res.json({ error: "Required fields missing or left blank" });
  }
  
  var IE = false;
  if(req.get('X-Requested-With') != 'XMLHttpRequest') IE = true;
  
  //create data to be saved
  var post_data = {
    posterId: req.session.loggedIn,
    posterName: req.session.userName,
    likedBy: [],
    repinVia: null,
    category: req.body.category,
    sourceUrl: null,
    videoEmbed: null,
    cloudPath: null,
    gameName: req.body.name,
    publisher: req.body.publisher || null,
    description: req.body.description,
    datePosted: util.getDate(),
    //used for riak search
    returnAll: 'y',
    comments: [],
    changes:{ likedBy: {add:[], remove:[]},
              comments:{add:[], remove:[] }
            }
  };
  
  //Push content onto rackspace CDN, retreieve URL
  app.rackit.add(req.files.image.path, {type: req.files.image.type}, function(err, cloudpath){
    if(err){
      console.log('rackspace erorr:');
      console.log(err);
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
        if(IE){
          res.contentType('text/plain');
          return res.send(JSON.stringify({ error: "Fetch user error" }));
        }
        return res.json({error: err});
      }
      else{
        if(IE){
         res.contentType('text/plain');
         return res.send(JSON.stringify(data));
        }
        return res.json(data);
      }
    });
  });
}

exports.postImageUrl = function(req, res){
  //validate data
  if(!req.body.name || !req.body.description || !req.body.category){
    console.log("Error: Required fields missing or left blank");
    return res.json({ error: "Required fields missing or left blank" });
  }
  //create data to be saved
  var post_data = {
    posterId: req.session.loggedIn,
    posterName: req.session.userName,
    likedBy: [],
    repinVia: null,
    category: req.body.category,
    sourceUrl: null,
    videoEmbed: null,
    cloudPath: null,
    gameName: req.body.name,
    publisher: req.body.publisher || null,
    description: req.body.description,
    datePosted: util.getDate(),
    //used for riak search
    returnAll: 'y',
    comments: [],
    changes:{ likedBy: {add:[], remove:[]},
              comments:{add:[], remove:[] }
            }
  };
  var content_type = req.body.type;
  var file_extension;
  var imgPath;
  console.log(content_type);
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
  console.log(file_extension);
  
  //generate some name for the file we will download
  util.generateId(function(id){
    console.log('nodeflake ID:');
    console.log(id);
    next(id);
  });
  
  function next(id){
    //download image from url, save to local /tmp folder
    console.log(id);
    console.log(app.temp_path + id + '.jpg');
    httpGet.get(req.body.url,
                app.temp_path + id + file_extension,
      function (error, result) {
        if (error) {
          console.error(' Download image from url Error: ' + error);
          console.log(' Download image from url Error: ' + error);
          console.log('error');
          return res.json({ error: error });
        } else {
          console.log('File downloaded at: ' + result.file);
          imgPath = result.file;
          next2();
        }
      }
    );
  }
  //read the file into rackspace
  function next2(){
    app.rackit.add(imgPath, {type: content_type}, function(err, cloudpath){
      if(err){
        console.log(imgPath);
        console.log(cloudpath);
        console.log("rackit.add error: ");
        console.log(err);
        return res.json({ error: err });
      }
      var viewUrl = app.rackit.getURI(cloudpath);
      post_data.sourceUrl = viewUrl;
      post_data.cloudPath = cloudpath;
      postGamePin(post_data, function(err, data){
        if(err){
          console.log("postGamePin error");
          return res.json({error: err});
        }
        return res.json(data);
      });
    });
  }
}

exports.postYoutubeUrl = function(req, res){
  //validate data
  if(!req.body.name || !req.body.description || !req.body.category || !req.body.imgUrl || !req.body.embedHtml){
    console.log("Error: Required fields missing or left blank");
    return res.json({ error: "Required fields missing or left blank" });
  }
  //create data to be saved
  var post_data = {
    posterId: req.session.loggedIn,
    posterName: req.session.userName,
    likedBy: [],
    repinVia: null,
    category: req.body.category,
    sourceUrl: req.body.imgUrl,
    videoEmbed: req.body.embedHtml,
    cloudPath: null,
    gameName: req.body.name,
    publisher: req.body.publisher || null,
    description: req.body.description,
    datePosted: util.getDate(),
    //used for riak search
    returnAll: 'y',
    comments: [],
    changes:{ likedBy: {add:[], remove:[]},
              comments:{add:[], remove:[] }
            }
  };
  console.log(req.body);
  postGamePin(post_data, function(err, data){
    if(err) return res.json({ error: err });
    return res.json(data);
  });
}

//generate ID, save into DB, and link to user
function postGamePin(post_data, callback){
  console.log('postGamePin!');
  var post_id;
  //Generate nodeflake ID
  util.generateId(function(id){
    console.log("nodeflake ID: " + id);
    post_id = id;
    next();
  });
  //create gamepin and store into Riak db
  function next(){
    console.log('next');
    var gamepin = app.riak.bucket('gamepins').objects.new(post_id, post_data);
    gamepin.save(function(err, saved){
      if(err) return callback("Save gamepin failed", null);
      console.log('Gamepin ' + saved.key + 'created');
      next2();
    });
  }
  //add gamepin ID to author's post array
  function next2(){
    console.log('next2');
    app.riak.bucket('users').objects.get(post_data.posterId, util.user_resolve, function(err, usr){
      //if(err) return res.json({ error: "postGamePin: Fetch User failed" });
      if(err) return callback("postGamePin: Fetch User failed", null);
      util.clearChanges(usr);
      //add this gamepin ID to the user object
      usr.data.posts.push(post_id);
      usr.data.changes.posts.add.push(post_id);
      usr.save(function(err, saved){
        console.log('gamepin ID added to user posts[]');
        next3();
      });
    });
  }
  //add gamepin id author's groups and activity
  function next3(){
    console.log('next3');
    app.riak.bucket('users').objects.get(post_data.posterId + '-groups', function(err, obj){
      if(err && err.status_code === 404){
        console.log('not found');
        //return res.json({error: "Error: user does not have groups list"});
        return callback("Error: user does not have groups list", null);
      }
      if(!obj.data[post_data.category]) obj.data[post_data.category] = [post_id];
      else obj.data[post_data.category].push(post_id);
      obj.save(function(err, saved){
        console.log('gamepin id added to '+ post_data.posterId +'\'s ' + post_data.category + ' group');
        next4();
      });
    });
  }
  //add gamepin event to recent activity
  function next4(){
    console.log('next4');
    app.riak.bucket('users').objects.get(post_data.posterId + '-activity', function(err, obj){
      if(err && err.status_code === 404){
        console.log('not found');
        //return res.json({error: "Error: user does not have an activity list"});
        return callback("Error: user does not have an activity list", null);
      }
      obj.data['evtIds'].push(post_id);
      obj.save(function(err, saved){
        console.log('gamepin id added to '+ post_data.posterId +'\'s recent activity');
        //return res.json({gamepin: post_data});
        return callback(null, {gamepin: post_data});
      });
    });
  }
}

//edit
exports.edit = function(req, res){
  console.log(req.body);
  return res.json({
    success: true
  })
}

//remove
exports.remove = function(req, res){
  console.log(req.body);
  return res.json({
    success: true
  })
}

//take array of comments, get comment obj, sort them, return sorted list of objs.
exports.getComments = function(req, res){
  //console.log(req.body.commentIds);
  var commentList = [];
  app.riak.bucket('comments').objects.get(req.body.commentIds, function(err, objs){
    if(err){
      return res.json({ error: err });
    }
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
    return res.json({ success:true, list: commentList });
  });
}

//add comment
exports.addComment = function(req, res){
  console.log(req.body);
  var commentId;
  var pinId = req.body.pinId,
      posterId = req.body.posterId,
      poster = req.body.posterName,
      text = req.body.content;
  //validations
  if(text === '' || text === null || text === undefined){
    return res.json({ error: "Error: text is empty" });
  }
  util.generateId(function(id){
    commentId = id;
    console.log(id);
    next();
  });
  function next(){
    var cmt = app.riak.bucket('comments').objects.new(commentId,
      {pin: pinId, posterId: posterId, posterName: poster,  content: text});
    cmt.save(function(err, saved_cmt){
      var pin = app.riak.bucket('gamepins').objects.new(pinId);
      pin.fetch(util.pin_resolve, function(err, obj){
        if(err){
          return res.json({ error: "Fetch Pin: " + err });;
        }
        util.clearChanges(obj);
        obj.data.comments.push(saved_cmt.key);
        obj.data.changes.comments.add.push(saved_cmt.key);
        obj.save(function(err, saved_pin){
          console.log(saved_pin);
          console.log("Comment #" + saved_cmt.key + " written to pin #" + saved_pin.key);
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
    if(err) return res.json({error: err});
    util.clearChanges(obj);
    return res.json({ gamepin: obj.data });
  });
}

//editComment
exports.editComment = function(req, res){
  console.log(req.body);
  return res.json({
    success: true
  })
}

//like
exports.like = function(req, res){
  console.log(req.body);
  return res.json({
    success: true
  })
}

//share
exports.share = function(req, res){
  console.log(req.body);
  return res.json({
    success: true
  })
}

//search
exports.search = function(req, res){
  console.log(req.body);
  return res.json({
    success: true
  })
}