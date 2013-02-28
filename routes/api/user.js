/********************************* User *******************************/
var bcrypt = require('bcrypt-nodejs');
var config = require('../../config');
var util = require('../../utility');
var app = require('../../app');

//Checks if user is logged in. Called on every angularjs infused page.
exports.checkLogin = function(req, res){
  //Clear newUser which stores register data
  if(req.session){
    if(req.session.newUser) req.session.newUser = null;
  }
	if(req.session.loggedIn){
		return res.json({
			loggedIn: true,
      userId: req.session.loggedIn,
      userName: req.session.userName
		});
	}
	else{
		return res.json({
			loggedIn: false,
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
      req.session.loggedIn = obj.data.email;
      req.session.userEmail = obj.data.email;
      req.session.userName = obj.data.username;
      return res.json({
        login: true,
        userId: req.session.loggedIn,
        userEmail: req.session.userEmail,
        userName: req.session.userName
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
  app.riak.bucket('users').object.exists('req.body.email', function(err, exists){
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
      passHash: hash
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
                profileImg: '',
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
          return res.json({register: true});
        });
      }
      else if(obj){
        usr_activity.metadata.vclock = obj.metadata.vclock;
        usr_activity.save(function(err, saved){
          console.log('Groups object ' + activity_key + ' found and overwritten');
          console.log('createUser complete!');
          return res.json({register: true});
        });
      }
    });
  }
}

// Get current user settings to prefill My Settings Page
exports.getSettings = function(req, res){
  app.riak.bucket('users').objects.get(req.session.userEmail, function(err, obj){
    if(err) return res.json({ error: 'User not found: ' + err });
    console.log(obj.data);
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
  console.log(req.body);
  //get current user object
  var user = app.riak.bucket('users').objects.new(req.body.settings.email);
  //need to refresh navbar if user changes name
  user.fetch(function(err, obj){
    console.log(obj);
    //update settings & possibly session
    if(req.body.settings.email) obj.data.email = req.body.settings.email;
    if(req.body.settings.username){
      obj.data.username = req.body.settings.username;
      req.session.userName = req.body.settings.username;
    }
    obj.data.bio = req.body.settings.bio;
    if(req.body.settings.gender) obj.data.gender = req.body.settings.gender;
    //save settings
    obj.save(function(err, obj){
      console.log('Settings saved');
      return res.json({ success: true, username: obj.data.username });
    });
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
    key = key || req.body.userEmail;
    var usr = app.riak.bucket('users').objects.new(key);
    usr.fetch(util.user_resolve, function(err, obj){
      if(err){
        return res.json({error: "getProfile error: " + err});
      }
      util.clearChanges(obj);
      return res.json(obj.data);
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
    if(err){
      console.log(err);
      return res.json({error: err});
    }
    objs = response.response.docs;
    for(obj in objs){
      var cmts = [];
      //convert commments from string to proper array
      if(objs[obj].fields.comments)
        cmts = objs[obj].fields.comments.split(" ");
      pinMap[objs[obj].id] = {  id: objs[obj].id,
                                category: objs[obj].fields.category,
                                description: objs[obj].fields.description,
                                poster: objs[obj].fields.posterName,
                                comments: []
                              };
      //keep track of the comment's position so we dont have to sort later
      for(c in cmts){
        commentIds.push(cmts[c]);
        commentMap[cmts[c]] = c;
      }
      //if(obj === '10') break;
    }
    next();
    //console.log(response.response.docs);
  });
  //fetch comments and attach them to their respective gamepin obj
  function next(){
    console.log('next');
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
          //need to get the user obj in order to get his username
          app.riak.bucket('users').objects.get(cmt_objs[c].data.posterId, util.user_resolve, function(err, obj){
            if(err){
              return res.json('err getting comment posters');
            }
            pinMap[cmt_objs[c].data.pin].comments[commentMap[cmt_objs[c].key]] = {};
            pinMap[cmt_objs[c].data.pin].comments[commentMap[cmt_objs[c].key]].posterName = obj.data.username;
            pinMap[cmt_objs[c].data.pin].comments[commentMap[cmt_objs[c].key]].id = cmt_objs[c].key
            pinMap[cmt_objs[c].data.pin].comments[commentMap[cmt_objs[c].key]].pin = cmt_objs[c].data.pin;
            pinMap[cmt_objs[c].data.pin].comments[commentMap[cmt_objs[c].key]].posterId = cmt_objs[c].data.posterId;
            pinMap[cmt_objs[c].data.pin].comments[commentMap[cmt_objs[c].key]].content = cmt_objs[c].data.content;
            if(clock === cmt_objs.length-1) next2();
            clock++;
          });
        })(c);
      }
      function next2(){
        console.log('next2');
        //console.log(pinMap);
        //for..in loop will iterate in the order that the elements were declared on the obj
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

/*exports.getPinList = function(req, res){
  console.log(req.body);
  var interval = 20;
  var page = req.body.page || 0;
  console.log("page: " + page);
  s = 0;
  
  var query = {
    q: 'returnAll:y',
    start: 0,
    rows: 1000,
    presort: 'key'
  };
  
  //can search via category dropdown OR search input
  if(req.body.searchTerm){
    console.log('search');
    query.q = 'description:'+req.body.searchTerm;
  }
  else if(req.body.category){
    console.log('search');
    query.q = 'category:'+req.body.category;
  }
  //should have resolve function for any read including search
  app.riak.bucket('gamepins').search.solr(query, function(err, response){
    if(err){
      console.log(err);
      return res.json({error: err});
    }
    console.log(response.response.docs.length);
    //console.log(response);
    return res.json({ objects: response.response.docs, interval: interval });
  });
}*/