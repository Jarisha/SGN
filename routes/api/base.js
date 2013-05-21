/** Base.js contains shared API calls + miscellaneous ones **/
var url = require('url');

var request = require('request');
var async = require('async');

var util = require('../../utility');
var app = require('../../app');
var E = require('../../customErrors');

var errlog = app.errlog;
var evtlog = app.evtlog;
var outlog = app.outlog;

/************************ Level 1 ************************/
//Save single RO and return it.  Tested - OK!
//Cases: Error - Success.  callback(Error, Saved)
var save_RO = exports.save_RO = function(RObject, bucketName, callback){
  //console.log(RObject);
  console.log(RObject);
  console.log(bucketName);
  app.riak.bucket(bucketName).object.save(RObject, function(err, savedRO){
    if(err){
      console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
      console.log(err);
      return callback(new Error('save_RO: ' + bucketName + ' failed: ' + err), null);
    }
    return callback(null, savedRO);
  })
}

//Save Array of ROs and return them.  Tested - OK!
//Cases: Error - Success.  callback(Error, Saves)
var save_ROs = exports.save_ROs = function(ROArray, bucketName, callback){
  app.riak.bucket(bucketName).objects.save(ROArray, function(errs, savedROs){
    if(errs) return callback(new Error('save_ROs: ' + bucketName + ' failed. ' + errs.length + ' errors '), null);
    return callback(null, savedROs);
  });
}

//get and delete KV pair. Generic. Accepts {key: '', bucket: ''}. callback(error)
var get_and_delete = exports.get_and_delete = function(obj, callback){
  app.riak.bucket(obj.bucket).objects.get(obj.key, util.last_write_wins, function(err, _obj){
    if(err && err.status_code !== 404) return callback(new Error(err.message));
    if(err && err.status_code === 404) return callback(null);
    _obj.delete(function(_err, deleted){
      if(_err) return callback(new Error(err.message));
      return callback(null);
    });
  });
}

// Given a key and bucket, find if it exists
// callback(error, not_found, found)
var RO_exist = exports.RO_exist = function(key, bucketName, callback){
  if(!key) callback('RO_exist error: no key specified', null, null);
  app.riak.bucket(bucketName).object.exists(key, function(err, result){
    if(err) return callback(new Error('RO_exist error'), null, null);
    if(result) return callback(null, null, true);
    if(!result) return callback(null, true, null);
  });
}

// Given an array of keys, return found and not found keys.
// callback(error, not_found[], found[])
var RO_exists = exports.RO_exists = function(keys, bucketName, callback){
  if(keys.length === 0) callback('RO_exists error: no keys specified', null, null);
  var found = [];
  var not_found = [];
  async.map(keys, function(key, _callback){
    app.riak.bucket(bucketName).object.exists(key, function(err, result){
      if(err) return _callback(new Error('RO_exists error: '+err.message), null);
      return _callback(null, result);
    });
  },
  function(err, results){
    if(err) return callback(err, null);
    for(r = 0, len = results.length; r < len; r++){
      if(results[r]) found.push(keys[r]);
      else not_found.push(keys[r]);
    }
    return callback(null, not_found, found);
  });
}

// get email given userName via riak 2i
// TODO: replace 2i with KV pair
// callback(error, email)
var getUserEmail = exports.getUserEmail = function(userName, callback){
  //search 'username' index, should return 1 email
  app.riak.bucket('users').search.twoi(userName, 'username', function(err, keys){
    if(err) return callback(new Error(err.message), null);
    if(keys.length===0) return callback(new Error('2i index not found'), null);
    key = keys[0];
    return callback(null, key);
  });
}

// Given email, quickly get userName and profileImg
// callback(error, {userName, profileImg})
var get_userRef = exports.get_userRef = function(email, callback){
  app.riak.bucket('userReference').objects.get(email, function(err, ref_obj){
    if(err){
      //if userRef is not found, pass null back
      if(err.status_code === 404) return callback(null, null);
      return callback(new Error('get_userRef '+email+' error: '+err.message), null);
    }
    return callback(null, {userName: ref_obj.data.userName, profileImg: ref_obj.data.profileImg });
  });
}

// Event goes like: SourceUser does Action onto Target.
// pass data object: {date:{year, month, day, hour, minute}, sourceEmail, action, target, (targetLink), (content) }
// callback(error, evtId);
var createEvent = exports.createEvent = function(evtObj, callback){
  //generateId
  var evtId;
  util.generateId(function(id){
    evtId = id;
    next();
  });
  function next(){
    //save the event
    var evt_RO =  app.riak.bucket('events').object.new(evtId, evtObj);
    evt_RO.save(function(err, saved){
      if(err) return callback(new Error('createEvent error: ' + err.message), null);
      else return callback(null, evtId);
    });
  }
}


// Given one event Id, return that Event RO
// callback(err, event_RO)
var getEvent = exports.getEvent = function(evtId, callback){
  app.riak.bucket('events').objects.get(evtId, function(err, evt_RO){
    if(err) return callback(new Error('getEvent error: ' + err.message), null);
    return callback(null, evt_RO);
  });
}

// Given an array of event Ids, return list of Events in the same order the Ids were specified
// callback(err, event_ROs[])
var getEvents = exports.getEvents = function(idArray, callback){
  async.map(idArray, function(id, _callback){
    app.riak.bucket('events').objects.get(id, function(err, evt_RO){
      if(err) return _callback(new Error('getEvents error: '+err.message), null);
      else return _callback(null, evt_RO);
    });
  },
  function(err, results){
    console.log(results);
    /*if(err) return callback(err, null);
    return callback(null, results)*/
  });
  /*app.riak.bucket('events').objects.get(idArray, callback(errs, evt_ROs){
    if(errs) return callback(new Error('getEvents error'), null);
    
    
  });*/
}

/************************ Level 3 ***********************/
exports.fetchEvent = function(req, res){
  console.log(req.query);
  app.riak.bucket('events').objects.get(req.query.eventId, function(err, event_RO){
    if(err) return res.json({ error: err.message });
    return res.json({ event: event_RO.data });
  });
}

exports.validImg = function(req, res){
  request({ method: 'HEAD', url: req.body.url},
            function(err, response, body){
              if(err){
                outlog.info('validImg error: ' + err);
                return res.json({valid: false});
              }
              if(response.statusCode === 404){
                outlog.info('image not found: ');
                return res.json({valid: false});
              }
              if(response.statusCode === 200 && (
                 response.headers['content-type'] === 'image/png' ||
                 response.headers['content-type'] === 'image/gif' ||
                 response.headers['content-type'] === 'image/jpeg')
                ){
                console.log(response.headers['content-type']);
                return res.json({valid: true, contentType: response.headers['content-type'] });
              }
              return res.json({valid: false});
            }
          );
}

//determine if youtube video is valid by doing HEAD request to URL
//if valid, send back an <iframe> embed fragment, and image url
exports.validVideo = function(req, res){
  console.log(req.body);
  var embedHtml;
  var imgUrl;
  var youtubeId;
  request({ method: 'HEAD', url: req.body.url},
            function(err, response, body){
              if(err){
                outlog.info('validVideo error: ' + err);
                return res.json({valid: false});
              }
              if(response.statusCode === 404){
                outlog.info('youtube video not found');
                return res.json({valid: false});
              }
              if(response.statusCode === 200 && response.headers['content-type'].indexOf('text/html') !== -1){
                var urlObj = url.parse(req.body.url, true);
                if(urlObj.host !== 'youtu.be'){
                  return res.json({valid: false, error:'Not a youtube share link'});
                }
                //extract ID, only works for newer youtube share links. TODO: Extract IDs for older youtube videos
                var youtubeId = urlObj.pathname.split("/")[1];
                imgUrl = 'http://img.youtube.com/vi/'+ youtubeId +'/0.jpg';
                embedHtml = '<iframe width="200" height="200" src="http://www.youtube.com/embed/'+youtubeId+'" frameborder="0" allowfullscreen></iframe>';
                return res.json({valid: true, embed: embedHtml, url: imgUrl});
              }
              errlog.info('video not returned with 200 response code: ' + response);
              return res.json({valid: false});
            }
          );
}

/***** get all entries and convert them to new schema *****/
exports.reindexGamepins = function(req, res){
  console.log("reindex Gamepins");
  
}
exports.reindexUsers = function(req, res){
  console.log("reindex Users");
}

exports.reindexComments = function(req, res){
  console.log("reindex Comments");
}