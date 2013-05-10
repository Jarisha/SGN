/********************************* User *******************************/
/* TODO - Clean things up with async - Update to Latest Version of Nodiak */
var bcrypt = require('bcrypt-nodejs');
var async = require('async');

var config = require('../../config');
var util = require('../../utility');
var app = require('../../app');
var pinAPI = require('./gamepin');
var base = require('./base.js');
var E = require('../../customErrors');

var userSchema = require('../../schema/user');
var comment_obj = require('../../schema/comment');

var errlog = app.errlog;
var evtlog = app.evtlog;
var outlog = app.outlog;

/******************************** DB Level - Level 1 *******************************/

// Reindex Riak Object ~ User to userSchema.
// Cases: Error - Success. callback(error, RO_usr)
var reindexUser = function(ROuser, callback){
  ROuser.data['version'] = userSchema.userInstance.version;
  //hard code data transfers
  if(ROuser.data['username']) ROuser.data['userName'] = ROuser.data['username'];
  var new_usr = new userSchema.user(ROuser.data);
  var invalid = new_usr.validate();
  if(invalid) return callback(invalid, null);
  ROuser.data = new_usr;
  base.save_RO(ROuser, 'users', function(err, savedRO){
    if(err) return callback(err, null);
    return callback(null, savedRO);
  });
}

// Get Riak Object ~ User. Tested - OK!
// Cases: Error - Out of Date - Success.  callback(error, RO_user)
var get_RO_user = exports.get_RO_user = function(key, callback){
  app.riak.bucket('users').object.get(key, util.last_write_wins, function(err, usr){
    if(err){
      if(err.status_code === 404) return callback(new E.NotFoundError('get_RO_user: '+err.data+' not found'), null);
      return callback(new Error('get_RO_user: '+err.message), null);
    }
    //reindex if out of date
    if(!usr.data.version || usr.data.version !== userSchema.userInstance.version){
      reindexUser(usr, function(_err, updated_usr){
        if(_err) return callback(_err, null);
        return callback(null, updated_usr);
      });
    }
    else return callback(null, usr);
  });
}

// Get Riak Object Array ~ User. Tested - OK!
// Cases: Error - Out of Date - Success. callback(errors, RO_users)
var get_RO_users = exports.get_RO_users = function(keys, callback){
  var users = [];
  var outdated = [];
  var outdated_index = {};
  
  async.waterfall([
    //eliminate all not found keys
    function(callback){
      base.RO_exists(keys, 'users', function(err, not_found, found){
        if(err) callback(err, null);
        keys = found;
        callback(null, keys);
     });
    },
    //fetch user RObjects
    function(keys, callback){
      app.riak.bucket('users').objects.get(keys, util.last_write_wins, function(err, usrs){
        if(err) return callback(new Error('get_RO_users: '+err.message), null);
        return callback(null, usrs);
      });
    }
  ], function(err, usrs){
    if(err) return callback(err, null);
    users = usrs;
    next();
  });
  
  function next(){
    //find all outdated users
    for(i = 0, len = users.length; i < len; i++){
      if(users[i].data.version !== userSchema.userInstance.version){
        outdated.push(users[i]);
        outdated_index[users[i]] = i;
      }
    }
    if(outdated.length === 0) next2();
    //reindex outdated users, then overwrite their outdated counterparts
    async.map(outdated, reindexUser, function(err, results){
      if(err) callback(err, null);
      for(i = 0, len = results.length; i < len; i++){
        users[outdated_index[results[i]]] = results[i];
      }
      next2();
    });
  }
  function next2(){
    return callback(null, users);
  }
}

// Get user activity RObjects, given user-activity key + event_id
// Note that events can me multiple types, but are limited to only gamepins for now           TEST - PASSED
// callback(error, evtIds[RObject])
var get_activity = function(activity_key, callback){
  //get list of evtIds
  app.riak.bucket('users').objects.get(activity_key, function(err, act_obj){
    if(err) return callback(new Error('get_RO_activity error: '+err.message) , null);
    next(act_obj.data.evtIds);
  });
  function next(idList){
    //fetch evt_ROs, store RO.data into result array (only gamepins for now, other events will have custom logic)
    async.map(idList,
      function(evtId, _callback){
        pinAPI.get_RO_gamepin(evtId, function(err, pin_RO){
          if(err instanceof E.NotFoundError) return _callback(null, null);  //if not found, just put null and continue
          if(err) return _callback(err, null);
          pin_RO.data.id = evtId;            //keep track of ID
          //get userName and profileImg from userRef
          base.get_userRef(pin_RO.data.posterId, function(_err, usr_ref){
            if(_err) return callback(_err, null);
            pin_RO.data.posterName = usr_ref.userName;
            pin_RO.data.profileImg = usr_ref.profileImg;
            return _callback(null, pin_RO.data);
          });
        });
      },
      function(err, evt_Data){
        if(err) return callback(err, null);
        util.removeNulls(evt_Data);     //remove not found (null) elements from result list
        return callback(null, evt_Data);
      }
    );
  }
}

// Add event_id to user activity, given user-activity key & event_id
// callback(error)
var add_activity = function(activity_key, event_id ,callback){
}

// Remove event_id from user activity, given user-activity key & event_id
// callback(error)
var remove_activity = function(id, event_id, callback){
}

// Updates userReference. - Tested - OK!
// Cases: Error - Success. callback(error, saved)
var update_userRef = function(emailId, userName, profileImg, callback){
  app.riak.bucket('userReference').objects.get(emailId, function(err, usr_ref){
    if(err) return callback('Update userReference error: ' + err, null);
    usr_ref.data = {  userName: userName || usr_ref.data.userName,
                      profileImg: profileImg || usr_ref.data.profileImg };
    base.save_RO(usr_ref, 'userReference', function(_err, saved){
      if(_err) return callback(_err, null);
      return callback(null, saved);
    });
  });
}

// Removes gamepin id from user's posts list                                              
// callback(error, modifiedUser)
var removePinFromUser = exports.removePinFromUser = function(userId, pinId, callback){
  async.waterfall([
    //get user
    function(_callback){
      get_RO_user(userId, function(err, usr){
        if(err) _callback(err, null);
        else _callback(null, usr);
      });
    },
    //remove pin reference + save user
    function(usr, _callback){
      //pinId = parseInt(pinId);
      var pindex = usr.data.posts.indexOf(pinId);
      if(pindex === -1) _callback(new Error('user '+userId+' does not own pin'), null);
      else{
        usr.data.posts.splice(pindex, 1);
        usr.save(function(err, saved){
          if(err) _callback(new Error(err.message), null);
          else _callback(null, saved);
        });
      }
    }
  ],
  //return user or error
  function(err, usr){
    if(err) callback(err, null);
    else callback(null, usr);
  });
}

//add pinId to user's post list. callback(error, modified_usr)                            
var addPinToUser = exports.addPinToUser = function(userId, pinId, callback){
  async.waterfall([
    //get user
    function(_callback){
      get_RO_user(userId, function(err, usr){
        if(err) _callback(err, null);
        else _callback(null, usr);
      });
    },
    //push pinID to end of posts list, then save
    function(usr, _callback){
      if(usr.data.posts.indexOf(pinId) === -1){
        console.log('pinId added')
        usr.data.posts.push(pinId);
        base.save_RO(usr, 'users', function(err, saved){
          if(err) _callback(err, null);
          _callback(null, usr);
        });
      }
      else{
        _callback(null, usr);
      }

    }
  ], function(err, usr){
    if(err) callback(err, null);
    else callback(null, usr);
  });
}

// create follower & following connection between source and target.                      
// If connection already exists, continue without error
// callback(error, updatedSource)
var addFollower = exports.addFollower = function(sourceId, targetId, callback){
  async.waterfall([
    function(_callback){
      //get sourceUsr and targetUsr
      get_RO_user(sourceId, function(err, src_usr){
        if(err) return _callback(err, null, null);
        get_RO_user(targetId, function(_err, trg_usr){
          if(_err) return _callback(_err, null, null);
          return _callback(null, src_usr, trg_usr);
        });
      });
    },
    //link them together & save
    function(src_user, trg_user, _callback){
      //add target to source's following list
      if(src_user.data.following.indexOf(targetId) === -1){
        src_user.data.following.push(targetId);
        base.save_RO(src_user, 'users', function(err, saved){
          if(err) return _callback(err, null, null);
          else return _callback(null, saved, trg_user); //next(saved);
        });
      }
      else return _callback(null, src_user, trg_user); //next(src_user);
    },
    function(source_RO, target_RO, _callback){
      if(target_RO.data.followers.indexOf(sourceId) === -1){
        target_RO.data.followers.push(sourceId);
        base.save_RO(target_RO, 'users', function(err, saved){
          if(err) return _callback(err, null);
          else return _callback(null, source_RO);
        });
      }
      else return _callback(null, source_RO);
    }
  ], function(err, source_RO){
    if(err) return callback(err, null);
    else return callback(null, source_RO);
  });
}

//remove follower & following connection between source and target                        
//if connection does not exist, continue without error
//callback(error, updatedSource)
var removeFollower = exports.removeFollower = function(sourceId, targetId, callback){
  async.waterfall([
    function(_callback){
      //get sourceUsr and targetUsr
      get_RO_user(sourceId, function(err, src_usr){
        if(err) return _callback(err, null);
        get_RO_user(targetId, function(_err, trg_usr){
          if(_err) return _callback(_err, null);
          return _callback(null, src_usr, trg_usr)
        });
      });
    },
    //remove references & save
    function(src_usr, trg_usr, _callback){
      //remove targetId from source's following list
      var index = src_usr.data.following.indexOf(targetId);
      if(index !== -1){
        src_usr.data.following.splice(index, 1);
        base.save_RO(src_usr, 'users', function(err, saved){
          if(err) return _callback(err, null, null);
          else return _callback(null, saved, trg_usr) // next(saved);
        });
      }
      else return _callback(null, src_usr, trg_usr) // next(src_user);
    },
    function(src_usr, trg_usr, _callback){
      var _index = trg_usr.data.followers.indexOf(sourceId);
      if(_index !== -1){
        trg_usr.data.followers.splice(_index, 1);
        base.save_RO(trg_usr, 'users', function(err, saved){
          if(err) return _callback(err, null);
          _callback(null, src_usr /*source_RO*/);
        });
      }
      else _callback(null, src_usr);
    }
  ], function(err, source_RO){
      if(err) callback(err, null);
      else callback(null, source_RO);
  });
}
/********************************************* CRUD & Validation Level - Level 2 ********************************/

//Create new user
function createUser(userInput, callback){
  var usr = new userSchema.user(userInput);
  var invalid = usr.validate();
  if(invalid) return callback(invalid);
  var assets = usr.getUserAssets();
  var ref = assets[0]; var groups = assets[1]; var activity = assets[2];
  return callback(null, usr, ref, groups, activity);
}

//Overwrite Valid data from RObject with input. Validate.
//Return error string on error, false on success
function updateUser(validData, input, callback){
  console.log('validData: ');
  var result = util.overwrite(validData, input);
  if(result) callback(result);
  var usr = new userSchema.user(validData);
  var invalid = usr.validate();
  invalid ? callback(invalid) : callback(false);
}

//check to make sure there are no dangling references. If so, delete them and adjust count.
function repairUser(userInput, callback){
  
}

/***************************************************** API Level - Level 3 *****************************************/

/** test reindex function **/
//fetch RObject for user
exports.fetchUser = function(req, res){
  get_RO_user(req.body.email, function(err, usr){
    if(err){
      errlog.info(err.message);
      return res.json({ error: err.message });
    }
    
    return res.json({ user: usr });
  });
}
//fetch RObject for users
exports.fetchUsers = function(req, res){
  get_RO_users(req.body.emails, function(err, usrs){
    if(err){
      errlog.info('fetchUsers error: '+err.message);
      return res.json({ error: 'fetchUsers error: '+err.message });
    }
    return res.json({ users: usrs });
  });
}

//create new user
exports.createWrap = function(req, res){
  var passHash;
  //Validate user input
  if(!req.body.email) return res.json({ error: 'email not entered' });
  if(!req.body.userName) return res.json({ error: 'userName not entered' });
  if(!req.body.password) return res.json({error: 'password not entered'});
  if(!req.body.confirm) return res.json({error: 'confirm not entered'});
  if(req.body.confirm !== req.body.password) return res.json({error: 'confirm does not match password'});
  req.body.passHash = bcrypt.hashSync(req.body.password);
  //clear useless data
  delete req.body.password;
  delete req.body.confirm;
  
  //Ensure that email + username are not taken
  async.parallel([
    function(callback){
      util.uniqueUserEmail(req.body.email, function(taken){
        if(taken) return callback(taken);
        return callback(null);
      });
    },
    function(callback){
      util.uniqueUserName(req.body.email, function(taken){
        if(taken) return callback(taken);
        return callback(null);
      })
    }
  ],
  function(taken){
    if(taken){
      errlog.info('Create User Error: '+taken.message);
      return res.json({error: taken.message});
    }
  });
  
  createUser(util.clone(req.body), function(err, user_obj, user_ref, user_groups, user_activity){
    if(err){
      errlog.info('Create user error: ' + err);
      return res.json({ error: err });
    }
    //Prepare user RObjects to be saved
    var save_user = app.riak.bucket('users').object.new(user_obj.email, user_obj);
    save_user.addToIndex('username', user_obj.userName);
    var save_groups = app.riak.bucket('users').object.new(user_obj.email + '-groups', user_groups);
    var save_activity = app.riak.bucket('users').object.new(user_obj.email + '-activity', user_activity);
    var save_ref = app.riak.bucket('userReference').object.new(user_obj.email , user_ref);
    
    //save user to Riak
    async.parallel([
      function(callback){
        base.save_ROs([save_user, save_groups, save_activity], 'users', function(_err){
          if(_err) return callback(error);
          return callback(null);
        });
      },
      function(callback){
        base.save_RO(save_ref, 'userReference', function(_err){
          if(_err) return callback(error);
          return callback(null);
        });
      }
    ],
    function(err){
      if(err){
        errlog.info('Create User Error: '+err.message);
        return res.json({ error: err.message });
      }
      return res.json({ success: 'Create User Success!' });
    });
  });
};

//edit user settings
exports.editWrap = function(req, res){
  var nameChange = false;
  if(!req.body.email) return res.json({ error: 'email required to edit user' });
  if(req.body.userName) nameChange = true;
  //handle change password
  if(req.body.password && !req.body.confirm) return res.json({ error: 'please enter confirm or leave password blank' });
  if(!req.body.password && req.body.confirm) return res.json({ error: 'please enter password or leave confirm blank' });
  if(req.body.password !== req.body.confirm){
    return res.json({ error: 'password does not match confirm'});
  }
  if(req.body.password) req.body.passHash = bcrypt.hashSync(req.body.password);
  delete req.body.password;
  delete req.body.confirm;
  
  async.waterfall([
    //Get user
    function(callback){
      get_RO_user(req.body.email, function(err, usr){
        if(err){
          errlog.info('Edit user error: '+err.message);
          return callback(err, null); // res.json({ error: err.message });
        }
        callback(null, usr);
      });
    },
    //update user settings
    function(usr, callback){
      updateUser(usr.data, req.body, function(err){
        if(err){
          errlog.info('Edit user error: '+err.message);
          return callback(err, null); // res.json({ error: err.message });
        }
        return callback(null, usr);
      });
    },
    //save user and userReference
    function(updated, callback){
      if(nameChange) updated.addToIndex('username', updated.data.userName);
      base.save_RO(updated, 'users', function(err){
        if(err) return res.json({ error: err.message });
        if(nameChange){
          update_userRef(updated.data.email, updated.data.userName, null, function(err, saved){
            if(err){
              return callback(err, null); // res.json({ error: err.message });
            }
            return callback(null, saved);
          });
        }
        else callback(null, updated);
      });
    }
  ], function(err, usr){
    if(err){
      errlog.info('editWrap error: '+err.message);
      return res.json({ error: err.message });
    }
    if(usr){
      return res.json({ success: 'Edit User '+req.body.email+' Success' });
    }
  });
}

//Deletes User and UserReference. Adds email and name to 'graveyard' bucket.
exports.deleteWrap = function(req, res){
  if(!req.body.email) return res.json({ error: 'email required to delete user' });
  var email = req.body.email;
  var name;
  
  //check if user exists
  app.riak.bucket('uses').object.exists(email, function(err, result){
    if(err) return res.json({ error: 'Delete user error: '+result });
    if(result) return res.json({ error: 'User does not exist' });
    else next();
  });
  
  function next(){
    //delete user, user-groups, user-activity, userReference
    async.each(
      [{key: email, bucket: 'users'}, {key: email+'-groups', bucket:'users'}, {key: email+'-activity', bucket:'users'},
      {key: email, bucket: 'userReference' }],
      base.get_and_delete,
      function(err){
        if(err){
          errlog.info('get_and_delete error: '+err.message);
          return res.json({ error: 'get_and_delete error: '+err.message });
        }
        //add user to graveyard
        else{
          var dead_usr = app.riak.bucket('graveyard').objects.new(email, {userName: name});
          dead_usr.save(function(_err, obj){
            if(_err){
              errlog.info('save to graveyward failed: '+_err.message)
              return res.json({ error: 'save to graveyard failed: '+_err.message });
            }
            else return res.json({ success: 'delete ' + email + ' success!' });
          });
        }
      }
    );
  }
}

exports.editSettings = function(req, res){
  var nameChange = false;
  var settings = req.body.settings;
  if(!req.body.email) return res.json({ error: 'email required to edit user' });
  if(settings.userName) nameChange = true;
  
  //handle change password
  if(settings.password && !settings.confirm) return res.json({ error: 'please enter confirm or leave password blank' });
  if(!settings.password && settings.confirm) return res.json({ error: 'please enter password or leave confirm blank' });
  if(settings.password !== settings.confirm){
    return res.json({ error: 'password does not match confirm'});
  }
  if(settings.password) settings.passHash = bcrypt.hashSync(settings.password);
  delete settings.password;
  delete settings.confirm;
  
  async.waterfall([
    //Get user
    function(callback){
      get_RO_user(req.body.email, function(err, usr){
        if(err){
          errlog.info('Edit user error: '+err.message);
          return callback(err, null); // res.json({ error: err.message });
        }
        callback(null, usr);
      });
    },
    //update user settings
    function(usr, callback){
      updateUser(usr.data, settings, function(err){
        if(err){
          errlog.info('Edit user error: '+err.message);
          return callback(err, null); // res.json({ error: err.message });
        }
        return callback(null, usr);
      });
    },
    //save user and userReference. If name changes, update session.
    function(updated, callback){
      if(nameChange){
        updated.addToIndex('username', updated.data.userName);
        req.session.userName = updated.data.userName;
      }
      base.save_RO(updated, 'users', function(err){
        if(err) return res.json({ error: err.message });
        if(nameChange){
          update_userRef(updated.data.email, updated.data.userName, null, function(err, saved){
            if(err){
              return callback(err, null); // res.json({ error: err.message });
            }
            return callback(null, saved);
          });
        }
        else callback(null, updated);
      });
    }
  ], function(err, usr){
    if(err){
      errlog.info('editWrap error: '+err.message);
      return res.json({ error: 'Error Error Error' });
    }
    if(usr){
      return res.json({ success: 'Edit User '+req.body.email+' Success',
                        userName: usr.data.userName,
                        notify: 'Edit User Success!'});
    }
  });
  
  //return res.json({ success: 'dummy result', notify:'Edit Settings Incomplete' });
}

//Test for functionality
exports.testAPI = function(req, res){
  /*get_activity('zippy@z.z-activity', function(err, evtData){                    //PASSED!
    if(err){
      console.log(err.message);
      return res.send(JSON.stringify({ error: err.message }));
    }
    else{
      console.log(evtData);
      return res.send(JSON.stringify({ success: 'test passed' }));
    }
  });*/
  
  //exports.removePinFromUser = function(userId, pinId, callback)
  /*removePinFromUser('u5@u.u', '777032948567371800', function(err, modifiedUser){            //PASSED!
    if(err){
      console.log(err.message);
      return res.send(JSON.stringify({ error: err.message }));
    }
    else{
      console.log(modifiedUser);
      return res.send(JSON.stringify({ success: 'test passed' }));
    }
  });*/
  
  //exports.addPinToUser = function(userId, pinId, callback)
  /*util.generateId(function(id){
    next(id);
  });
  
  function next(id){
    addPinToUser('u5@u.u', id , function(err, modified_usr){
      if(err){
        console.log(err.message);
        return res.send(JSON.stringify({ error: err.message }));
      }
      else{
        return res.send(JSON.stringify({ success: 'test passed' }));
      }
    });
  }*/
  
  //exports.addFollower = function(sourceId, targetId, callback)
  /*addFollower('mom@m.m' ,'dtonys@gmail.com', function(err, updated_source){
    if(err) return res.send(JSON.stringify({ error: err.message }));
    else return res.send(JSON.stringify({ success: 'test passed' }));
  });*/
  
  //exports.removeFollower = function(sourceId, targetId, callback)
  /*removeFollower('dtonys@gmail.com', 'test1@t.t', function(err, updated_source){
    removeFollower('dtonys@gmail.com', 'test2@t.t', function(err, updated_source){
      removeFollower('dtonys@gmail.com', 'test3@t.t', function(err, updated_source){
        if(err) return res.send(JSON.stringify({ error: err.message }));
        else return res.send(JSON.stringify({ success: 'test passed' }));
      });
    });
  });*/
  
  //editSettings implemented via editWrap
  
  //exports.follow = function(req, res){
  
  //exports.getProfile = function(req, res){
  
}

/********************************************** API Level - Redacted  *************************************/

//Checks if session data is set (if user is logged in). Called on every angularjs infused page.
exports.checkLogin = function(req, res){
  if(!req.session || !req.session.loggedIn) return res.json({ loggedIn: false });
  //Clear newUser which stores register data
  if(req.session){
    if(req.session.newUser) req.session.newUser = null;
  }
	if(req.session.loggedIn){
		return res.json({
			loggedIn: true,
      userId: req.session.loggedIn,
      userName: req.session.userName,
      avatarImg: req.session.avatarUrl
		});
	}
}

//If we are registering with facebook, send profile params (stored in req.session.fbUser) to front end
exports.facebookRegister = function(req, res){
  if(req.session.fbUser){
    //delete req.user
    var temp = req.session.fbUser;
    req.session.fbUser = null;
    return res.json({
      fb: true,
      fbEmail: temp.data.email,
      fbName: temp.data.name,
      fbConnect: true
    });
  }
  else{
    return res.json({
      fb: false
    });
  }
}
//Login via gateway, identical to login except for body params
exports.gatewayLogin = function(req, res){
  var IE = false;
  if(req.get('X-Requested-With') != 'XMLHttpRequest') IE = true;
  
  //validation.  TODO: more rigorous validations
  if(!req.body.email) return res.json({login: false, error: 'Invalid email entered'});
  if(!req.body.password) return res.json({login: false, error: 'Invalid password entered'});
	//check if email exists in db
  base.RO_exist(req.body.email, 'users', function(err, not_found, found){
    if(err) return res.json({login: false, error: 'Error: ' + err.message});
    if(not_found) return res.json({login: false, error: 'Email not found'});
    if(found) next();
  });
  
	function next(){
    get_RO_user(req.body.email, function(err, ROuser){
      if(err) return res.json({login: false, error: err.message });
      
      //check password
      if(!(bcrypt.compareSync(req.body.password, ROuser.data.passHash))){
        return res.send(JSON.stringify({ login: false, error: 'Wrong password.' }));
			}
      
      //log in, set appropriate session data
      req.session.loggedIn = ROuser.data.email;
      req.session.userEmail = ROuser.data.email;
      req.session.userName = ROuser.data.userName;
      req.session.avatarUrl = ROuser.data.profileImg;
      //req.session.likes = ROuser.data.likes;         //save likes for front page
      
      outlog.info('Gateway Login Success for: ' + ROuser.data.username);
      evtlog.info('Gateway Login Success for: ' + ROuser.data.username);
      return res.send(JSON.stringify({
        login: true,
        userId: req.session.loggedIn,
        userEmail: req.session.userEmail,
        userName: req.session.userName,
        avatarUrl:  req.session.avatarUrl
      }));
    });
	}
}

// Destroy Session
exports.logout = function(req, res){
  if(req.session.loggedIn){
    outlog.info('logging out');
    evtlog.info('logging out'); 
    req.session.destroy();  //actually log us out
    res.json({
      logout: true
    });
  }
  else{
    outlog.info('User is not logged in');
    res.json({
      logout: false,
      error: "User is not logged in"
    });
  }
}

// Register step 1: hash password and put user data into session
exports.register = function(req, res){
  // Prompt error if we are already logged in (client should prevent this from happening)
  if(req.session.loggedIn){
    outlog.info('Registration Failed: User already logged in');
    return res.json({
      register: false,
      error: 'Registration Failed: User already logged in'
    });
  }
  //validate user input
  //validation.  TODO: more rigorous validations
  if(!req.body.email) return res.json({login: false, error: 'No email entered'});
  if(!req.body.name) return res.json({login: false, error: 'No name entered'});
  if(!req.body.password) return res.json({login: false, error: 'No password entered'});
  if(!req.body.confirm) return res.json({login: false, error: 'No confirm entered'});
  
	if(req.body.password !== req.body.confirm){
    outlog.info('Password does not match confirm');
		return res.json({
      register: false,
			error: 'Password does not match confirm'
		});
	}
	//check if another user with this email exists already
  app.riak.bucket('users').object.exists(req.body.email, function(err, exists){
    if(err){
      errlog.info('Check for existing user error: ' + err);
      return res.json({ error: 'Error: ' + err });
    }
    if(exists){
      outlog.info('This email is already registered. Please log in.');
      return res.json({
        register: false,
        error: 'This email is already registered. Please log in'
      });
    }
    next();
  });
  //check if another user with this name exists
	function next(){
		var hash = bcrypt.hashSync(req.body.password);
		//save data into session so step 2 can use it to complete the registration
		req.session.newUser = {
      email: req.body.email,
      name: req.body.name,
      fbConnect: req.body.fbConnect,
      passHash: hash,
      avatarImg: null
    };
    outlog.info('register step 1 complete');
		return res.json({
			register: true
		});
	}
};
//Register step 2: Construct new user from session.newUser & categories selected
exports.register_2 = function(req, res){
  var newEmail = req.session.newUser.email,
      newName = req.session.newUser.name,
      newHash = req.session.newUser.passHash,
      newFbConnect = req.session.newUser.fbConnect,
      newAvatarUrl = req.session.newUser.avatarImg,
			favCategories = [],
      dayJoined = util.getDate();
    //set fav_categories
    for(category in req.body.categories){
      favCategories.push(req.body.categories[category]);
    }
    var new_usr =  new userSchema.user();
    new_usr.email = newEmail;
    new_usr.passHash = newHash;
    new_usr.username = newName;
    new_usr.fbConnect = newFbConnect;
    new_usr.favCat = favCategories;
    new_usr.profileImg = newAvatarUrl;
    new_usr.dateJoined = dayJoined;
    
  //make new user
  
  //create/overwrite user
  var new_usr = app.riak.bucket('users').objects.new(newUser.email, newUser);
  //index username so we can query via username instead of email
  new_usr.addToIndex('username', newName);
  app.riak.bucket('users').objects.get(newUser.email, util.user_resolve, function(err, obj) {
    if(err){
      //if user doesn't exist, create new user
      if(err.status_code === 404){
        new_usr.save(function(err, saved){
          outlog.info('User ' + newUser.email + ' created');
          req.session.loggedIn = saved.data.email;
          req.session.userName = saved.data.username;
          req.session.userEmail = saved.data.email;
          req.session.avatarUrl = saved.data.profileImg;
          outlog.info(req.session.userName + 'Registered and logged In');
          next();
        });
      }
      else{
        outlog.info('Get user error: ' + err);
      }
    }
    //if existing user found, fetch that user's vec clock and overwrite with new_usr
    else if(obj){
      outlog.info('Error: user with existing email found');
      return;
    }
  });
  //create/overwrite user-groups
  function next(){
    //create one group per favCat
    var groups = {};
    var group_key = newUser.email + '-groups';
    for(f in new_usr.data.favCat){
       groups[new_usr.data.favCat[f]] = [];
    }
    var usr_groups = app.riak.bucket('users').objects.new(group_key, groups);
    app.riak.bucket('users').objects.get(group_key, function(err, obj) {
      if(err && err.status_code === 404){
        usr_groups.save(function(err, data){
          outlog.info('Groups object ' + group_key + ' created');
          next2();
        });
      }
      else if(obj){
        usr_groups.metadata.vclock = obj.metadata.vclock;
        usr_groups.save(function(err, data){
          outlog.info('Groups object ' + group_key + ' found and overwritten');
          next2();
        });
      }
    });
  }
  //create/overwrite user-activity
  function next2(){
    var activity = {evtIds:[]};
    var activity_key = newUser.email + '-activity';
    var usr_activity = app.riak.bucket('users').objects.new(activity_key, activity);
    app.riak.bucket('users').objects.get(activity_key, function(err, obj) {
      if(err && err.status_code === 404){
        usr_activity.save(function(err, saved){
          outlog.info('Activity queue ' + activity_key + ' created');
          outlog.info('createUser complete!');
          next3();
        });
      }
      else if(obj){
        usr_activity.metadata.vclock = obj.metadata.vclock;
        usr_activity.save(function(err, saved){
          outlog.info('Groups object ' + activity_key + ' found and overwritten');
          outlog.info('createUser complete!');
          next3();
        });
      }
    });
  }
  //store email -> {username, profileImg} into bucket for easy reference
  function next3(){
    var ref_data = new userSchema.userRef();
    ref_data.username = newName;
    ref_data.imgUrl = newUser.profileImg;
    var usr_ref = app.riak.bucket('userReference').objects.new(newEmail, ref_data);
    usr_ref.save(function(err, obj){
      outlog.info('user Reference saved!');
      return res.json({register: true, userData: newUser});
    });
  }
}

// Get current user settings to prefill My Settings Page
/*exports.getSettings = function(req, res){
  console.log('getSettings');
  get_RO_user(req.session.userEmail, function(err, usr){
    if(err){
      errlog.info('getSettings error: '+err.message);
      return res.json({ error: 'getSettings error: '+err.message});
    }
    return res.json({
      email: usr.data.email,
      userName: usr.data.userName,
      gender: usr.data.gender,
      bio: usr.data.bio
    });
  });
}*/

//get port # from server.  This belongs in a misc.js rather than user.js
exports.getPath = function(req, res){
  return res.json({
    path: app.self.locals.rootPath
  });
}
//deactivate
exports.deactivate = function(req, res){
  if(!req.body.email) return res.json({ error: 'email required to delete user' });
  var email = req.body.email;
  var name;
  
  //check if user exists
  app.riak.bucket('uses').object.exists(email, function(err, result){
    if(err) return res.json({ error: 'Delete user error: '+result });
    if(result) return res.json({ error: 'User does not exist' });
    else next();
  });
  
  function next(){
    //delete user, user-groups, user-activity, userReference
    async.each(
      [{key: email, bucket: 'users'}, {key: email+'-groups', bucket:'users'}, {key: email+'-activity', bucket:'users'},
      {key: email, bucket: 'userReference' }],
      base.get_and_delete,
      function(err){
        if(err){
          errlog.info('get_and_delete error: '+err.message);
          return res.json({ error: 'get_and_delete error: '+err.message });
        }
        //add user to graveyard
        else{
          var dead_usr = app.riak.bucket('graveyard').objects.new(email, {userName: name});
          dead_usr.save(function(_err, obj){
            if(_err){
              errlog.info('save to graveyward failed: '+_err.message)
              return res.json({ error: 'save to graveyard failed: '+_err.message });
            }
            else return res.json({ success: 'delete ' + email + ' success!' });
          });
        }
      }
    );
  }
}

//addFollower: source user follows target user, given targetName or targetId                                          TEST
exports.follow = function(req, res){
  var sourceId = req.body.sourceId,
      targetName = req.body.targetName,
      targetId = req.body.targetId;
  //if no targetId give, look it up via 2i
  if(!targetId){
    base.getUserEmail(targetName, function(err, email){
      if(err) return res.json({ error: err.message });
      targetId = email;
      next();
    });
  }
  else next();
  function next(){
    if(sourceId === targetId){
      outlog.info('Error: cannot follow yourself');
      return res.json({ error: 'Error: cannot follow yourself' });
    }
    //link users together, and save them
    addFollower(sourceId, targetId, function(err, sourceRO){
      if(err) return res.json({ error:'follow user error: '+err.message });
      return res.json({ success: sourceId+' following '+targetId+' success', notify: 'Now following '+targetId });
    });
  }
}

//sourceId removes follower relationship from targetId                                  TEST
exports.unfollow = function(req, res){
  var sourceId = req.body.sourceId,
      targetId = req.body.targetId;
  //validate
  if(sourceId === targetId){
    outlog.info('Error: cannot unfollow yourself');
    return res.json({ error: 'Error: cannot unfollow yourself' });
  }
  
  removeFollower(sourceId, targetId, function(err, sourceRO){
    if(err) return res.json({ error: 'unfollow error: '+err.message });
    return res.json({ success: sourceId+' unfollow '+targetId+' success', notify: 'Unfollowed '+targetId });
  });
}

exports.getSettings = function(req, res){
  if(!req.body.userName && !req.body.email) return res.json({ error: 'getSettings: no userName or userEmail specified' });
  if(req.body.email){
    get_RO_user(req.body.email, function(err, usr){
      if(err) return res.json({ error: 'getProfile: '+err.message });
      return res.json({ success: true, gender: usr.data.gender, userName: usr.data.userName });
    });
  }
  else if(req.body.userName){
    base.getUserEmail(req.body.userName, function(err, usr_email){
      if(err) return res.json({ error: 'getProfile: '+err.message });
      get_RO_user(usr_email, function(err, usr){
        if(err) return res.json({ error: 'getProfile: '+err.message });
        return res.json({ success: true, gender: usr.data.gender });
      });
    });
  }
}

// getProfile - return profile data for display - does not interact with session.
// user settings - follower/following user+image - userActivity
// accepts userEmail OR userName. userEmail preffered.
exports.getProfile = function(req, res){
  //get email via twoi search
  if(!req.body.userName && !req.body.email) return res.json({ error: 'getProfile: no userName or userEmail specified' });
  var user;                 // user RObject
  var email;                // reference to user's email
  var displayData = {};     // profile data we will send to the front end
  var activityList = [];    // contains list of ordered recent activity
  
  if(req.body.email){
    email = req.body.email;
    get_RO_user(email, function(err, usr){
      if(err) return res.json({ error: 'getProfile: '+err.message });
      user = usr;
      displayData = usr.data;
      delete displayData.passHash;   //we don't want to send password hash to client
      next();
    });
  }
  else if(req.body.userName){
    //get usr RObject, add data to displayData obj
    base.getUserEmail(req.body.userName, function(err, usr_email){
      if(err) return res.json({ error: 'getProfile: '+err.message });
      email = usr_email;
      get_RO_user(email, function(err, usr){
        if(err) return res.json({ error: 'getProfile: '+err.message });
        user = usr;
        displayData = usr.data;
        delete displayData.passHash;   //we don't want to send password hash to client
        next();
      });
    });
  }
  function next(){
    //get {username, imageThumb} for all followers and following, store in displayData
    //if userRef is not found, we will return null
    async.map(user.data.followers, base.get_userRef, function(err, results){
      if(err){
        return res.json({ error: 'getProfile: '+err.message });
      }
      util.removeNulls(results);
      displayData['followers'] = results;
      async.map(user.data.following, base.get_userRef, function(_err, _results){
        if(_err){
          return res.json({ error: 'getProfile: '+_err.message });
        }
        util.removeNulls(_results);    //remove not found elements
        displayData['following'] = _results;
        next2();
      });
    });
  }
  function next2(){
    //get recent activity (RO_gamepin.data), add to activityList[]
    get_activity(email+'-activity', function(err, evt_data){
      if(err){
        errlog.info('getProfile error: '+err.message);
        return res.json({ error: 'getProfile: '+err.message });
      }
      activityList = evt_data;
      next3();
    });
  }
  //send data to profile page
  function next3(){
    return res.json({ profileData: displayData, activityData: activityList });
  }
}
/* The following funcs used to retrieve list of pins that populate front page
 * We depend on riak solr search with presort:'key' in order to get a chronologically
 * sorted list.
 */

//given user email, fetch user and return list of followers
exports.getFollowers = function(req, res){
  if(!req.body.email) return res.json({ error: 'email required' });
  
  get_RO_user(req.body.email, function(err, usr){
    if(err) return res.json({ error: err.message });
    return res.json({ success: true, following: usr.data.following });
  });
}

//Return front page list of pins with comments
//Search index data is not deleted alongside DB entires, so we must filter out deleted entries.
exports.getPinList = function(req, res){
  var returnList = [];
  //javascript objects are maps. So ordered series KV pairs, iterable via insertion order.
  var indexMap = {};
  var pinMap = {};
  //feed comment ids into nodiak
  var commentIds = [];
  var gamepins;
  
  //do generic query, will get 200 most recent posts
  var query = {
    q: 'returnAll:y',
    start: 0,
    rows: 200,
    presort: 'key'
  };
  //get list of pins in sorted order
  app.riak.bucket('gamepins').search.solr(query, function(err, response){
    if(err){
      errlog.info('search.solr error: ' + err);
      return res.json({error: err});
    }
    if(response.response.numFound === 0){
      outlog.info('search.solr: none found');
      return res.json({ objects: returnList });
    }                                           //Hope this example helps, b/c I can't explain this in words
    gamepins = response.response.docs; // [ {posterId: user1}, {posterId: user2}, {posterId: user1}, {posterId: user1},
                                           //   {posterId: user3}, {posterId: user1}, {posterId: user1}, {posterId: user3} ]
    var posterArray = [];                  //[user1, user2, user5] => [user, user]
    var posterObj = {};                    //{user1: [0,3,5,2], user2:[1], user3:[4,6]} => user: [index, index]
    
    var gamepinIds = [];
    var indexMap = {};
    
    for(g = 0, glen = gamepins.length; g < glen; g++){
      //fill idList and id => index map
      gamepinIds.push(gamepins[g].id);
      indexMap[gamepins[g].id] = g;
    }
    
    //Remove all gamepins that do not exist
    base.RO_exists(gamepinIds, 'gamepins', function(err, not_found, found){
      if(err) return res.json({ error: err.message });
      for(f = 0, flen = not_found.length; f < flen; f++){
        gamepins.splice(indexMap[not_found[f]], 1);
      }
      next();
    });
    //Remove all gamepins who's owners do not exist
    function next(){
      for(g = 0, glen = gamepins.length; g < glen; g++){
        //fill posters and poster => pinIds[]
        var pinData = gamepins[g].fields;
        if(posterArray.indexOf(pinData.posterId) === -1) posterArray.push(pinData.posterId);
        if(!posterObj[pinData.posterId]) posterObj[pinData.posterId] = [g];
        else posterObj[pinData.posterId].push(g);
      }
      base.RO_exists(posterArray, 'users', function(err, not_found, found){
        if(err) return res.json({ error: err.message });
        for(f = 0, flen = not_found.length; f < flen; f++){
          nullUser = not_found[f];
          for(g = 0, glen = posterObj[nullUser].length; g < glen; g++){
            gamepins[posterObj[nullUser][g]] = null;
          }
        }
        util.removeNulls(gamepins);
        next2();
      });
    }
  });
  /* *** **** *** *** *** *** *** *** *** *** *** *** *** */
  function next2(){
    var count = 0;
    for(var o = 0; o < gamepins.length; o++){
      //insert null value to create insertion order
      pinMap[gamepins[o].id] = null;
      (function(_o){
        var pin = gamepins[_o];
        var pinId = gamepins[_o].id;
        //Fetch userRef to update gamepin
        app.riak.bucket('userReference').objects.get(pin.fields.posterId, function(err, ref_obj){
          if(err && err.status_code === 404) return;
          var cmts = [];
          var likedBy = [];
          if(err){
            errlog.info('error:' + err);
            return res.json({error: err});
          }
          //convert commments + likes from string to array
          if(pin.fields.comments)
            cmts = pin.fields.comments.split(" ");
          if(pin.fields.likedBy)
            likedBy = pin.fields.likedBy.split(" ");
          pinMap[pinId] = pin.fields;
          pinMap[pinId].id = pinId;
          //Overwrite old values with potentially updated user data
          pinMap[pinId].poster = ref_obj.data.userName;
          pinMap[pinId].profileImg = ref_obj.data.profileImg;
          pinMap[pinId].comments = [];
          pinMap[pinId].likedBy = likedBy;
          pinMap[pinId].likedFlag = false;                  //set likedflag for front page
          if(likedBy.indexOf(req.session.userEmail) !== -1) pinMap[pinId].likedFlag = true;
          //pinMap[pinId].likeFlag = false;
          //if(req.session.likes.indexOf(pinId) !== -1) pinMap[pinId].likeFlag = true;
          
          // Push comment IDs into array, so we can send them to nodiak. [<nodeflakeId>, <nodeflakeId>, <nodeflakeId>]
          // CommmentMap KV = { <nodeflakeId>: <commentIndex>, nodeflakeId>: <commentIndex>, }
          for(var c = 0; c < cmts.length; c++){
            commentIds.push(cmts[c]);
            indexMap[cmts[c]] = c;
          }
          count++;
          if(count === gamepins.length) next3();
        });
      })(o);
    }
  }
  function next3(){
    var posterIds = [];
    var posterNames = {};
    //TODO: Access to comment RO_get
    app.riak.bucket('comments').objects.get(commentIds, function(err, cmt_objs){
      if(cmt_objs.length === 0) next4();
      if(err && !cmt_objs){
        errlog.info('no comments found on pin with commentIds');
        next4();
      }
      if(err){
        for(var e = 0; e < err.length; e++){
          //remove not found comment from indexMap
          delete indexMap[err[e].data];
          if(err[e].status_code === 404 ){
            errlog.info('comment not found');
          }
          else{
            errlog.info('get comments error: ' + err);
          }
        }
      }
      var count = 0;
      for(var c = 0; c < cmt_objs.length; c++){
        (function(_c){
          var comment = cmt_objs[_c];
          app.riak.bucket('userReference').objects.get(comment.data.posterId, function(_err, usr_ref){
            if(_err){
              count++;
              if(count === cmt_objs.length) next4();
              return;
            }
            pinMap[comment.data.pin].comments[indexMap[comment.key]] = comment.data;
            pinMap[comment.data.pin].comments[indexMap[comment.key]].key = comment.key;
            pinMap[comment.data.pin].comments[indexMap[comment.key]].posterName = usr_ref.data.userName;
            pinMap[comment.data.pin].comments[indexMap[comment.key]].posterImg = usr_ref.data.profileImg;
            count++;
            if(count === cmt_objs.length) next4();
          });
        })(c);
      }
      function next4(){
        //for..in loop will iterate in the order that the gamepins were declared on the obj
        //because riak search gives us an ordered list, we can rely on maintaining the order
        for(pin in pinMap){
          util.removeNulls(pinMap[pin].comments);  //get rid of not found comments
          returnList.push(pinMap[pin]);
        }
        return res.json({ objects: returnList });
      }
    });
  }
}

//return list of gamepin-with-comment objs of given category
exports.categorySearch = function(req, res){
  var returnList = [];
  var commentMap = {};
  var pinMap = {};
  var commentIds = [];
  var category = req.body.category;
  
  outlog.info(req.body.category);
  if(req.body.category === 'Action & Adventure') category = 'Action \& Adventure';
  
  var query = {
    q: 'category:'+category,
    start: 0,
    rows: 1000,
    presort: 'key'
  };
  outlog.info(query);
  //get list of pins in sorted order
  app.riak.bucket('gamepins').search.solr(query, function(err, response){
    if(err){
      outlog.info(err);
      return res.json({error: err});
    }
    objs = response.response.docs;
    outlog.info(objs);
    for(obj in objs){
      var cmts = [];
      if(objs[obj].fields.comments)
        cmts = objs[obj].fields.comments.split(" ");
      pinMap[objs[obj].id] = {  id: objs[obj].id,
                                category: objs[obj].fields.category,
                                description: objs[obj].fields.description,
                                poster: objs[obj].fields.posterName,
                                comments: []
                              };
      //keep track of the comment's index so we dont have to sort later
      for(c in cmts){
        commentIds.push(cmts[c]);
        commentMap[cmts[c]] = c;
      }
    }
    next();
  });
  function next(){
    app.riak.bucket('comments').objects.get(commentIds, function(err, cmt_objs){
      if(err){
        return res.json({error: 'get comments failure or no comments'});
      }
      //if nodiak gives us a single object, convert that into an array with 1 element
      if(cmt_objs && Object.prototype.toString.call( cmt_objs ) === '[object Object]')
        cmt_objs = [cmt_objs];
      for(c in cmt_objs){
        pinMap[cmt_objs[c].data.pin].comments[commentMap[cmt_objs[c].key]] = {
                                                          id: cmt_objs[c].key,
                                                          pin: cmt_objs[c].data.pin,
                                                          poster: cmt_objs[c].data.poster,
                                                          content: cmt_objs[c].data.content,
                                                          posterImg: cmt_objs[c].data.imgUrl};
      }
      for(pin in pinMap){
        returnList.push(pinMap[pin]);
      }
      return res.json({ objects: returnList });
    });
  }
}
//return list of gamepin-with-comment objs with matching text in gamepin.description
exports.textSearch = function(req, res){
  var returnList = [];
  var commentMap = {};
  var pinMap = {};
  var commentIds = [];
  
  var query = {
    q: 'description:'+req.body.text,
    start: 0,
    rows: 1000,
    presort: 'key'
  };
  app.riak.bucket('gamepins').search.solr(query, function(err, response){
    if(err){
      outlog.info(err);
      return res.json({error: err});
    }
    objs = response.response.docs;
    outlog.info(objs);
    for(obj in objs){
      var cmts = [];
      if(objs[obj].fields.comments)
        cmts = objs[obj].fields.comments.split(" ");
      /*pinMap[objs[obj].id] = {  id: objs[obj].id,
                                category: objs[obj].fields.category,
                                description: objs[obj].fields.description,
                                poster: objs[obj].fields.posterName,
                                datePosted: objs[obj].fields.datePosted,
                                gameName: objs[obj].fields.gameName,
                                posterId: objs[obj].fields.posterId,
                                posterName: objs[obj].fields.posterName,
                                publisher: objs[obj].fields.publisher,
                                comments: []
                              };*/
      pinMap[objs[obj].id] = objs[obj].fields;
      pinMap[objs[obj].id]['id'] = objs[obj].id;
      pinMap[objs[obj].id]['comments'] = [];
      for(c in cmts){
        commentIds.push(cmts[c]);
        commentMap[cmts[c]] = c;
      }
    }
    next();
  });
  function next(){
    app.riak.bucket('comments').objects.get(commentIds, function(err, cmt_objs){
      if(err){
        errlog.info('get comments error: ' + err);
        return res.json({error: 'get comments failure or no comments'});
      }
      if(cmt_objs && Object.prototype.toString.call( cmt_objs ) === '[object Object]')
        cmt_objs = [cmt_objs];
      for(c in cmt_objs){
        pinMap[cmt_objs[c].data.pin].comments[commentMap[cmt_objs[c].key]] = {
                                                          id: cmt_objs[c].key,
                                                          pin: cmt_objs[c].data.pin,
                                                          poster: cmt_objs[c].data.poster,
                                                          content: cmt_objs[c].data.content,
                                                          posterImg: cmt_objs[c].data.imgUrl};
      }
      for(pin in pinMap){
        returnList.push(pinMap[pin]);
      }
      outlog.info('text search success');
      return res.json({ objects: returnList });
    });
  }
}

//given username, see if user exists and return email if so
exports.getUser = function(req, res){
  app.riak.bucket('users').search.twoi(req.body.name, 'username', function(err, keys){
    if(err){
      errlog.info('twoi error: ' + err);
      return res.json({error: "2i Error:" + err});
    }
    if(keys.length > 0) return res.json({ exists: true, email: keys[0] });
    else return res.json({exists: false});
  });
}

//change avatar image, outside of registration process.
//we will change the session var, the user object, and user quick reference
exports.changeAvatar = function(req, res){
  var IE = false;
  if(req.get('X-Requested-With') != 'XMLHttpRequest') IE = true;
  if(!req.files.image){
    return res.json({error: 'No image recieved by server'});
  }
  var url;
  app.rackit.add(req.files.image.path, {type: req.files.image.type}, function(err, cloudpath){
    if(err){
      if(IE){
        errlog.info('File upload error');
        res.contentType('text/plain'); 
        return res.send(JSON.stringify({error: 'File upload error'}));
      }
      return res.json({error: err});
    }
    url = app.rackit.getURI(cloudpath);
    req.session.avatarUrl = url;
    next();
  });
  //update the user
  function next(){
    app.riak.bucket('users').objects.get(req.session.loggedIn, util.user_resolve, function(err, obj){
      if(err){
        errlog.info('update user error : ' + err);
        return res.json({error: err});
      }
      util.clearChanges(obj);
      obj.data.profileImg = url;
      obj.save(function(err, saved){
        if(err){
          if(IE){
            errlog.info('Fetch user error ' + er);
            res.contentType('text/plain'); 
            return res.send(JSON.stringify({error: 'Fetch user error'}));
          }
          return res.json({error: err});
        }
        next2();
      });
    });
  }
  //update the user ref
  function next2(){
    app.riak.bucket('userReference').objects.get(req.session.loggedIn, function(err, obj){
      if(err) return res.json({error: err});
      obj.data.profileImg = url;
      obj.save(function(err, saved){
        if(err){
          if(IE){
            errlog.info('userReference save error ' + err);
            res.contentType('text/plain'); 
            return res.send(JSON.stringify({error: "Save error"}));
          }
          return res.json({error: err});
        }
        if(IE){
          res.contentType('text/plain');
          return res.end();
        }
        outlog.info('Avatar change success');
        return res.json({ success: "Avatar changed success" });
      });
    });
  }
}

//upload avatar image, used for registration only
exports.uploadAvatar = function(req, res){
  if(!req.files.image){
    outlog.info('No image recieved by server');
    return res.json({error: 'No image recieved by server'});
  }
  //Push content onto rackspace CDN, retreieve URL, set session.newUser.avatarImg
  app.rackit.add(req.files.image.path, {type: req.files.image.type}, function(err, cloudpath){
    if(err){
      errlog.info('uploadAvatar rackit add error: ' + err);
      return res.json({error: err});
    }
    var url = app.rackit.getURI(cloudpath);
    req.session.newUser.avatarImg = url;
    outlog.info('uploadAvatar success!');
    return res.json({ success: true });
  });
}

//creates pending account
exports.createPending = function(req, res){
  //validation
  if(!req.body.email || !req.body.userName)
    return res.send('');
  
  var pending_data = new userSchema.pendingUser();
  pending_data.email = req.body.email;
  pending_data.userName = req.body.userName;
  pending_data.email = req.body.company || false;
  
  //create pending user
  pend_usr = app.riak.bucket('pendingUsers').objects.new(pending_data.email, pending_data);
  pend_usr.addToIndex('username', pending_data.userName);
  pend_usr.save(function(err, saved){
    if(err){
      errlog.info('Save Pending User Error: ' + err);
      return res.json({ error: 'Save Pending User Error: ' + err });
    }
    outlog.info('Pending user '+ saved.key + ' created');
    evtlog.info('Pending user '+ saved.key + ' created');
    app.mandrill('messages/send', {
        message: {
          to: [{email: req.body.email}],
          from_email: 'info@quyay.com',
          subject: 'Quyay Alpha Registration',
          text: "Thank you for signing up for Quyay Alpha!\n\n" +
          "We have created a pending account for you with this email address and the username you submitted.\n\n" +
          "If you're accepted into this early access phase, we'll email you with more info, including how to log in. \n\n" +
          "-Team Quyay"
        }
      }, function(err, response){
        if(err){
          errlog.info('send email failure: ' + JSON.stringify(err));
          outlog.info('send email failure: ' +JSON.stringify(err));
          return res.json({error: err});
        }
        else{
          outlog.info('send email success');
          evtlog.info('send email success');
          return res.json({ success: "Submit Successful!" });
        }
      });
  });
}
//accept pending account, create real account, email user tmp password
exports.acceptPending = function(req, res){
  outlog.info('acceptPending');
  return res.json({ success: true });
}

exports.rejectPending = function(req, res){
  outlog.info('rejectPending');
  return res.json({ success: true });
}

//set real password, disabling temp password
exports.setPassword = function(req, res){
  outlog.info('setPassword');
  return res.json({ success: true });
}

//ensure that user name has not been taken
exports.checkUniqueName = function(req, res){
  if(!req.body.userName) return res.send(JSON.stringify({error: 'No Username Entered'}));
  
  util.uniqueUserName(req.body.userName, function(err){
    if(err) return res.send(JSON.stringify({error: 'Username already exists'}));
    return res.send(JSON.stringify({ success: true }));
  });
}

//ensure that user email has not been taken
exports.checkUniqueEmail = function(req, res){
  if(!req.body.email) return res.send(JSON.stringify({error: 'No Email Entered'}));
  
  util.uniqueUserEmail(req.body.email, function(err){
    if(err) return res.send(JSON.stringify({error: 'Email already exists'}));
    return res.send(JSON.stringify({ success: true }));
  });
}

//Get user activity, and then fetch those pins
exports.getActivity = function(req, res){
  outlog.info(req.params.userName);
  var user_id;
  var activityIds = [];
  var activityMap = {};
  
  //0: fetch userId via 2i
  app.riak.bucket('users').search.twoi(req.params.userName, 'username', function(err, keys){
    if(err){
      errlog.info('2i error: ' + err);
      return res.json({error: '2i Error: ' + err});
    }
    user_id = keys[0];
    next();
  });
  //1: Get list of Ids
  function next(){
    app.riak.bucket('users').objects.get(user_id + '-activity', function(err, obj){
      if(err){
        errlog.info('Fetch Activity Error ' + err)
        return res.json({error: 'Fetch Activity Error: ' + err});
      }
      activityIds = obj.data.evtIds;
      next2();
    });
  }
  //create Map and declare it in order of evtIdList,
  //we need to do this in order to establish the correct order
  function next2(){
    for(id in activityIds){
      activityMap[activityIds[id]] = null;
    }
    //fetch gamepins + fill map
    app.riak.bucket('gamepins').objects.get(activityIds, function(errs, objs){
      if(errs){
        errlog.info('One or More activity objects not found');
        return res.json({error: 'One or More activity objects not found'});
      }
      //if nodiak gives us a single object, convert that into an array with 1 element
      if(objs && Object.prototype.toString.call( objs ) === '[object Object]')
        objs = [objs];
      for(var o in objs){
        activityMap[objs[o].key] = objs[o].data;
      }
      return res.json({activity: activityMap});
    });
  }
}

exports.getLikedPins = function(req, res){
  if(!req.body.email) return res.json({ error: 'No email specified' });
  if(!req.body.pinIds) return res.json({ error: 'No pinIds specified' });
  
  //get pin given pinIds, ignore not found
  async.map(req.body.pinIds, function(pinId, callback){
    pinAPI.get_RO_gamepin(pinId, function(err, RO_pin){
      if(err){
        console.log(err);
        if(err instanceof E.NotFoundError) return callback(null, null);
        else return callback(err, null);
      }
      return callback(null, RO_pin);
    });
  },
  function(err, results){
    if(err) return res.json({ error: err.message });
    var res_list = [];
    
    for(r in results){
      results[r].data.id = results[r].key;
      res_list.push(results[r].data);
    }
    return res.json({ likedPins: res_list });
  });
}

//get groups which contain gamepin IDs, then fetch those gamepins and return them
//replace object containing IDs the actual object itself
exports.getGroups = function(req, res){
  if(!req.body.userName) return res.json({ error: 'userName missing' });
  var user_id;
  var gamepinIds = [];
  var groupIdMap = {};
  var groupDataMap = {};
  //0: fetch userId via 2i given userName
  app.riak.bucket('users').search.twoi(req.body.userName, 'username', function(err, keys){
    if(err){
      errlog.info('2i error: ' + err);
      return res.json({error: '2i Error:' + err});
    }
    user_id = keys[0];
    next();
  });
  //get groups object, store all Ids into one big array, gamepinIds
  function next(){
    app.riak.bucket('users').objects.get(user_id + '-groups', function(err, obj){
      if(err){
        errlog.info('Fetch Group error');
        return res.json({ error: 'Fetch Group error:' +  err });
      }
      groupIdMap = obj.data;
      //if object is empty return it right away with no additional fuss
      if(!Object.keys(groupIdMap).length) return res.json({groups: {}});
      
      //put all of the ids into one big list
      for(cat in groupIdMap){
        gamepinIds = gamepinIds.concat(groupIdMap[cat]);
      }
      
      //convert this data from map of arrays to map of maps (fun...:p)
      //iterating through object
      for(cat in groupIdMap){
        var catArray = groupIdMap[cat];
        groupDataMap[cat] = {};
        //iterating through array, using for loop for clarity
        for(var i = 0; i < catArray.length; i++){
          groupDataMap[cat][catArray[i]] = null;
        }
      }
      next2();
    });
  }
  //Fetch the gamepins from the gamepinIds array, match their category with the group
  function next2(){
    app.riak.bucket('gamepins').objects.get(gamepinIds, function(errs, objs){
      if(errs){
        for(e = 0, len = errs.length; e < len; e++){
          if(errs[e].status_code === 404) continue;
          else{
            errlog.info("riak.bucket('gamepins').objects.get error: "+errs[e].message);
            return res.json({ error: "riak.bucket('gamepins').objects.get error: "+errs[e].message});
          }
        }
      }
      //if nodiak gives us a single object, convert that into an array with 1 element
      if(objs && Object.prototype.toString.call( objs ) === '[object Object]')
        objs = [objs];
        
      /*base.get_userRef(pin_RO.data.posterId, function(_err, usr_ref){
        if(_err) return callback(_err, null);
        pin_RO.data.posterName = usr_ref.userName;
        pin_RO.data.profileImg = usr_ref.profileImg;
        return _callback(null, pin_RO.data);
      });
        
      //put the object into its proper place
      for(var o in objs){
        groupDataMap[objs[o].data.category][objs[o].key] = objs[o].data;
        groupDataMap[objs[o].data.category][objs[o].key].id = objs[o].key; //store pinId into object itself
      }*/
      
      //always must fetch userRef (should think about abstracting this to base API)
      async.each(objs, function(pin_RO, callback){
        base.get_userRef(pin_RO.data.posterId, function(_err, usr_ref){
          if(_err) return callback(_err);
          pin_RO.data.posterName = usr_ref.userName;
          pin_RO.data.profileImg = usr_ref.profileImg;
          return callback(null);
        });
      },
      function(err){
        if(err) return res.json({ error: err.message });
        for(var o in objs){
          groupDataMap[objs[o].data.category][objs[o].key] = objs[o].data;
          groupDataMap[objs[o].data.category][objs[o].key].id = objs[o].key; //store pinId into object itself
        }
        //TODO, make this more...elegant?
        util.removeNullsFromObj(groupDataMap);        //remove ids that point to no data
        for(g in groupDataMap){
          if(Object.keys(groupDataMap[g]).length === 0) delete groupDataMap[g];    //remove categories that have no ids
        }
        return res.json({groups: groupDataMap});
      });
    });
  }
}