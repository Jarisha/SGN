var dbConfig = require('./db_config');
var passport = exports.passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var app = require('./app');

exports.init = function(){
  //configure passport
  passport.serializeUser(function(user, done) {
    done(null, user.email);
  });
  
  //sent on every requests
  passport.deserializeUser(function(email, done) {
    return(null, email);
  });
  
  passport.use(new FacebookStrategy({
      clientID: "177752685682496",
      clientSecret: "bcd13f474bae8217643ece20c68cd3a4",
      callbackURL: "http://localhost:3001/auth/facebook/callback"
    },
    function(accessToken, refreshToken, profile, done) {
      console.log(profile);
      console.log(profile.emails[0].value);
      console.log(profile.displayName);
      //var dummyUser = {email: 'test@gmail.com', name: 'test'};
      //return done(null, dummyUser);
      
      //Look for user with email
      app.db.get('users', profile.emails[0].value, function(err, user){
        console.log('!!!!!!!');
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