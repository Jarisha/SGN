/*************************************** Gamepin ***************************************/
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

//comment
exports.comment = function(req, res){
  console.log(req.body);
  return res.json({
    success: true
  })
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