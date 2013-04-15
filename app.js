//nodejs Core Modules
var cluster = require('cluster');
var http = require('http');
var https = require('https');
var url = require('url');
var fs = require('fs');
var numCores = require('os').cpus().length;

//External modules, read in from node_modules.
var express = require('express');
var RedisStore = require('connect-redis')(express);
var socket = require('socket.io');
var httpGet = exports.httpGet =  require('http-get');
var request = exports.request = require('request');
var bcrypt = exports.bcrypt = require('bcrypt-nodejs');
var rackit = exports.rackit = require('rackit');
var mandrill = exports.mandrill = require('node-mandrill')('rRK6Fs7T1NKpMbJZKxpJfA');
var winston = require('winston');

winston.info('Hello there this is winston default');

//Quyay_API
var userApi = require('./routes/api/user');
var gamepinApi = require('./routes/api/gamepin');
var utilApi = require('./routes/api/util');
var util = require('./utility');

//Local files
var routes = require('./routes');
var config = require('./config');
var passConfig = require('./pass_config');
var riakConfig = require('./riak_config');

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
  if(err) console.error('error:' + err);
});

//node cluster encapsulates web server creation
if(cluster.isMaster){
  for(var i = 0; i < numCores; i++){
    cluster.fork();
  }
}
else{
  //Create server
  var app = exports.server = express();
  
  var nodeflake_host;
  
  //configure settings & middleware
  app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(express.static(__dirname + '/public'));
    app.use(express.favicon(__dirname + '/public'));
    app.use(express.cookieParser());
    app.use(passConfig.passport.initialize());
  });
  
  app.configure('tony', function(){
    var riak = exports.riak = require('nodiak').getClient('http', config.dev_db_host, config.dev_db_port);
    var nodeflake_host = exports.nodeflake_host = config.dev_nodeflake_host;
    var temp_path = exports.temp_path = config.dev_temp_path;
    app.use(express.session({ secret: "tazazaz",
                            store : new RedisStore({
                              host : config.dev_redis_host,
                            }),
                            cookie: { maxAge: 86400000
                                      }
                            }));
    riakConfig.init();
    app.locals.host = config.dev_host;
    app.locals.rootPath =  "http://" + config.dev_host;
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    
    var outlog = new (winston.Logger)({
      exitOnError: false, //don't crash on exception
      transports: [
        new (winston.transports.File)({ level: 'info', filename: config.dev_log_path + 'quyay.log', json:false })
      ]
    }); 
    var errlog = new (winston.Logger)({
      exitOnError: false, //don't crash on exception
      transports: [
        new (winston.transports.File)({ level: 'info', filename: config.dev_log_path + 'error.log', json:false })
      ]
    });
    
    //SSL options
    var options = {
      key: fs.readFileSync(config.dev_ssl_path + 'quyay.com.key'),
      cert: fs.readFileSync(config.dev_ssl_path + 'quyay.com.crt'),
      ca: [fs.readFileSync(config.dev_ssl_path + 'gd_bundle.crt')]
    }
    
    http.createServer(app).listen(80, function(){
      console.log('HTTP Express server listening on port 80');
    });
    https.createServer(options, app).listen(443, function(){
      console.log('HTTPS Express server listening on port 443');
    });
  });
  
  app.configure('production', function(){
    var riak = exports.riak = require('nodiak').getClient('http', config.production_db_host, config.production_db_port);
    var nodeflake_host = exports.nodeflake_host = config.production_nodeflake_host;
    var temp_path = exports.temp_path = config.production_temp_path;
    app.use(express.session({ secret: "tazazaz",
                            store : new RedisStore({
                              host : config.production_redis_host,
                            }),
                            cookie: { maxAge: 86400000
                                      }
                            }));
    riakConfig.init();
    app.locals.host = config.production_host;
    app.locals.rootPath =  "http://" + config.production_host;
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    
    var outlog = new (winston.Logger)({
      exitOnError: false, //don't crash on exception
      transports: [
        new (winston.transports.File)({ level: 'info', filename: config.production_log_path + 'quyay.log', json:false })
      ]
    });
    var errlog = new (winston.Logger)({
      exitOnError: false, //don't crash on exception
      transports: [
        new (winston.transports.File)({ level: 'info', filename: config.production_log_path + 'error.log', json:false })
      ]
    });
    
    outlog.info('This is log output');
    errlog.info('This is err output');
    
    //SSL options
    var options = {
      key: fs.readFileSync(config.production_ssl_path + 'quyay.com.key'),
      cert: fs.readFileSync(config.production_ssl_path + 'quyay.com.crt'),
      ca: [fs.readFileSync(config.production_ssl_path + 'gd_bundle.crt')]
    }
    
    http.createServer(app).listen(80, function(){
      console.log('HTTP Express server listening on port 80');
    });
    https.createServer(options, app).listen(443, function(){
      console.log('HTTPS Express server listening on port 443');
    });
  });
  
  
  //Routes will be handled client side, all routes are built from base
  
  app.get('*', function(req, res, next){
    //if https and logged in, redirect to http version of page
    if(req.connection.encrypted && req.session.loggedIn){
      return res.redirect('http://' + app.locals.host + req.url);
    }
    next();
  });
  
  app.get('/', function(req, res){
    console.log('Worker: ' + cluster.worker.id + ' served this page.');
    //redirect us to https page
    if(!req.connection.encrypted && !req.session.loggedIn) return res.redirect('https://' + app.locals.host + '/');
    //console.log(req.session);
    if(!req.session.loggedIn){
      return res.render('banner');
    }
    res.render('base');
  });
  app.get('/store', function(req, res){
    if(!req.session.loggedIn){
      return res.redirect('https://' + app.locals.host + '/');
    }
    res.render('base');
  });
  app.get('/profile', function(req, res){
    if(!req.session.loggedIn){
      return res.redirect('https://' + app.locals.host + '/');
    }
    res.render('base');
  });
  app.get('/settings', function(req, res){
    if(!req.session.loggedIn){
      return res.redirect('https://' + app.locals.host + '/');
    }
    res.render('base');
  });
  app.get('/about', function(req, res){
    if(!req.session.loggedIn){
      return res.redirect('https://' + app.locals.host + '/');
    }
    res.render('base');
  });
  app.get('/about/:about', function(req, res){
    if(!req.session.loggedIn){
      return res.redirect('https://' + app.locals.host + '/');
    }
    res.render('base');
  });
  app.get('/fbfail', function(req, res){
    res.send('facebook login failure');
  });
  /*
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
        console.log('Login via facebook success!');
        req.session.loggedIn = req.user.data.email;
        req.session.userEmail = req.user.data.email;
        req.session.userName = req.user.data.name;
        res.redirect('/');
      }
    }
  );
  */
  
  //All view partials must be served
  app.get('/partials/:name', routes.partials);
  app.get('/user/:user', function(req, res){
    if(!req.session.loggedIn){
      return res.render('banner');
    }
    return res.render('base');
  });
  
  /********* Quyay API ***********/
  //User
  app.get('/api/facebookRegister', userApi.facebookRegister);
  app.post('/api/facebookRegister', userApi.facebookRegister);
  app.post('/api/login', userApi.login);
  //
  app.post('/api/gatewayLogin', userApi.gatewayLogin);
  //
  app.post('/api/logout', userApi.logout);
  app.post('/api/register', userApi.register);
  app.post('/api/register_2', userApi.register_2);
  //app.get('/api/checkLogin', userApi.checkLogin);
  app.post('/api/checkLogin', userApi.checkLogin);
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
  app.post('/api/util/reindexGamepins', utilApi.reindexGamepins);
  app.post('/api/util/reindexUsers', utilApi.reindexUsers);
  app.post('/api/util/reindexComments', utilApi.reindexComments);
  
  //Angular will take care of the 404 page
  app.get('*', function(req, res){
    return res.render('base');
  });
}

