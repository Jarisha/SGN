var passport = exports.passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var app = require('./app');

exports.init = function(Fb_ID, Fb_secret, rootPath){
  //configure passport
  passport.serializeUser(function(user, done) {
    done(null, user.email);
  });
  
  //sent on every requests
  passport.deserializeUser(function(email, done) {
    return(null, email);
  });
  
  passport.use(new FacebookStrategy({
      clientID: Fb_ID,
      clientSecret: Fb_secret,
      callbackURL: rootPath + "/auth/facebook/callback"
    },
    function(accessToken, refreshToken, profile, done) {
      //var dummyUser = {email: 'test@gmail.com', name: 'test'};
      //return done(null, dummyUser);
      
      //Look for user with email
      app.db.get('users', profile.emails[0].value, function(err, user){
        //If not found, we are registering.
        if(err) return register();
        //Else, log in
        user.registerMe = false;
        //set facebook flag if not set for this user
        if(!user.fbConnect){
          user.fbConnect = true;
          app.db.save('users', profile.emails[0].value, user);
          return done(null, user);
        }
        return done(null, user);
      });
      //If not found, we are registering.  Go to register step 2.
      function register(){
        newUser = {};
        newUser.email = profile.emails[0].value;
        newUser.name = profile.displayName;
        newUser.fbConnect = true;
        newUser.registerMe = true;
        
        return done(null, newUser);
      }
    }
  ));
}