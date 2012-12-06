/********************************* User *******************************/
var dbConfig = require('../../db_config');
var bcrypt = require('bcrypt-nodejs');
var config = require('../../config');

// Check if we are logged, and return user vars if so
// This is called on every angular generated page to determine if we are logged in
exports.checkLogin = function(req, res){
  //If a user strays from register step 2 page without completing the process,
  //delete the saved data from register step 1.
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

//If we are registering with facebook, send profile params to front end
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
  dbConfig.User.findOne({ email: req.body.email}, function(err, result){
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
        error: 'User with specified email not found.'
      });
    }
    if(bcrypt.compareSync(req.body.password, result.passHash)){
      //set session
      req.session.loggedIn = result._id.toString();
      req.session.userEmail = result.email;
      req.session.userName = result.name;
      console.log(req.session.userEmail + " Logged In");
      //return all relevant user data
      return res.json({
        login: true,
        userId: req.session.loggedIn,
        userEmail: req.session.userEmail,
        userName: req.session.userName
      });
    }
    else{
      return res.json({
        login: false,
        error: 'Wrong password. Try again.'
      });
    }
  });
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
	else{
    var hash = bcrypt.hashSync(req.body.password);
		/*var user = new dbConfig.User({email: req.body.email, name: req.body.name, passHash: hash});
		if(!user){
			console.log('create user failed');
			return res.json({
        register: false,
				error: 'create user failed'
			});
		}
    //save data into newUser object so step 2 can use it to complete the registration */
    req.session.newUser = {};
    req.session.newUser.email = req.body.email;
    req.session.newUser.name = req.body.name;
    req.session.newUser.passHash = hash;
    return res.json({
      register: true
    });
		/*user.save(function(err){
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
		});*/
	}
};

// Get current user settings to prefill My Settings Page
exports.getSettings = function(req, res){
  dbConfig.User.findOne({ name: req.session.userName }, function(err, result){
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
  dbConfig.User.findOne({ name: req.session.userName }, function(err, result){
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

//get port # from server.  This belongs in a misc.js rather than user.js
exports.getPort = function(req, res){
  return res.json({
    port: config.port
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

//getProfileData
exports.getProfileData = function(req, res){
  return res.json({
    success: true
  })
}