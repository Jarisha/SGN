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
      fbEmail: temp.email,
      fbName: temp.name,
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
	app.db.exists('users', req.body.email, function(err, exists){
		if(!exists) return res.json({login: false, error: 'Email not found in db'});
		next();
	});
	//get user, check password, log in
	function next(){
		app.db.get('users', req.body.email, function(err, user){
			if(err) return res.json({ login: false, error: 'Unable to fetch user'});
			if(!(bcrypt.compareSync(req.body.password, user.passHash))){
				return res.json({ login: false, error: 'Wrong password.' })
			}
			//set session to log in
      req.session.loggedIn = user.email;
      req.session.userEmail = user.email;
      req.session.userName = user.name;
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
	app.db.exists('users', req.body.email, function(err, exists){
		if(exists){
			return res.json({
				register: false,
				error: 'This email is already registered.  Please log in'
			});
		}
		next();
	});
	function next(){
		var hash = bcrypt.hashSync(req.body.password);
		//save data into session so step 2 can use it to complete the registration
		req.session.newUser = {};
		req.session.newUser.email = req.body.email;
		req.session.newUser.name = req.body.name;
		req.session.newUser.fbConnect = req.body.fbConnect;
		req.session.newUser.passHash = hash;
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
  //set fav_categories
  for(category in req.body.categories){
    favCategories.push(req.body.categories[category]);
  }
	//save new user into database and log in
	app.db.save('users', newEmail,
		{email: newEmail, name: newName, passHash: newHash, fbConnect: newFbConnect, favCat: favCategories},
		{returnbody: true},
		function(err, data){
			if(err) return res.json({ register: false, error: 'user save failed' });
			next();
		}
	)
	//set session to logged in
	function next(){
		req.session.loggedIn = newEmail;
    req.session.userName = newName;
    req.session.userEmail = newEmail;
		console.log(req.session.userName + ' Registered and logged In');
		return res.json({ register: true });
	}
}

// Get current user settings to prefill My Settings Page
exports.getSettings = function(req, res){
  app.db.get('users', req.session.userEmail, function(err, user){
    if(err) return res.json({ error: 'User not found' });
    return res.json({ email: user.email,
                      username: user.username,
                      gender: user.gender,
                      bio: user.bio
                    });
  });
}

// editSettings 
exports.editSettings = function(req, res){
  app.db.get('users', req.session.userEmail, function(err, user){
    //validate all form data
    if(!(req.body.settings.email && req.body.settings.username)){
      return res.json({
				error: 'Email or Username is blank'
			});
    }
    //update user object
    user.email = req.body.settings.email;
    user.name = req.body.settings.username;
    user.bio = req.body.settings.bio;
    if(req.body.settings.gender) user.gender = req.body.settings.gender;
    app.db.save('users', user.email, user, function(err){
      if(err) return res.json({ error: 'Edit Settings: save user to db failed' });
      return res.json({ success: true });
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