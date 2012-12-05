var express = require('express');
var routes = require('./routes');
var config = require('./config');
//var api = require('./routes/api');
var dbConfig = require('./db_config');
var userApi = require('./routes/api/user');
var gamepinApi = require('./routes/api/gamepin');
var storepinApi = require('./routes/api/storepin');
var passConfig = require('./pass_config');
var MongoStore = require('connect-mongo')(express);

//create app
var app = express();

//initialize mongo and passport
dbConfig.init();
passConfig.init();
  
//configure settings & middleware
app.configure(function(){
  app.locals.port = config.port;
  app.locals.rootPath = 'http://localhost:'+ config.port;
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
  }
);
app.get('/allUsers', function(req, res){
  var html = '<ul>';
  dbConfig.User.find({}, function(err, result){
    if(err){
      return res.send('err: ' + err);
    }
		if(!result){
      return res.send('no users in db');
    }
    for(user in result){
      html += '<li><a href="/user/'+result[user].name+'">'+ result[user].name +'</a></li>';
    }
    html += '</ul>';
    return res.send('List of Users: '+html);
  });
});
app.get('/user/*', function(req, res){
  return res.render('base');
});

app.get('/settings', function(req, res){
  return res.render('base');
});

//All view partials must be served
app.get('/partials/:name', routes.partials);

/********* JSON API ***********/
//User
app.post('/api/login', userApi.login);
app.get('/api/logout', userApi.logout);
app.post('/api/register', userApi.register);
app.get('/api/checkLogin', userApi.checkLogin);
app.get('/api/getSettings', userApi.getSettings);
app.post('/api/editSettings', userApi.editSettings);
app.get('/api/deactivate', userApi.deactivate);
app.post('/api/addFollowers', userApi.addFollowers);
app.post('/api/removeFollowers', userApi.removeFollowers);
app.get('/api/getPort', userApi.getPort);
//Gamepin
app.post('/api/gamepin/post', gamepinApi.post);
app.post('/api/gamepin/edit', gamepinApi.edit);
app.post('/api/gamepin/remove', gamepinApi.remove);
app.post('/api/gamepin/comment', gamepinApi.comment);
app.post('/api/gamepin/editComment', gamepinApi.editComment);
app.post('/api/gamepin/like', gamepinApi.like);
app.post('/api/gamepin/share', gamepinApi.share);
app.post('/api/gamepin/search', gamepinApi.search);
//Storepin
app.post('/api/gamepin/post', storepinApi.post);
app.post('/api/gamepin/favorite', storepinApi.favorite);
app.post('/api/gamepin/share', storepinApi.share);
app.post('/api/gamepin/download', storepinApi.download);
app.post('/api/gamepin/search', storepinApi.search);

//Route to 404 Page if not served
app.get('*', function(req, res){
  return res.send('Page Not Found');
});

// Start server
app.listen(3001, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});