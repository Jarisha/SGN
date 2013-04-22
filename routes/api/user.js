/********************************* User *******************************/
var bcrypt = require('bcrypt-nodejs');
var config = require('../../config');
var util = require('../../utility');
var app = require('../../app');

var userSchema = require('../../schema/user');
var comment_obj = require('../../schema/comment');

//Checks if session data is set (if user is logged in). Called on every angularjs infused page.
exports.checkLogin = function(req, res){
  console.log(app.self.locals);
  if(!app.self.locals.fake_session.loggedIn) return res.json({ loggedIn: false });
  else{
    return res.json({
      loggedIn: app.self.locals.fake_session.loggedIn,
      userId: null,
      userName: app.self.locals.fake_session.userAvatar,
      avatarImg: app.self.locals.fake_session.useAvatar
    });
  }
}

exports.getPath = function(req, res){
  return res.json({
    path: 'http://localhost'
  });
}

//Login via gateway, identical to login except for body params
exports.gatewayLogin = function(req, res){
  app.self.locals.fake_session.loggedIn = true;
  return res.json({
    loggedIn: app.self.locals.fake_session.loggedIn,
    userId: null,
    userName: app.self.locals.fake_session.userAvatar,
    avatarImg: app.self.locals.fake_session.useAvatar
  });
}

// Login: Set session given correct params
exports.login = function(req, res){
  app.self.locals.fake_session.loggedIn = true;
  return res.json({
    loggedIn: app.self.locals.fake_session.loggedIn,
    userId: null,
    userName: app.self.locals.fake_session.userAvatar,
    avatarImg: app.self.locals.fake_session.useAvatar
  });
}

// Destroy Session
exports.logout = function(req, res){
  if(req.session.loggedIn){
    console.log('logging out');
    app.self.locals.fake_session.loggedIn = false;
    res.json({
      logout: true
    });
  }
}
// Get current user settings to prefill My Settings Page
exports.getSettings = function(req, res){
  app.riak.bucket('users').objects.get(req.session.userEmail, function(err, obj){
    if(err){
      //errlog.info('User not found');
      return res.json({ error: 'User not found: ' + err });
    }
    console.log('Got settings for current user');
    return res.json({
      email: obj.data.email,
      username: obj.data.username,
      gender: obj.data.gender,
      bio: obj.data.bio
    });
  });
}

// editSettings
exports.editSettings = function(req, res){
  //validate user input
  if(!(req.body.settings.email && req.body.settings.username)){
    console.log('Email or Username is blank');
    return res.json({
      error: 'Email or Username is blank'
    });
  }
  var changePass = false;
  if((req.body.settings.changePass && req.body.settings.changeConfirm) &&
     (req.body.settings.changePass === req.body.settings.changeConfirm) ){
    changePass = true;
  }
  else if(req.body.settings.changePass !== req.body.settings.changeConfirm){
    console.log('Confirm does not match password');
    return res.json({error: 'Confirm does not match Passowrd'});
  }
  //get current user object
  var user = app.riak.bucket('users').objects.new(req.body.settings.email);
  var oldName;
  //need to refresh navbar if user changes name
  user.fetch(function(err, obj){
    if(err) return //errlog.info('fetch user error: ' + err);
    //update password if change password conditions are correct
    if(changePass) obj.data.passHash = bcrypt.hashSync(req.body.settings.changePass);
    //update settings & session data
    if(req.body.settings.email) obj.data.email = req.body.settings.email;
    obj.data.bio = req.body.settings.bio;
    if(req.body.settings.gender) obj.data.gender = req.body.settings.gender;
    if(req.body.settings.username){
      oldName = obj.data.username;
      obj.data.username = req.body.settings.username;
      req.session.userName = req.body.settings.username;
      //if username is changed, we need to change the reference table
      var ref_data =  util.clone(userReference_obj);
      ref_data.username = req.body.settings.username;
      ref_data.imgUrl = req.session.avatarUrl;
      /*var usr_ref = app.riak.bucket('userReference').objects.new(req.body.settings.email,
                                                                {username: req.body.settings.username,
                                                                 imgUrl: req.session.avatarUrl});*/
      var usr_ref = app.riak.bucket('userReference').objects.new(req.body.settings.email, ref_data);
      usr_ref.save(function(err, saved){
        console.log("userReference table updated: " + saved);
        next();
      });
    }
    else next();
    function next(){
      //save settings and update index
      obj.clearIndex('username');
      obj.addToIndex('username', req.body.settings.username);
      obj.save(function(err, obj){
        if(changePass){
          console.log('Settings saved and Password updated!');
          evtlog.info('Settings saved and Password updated!');
          return res.json({ success: true, username: obj.data.username, notify: "Settings Saved and Password updated!" });
        }
        console.log('Settings saved');
        return res.json({ success: true, username: obj.data.username, notify: "Settings Saved!" });
      });
    }
  });
}

//addFollowers: source user follows target user
exports.follow = function(req, res){
  var sourceId = req.body.sourceId,
      targetId = req.body.targetId;  
  var src = app.riak.bucket('users').objects.new(sourceId),
      targ = app.riak.bucket('users').objects.new(targetId);
  //validate
  if(sourceId === targetId){
    console.log('Error: cannot follow yourself');
    return res.json({ error: 'Error: cannot follow yourself' });
  }
  
  //source user adds target to following
  src.fetch(util.user_resolve, function(err, obj){
    if(err){
      //errlog.info('fetch user error: ' + err);
      return res.json({ error: 'Fetch User: ' + err });
    }
    util.clearChanges(obj);
    
    if(obj.data.following.indexOf(targetId) === -1){
      obj.data.following.push(targetId);
      obj.data.changes.following.add.push(targetId);
      obj.save(function(err,saved){
        if(err) return //errlog.info('user save error: ' + err);
        console.log(sourceId + ' following ['+ saved.data.following +']');
        next();
      });
    }
    else{
      console.log('User ' + targetId + ' aready on following list');
      return res.json({ error: 'User ' + targetId + ' aready on following list' });
    }
  });
  function next(){
    //target user adds source to followers
    targ.fetch(util.user_resolve, function(err, obj){
      if(err){
        //errlog.info('fetch user error: ' + err);
        return res.json({ error: 'Fetch User: ' + err });
      }
      util.clearChanges(obj);
      if(obj.data.followers.indexOf(sourceId) === -1){
        obj.data.followers.push(sourceId);
        obj.data.changes.followers.add.push(sourceId);
        obj.save(function(err, saved){
          if(err) //errlog.info('user save error: ' + err);
          console.log(targetId + " followers ["+ saved.data.followers +"]");
          return res.json({ success: true });
        });
      }
      else{
        console.log('User ' + targetId + ' aready on following list')
        return res.json({ error: "User " + targetId + " aready on following list" });
      }
    });
  }
}

//getProfile - return profile data
exports.getProfile = function(req, res){
  //if sent username, fetch corresponding email
  var key;
  if(req.body.userName){
    app.riak.bucket('users').search.twoi(req.body.userName, 'username', function(err, keys){
      if(err) return res.json({error: "2i Error:" + err});
      key = keys[0];
      next();
    });
  }
  else next();
  function next(){
    console.log('next1');
    key = key || req.body.userEmail;
    var usr = app.riak.bucket('users').objects.new(key);
    usr.fetch(util.user_resolve, function(err, obj){
      if(err){
        //errlog.info('getProfile error: ' + err);
        return res.json({error: "getProfile error: " + err});
      }
      util.clearChanges(obj);
      obj.data.followerUnit = [];
      obj.data.followingUnit = [];
      var clock = 0;
      if(obj.data.followers.length === 0) next2();
      //add followers, need to get their usernames via userReference
      for(f in obj.data.followers){
        (function(f){
          app.riak.bucket('userReference').objects.get(obj.data.followers[f], function(err, ref_obj){
            if(err) //errlog.info('get userReference error: ' + err);
            var user_name = ref_obj.data.username;
            var user_image = ref_obj.data.imgUrl;
            obj.data.followerUnit.push({ name: user_name, image: user_image });
            if(clock === obj.data.followers.length-1) next2();
            clock++;
          });
        })(f)
      }
      //add following
      function next2(){
        var clock = 0;
        if(obj.data.following.length === 0) next3();
        //add following
        for(f in obj.data.following){
          (function(_f){
            app.riak.bucket('userReference').objects.get(obj.data.following[_f], function(err, ref_obj){
              if(err) console.log('Error: ' + err);
              console.log(ref_obj.data);
              var user_name = ref_obj.data.username;
              var user_image = ref_obj.data.imgUrl;
              obj.data.followingUnit.push({name: user_name, image: user_image});
              if(clock === obj.data.following.length-1) next3();
              clock++;
            });
          })(f);
        }
      }
      function next3(){
        console.log('getProfile Success!');
        return res.json(obj.data);
      }
    });
  }
}
/* The following funcs used to retrieve list of pins that populate front page
 * We depend on riak solr search with presort:'key' in order to get a chronologically
 * sorted list.
 */

//return list of gamepin-with-comments objs given no search params
exports.getPinList = function(req, res){
  return res.json({objects: {}});
  /*
  var returnList = [];
  //javascript objects are maps. So ordered series KV pairs, ordered via insertion order
  var commentMap = {};
  var pinMap = {};
  //feed comment ids into nodiak
  var commentIds = [];
  
  var query = {
    q: 'returnAll:y',
    start: 0,
    rows: 200,
    presort: 'key'
  };
  //get list of pins in sorted order
  app.riak.bucket('gamepins').search.solr(query, function(err, response){
    if(err){
      //errlog.info('search.solr error: ' + err);
      return res.json({error: err});
    }
    if(response.response.numFound === 0){
      console.log('search.solr: none found');
      return res.json({ objects: returnList });
    }
    objs = response.response.docs;
    var clock = 0;
    for(o in objs){
      (function(o){
        app.riak.bucket('userReference').objects.get(objs[o].fields.posterId, function(err, obj){
          var cmts = [];
          if(err){
            //errlog.info('error:' + err);
            return res.json({error: err});
          }
          //console.log(obj.data);
          //convert commments from string to proper array
          if(objs[o].fields.comments)
            cmts = objs[o].fields.comments.split(" ");
          pinMap[objs[o].id] = {  id: objs[o].id,
                                    category: objs[o].fields.category,
                                    description: objs[o].fields.description,
                                    imageUrl: objs[o].fields.sourceUrl,
                                    poster: obj.data.username,
                                    posterImg: obj.data.imgUrl,
                                    comments: []
                                  };
          //keep track of the comment's position so we dont have to sort later
          for(c in cmts){
            commentIds.push(cmts[c]);
            commentMap[cmts[c]] = c;
          }
          if(clock === objs.length-1) next();
          clock++;
        });
      })(o);
    }
  });
  //fetch comments and attach them to their respective gamepin obj
  function next(){
    var posterIds = [];
    var posterNames = {};
    app.riak.bucket('comments').objects.get(commentIds, function(err, cmt_objs){
      if(cmt_objs.length === 0) next2();
      if(err){
        if(err.status_code = 404){
          //errlog.info('get comments error: ' + err);
          return res.json({error: 'get comments error: ' + err});
        }
        else{
          //errlog.info('get comments error: ' + err);
          return res.json({error: 'get comments error: ' + err});
        }
      }
      //if nodiak gives us a single object, convert that into an array with 1 element
      if(cmt_objs && Object.prototype.toString.call( cmt_objs ) === '[object Object]')
        cmt_objs = [cmt_objs];
      var clock = 0;
      for(c in cmt_objs){
        (function(_c){
          //fetch current user name from userReference
          app.riak.bucket('userReference').objects.get(cmt_objs[_c].data.posterId, function(err, obj){
            if(err){
              //errlog.info('get userReference error: ' + err);
              return res.json('err getting comment posters');
            }
            pinMap[cmt_objs[_c].data.pin].comments[commentMap[cmt_objs[_c].key]] = {};
            pinMap[cmt_objs[_c].data.pin].comments[commentMap[cmt_objs[_c].key]].posterName = obj.data.username;
            pinMap[cmt_objs[_c].data.pin].comments[commentMap[cmt_objs[_c].key]].posterImg = obj.data.imgUrl;
            pinMap[cmt_objs[_c].data.pin].comments[commentMap[cmt_objs[_c].key]].id = cmt_objs[_c].key;
            pinMap[cmt_objs[_c].data.pin].comments[commentMap[cmt_objs[_c].key]].pin = cmt_objs[_c].data.pin;
            pinMap[cmt_objs[_c].data.pin].comments[commentMap[cmt_objs[_c].key]].posterId = cmt_objs[_c].data.posterId;
            pinMap[cmt_objs[_c].data.pin].comments[commentMap[cmt_objs[_c].key]].content = cmt_objs[_c].data.content;
            if(clock === cmt_objs.length-1) next2();
            clock++;
          });
        })(c);
      }
      function next2(){
        //for..in loop will iterate in the order that the gamepins were declared on the obj
        //because riak search gives us an ordered list, we can rely on maintaining the order
        for(pin in pinMap){
          returnList.push(pinMap[pin]);
        }
        return res.json({ objects: returnList });
      }
    });
  }*/
}

//return list of gamepin-with-comment objs of given category
exports.categorySearch = function(req, res){
  var returnList = [];
  var commentMap = {};
  var pinMap = {};
  var commentIds = [];
  var category = req.body.category;
  
  console.log(req.body.category);
  if(req.body.category === 'Action & Adventure') category = 'Action \& Adventure';
  
  var query = {
    q: 'category:'+category,
    start: 0,
    rows: 1000,
    presort: 'key'
  };
  console.log(query);
  //get list of pins in sorted order
  app.riak.bucket('gamepins').search.solr(query, function(err, response){
    if(err){
      console.log(err);
      return res.json({error: err});
    }
    objs = response.response.docs;
    console.log(objs);
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
      console.log(err);
      return res.json({error: err});
    }
    objs = response.response.docs;
    console.log(objs);
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
        //errlog.info('get comments error: ' + err);
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
      console.log('text search success');
      return res.json({ objects: returnList });
    });
  }
}

//given username, see if user exists and return email if so
exports.getUser = function(req, res){
  
  app.riak.bucket('users').search.twoi(req.body.name, 'username', function(err, keys){
    if(err){
      //errlog.info('twoi error: ' + err);
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
        //errlog.info('File upload error');
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
        //errlog.info('update user error : ' + err);
        return res.json({error: err});
      }
      util.clearChanges(obj);
      obj.data.profileImg = url;
      obj.save(function(err, saved){
        if(err){
          if(IE){
            //errlog.info('Fetch user error ' + er);
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
      obj.data.imgUrl = url;
      obj.save(function(err, saved){
        if(err){
          if(IE){
            //errlog.info('userReference save error ' + err);
            res.contentType('text/plain'); 
            return res.send(JSON.stringify({error: "Save error"}));
          }
          return res.json({error: err});
        }
        if(IE){
          res.contentType('text/plain');
          return res.end();
        }
        console.log('Avatar change success');
        return res.json({ success: "Avatar changed success" });
      });
    });
  }
}

//upload avatar image, used for registration only
exports.uploadAvatar = function(req, res){
  if(!req.files.image){
    console.log('No image recieved by server');
    return res.json({error: 'No image recieved by server'});
  }
  //Push content onto rackspace CDN, retreieve URL, set session.newUser.avatarImg
  app.rackit.add(req.files.image.path, {type: req.files.image.type}, function(err, cloudpath){
    if(err){
      //errlog.info('uploadAvatar rackit add error: ' + err);
      return res.json({error: err});
    }
    var url = app.rackit.getURI(cloudpath);
    req.session.newUser.avatarImg = url;
    console.log('uploadAvatar success!');
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
      //errlog.info('Save Pending User Error: ' + err);
      return res.json({ error: 'Save Pending User Error: ' + err });
    }
    console.log('Pending user '+ saved.key + ' created');
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
          //errlog.info('send email failure: ' + JSON.stringify(err));
          console.log('send email failure: ' +JSON.stringify(err));
          return res.json({error: err});
        }
        else{
          console.log('send email success');
          evtlog.info('send email success');
          return res.json({ success: "Submit Successful!" });
        }
      });
  });
}
//accept pending account, create real account, email user tmp password
exports.acceptPending = function(req, res){
  console.log('acceptPending');
  return res.json({ success: true });
}

exports.rejectPending = function(req, res){
  console.log('rejectPending');
  return res.json({ success: true });
}

//set real password, disabling temp password
exports.setPassword = function(req, res){
  console.log('setPassword');
  return res.json({ success: true });
}

//ensure that user name has not been taken
exports.checkUniqueName = function(req, res){
  console.log('checkUniqueName');
  //validation
  if(!req.body.userName) return res.send(JSON.stringify({error: 'No Username Entered'}));
  
  //check pending accounts to see if username exists
  app.riak.bucket('pendingUsers').search.twoi(req.body.userName, 'username', function(err, keys){
    if(err){
      //errlog.info('check user exists error: ' + err);
      return res.json({error: err});
    }
    if(keys){
      if(keys.length !== 0){
        console.log('Username already exists!');
        return res.send(JSON.stringify({error: 'Username already exists'}));
      }
      return next();
    }
  });
  function next(){
    //check registered accounts to see if username exists
    app.riak.bucket('users').search.twoi(req.body.userName, 'username', function(err, keys){
      if(err){
        //errlog.info('check registered accounts twoi error: ' + err);
        return res.send(JSON.stringify({error: err}));
      }
      if(keys){
        if(keys.length !== 0){
          console.log('Username already exists');
          return res.send(JSON.stringify({error: 'Username already exists'}));
        }
        return res.send(JSON.stringify({ success: true }));
      }
    });
  }
}

//ensure that user email has not been taken
exports.checkUniqueEmail = function(req, res){
  if(!req.body.email){
    console.log('No Email Entered');
    return res.send(JSON.stringify({error: 'No Email Entered'}));
  }
  //check pending accounts to see if email exists
  app.riak.bucket('pendingUsers').object.exists(req.body.email, function(err, result){
    if(err){
      //errlog.info('Pending Email Exists Error: ' + err);
      return res.send(JSON.stringify({ error: 'Pending Email Exists Error: ' + err }));
    }
    if(result){
      //errlog.info('Pending Email already exists');
      return res.send(JSON.stringify({ error: 'Pending Email already exists' }));
    }
    else next();
  });
  function next(){
    //check registered accounts to see if email exists
    app.riak.bucket('users').object.exists(req.body.email, function(err, result){
      if(err){
        //errlog.info(err);
        return res.send(JSON.stringify({ error: 'Registered Email Exists Error: ' + err }));
      }
      if(result){
        //errlog.info('Registered Email Exists Error: ' + err);
        return res.json(JSON.stringify({ error: 'Registerd Email already exists' }));
      }
      else return res.json(JSON.stringify({ success: true }));
    });
  }
}

//Get user activity, and then fetch those pins
exports.getActivity = function(req, res){
  console.log(req.params.userName);
  var user_id;
  var activityIds = [];
  var activityMap = {};
  
  //0: fetch userId via 2i
  app.riak.bucket('users').search.twoi(req.params.userName, 'username', function(err, keys){
    if(err){
      //errlog.info('2i error: ' + err);
      return res.json({error: '2i Error: ' + err});
    }
    user_id = keys[0];
    next();
  });
  //1: Get list of Ids
  function next(){
    app.riak.bucket('users').objects.get(user_id + '-activity', function(err, obj){
      if(err){
        //errlog.info('Fetch Activity Error ' + err)
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
        //errlog.info('One or More activity objects not found');
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

//get groups which contain gamepin IDs, then fetch those gamepins and return them
//replace object containing IDs the actual object itself
exports.getGroups = function(req, res){
  var user_id;
  var gamepinIds = [];
  var groupIdMap = {};
  var groupDataMap = {};
  //0: fetch userId via 2i
  app.riak.bucket('users').search.twoi(req.params.userName, 'username', function(err, keys){
    if(err){
      //errlog.info('2i error: ' + err);
      return res.json({error: '2i Error:' + err});
    }
    user_id = keys[0];
    next();
  });
  //get groups object, store all Ids into one big array, gamepinIds
  function next(){
    app.riak.bucket('users').objects.get(user_id + '-groups', function(err, obj){
      if(err){
        //errlog.info('Fetch Group error');
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
        //errlog.info('One or more group gamepins not found');
        return res.json({ error: 'One or more group gamepins not found: '});
      }
      //if nodiak gives us a single object, convert that into an array with 1 element
      if(objs && Object.prototype.toString.call( objs ) === '[object Object]')
        objs = [objs];
      //put the object into its proper place
      for(var o in objs){
        groupDataMap[objs[o].data.category][objs[o].key] = objs[o].data;
      }
      return res.json({groups: groupDataMap});
    });
  }
}