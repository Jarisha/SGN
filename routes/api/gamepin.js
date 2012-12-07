/*************************************** Gamepin ***************************************/
var dbConfig = require('../../db_config');
//post gamepin.  Create the gamepin object and store in db
exports.post = function(req, res){
  return res.json({
    success: true,
    message: 'Post game_pin successfull!'
  });
  /*return res.json({
    success: false,
    error: 'Error: post gamepin failed'
  });*/
}

//edit
exports.edit = function(req, res){
  return res.json({
    success: true
  })
}

//remove
exports.remove = function(req, res){
  return res.json({
    success: true
  })
}

//comment
exports.comment = function(req, res){
  return res.json({
    success: true
  })
}

//editComment
exports.editComment = function(req, res){
  return res.json({
    success: true
  })
}

//like
exports.like = function(req, res){
  return res.json({
    success: true
  })
}

//share
exports.share = function(req, res){
  return res.json({
    success: true
  })
}

//search
exports.search = function(req, res){
  return res.json({
    success: true
  })
}