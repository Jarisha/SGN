/********************************* User *******************************/
var bcrypt = require('bcrypt-nodejs');
var config = require('../../config');
var util = require('../../utility');
var app = require('../../app');

//Checks if user is logged in. Called on every angularjs infused page.
exports.checkLogin = function(req, res){
  //Clear newUser which stores register data
  if(req.session.newUser) req.session.newUser = null;
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
      req.session.userName = obj.data.name;
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
                name: newName,
                fbConnect: newFbConnect,
                favCat: favCategories,
                profileImg: '',
                gender: null,
                bio:null,
                dateJoined: dayJoined,
                currXP:0,
                nextXP:100,
                level:1,
                posts:[],
                likes:[],
                followers:[],
                following:[],
                friends:[],
                recentActivity:[],
                changes:{
                  posts: {add:[], remove:[]},
                  likes: {add:[], remove:[]},
                  followers: {add:[], remove:[]},
                  following: {add:[], remove:[]},
                  friends: {add:[], remove:[]}
                }
    };
  //make new user
  var user = app.riak.bucket('users').objects.new(newUser.email, newUser);
  //save user
  user.save(function(err, obj){
    if(err)
      return res.json({ register: false, error: 'Error: ' + err });
    next(obj);
  });
	//log in
	function next(obj){
		req.session.loggedIn = obj.data.email;
    req.session.userName = obj.data.name;
    req.session.userEmail = obj.data.email;
		console.log(req.session.userName + ' Registered and logged In');
		return res.json({ register: true });
	}
}

// Get current user settings to prefill My Settings Page
exports.getSettings = function(req, res){
  app.riak.bucket('users').objects.get(req.session.userEmail, function(err, obj){
    if(err) return res.json({ error: 'User not found: ' + err });
    return res.json({
      email: obj.data.email,
      name: obj.data.name,
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
  //get current user object
  var user = app.riak.bucket('users').objects.new(req.session.userEmail);
  //need to refresh navbar if user changes name
  user.fetch(function(err, obj){
    //update settings & possibly session
    if(req.body.settings.email) obj.data.email = req.body.settings.email;
    if(req.body.settings.username){
      obj.data.name = req.body.settings.username;
      req.session.userName = req.body.settings.username;
    }
    obj.data.bio = req.body.settings.bio;
    if(req.body.settings.gender) obj.data.gender = req.body.settings.gender;
    //save settings
    obj.save(function(err, obj){
      console.log('Settings saved');
      return res.json({ success: true, name: obj.data.name })
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

//getProfileData: return all relevant profile view data to front end
exports.getProfile = function(req, res){
  var usr = app.riak.bucket('users').objects.new(req.body.userEmail);
  usr.fetch(util.user_resolve, function(err, obj){
    if(err){
      return res.json({error: err});
    }
    util.clearChanges(obj);
    return res.json(obj.data);
  });
}

exports.getPinList = function(req, res){
  s = 0;
  var query = {
    q: 'returnAll:y',
    start: s,
    rows: 100
    //presort: 'key'
  };
  if(req.body.searchTerm){
    query = {
      q: 'description:'+req.body.searchTerm,
      start: s,
      rows: 10000,
      presort: 'key'
    }
    console.log('search');
  }
  if(req.body.category){
    query = {
      q: 'category:'+req.body.category,
      start: s,
      rows: 10000,
      presort: 'key'
    }
  }
  //should have resolve function for any read including search
  app.riak.bucket('gamepins').search.solr(query, function(err, response){
    if(err){
      console.log(err);
      return res.json({error: err});
    }
    //console.log(response);
    return res.json({ objects: response.response.docs });
  });
}

