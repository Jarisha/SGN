var passport = exports.passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var app = require('./app');

exports.init = function(Fb_ID, Fb_secret, rootPath){
  //configure passport
  passport.serializeUser(function(user, done) {
    console.log(user);
    console.log('serializeUser');
    done(null, user.data.email);
  });
  
  //sent on every requests
  passport.deserializeUser(function(email, done) {
    console.log('serializeUser');
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
      if(!profile.emails[0])
        return done('Error: No email address connected to this facebook account.')
      
      //Look for user with email
      app.riak.bucket('users').objects.get(profile.emails[0].value, function(err, user){
        //if not found, continue to register
        if(err) return next();
        //if found, log me in
        user.registerMe = false;
        //if not set, set facebook flag for this user
        if(!user.data.fbConnect){
          user.data.fbConnect = true;
          //save the change
          user.save(function(err, obj){
            return done(null, obj);
          });
        }
        else{
          return done(null, user);
        }
      });
      /*app.db.get('users', profile.emails[0].value, function(err, user){
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
      });*/
      //If not found, we are registering.  Use facebook profile data to start a new account.
      function next(){
        newUser = {
          registerMe: true,
          data: {
            email: profile.emails[0].value,
            name: profile.displayName,
            fbConnect: true
          }
        };
        return done(null, newUser);
      }
    }
  ));
}