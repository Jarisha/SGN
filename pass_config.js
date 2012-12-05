var dbConfig = require('./db_config');
var passport = exports.passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;

exports.init = function(){
  //configure passport
  passport.serializeUser(function(user, done) {
    done(null, user.email);
  });
  
  passport.deserializeUser(function(email, done) {
    dbConfig.User.findOne({email:email}, function(err, user) {
      done(err, user);
    });
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
      
      //Look for user with email
      dbConfig.User.findOne({ email: profile.emails[0].value }, function(err, result){
        if(err){
          console.log('login error: ' + err);
          return res.json({
            login: false,
            error: 'login error: ' + err
          });
        }
        //If not found, register new account and connect to facebook
        if(!result){
          console.log('facebook user NOT found in DB');
          var user = new User({email: profile.emails[0].value, name: profile.displayName, fbConnect: true });
          if(!user){
            console.log('create user failed');
          }
          user.save(function(err){
            if(err){
              console.log('next( %s )', err);
            }
            console.log('facebook user with name: %s, email: %s created', profile.displayName, profile.emails[0].value);
            user.registerMe = true;
            return done(null, user);
          });
        }
        //If found, log in and connect to facebook
        else{
          console.log('facebook user found in DB, loggging in');
          if(!result.fbConnect){
            //set facebook data
            fbConnect = true;
          }
          result.registerMe = false;
          return done(null, result);
        }
      });
    }
  ));
}