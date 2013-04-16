/********************************* User *******************************/
var bcrypt = require('bcrypt-nodejs');
var config = require('../../config');
var util = require('../../utility');
var app = require('../../app');

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
  console.log(req.body);
  console.log('GATEWAY LOGIN')
  var IE = false;
  if(req.get('X-Requested-With') != 'XMLHttpRequest'){
    console.log('IE MODE');
    IE = true;
  }
  
  //validation.  TODO: more rigorous validations
  if(!req.body.email) return res.json({login: false, error: 'Invalid email entered'});
  if(!req.body.password) return res.json({login: false, error: 'Invalid password entered'});
	//check if email exists in db
  app.riak.bucket('users').object.exists(req.body.email, function(err, exists) {
    if(err) return res.json({login: false, error: 'Error: ' +  err});
    if(!exists){
      console.log('Does not exist!');
      /*if(IE){ return res.send('Error, Email not registered');}
      else return res.json({login: false, error: 'Email not registered'});*/
      return res.send(JSON.stringify({login: false, error: 'Email not registered'}));
      //return res.send('bad email');
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
				//return res.json({ login: false, error: 'Wrong password.' })
        return res.send(JSON.stringify({ login: false, error: 'Wrong password.' }));
        //return res.send('wrong password');
			}
      //log in
      console.log(obj.data);
      req.session.loggedIn = obj.data.email;
      req.session.userEmail = obj.data.email;
      req.session.userName = obj.data.username;
      req.session.avatarUrl = obj.data.profileImg;
      console.log('WE MADE IT THIS FAR');
      console.log(req.url);
      /*if(IE){
        console.log('IE login success');
        res.contentType('text/plain');
        return res.send(200);
      }*/
      return res.send(JSON.stringify({
        login: true,
        userId: req.session.loggedIn,
        userEmail: req.session.userEmail,
        userName: req.session.userName,
        avatarUrl:  req.session.avatarUrl
      }));
      //return res.send('success');
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
      return res.json({login: false, error: 'Email not registered'});
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
  var changePass = false;
  if((req.body.settings.changePass && req.body.settings.changeConfirm) &&
     (req.body.settings.changePass === req.body.settings.changeConfirm) ){
    changePass = true;
  }
  else if(req.body.settings.changePass !== req.body.settings.changeConfirm){
    return res.json({error: 'Confirm does not match Passowrd'});
  }
  
  console.log('EDITSETTINGS');
  console.log(req.body);
  //get current user object
  var user = app.riak.bucket('users').objects.new(req.body.settings.email);
  var oldName;
  //need to refresh navbar if user changes name
  user.fetch(function(err, obj){
    //update password if change password conditions are correct
    if(changePass){
      obj.data.passHash = bcrypt.hashSync(req.body.settings.changePass);
    }
    //update settings & session data
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
        if(changePass){
          return res.json({ success: true, username: obj.data.username, notify: "Settings Saved and Password updated!" });
        }
        return res.json({ success: true, username: obj.data.username, notify: "Settings Saved!" });
      });
    }
  });
}

//get port # from server.  This belongs in a misc.js rather than user.js
exports.getPath = function(req, res){
  return res.json({
    path: app.self.locals.rootPath
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
      obj.data.followerUnit = [];
      obj.data.followingUnit = [];
      var clock = 0;
      console.log('beforeFollowers');
      if(obj.data.followers.length === 0) next2();
      console.log('afterFollowers');
      //add followers, need to get their usernames via userReference
      for(f in obj.data.followers){
        (function(f){
          app.riak.bucket('userReference').objects.get(obj.data.followers[f], function(err, ref_obj){
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
        console.log('next2');
        var clock = 0;
        if(obj.data.following.length === 0) next3();
        //add following
        console.log(obj.data.following);
        for(f in obj.data.following){
          console.log('!');
          console.log(f);
          console.log('!');
          console.log(obj.data.following[f]);
          (function(f){
            app.riak.bucket('userReference').objects.get(obj.data.following[f], function(err, ref_obj){
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
        console.log('next3');
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
    rows: 200,
    presort: 'key'
  };
  //get list of pins in sorted order
  app.riak.bucket('gamepins').search.solr(query, function(err, response){
    console.log("Error:");
    console.log(err);
    console.log("Response:");
    if(err){
      console.log("search.solr" + err);
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
          if(err){
            console.log('error:' + err);
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
      return res.json({ objects: returnList });
    });
  }
}

//given username, see if user exists and return email if so
exports.getUser = function(req, res){
  console.log(req.body);
  app.riak.bucket('users').search.twoi(req.body.name, 'username', function(err, keys){
    if(err) return res.json({error: "2i Error:" + err});
    //key = keys[0];
    console.log(err);
    console.log(keys);
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
        res.contentType('text/plain'); 
        return res.send(JSON.stringify({error: "File upload error"}));
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
      if(err) return res.json({error: err});
      util.clearChanges(obj);
      obj.data.profileImg = url;
      obj.save(function(err, saved){
        if(err){
          if(IE){
            res.contentType('text/plain'); 
            return res.send(JSON.stringify({error: "Fetch user error"}));
          }
          return res.json({error: err});
        }
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
        if(err){
          if(IE){
            res.contentType('text/plain'); 
            return res.send(JSON.stringify({error: "Save error"}));
          }
          return res.json({error: err});
        }
        if(IE){
          //res.contentType('text/plain');
          //return res.send(JSON.stringify(data));
          
          res.contentType('text/plain');
          return res.end();
        }
        return res.json({success: "Avatar changed successfully1111"});
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
    req.session.newUser.avatarImg = url;
    return res.json({ success: true });
  });
}

//creates pending account
exports.createPending = function(req, res){
  console.log('createPending');
  console.log(req.body);
  
  //validation
  if(!req.body.email || !req.body.userName)
    //return res.json({ error: "Missing fields" });
    return res.send('');
  
  var pending_data = {
    email: req.body.email,
    userName: req.body.userName,
    company: req.body.company || false
  }
  
  console.log(pending_data);
  
  //create pending user
  pend_usr = app.riak.bucket('pendingUsers').objects.new(pending_data.email, pending_data);
  pend_usr.addToIndex('username', pending_data.userName);
  pend_usr.save(function(err, saved){
    if(err) return res.json({ error: "Save Pending User Error: " + err });
    console.log('Pending user '+ saved.key +' saved');
    app.mandrill('messages/send', {
        message: {
          to: [{email: req.body.email}],
          from_email: 'info@quyay.com',
          subject: "Quyay Alpha Registration",
          text: "Thank you for signing up for Quyay Alpha!\n\n" +
          "We have created a pending account for you with this email address and the username you submitted.\n\n" +
          "If you're accepted into this early access phase, we'll email you with more info, including how to log in. \n\n" +
          "-Team Quyay"
        }
      }, function(err, response){
        if(err){
          console.log(JSON.stringify(err));
          return res.json({error: err});
        }
        else{
          console.log(response);
          return res.json({ success: "Submit Successful!" });
        }
      });
  });
}
//accept pending account, create real account, email user tmp password
exports.acceptPending = function(req, res){
  console.log('acceptPending');
  console.log(req.body);
  return res.json({ success: true });
}

exports.rejectPending = function(req, res){
  console.log('rejectPending');
  console.log(req.body);
  return res.json({ success: true });
}

//set real password, disabling temp password
exports.setPassword = function(req, res){
  console.log('setPassword');
  console.log(req.body);
  return res.json({ success: true });
}

//ensure that user name has not been taken
exports.checkUniqueName = function(req, res){
  console.log('checkUniqueName');
  //validation
  if(!req.body.userName) return res.send(JSON.stringify({error: "No Username Entered"}));
  
  //check pending accounts to see if username exists
  app.riak.bucket('pendingUsers').search.twoi(req.body.userName, 'username', function(err, keys){
    if(err) return res.json({error: err});
    if(keys){
      if(keys.length !== 0) return res.send(JSON.stringify({error: "Username already exists"}));
      return next();
    }
  });
  function next(){
    //check registered accounts to see if username exists
    app.riak.bucket('users').search.twoi(req.body.userName, 'username', function(err, keys){
      if(err) return res.send(JSON.stringify({error: err}));
      if(keys){
        if(keys.length !== 0) return res.send(JSON.stringify({error: "Username already exists"}));
        return res.send(JSON.stringify({ success: true }));
      }
    });
  }
}

//ensure that user email has not been taken
exports.checkUniqueEmail = function(req, res){
  console.log('checkUniqueEmail');
  if(!req.body.email) return res.send(JSON.stringify({error: "No Email Entered"}));
  console.log(req.body);
  //check pending accounts to see if email exists
  app.riak.bucket('pendingUsers').object.exists(req.body.email, function(err, result){
    if(err) return res.send(JSON.stringify({ error: "Pending Email Exists Error: " + err }));
    if(result) return res.send(JSON.stringify({ error: "Pending Email already exists" }));
    if(!result) next();
  });
  function next(){
    //check registered accounts to see if email exists
    app.riak.bucket('users').object.exists(req.body.email, function(err, result){
      if(err) return res.send(JSON.stringify({ error: "Registered Email Exists Error: " + err }));
      if(result) return res.json(JSON.stringify({ error: "Registerd Email already exists" }));
      if(!result) return res.json(JSON.stringify({ success: true }));
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
    if(err) return res.json({error: "2i Error:" + err});
    user_id = keys[0];
    next();
  });
  //1: Get list of Ids
  function next(){
    app.riak.bucket('users').objects.get(user_id + '-activity', function(err, obj){
      if(err) return res.json({error: "Fetch Activity Error: " + err});
      activityIds = obj.data.evtIds;
      //console.log(activityIds);
      next2();
    });
  }
  //create Map and declare it in order of evIdList,
  //we need to do this in order to establish the correct order
  function next2(){
    for(id in activityIds){
      activityMap[activityIds[id]] = null;
    }
    //fetch gamepins + fill map
    app.riak.bucket('gamepins').objects.get(activityIds, function(errs, objs){
      if(errs) return res.json({error: "One or More activity objects not found"});
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
  console.log(req.params.userName);
  var user_id;
  var gamepinIds = [];
  var groupIdMap = {};
  var groupDataMap = {};
  //0: fetch userId via 2i
  app.riak.bucket('users').search.twoi(req.params.userName, 'username', function(err, keys){
    if(err) return res.json({error: "2i Error:" + err});
    user_id = keys[0];
    next();
  });
  //get groups object, store all Ids into one big array, gamepinIds
  function next(){
    app.riak.bucket('users').objects.get(user_id + '-groups', function(err, obj){
      if(err) return res.json({ error: "Fetch Group error:" +  err });
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
        //return res.json({ error: "One or more group gamepins not found: "});
        console.log(errs);
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