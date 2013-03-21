/********************************* User *******************************/
var bcrypt = require('bcrypt-nodejs');
var config = require('../../config');
var util = require('../../utility');
var app = require('../../app');

//Checks if session data is set (if user is logged in). Called on every angularjs infused page.
exports.checkLogin = function(req, res){
  if(!req.session) return res.json({ loggedIn: false });
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

// Login: Set session given correct params
exports.login = function(req, res){
  // Prompt error if we are already logged in (client should prevent this from happening)
  if(req.session.loggedIn){
    return res.json({
      login: false,
      error: 'Login Failed: User already logged in'
    });
  }
  
  //validation.  TODO: more rigorous validations
  if(!req.body.email) return res.json({login: false, error: 'Invalid email entered'});
  if(!req.body.password) return res.json({login: false, error: 'Invalid password entered'});
	//check if email exists in db
  app.riak.bucket('users').object.exists(req.body.email, function(err, exists) {
    if(err) return res.json({login: false, error: 'Error: ' +  err});
    if(!exists){
      console.log('Does not exist!');
      return res.json({login: false, error: 'Email not found in db'});
    }
    return next();
  });
	function next(){
    //get user
    var user = app.riak.bucket('users').objects.new(req.body.email);
    user.fetch(util.user_resolve, function(err, obj){
      console.log(err);
      util.clearChanges(obj);
      
      //check password
      if(!(bcrypt.compareSync(req.body.password, obj.data.passHash))){
				return res.json({ login: false, error: 'Wrong password.' })
			}
      //log in
      console.log(obj.data);
      req.session.loggedIn = obj.data.email;
      req.session.userEmail = obj.data.email;
      req.session.userName = obj.data.username;
      req.session.avatarUrl = obj.data.profileImg;
      return res.json({
        login: true,
        userId: req.session.loggedIn,
        userEmail: req.session.userEmail,
        userName: req.session.userName,
        avatarUrl:  req.session.avatarUrl
      });
    });
	}
}

// Destroy Session
exports.logout = function(req, res){
  if(req.session.loggedIn){
    console.log('destroying session'); 
    req.session.destroy();  //actually log us out
    res.json({
      logout: true
    });
  }
  else{
    res.json({
      logout: false,
      error: "User is not logged in"
    });
  }
}

// Register step 1: hash password and put user data into session
exports.register = function(req, res){
  // Prompt error if we are already logged in (client should prevent this from happening)
  console.log(req.body);
  if(req.session.loggedIn){
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
		return res.json({
      register: false,
			error: 'Password does not match confirm'
		});
	}
	//check if another user with this email exists already
  app.riak.bucket('users').object.exists(req.body.email, function(err, exists){
    if(err)
      return res.json({ error: 'Error: ' + err });
    if(exists){
      return res.json({
        register: false,
        error: 'This email is already registered. Please log in'
      });
    }
    next();
  });
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
		return res.json({
			register: true
		});
	}
};
//Register step 2: Construct new user from session.newUser & categories selected
exports.register_2 = function(req, res){
  console.log('register_2');
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
    var newUser = {
                email: newEmail,
                passHash: newHash,
                username: newName,
                fbConnect: newFbConnect,
                favCat: favCategories,
                profileImg: newAvatarUrl,
                gender: null,
                bio:null,
                dateJoined: dayJoined,
                posts:[],
                likes:[],
                followers:[],
                following:[],
                changes:{
                  posts: {add:[], remove:[]},
                  likes: {add:[], remove:[]},
                  followers: {add:[], remove:[]},
                  following: {add:[], remove:[]},
                }
    };
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
          console.log('User ' + newUser.email + ' created');
          req.session.loggedIn = saved.data.email;
          req.session.userName = saved.data.username;
          req.session.userEmail = saved.data.email;
          req.session.avatarUrl = saved.data.profileImg;
          console.log(req.session.userName + 'Registered and logged In');
          next();
        });
      }
      else{
        console.log('Get user error: ' + err);
      }
    }
    //if existing user found, fetch that user's vec clock and overwrite with new_usr
    else if(obj){
      console.log('Error: user with existing email found');
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
          console.log('Groups object ' + group_key + ' created');
          next2();
        });
      }
      else if(obj){
        usr_groups.metadata.vclock = obj.metadata.vclock;
        usr_groups.save(function(err, data){
          console.log('Groups object ' + group_key + ' found and overwritten');
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
          console.log('Activity queue ' + activity_key + ' created');
          console.log('createUser complete!');
          next3();
        });
      }
      else if(obj){
        usr_activity.metadata.vclock = obj.metadata.vclock;
        usr_activity.save(function(err, saved){
          console.log('Groups object ' + activity_key + ' found and overwritten');
          console.log('createUser complete!');
          next3();
        });
      }
    });
  }
  //store email -> {username, profileImg} into bucket for easy reference
  function next3(){
    var usr_ref = app.riak.bucket('userReference').objects.new(newEmail, {username: newName, imgUrl: newUser.profileImg});
    usr_ref.save(function(err, obj){
      console.log('user Reference saved!');
      console.log(obj);
      return res.json({register: true, userData: newUser});
    });
  }
}

// Get current user settings to prefill My Settings Page
exports.getSettings = function(req, res){
  app.riak.bucket('users').objects.get(req.session.userEmail, function(err, obj){
    if(err) return res.json({ error: 'User not found: ' + err });
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
    return res.json({
      error: 'Email or Username is blank'
    });
  }
  console.log('EDITSETTINGS');
  console.log(req.body);
  //get current user object
  var user = app.riak.bucket('users').objects.new(req.body.settings.email);
  var oldName;
  //need to refresh navbar if user changes name
  user.fetch(function(err, obj){
    //update settings & possibly session
    if(req.body.settings.email) obj.data.email = req.body.settings.email;
    obj.data.bio = req.body.settings.bio;
    if(req.body.settings.gender) obj.data.gender = req.body.settings.gender;
    if(req.body.settings.username){
      oldName = obj.data.username;
      obj.data.username = req.body.settings.username;
      req.session.userName = req.body.settings.username;
      //if username is changed, we need to change the reference table
      var usr_ref = app.riak.bucket('userReference').objects.new(req.body.settings.email,
                                                                {username: req.body.settings.username,
                                                                 imgUrl: req.session.avatarUrl});
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
        console.log('Settings saved');
        return res.json({ success: true, username: obj.data.username });
      });
    }
  });
}

//get port # from server.  This belongs in a misc.js rather than user.js
exports.getPath = function(req, res){
  return res.json({
    path: app.server.locals.rootPath
  });
}
//deactivate
exports.deactivate = function(req, res){
  return res.json({
    success: true
  })
}

//addFollowers: source user follows target user
exports.follow = function(req, res){
  var sourceId = req.body.sourceId,
      targetId = req.body.targetId;  
  var src = app.riak.bucket('users').objects.new(sourceId),
      targ = app.riak.bucket('users').objects.new(targetId);
  //validate
  if(sourceId === targetId){
    return res.json({ error: "Error: cannot follow yourself" });
  }
  
  //source user adds target to following
  src.fetch(util.user_resolve, function(err, obj){
    if(err){
      return res.json({ error: "Fetch User: " + err });
    }
    util.clearChanges(obj);
    
    if(obj.data.following.indexOf(targetId) === -1){
      obj.data.following.push(targetId);
      obj.data.changes.following.add.push(targetId);
      obj.save(function(err,saved){
        console.log(sourceId + " following ["+ saved.data.following +"]");
        next();
      });
    }
    else{
      return res.json({ error: "User " + targetId + " aready on following list" });
    }
  });
  function next(){
    //target user adds source to followers
    targ.fetch(util.user_resolve, function(err, obj){
      if(err){
        return res.json({ error: "Fetch User: " + err });
      }
      util.clearChanges(obj);
      if(obj.data.followers.indexOf(sourceId) === -1){
        obj.data.followers.push(sourceId);
        obj.data.changes.followers.add.push(sourceId);
        obj.save(function(err, saved){
          console.log(targetId + " followers ["+ saved.data.followers +"]");
          return res.json({ success: true });
        });
      }
      else{
        return res.json({ error: "User " + targetId + " aready on following list" });
      }
    });
  }
}

//removeFollowers
exports.unfollow = function(req, res){
  return res.json({
    success: true
  })
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
        return res.json({error: "getProfile error: " + err});
      }
      util.clearChanges(obj);
      obj.data.followerNames = [];
      obj.data.followingNames = [];
      var clock = 0;
      console.log('beforeFollowers');
      if(obj.data.followers.length === 0) next2();
      for(f in obj.data.followers){
        (function(f){
          app.riak.bucket('userReference').objects.get(obj.data.followers[f], function(err, name_obj){
            obj.data.followerNames.push(name_obj.data.username);
            console.log(clock);
            if(clock === obj.data.followers.length-1) next2();
            clock++;
          });
        })(f)
      }
      function next2(){
        clock = 0;
        console.log('next2');
        if(obj.data.following.length === 0) next3();
        for(f in obj.data.following){
          (function(f){
            app.riak.bucket('userReference').objects.get(obj.data.following[f], function(err, name_obj){
              obj.data.followingNames.push(name_obj.data.username);
              if(clock === obj.data.following.length-1) next3();
              clock++;
            });
          })(f);
        }
      }
      function next3(){
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
  var returnList = [];
  //associative arrays make things easier.  Lets call them maps for short.
  var commentMap = {};
  var pinMap = {};
  //feed comment ids into nodiak
  var commentIds = [];
  
  var query = {
    q: 'returnAll:y',
    start: 0,
    rows: 1000,
    presort: 'key'
  };
  //get list of pins in sorted order
  app.riak.bucket('gamepins').search.solr(query, function(err, response){
    console.log("Error:");
    console.log(err);
    console.log("Response:");
    if(err){
      console.log(err);
      return res.json({error: err});
    }
    if(response.response.numFound === 0){
      return res.json({ objects: returnList });
    }
    objs = response.response.docs;
    var clock = 0;
    for(o in objs){
      (function(o){
        app.riak.bucket('userReference').objects.get(objs[o].fields.posterId, function(err, obj){
          var cmts = [];
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
    //console.log(response.response.docs);
  });
  //fetch comments and attach them to their respective gamepin obj
  function next(){
    var posterIds = [];
    var posterNames = {};
    app.riak.bucket('comments').objects.get(commentIds, function(err, cmt_objs){
      if(cmt_objs.length === 0) next2();
      if(err){
        if(err.status_code = 404){
          console.log('no comment found');
        }
        else{
          return res.json({error: 'get comments error: ' + err});
        }
      }
      //if nodiak gives us a single object, convert that into an array with 1 element
      if(cmt_objs && Object.prototype.toString.call( cmt_objs ) === '[object Object]')
        cmt_objs = [cmt_objs];
      var clock = 0;
      for(c in cmt_objs){
        (function(c){
          //fetch current user name from userReference
          app.riak.bucket('userReference').objects.get(cmt_objs[c].data.posterId, function(err, obj){
            if(err){
              return res.json('err getting comment posters');
            }
            pinMap[cmt_objs[c].data.pin].comments[commentMap[cmt_objs[c].key]] = {};
            pinMap[cmt_objs[c].data.pin].comments[commentMap[cmt_objs[c].key]].posterName = obj.data.username;
            pinMap[cmt_objs[c].data.pin].comments[commentMap[cmt_objs[c].key]].posterImg = obj.data.imgUrl;
            pinMap[cmt_objs[c].data.pin].comments[commentMap[cmt_objs[c].key]].id = cmt_objs[c].key;
            pinMap[cmt_objs[c].data.pin].comments[commentMap[cmt_objs[c].key]].pin = cmt_objs[c].data.pin;
            pinMap[cmt_objs[c].data.pin].comments[commentMap[cmt_objs[c].key]].posterId = cmt_objs[c].data.posterId;
            pinMap[cmt_objs[c].data.pin].comments[commentMap[cmt_objs[c].key]].content = cmt_objs[c].data.content;
            if(clock === cmt_objs.length-1) next2();
            clock++;
          });
        })(c);
      }
      function next2(){
        //console.log(pinMap);
        //for..in loop will iterate in the order that the gamepins were declared on the obj
        //because riak search gives us an ordered list, we can rely on maintaining the order
        for(pin in pinMap){
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
  
  var query = {
    q: 'category:'+req.body.category,
    start: 0,
    rows: 1000,
    presort: 'key'
  };
  //get list of pins in sorted order
  app.riak.bucket('gamepins').search.solr(query, function(err, response){
    if(err){
      console.log(err);
      return res.json({error: err});
    }
    objs = response.response.docs;
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
                                                          content: cmt_objs[c].data.content };
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
      if(cmt_objs && Object.prototype.toString.call( cmt_objs ) === '[object Object]')
        cmt_objs = [cmt_objs];
      for(c in cmt_objs){
        pinMap[cmt_objs[c].data.pin].comments[commentMap[cmt_objs[c].key]] = {
                                                          id: cmt_objs[c].key,
                                                          pin: cmt_objs[c].data.pin,
                                                          poster: cmt_objs[c].data.poster,
                                                          content: cmt_objs[c].data.content };
      }
      for(pin in pinMap){
        returnList.push(pinMap[pin]);
      }
      return res.json({ objects: returnList });
    });
  }
}

exports.getUser = function(req, res){
  console.log(req.body);
  app.riak.bucket('users').search.twoi(req.body.name, 'username', function(err, keys){
    if(err) return res.json({error: "2i Error:" + err});
    //key = keys[0];
    console.log(err);
    console.log(keys);
    if(keys.length > 0) return res.json({ exists: true });
    else return res.json({exists: false});
  });
}

//change avatar image, outside of registration process.
//we will change the session var, the user object, and user quick reference
exports.changeAvatar = function(req, res){
  if(!req.files.image){
    return res.json({error: 'No image recieved by server'});
  }
  var url;
  app.rackit.add(req.files.image.path, {type: req.files.image.type}, function(err, cloudpath){
    if(err) return res.json({error: err});
    url = app.rackit.getURI(cloudpath);
    req.session.avatarUrl = url;
    next();
  });
  //update the user
  function next(){
    app.riak.bucket('users').objects.get(req.session.loggedIn, util.user_resolve, function(err, obj){
      if(err) return res.json({error: err});
      util.clearChanges(obj);
      obj.data.profileImg = url;
      obj.save(function(err, saved){
        if(err) return res.json({error: err});
        next2();
      });
    });
  }
  //update the user quickreference
  function next2(){
    app.riak.bucket('userReference').objects.get(req.session.loggedIn, function(err, obj){
      if(err) return res.json({error: err});
      obj.data.imgUrl = url;
      obj.save(function(err, saved){
        if(err) return res.json({error: err});
        return res.json({success: "Avatar changed successfully!"});
      });
    });
  }
}

//upload avatar image, used for registration only
exports.uploadAvatar = function(req, res){
  if(!req.files.image){
    return res.json({error: 'No image recieved by server'});
  }
  console.log(req.body);
  console.log(req.files.image);
  //Push content onto rackspace CDN, retreieve URL, set session.newUser.avatarImg
  app.rackit.add(req.files.image.path, {type: req.files.image.type}, function(err, cloudpath){
    if(err) return res.json({error: err});
    var url = app.rackit.getURI(cloudpath);
    //req.session.avatarImgUrl = app.rackit.getURI(cloudpath);
    req.session.newUser.avatarImg = url;
    return res.json({ success: true });
  });
}
