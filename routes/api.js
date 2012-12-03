/*
 * Serve JSON to our AngularJS client
 */
//var dbconfig = require('../db_config');

exports.name = function (req, res) {
  res.json({
  	name: 'Bob'
  });
};

//Check if we are logged, and return session vars if so
exports.checkLogin = function(req, res){
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

/* Login: Set session given correct params */
exports.login = function(req, res){
  // Prompt error if we are already logged in (client should prevent this from happening)
  if(req.session.loggedIn){
    return res.json({
      login: false,
      error: 'Login Failed: User already logged in'
    });
  }
  console.log(req.body.email + ' ' + req.body.password);
	User.findOne({ email: req.body.email, password: req.body.password }, function(err, result){
		if(err){
      console.log('login error: ' + err);
			return res.json({
        login: false,
				error: 'login error: ' + err
			});
    }
		if(!result){
      return res.json({
        login: false,
				error: 'User not found or wrong password'
			});
    }
    //set session
		req.session.loggedIn = result._id.toString();
    req.session.userEmail = result.email;
    req.session.userName = result.name;
    console.log(req.session.email + " Logged In");
    //return all relevant user data
    return res.json({
      login: true,
      userId: req.session.loggedIn,
      userEmail: req.session.userEmail,
      userName: req.session.userName
    });
	});
};

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

/* Register: Add user and set session */
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
	else{
		var user = new User({email: req.body.email, name: req.body.name, password: req.body.password});
		if(!user){ 
			console.log('create user failed');
			return res.json({
        register: false,
				error: 'create user failed'
			});
		}
		user.save(function(err){
			if(err){
				console.log('next( %s )', err);
				return res.json({
          register: false,
					error: 'create user failed'
				});
			}
			req.session.loggedIn = user._id.toString();
      req.session.userName = user.name;
      req.session.userEmail = user.email;
      console.log(req.session.userName + ' Registered and logged In');
			return res.json({
				register: true,
				userId: req.session.loggedIn,
        userName: req.session.userName,
        userEmail: req.session.userEmail
			});
		});
	}
};

/* Get current user settings to prefill My Settings Page */
exports.getSettings = function(req, res){
  User.findOne({ name: req.session.userName }, function(err, result){
    if(err){
      console.log('getSettings error: ' + err);
			return res.json({
				error: 'getSettings error: ' + err
			});
    }
    if(!result){
      return res.json({
				error: 'User with name: ' + req.session.userName + 'not found'
			});
    }
    return res.json({
      email: result.email,
      username: result.username,
      gender: result.gender,
      bio: result.bio
    });
  });
}

// editSettings 
exports.editSettings = function(req, res){
  User.findOne({ name: req.session.userName }, function(err, result){
    if(err){
      console.log('editSettings error: ' + err);
			return res.json({
				error: 'editSettings error: ' + err
			});
    }
    if(!result){
      return res.json({
				error: 'User with name: ' + req.session.userName + 'not found'
			});
    }
    // valid email and username required.
    if(!(req.body.settings.email && req.body.settings.username)){
      return res.json({
				error: 'Email or Username is blank'
			});
    }
    //update object
    result.email = req.body.settings.email;
    result.username = req.body.settings.username;
    result.bio = req.body.settings.bio;
    if(req.body.settings.gender) result.gender = req.body.settings.gender;
    result.save();

    return res.json({
      edit: true
    });
  });
}