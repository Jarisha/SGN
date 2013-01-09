/********************************* User *******************************/
var bcrypt = require('bcrypt-nodejs');
var config = require('../../config');
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
	//check if email exists in db
  app.riak.bucket('users').object.exists(req.body.email, function(err, exists) {
    if(err) return res.json({login: false, error: 'Error: ' +  err});
    if(!exists) return res.json({login: false, error: 'Email not found in db'});
    return next();
  });
	function next(){
    //get user
    var user = app.riak.bucket('users').objects.new(req.body.email);
    user.fetch(function(err, obj){
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
};

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
        error: 'This email is already registerd. Please log in'
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
			favCategories = [];
  var newUser = {email: newEmail, name: newName, passHash: newHash, fbConnect: newFbConnect, favCat: favCategories};
  //set fav_categories
  for(category in req.body.categories){
    favCategories.push(req.body.categories[category]);
  }
  //make new user
  var user = app.riak.bucket('users').objects.new(newUser.email, newUser, {returnbody: true});
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

//addFollowers
exports.addFollowers = function(req, res){
  return res.json({
    success: true
  })
}

//removeFollowers
exports.removeFollowers = function(req, res){
  return res.json({
    success: true
  })
}

//getProfileData: return all relevant profile view data to front end
exports.getProfile = function(req, res){
  return res.json({ success: false, Error: 'TODO: Get leveldb + 2i indexing setup first' });
}