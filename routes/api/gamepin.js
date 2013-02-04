/*************************************** Gamepin ***************************************/
var util = require('../../utility');
var app = require('../../app');

//post gamepin.  Create the gamepin object and store in db
exports.post = function(req, res){
  //validate data
  if(!req.body.data.name || !req.body.data.category || !req.body.data.description || !req.body.data.content){
    return res.json({
      success: false,
      error: 'Must fill in all required fields'
    });
  }
  //create gamepin and save it into db
  var gamePin = new dbConfig.GamePin({content: req.body.data.content, gameName: req.body.data.name,
  description: req.body.data.description, category: req.body.data.category});
  if(!gamePin){
    return res.json({
      register: false,
      error: 'post gamePin failed'
    });
  }
  if(req.body.data.publisher) gamePin.publisher = req.body.data.publisher;
  gamePin.save(function(err){
    if(err){
      return res.json({
        register: false,
				error: 'save gamePin to DB failed'
			});
    }
    return res.json({
      success: true,
      message: 'Post game_pin successfull!'
    });
  });
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

//comment
exports.addComment = function(req, res){
  console.log(req.body);
  var commentId;
  var pinId = req.body.pinId,
      posterId = req.body.posterId,
      text = req.body.content;
  //validations
  if(text === '' || text === null || text === undefined){
    return res.json({ error: "Error: text is empty" });
  }
  util.generateId(function(id){
    commentId = id;
    next();
  });
  function next(){
    var cmt = app.riak.bucket('comments').objects.new(commentId, {pin: pinId, poster: posterId, content: text});
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
          console.log("Comment #" + saved_cmt.key + " written to pin #" + saved_pin.key);
          return res.json({ success: true });
        });
      });
    });
  }
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