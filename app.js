var express = require('express');
var routes = require('./routes');
var config = require('./config');
var api = require('./routes/api');
var dbConfig = require('./db_config');
var passConfig = require('./pass_config');
var MongoStore = require('connect-mongo')(express);

//create app
var app = express();

//initialize mongo and passport
dbConfig.init();
passConfig.init();
  
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
  app.use(passConfig.passport.initialize());
  app.use(passConfig.passport.session());
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

//Routes will be handled client side, all routes are built from base
app.get('/', function(req, res){
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
app.get('/fbfail', function(req, res){
  res.send('facebook login failure');
});
app.get('/registerMe', function(req, res){
  res.send('choose stuff that you like');
});
app.get('/auth/facebook',
  passConfig.passport.authenticate('facebook', { scope: ['email'] })
);

app.get('/auth/facebook/callback',
  passConfig.passport.authenticate('facebook', { failureRedirect: '/fbfail' }),
  function(req, res) {
    //if we need to register this facebook user, continue on to registration
    if(req.user.registerMe){
      res.redirect('/registerMe');
    }
    //if we were only logging in this facbeook user, go home
    else{
      req.session.loggedIn = req.user._id;
      req.session.userEmail = req.user.email;
      req.session.userName = req.user.name;
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