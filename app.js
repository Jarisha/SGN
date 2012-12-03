var express = require('express');
var routes = require('./routes');
var config = require('./config');
var api = require('./routes/api');
//var dbconfig = require('./db_config');
var mongoose = require('mongoose');
var MongoStore = require('connect-mongo')(express);
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;

//create app
var app = express();

//start mongodb
//dbconfig.init();
var db = mongoose.createConnection(config.db_host, config.db);
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log('mongodb connected on ' + config.db);
});

//define schema
var userSchema = mongoose.Schema({
  email: { type: String, unique: true },
  name: { type: String, unique: true},
  password: String,
  gender: String,
  bio: String
});
//index using name
userSchema.index({name: 1});
//userSchema.set('autoIndex', false);
User = db.model('sgnuser', userSchema);

//configure passport
passport.serializeUser(function(user, done) {
  console.log(user);
  done(null, user.email);
});

passport.deserializeUser(function(email, done) {
  console.log(email);
  User.findOne({email:email}, function(err, user) {
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
    console.log(profile.emails);
    console.log(profile.emails[0]);
    console.log(profile.emails[0].value);
    console.log(profile.displayName);
    
    //Look for user with email
    User.findOne({ email: profile.emails[0].value }, function(err, result){
      if(err){
        console.log('login error: ' + err);
        return res.json({
          login: false,
          error: 'login error: ' + err
        });
      }
      //If not found, create new SGN user with facebook profile data
      if(!result){
        console.log('facebook user NOT found in DB');
        var user = new User({email: profile.emails[0].value, name: profile.displayName });
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
      else{
        console.log('facebook user found in DB');
        result.registerMe = false;
        return done(null, result);
      }
    });
    //var err = 'STUPORIZOR';
    //return done(err);
  }
));
  
//configure settings & middleware
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');  //hope to use HTML + Angular only
  app.use(express.methodOverride());
  app.use(express.bodyParser());
  app.use(express.static(__dirname + '/public'));
  app.use(express.favicon(__dirname + '/public'));
  app.use(express.cookieParser());
  app.use(express.session({
    secret: 'sgnsecret',
    cookie: { maxAge:  24 * 60 *  10 * 1000 }, //Sessions expire after a day
    store: new MongoStore({
      db: config.db,
      clear_interval: 3600  //Interval in seconds to clear expired sessions
    })
  }));
  app.use(passport.initialize());
  app.use(passport.session());
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

//Routes will be handled client side, all routes are built from base
app.get('/', function(req, res){
  //If we logged in with facebook, set the session so we are logged in
  if(req.user){
    req.session.loggedIn = req.user._id;
    req.session.userEmail = req.user.email;
    req.session.userName = req.user.name;
  }
  res.render('base');
});
app.get('/store', function(req, res){
  res.render('base');
});
app.get('/profile', function(req, res){
  res.render('base');
});
app.get('/settings', function(req, res){
  res.render('base');
});
app.get('/about', function(req, res){
  res.render('base');
});

//Routes for facebook authentication
app.get('/fbsuccess', function(req, res){
  //set session AKA: log facebook user in
  res.send('facebook login success! ' + req.user);
});
app.get('/fbfail', function(req, res){
  res.send('facebook login failure: This is impossible because you already succesfully logged into facebook.' + req.user);
});
app.get('/registerMe', function(req, res){
  res.send('choose stuff that you like');
});
app.get('/auth/facebook',
  passport.authenticate('facebook', { scope: ['email'] })
);
/*app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { successRedirect: '/',
                                      failureRedirect: '/fbfail' }));*/

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/fbfail' }),
  function(req, res) {
    //if we need to register this facebook user, continue on to registration
    if(req.user.registerMe){
      res.redirect('/registerMe');
    }
    //if we were only logging in this facbeook user, go home
    else{
      res.redirect('/');
    }
  });

//All view partials must be served
app.get('/partials/:name', routes.partials);

// JSON API
app.get('/api/name', api.name);
app.post('/api/login', api.login);
app.get('/api/logout', api.logout);
app.post('/api/register', api.register);
app.get('/api/checkLogin', api.checkLogin);
app.get('/api/getSettings', api.getSettings);
app.post('/api/editSettings', api.editSettings);

//Route to 404 Page if not served
app.get('*', routes.notfound);

// Start server
app.listen(3001, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});