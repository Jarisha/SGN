var express = require('express');
var routes = require('./routes');
var config = require('./config');
var userApi = require('./routes/api/user');
var gamepinApi = require('./routes/api/gamepin');
var storepinApi = require('./routes/api/storepin');
var passConfig = require('./pass_config');
var bcrypt = require('bcrypt-nodejs');
var RedisStore = require('connect-redis')(express);
var db = exports.db = require('riak-js').getClient({host: config.db_host, port: config.db_port});

//create app
var app = exports.server = express();
  
//configure settings & middleware
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');  //hope to use HTML + Angular only
  app.use(express.methodOverride());
  app.use(express.bodyParser());
  app.use(express.static(__dirname + '/public'));
  app.use(express.favicon(__dirname + '/public'));
  app.use(express.cookieParser());
  app.use(express.session({ secret: "tazazaz",
                          store : new RedisStore({ 
                            host : config.redis_host,
                          }),
                          cookie: { maxAge: 6048800 /* one week */ }
                          }));
  app.use(passConfig.passport.initialize());
  //app.use(passConfig.passport.session());
});

app.configure('development', function(){
  app.locals.port = config.dev_port;
  app.locals.rootPath = "http://" + config.dev_host + ':' + config.dev_port;
  //initialize passport
  passConfig.init(config.dev_Fb_ID, config.dev_Fb_Secret, app.locals.rootPath);
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  
  // Start server
  app.listen(config.dev_port, function(){
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
  });
});

app.configure('tony', function(){
  app.locals.port = config.tony_port;
  app.locals.rootPath =  "http://" + config.tony_host + ':' + config.tony_port;
  //initialize passport
  passConfig.init(config.tony_Fb_ID, config.tony_Fb_Secret, app.locals.rootPath);
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  
  // Start server
  app.listen(config.tony_port, function(){
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
  });
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

//Routes will be handled client side, all routes are built from base
app.get('/', function(req, res){
  console.log(req.session);
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
//Page for Register Step 2: Choose categories you like.
app.get('/register', function(req, res){
  if(!req.session.newUser){ console.log('go home'); return res.redirect('/');}
  res.render('register');
});
app.get('/logout', function(req, res){
  console.log('destroying session');
  req.logout();
  req.session.destroy();  //actually log us out
  res.redirect('/');
});
app.get('/auth/facebook',
  passConfig.passport.authenticate('facebook', { scope: ['email'] })
);
app.get('/auth/facebook/callback',
  passConfig.passport.authenticate('facebook', { failureRedirect: '/fbfail' }),
  function(req, res) {
    //if we need to register this facebook user, store user params into req.session.fbUser
    if(req.user.registerMe){
      req.session.fbUser = req.user;
      res.redirect('/');
    }
    //if logging in, set fb flag and log in
    else{
      req.session.loggedIn = req.user.email;
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
//used for testing purposes only
app.get('/test', function(req, res){
  bcrypt.genSalt(11, function(err, salt){
    res.send(salt);
  });
});
app.post('/', function(req, res){
  //req. form is nulL
  console.log(req.body);
  console.log(req.form);
  console.log(req.files);
});

//All view partials must be served
app.get('/partials/:name', routes.partials);

/********* JSON API ***********/
//User
app.get('/api/facebookRegister', userApi.facebookRegister);
app.post('/api/login', userApi.login);
app.get('/api/logout', userApi.logout);
app.post('/api/register', userApi.register);
app.post('/api/register_2', userApi.register_2);
app.get('/api/checkLogin', userApi.checkLogin);
app.get('/api/getSettings', userApi.getSettings);
app.post('/api/editSettings', userApi.editSettings);
app.get('/api/deactivate', userApi.deactivate);
app.post('/api/addFollowers', userApi.addFollowers);
app.post('/api/removeFollowers', userApi.removeFollowers);
app.get('/api/getPath', userApi.getPath);
app.post('/api/getProfile', userApi.getProfile);
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