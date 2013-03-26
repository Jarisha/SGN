var express = require('express');
var http = require('http');
var https = require('https');
var url = require('url');
var fs = require('fs');
var routes = require('./routes');
var config = require('./config');
var userApi = require('./routes/api/user');
var gamepinApi = require('./routes/api/gamepin');
var utilApi = require('./routes/api/util');
var passConfig = require('./pass_config');
var riakConfig = require('./riak_config');
var bcrypt = require('bcrypt-nodejs');
var winston = require('winston');
var RedisStore = require('connect-redis')(express);
var rackit = exports.rackit = require('rackit');
var mandrill = exports.mandrill = require('node-mandrill')('rRK6Fs7T1NKpMbJZKxpJfA');

//testing purposes only
var util = require('./utility');

//create app
var app = exports.server = express();
var httpApp = express();
//global variable (copout!)
var blocker = true;

var nodeflake_host;

//create rackspace image, define name of container we will push images to
rackit.init({
  user: 'happyspace',
  key: '1b5a100b899c44633dbda1aa93ea6237',
  prefix: 'gamepin',
  tempURLKey : null, // A secret for generating temporary URLs
  useSNET : false,
  useCDN : true,
  useSSL : false, // Specifies whether to use SSL (https) for CDN links
  verbose : false, // If set to true, log messages will be generated
  logger : console.log // Function to receive log messages
}, function(err){
  if(err) console.log('error:' + err);
});

//configure riak
//riakConfig.init();

//configifure log
winston.add(winston.transports.File, { filename: 'web.log'});
winston.remove(winston.transports.Console);

//initialize riak buckets

//SSL options
var options = {
  key: fs.readFileSync(__dirname + '/quyay.com.key'),
  cert: fs.readFileSync(__dirname + '/quyay.com.crt')
};

//configure settings & middleware
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');  //hope to use HTML + Angular only
  app.use(express.methodOverride());
  app.use(express.bodyParser());
  app.use(express.static(__dirname + '/public'));
  app.use(express.favicon(__dirname + '/public'));
  app.use(express.cookieParser());
  app.use(passConfig.passport.initialize());
  //app.use(passConfig.passport.session());
  //logging middleware
  app.use(function(req, res, next){
    winston.info(req.method);
    winston.info(req.url);
    next();
  });
});

app.configure('development', function(){
  var riak = exports.riak = require('nodiak').getClient('http', config.db_host, config.db_port);
  var nodeflake_host = exports.nodeflake_host = '10.0.1.11';
  app.use(express.session({ secret: "tazazaz",
                          store : new RedisStore({ 
                            host : config.redis_host,
                          }),
                          cookie: { maxAge: 86400000
                                    }
                          }));
  riakConfig.init();
  app.locals.port = config.dev_port;
  
  app.locals.rootPath = "http://" + config.dev_host /*+ ':' + config.dev_port */;
  //initialize passport
  passConfig.init(config.dev_Fb_ID, config.dev_Fb_Secret, app.locals.rootPath);
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  
  http.createServer(app).listen(80, function(){
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
  });
  /*https.createServer(options, app).listen(443 ,function(){
    console.log("HTTPS Express server listening on port %d in %s mode", this.address().port, app.settings.env);
  });*/
  // Start server
  /*app.listen(config.dev_port, function(){
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
  });*/
});

app.configure('tony', function(){
  var riak = exports.riak = require('nodiak').getClient('http', config.db_host, config.db_port);
  var nodeflake_host = exports.nodeflake_host = '10.0.1.11';
  var temp_path = exports.temp_path = "C:/Users/Tony/AppData/Local/Temp/";
  app.use(express.session({ secret: "tazazaz",
                          store : new RedisStore({ 
                            host : config.redis_host,
                          }),
                          cookie: { maxAge: 86400000
                                    }
                          }));
  
  riakConfig.init();
  app.locals.port = config.tony_port;
  app.locals.rootPath =  "http://" + config.tony_host /* + ':' + config.tony_port */;
  console.log(app.locals.rootPath);
  //initialize passport
  passConfig.init(config.tony_Fb_ID, config.tony_Fb_Secret, app.locals.rootPath);
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));

  /*https.createServer(options, app).listen(443 ,function(){
    console.log("HTTPS Express server listening on port %d in %s mode", this.address().port, app.settings.env);
  });*/
  /*http.createServer(app).listen(80, function(){
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
  });*/
  app.listen(config.dev_port, function(){
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
  });
});

app.configure('production', function(){
  var riak = exports.riak = require('nodiak').getClient('http', config.production_db_host, config.production_db_port);
  var nodeflake_host = exports.nodeflake_host = '127.0.0.1';
  var temp_path = exports.temp_path = "/tmp/";
  app.use(express.session({ secret: "tazazaz",
                          store : new RedisStore({ 
                            host : config.production_redis_host,
                          }),
                          cookie: { maxAge: 86400000
                                    }
                          }));
  riakConfig.init();
  app.locals.rootPath =  "http://" + config.production_host;
  console.log(app.locals.rootPath);
  //initialize passport
  //passConfig.init(config.tony_Fb_ID, config.tony_Fb_Secret, app.locals.rootPath);
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  
  /*https.createServer(options, app).listen(443 ,function(){
    console.log("HTTPS Express server listening on port %d in %s mode", this.address().port, app.settings.env);
  });*/
  
  http.createServer(app).listen(80, function(){
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
  });
  
  app.use(express.errorHandler());
});

app.get('http://localhost', function(req, res){
  console.log('hi');
});

//Routes will be handled client side, all routes are built from base
app.get('/banner', function(req, res){
  res.render('banner');
});

app.get('/', function(req, res){
  if(!req.session.loggedIn){
    return res.render('banner');
  }
  res.render('base');
});
app.get('/store', function(req, res){
  if(!req.session.loggedIn){
    return res.render('banner');
  }
  res.render('base');
});
app.get('/profile', function(req, res){
  if(!req.session.loggedIn){
    return res.render('banner');
  }
  res.render('base');
});
app.get('/settings', function(req, res){
  if(!req.session.loggedIn){
    return res.render('banner');
  }
  res.render('base');
});
app.get('/about', function(req, res){
  if(!req.session.loggedIn){
    return res.render('banner');
  }
  res.render('base');
});
app.get('/about/:about', function(req, res){
  if(!req.session.loggedIn){
    return res.render('banner');
  }
  res.render('base');
});
app.get('/fbfail', function(req, res){
  res.send('facebook login failure');
});
//Page for Register Step 2: Choose categories you like.
/*app.get('/register', function(req, res){
  if(!req.session.newUser){ console.log('Registration Step 1 incomplete: Go home!'); return res.redirect('/');}
  res.render('register');
});*/
/*app.get('/logout', function(req, res){
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
      console.log("set req.session.fbUser");
      res.redirect('/');
    }
    //if logging in, set fb flag and log in
    else{
      console.log('Login via facebook success!');
      console.log(req.user);
      req.session.loggedIn = req.user.data.email;
      req.session.userEmail = req.user.data.email;
      req.session.userName = req.user.data.name;
      res.redirect('/');
    }
  }
);
app.get('/allUsers', function(req, res){
  var html = '<ul>';
  //res.send('TODO: Switch to levedb to index users via username');
});
app.get('/user/*', function(req, res){
  console.log('stars everywhere');
  return res.render('base');
});

//TODO put regex to filter appropriately
app.get('/page/*', function(req, res){
  return res.render('base');
});*/

//app.get('/category/*/*', function(req, res){
//  return res.render('base');
//});

//app.get('/text/*/*', function(req, res){
//  return res.render('base');
//});
/*
app.get('/settings', function(req, res){
  return res.render('base');
});
//used for testing purposes only
app.get('/test', function(req, res){
  bcrypt.genSalt(11, function(err, salt){
    res.send(salt);
  });
});

//file upload
app.post('/', function(req, res){
  //req. form is nulL
  console.log(req.body);
  console.log(req.form);
  console.log(req.files);
});*/

//All view partials must be served
app.get('/partials/:name', routes.partials);
app.get('/user/:user', function(req, res){
  if(!req.session.loggedIn){
    return res.render('banner');
  }
  return res.render('base');
});

/********* JSON API ***********/
//User
app.get('/api/facebookRegister', userApi.facebookRegister);
app.post('/api/facebookRegister', userApi.facebookRegister);
app.post('/api/login', userApi.login);
//
app.post('/api/gatewayLogin', userApi.gatewayLogin);
//
app.get('/api/logout', userApi.logout);
app.post('/api/register', userApi.register);
app.post('/api/register_2', userApi.register_2);
app.get('/api/checkLogin', userApi.checkLogin);
//app.post('/api/checkLogin', userApi.checkLogin);
app.get('/api/getSettings', userApi.getSettings);
app.post('/api/editSettings', userApi.editSettings);
app.get('/api/deactivate', userApi.deactivate);
app.post('/api/follow', userApi.follow);
app.post('/api/unfollow', userApi.removeFollowers);
app.get('/api/getPath', userApi.getPath);
app.post('/api/getProfile', userApi.getProfile);
app.post('/api/getPinList', userApi.getPinList);
app.post('/api/categorySearch', userApi.categorySearch);
app.post('/api/textSearch', userApi.textSearch);
app.post('/api/getUser', userApi.getUser);
app.post('/api/uploadAvatar', userApi.uploadAvatar);
app.post('/api/changeAvatar', userApi.changeAvatar);
app.post('/api/sendEmail', userApi.sendEmail);

//Fetch Profile data
app.get('/api/getActivity/:userName', userApi.getActivity);
app.get('/api/getGroups/:userName', userApi.getGroups);

//alpha registration based api calls
app.post('/api/createPending', userApi.createPending);
app.post('/api/acceptAccount', userApi.acceptPending);
app.post('/api/setPassword', userApi.setPassword);
app.post('/api/checkUniqueName', userApi.checkUniqueName);
app.post('/api/checkUniqueEmail', userApi.checkUniqueEmail);

//Gamepin
//app.post('/api/gamepin/postGamePin', gamepinApi.postGamePin);
app.post('/api/gamepin/postImageUpload', gamepinApi.postImageUpload);
app.post('/api/gamepin/postImageUrl', gamepinApi.postImageUrl);
app.post('/api/gamepin/postYoutubeUrl', gamepinApi.postYoutubeUrl);
app.post('/api/gamepin/edit', gamepinApi.edit);
app.post('/api/gamepin/remove', gamepinApi.remove);
app.post('/api/gamepin/getComments', gamepinApi.getComments);
app.post('/api/gamepin/addComment', gamepinApi.addComment);
app.post('/api/gamepin/editComment', gamepinApi.editComment);
app.post('/api/gamepin/like', gamepinApi.like);
app.post('/api/gamepin/share', gamepinApi.share);
app.post('/api/gamepin/search', gamepinApi.search);
app.post('/api/gamepin/getPinData', gamepinApi.getPinData);

//misc
app.post('/api/util/validImg', utilApi.validImg);
app.post('/api/util/validVideo', utilApi.validVideo);

//Route to 404 Page if not served
app.get('*', function(req, res){
  return res.send('Page Not Found');
});