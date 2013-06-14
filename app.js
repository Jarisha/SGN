//nodejs Core Modules
var cluster = require('cluster');
var http = require('http');
var https = require('https');
var url = require('url');
var fs = require('fs');
var numCores = require('os').cpus().length;

//External modules, read in from node_modules
var express = require('express');
var RedisStore = require('connect-redis')(express);
var httpGet = require('http-get');
var request = require('request');
var bcrypt = require('bcrypt-nodejs');
var rackit = require('rackit');
var mandrill = exports.mandrill = require('node-mandrill')('rRK6Fs7T1NKpMbJZKxpJfA');
var winston = require('winston');

//Modules within SGN
var config = require('./config');
var partials = require('./routes/partials');
var outlog, evtlog, errlog;
var apiRoutes;
var riakConfig;

//enables '/debug' page which has super user Create / Edit / Delete functionality for all objects
var god_mode = true;

//only admin users have access to our content management systems located at '/debug'
var adminUsers = ['dtonys@gmail.com', 'colemanfoley@gmail.com', 'amarg@slimstown.com', 'thebigq@quyay.com'];

//create rackspace image, define name of container we will push images to
rackit.init({
  user: 'happyspace',
  key: '1b5a100b899c44633dbda1aa93ea6237',
  prefix: 'gamepin',
  tempURLKey : null,
  useSNET : false,
  useCDN : true,
  useSSL : false, // Specifies whether to use SSL (https) for CDN links
  verbose : false, // If set to true, log messages will be generated
  logger : console.log // Function to receive log messages
}, function(err){
  if(err) console.error('error:' + err);
});

exports.rackit = rackit;

//node cluster encapsulates web server creation
if(cluster.isMaster){
  for(var i = 0; i < numCores; i++){
    cluster.fork();
  }
}
else{

  //Create server and export it to others who need it
  var app = exports.self = express();
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
  });

  //ad hoc middleware - Manage HTTP / HTTPS.  This is a bit of a mess right now.
  function auth(req, res, next){
    //HTTP + Logged out = GOTO HTTPS
    if(!req.session.loggedIn && !req.connection.encrypted){
      return res.redirect('https://' + app.locals.host + req.url);
    }
    //HTTPS + Logged out = Serve banner
    else if(!req.session.loggedIn && req.connection.encrypted){
      return res.render('banner');
    }
    //HTTPS + Logged in = GOTO HTTP
    else if(req.session.loggedIn && req.connection.encrypted){
      return res.redirect('http://' + app.locals.host + req.url);
    }
    //HTTP + Logged in = OK
    else if(req.session.loggedIn && !req.connection.encrypted);
    next();
  }
  
  app.configure('coleman', function(){
    //setup riak and express
    var riak = exports.riak = require('nodiak').getClient('http', '127.0.0.1', 8091);
    var nodeflake_host = exports.nodeflake_host = '127.0.0.1';
    var temp_path = exports.temp_path = config.dev_temp_path;
    app.use(express.session({ secret: "tazazaz",
                            store : new RedisStore({
                              host : '127.0.0.1',
                              //host : config.dev_redis_host,
                            }),
                            cookie: { maxAge: 86400000
                                      }
                            }));
    //express global
    app.locals.env = 'coleman';
    app.locals.host = 'localhost';
    app.locals.rootPath =  "http://" + 'localhost';

    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));

    //only use log files in production
    outlog = exports.outlog = {
      info: function(){}
    }
    errlog = exports.errlog = {
      info: function(){}
    }
    evtlog = exports.evtlog = {
      info: function(){}
    }
    apiRoutes = require('./routes/apiRoutes');
    riakConfig = require('./riak_config');
    util = require('./utility');

    //app.use(passConfig.passport.initialize());
    //ping riak and nodeflake
    riakConfig.init();

    //SSL options
    var options = {
      key: fs.readFileSync('quyay.com.key'),
      cert: fs.readFileSync('quyay.com.crt'),
      ca: [fs.readFileSync('gd_bundle.crt')]
    }

    http.createServer(app).listen(80, function(){
      outlog.info('HTTP Express server listening on port ? in dev mode');
      console.log('HTTP Express server listening on port ? in dev mode');
    });
    https.createServer(options, app).listen(443, function(){
      outlog.info('HTTPS Express server listening on port 443 in dev mode');
      console.log('HTTPS Express server listening on port 443 in dev mode');
    });
  });
  
  app.configure('dev', function(){
    //setup riak and express
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
    //express global
    app.locals.env = 'dev';
    app.locals.host = config.dev_host;
    app.locals.rootPath =  "http://" + config.dev_host;
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));

    //only use log files in production
    outlog = exports.outlog = {
      info: function(){}
    }
    errlog = exports.errlog = {
      info: function(){}
    }
    evtlog = exports.evtlog = {
      info: function(){}
    }
    apiRoutes = require('./routes/apiRoutes');
    //passConfig = require('./pass_config');
    riakConfig = require('./riak_config');
    util = require('./utility');

    //app.use(passConfig.passport.initialize());
    //ping riak and nodeflake
    riakConfig.init();

    //SSL options
    var options = {
      key: fs.readFileSync('quyay.com.key'),
      cert: fs.readFileSync('quyay.com.crt'),
      ca: [fs.readFileSync('gd_bundle.crt')]
    }

    http.createServer(app).listen(80, function(){
      outlog.info('HTTP Express server listening on port ? in dev mode');
      console.log('HTTP Express server listening on port ? in dev mode');
    });
    https.createServer(options, app).listen(443, function(){
      outlog.info('HTTPS Express server listening on port 443 in dev mode');
      console.log('HTTPS Express server listening on port 443 in dev mode');
    });
  });

  app.configure('staging', function(){
    //setup riak and express
    var riak = exports.riak = require('nodiak').getClient('http', config.production_db_host, config.staging_db_port);
    var nodeflake_host = exports.nodeflake_host = config.staging_nodeflake_host;
    var temp_path = exports.temp_path = config.staging_temp_path;
    app.use(express.session({ secret: "tazazaz",
                            store : new RedisStore({
                              host : config.staging_redis_host,
                            }),
                            cookie: { maxAge: 86400000
                                      }
                            }));
    
    //express globals
    app.locals.env = 'staging';
    app.locals.host = config.staging_host;
    app.locals.rootPath =  "http://" + config.staging_host;
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    
    outlog = exports.outlog = new (winston.Logger)({
      exitOnError: false, //don't crash on exception
      transports: [
        new (winston.transports.File)({ level: 'info', filename: config.staging_log_path + 'quyay.log', json:true,
                                      options: {   //stupid hack to make winston work with express
                                          flags: 'a',
                                          highWaterMark: 24
                                        }
                                      })
      ]
    });
    errlog = exports.errlog = new (winston.Logger)({
      exitOnError: false, //don't crash on exception
      transports: [
        new (winston.transports.File)({ level: 'info',
                                        filename: config.staging_log_path + 'error.log',
                                        json:true,
                                        options: {   
                                          flags: 'a',
                                          highWaterMark: 24
                                        }
                                      })
      ]
    });
    evtlog = exports.evtlog = new (winston.Logger)({
      exitOnError: false, //don't crash on exception
      transports: [
        new (winston.transports.File)({ level: 'info', filename: config.staging_log_path + 'event.log', json:true,
                                        options: {
                                          flags: 'a',
                                          highWaterMark: 24
                                        }
                                      })
      ]
    });
    apiRoutes = require('./routes/apiRoutes');
    
    riakConfig = require('./riak_config');
    util = require('./utility');
    
    //ping riak and nodeflake
    riakConfig.init();
    
    //SSL options
    var options = {
      key: fs.readFileSync(config.staging_ssl_path + 'quyay.com.key'),
      cert: fs.readFileSync(config.staging_ssl_path + 'quyay.com.crt'),
      ca: [fs.readFileSync(config.staging_ssl_path + 'gd_bundle.crt')]
    }
    
    http.createServer(app).listen(80, function(){
      outlog.info('HTTP Express server listening on port 80');
    });
    https.createServer(options, app).listen(443, function(){
      outlog.info('HTTPS Express server listening on port 443');
    });
  });
  
  app.configure('production', function(){
    //setup riak and express
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
    
    //express globals
    app.locals.env = 'production';
    app.locals.host = config.production_host;
    app.locals.rootPath =  "http://" + config.production_host;
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    
    outlog = exports.outlog = new (winston.Logger)({
      exitOnError: false, //don't crash on exception
      transports: [
        new (winston.transports.File)({ level: 'info', filename: config.production_log_path + 'quyay.log', json:true,
                                      options: {   //stupid hack b/c winston doesn't work with express
                                          flags: 'a',
                                          highWaterMark: 24
                                        }
                                      })
      ]
    });
    errlog = exports.errlog = new (winston.Logger)({
      exitOnError: false, //don't crash on exception
      transports: [
        new (winston.transports.File)({ level: 'info',
                                        filename: config.production_log_path + 'error.log',
                                        json:true,
                                        options: {   
                                          flags: 'a',
                                          highWaterMark: 24
                                        }
                                      })
      ]
    });
    evtlog = exports.evtlog = new (winston.Logger)({
      exitOnError: false, //don't crash on exception
      transports: [
        new (winston.transports.File)({ level: 'info', filename: config.production_log_path + 'event.log', json:true,
                                        options: {
                                          flags: 'a',
                                          highWaterMark: 24
                                        }
                                      })
      ]
    });
    apiRoutes = require('./routes/apiRoutes');
    
    riakConfig = require('./riak_config');
    util = require('./utility');
    
    //ping riak and nodeflake
    riakConfig.init();
    
    //SSL options
    var options = {
      key: fs.readFileSync(config.production_ssl_path + 'quyay.com.key'),
      cert: fs.readFileSync(config.production_ssl_path + 'quyay.com.crt'),
      ca: [fs.readFileSync(config.production_ssl_path + 'gd_bundle.crt')]
    }
    
    http.createServer(app).listen(80, function(){
      outlog.info('HTTP Express server listening on port 80');
    });
    https.createServer(options, app).listen(443, function(){
      outlog.info('HTTPS Express server listening on port 443');
    });
  });
  
  app.get('/debug', function(req, res){
    for(var i = 0, len = adminUsers.length; i < len; i++){
      if(req.session.userEmail === adminUsers[i])
        return res.render('debug');
    }
    res.render('base');
  });
  
  //case for blitz.io
  app.get('/mu-1234-cafe-5678-babe', function(req, res){
    return res.send('42');
  });
  
  app.get('/', auth, function(req, res){
    res.render('base');
  });

  app.get('/store', auth, function(req, res){
    res.render('base');
  });
  app.get('/profile', auth, function(req, res){
    res.render('base');
  });
  app.get('/settings', auth, function(req, res){
    res.render('base');
  });
  app.get('/about', auth, function(req, res){
    res.render('base');
  });
  app.get('/about/:about', auth, function(req, res){
    res.render('base');
  });
  app.get('/user/:user', auth, function(req, res){
    return res.render('base');
  });
  
  //All view partials must be served - This correlates to the Angular Router
  app.get('/partials/front/:name', partials.front);
  app.get('/partials/profile/:name', partials.profile);
  app.get('/partials/user/:name', partials.user);
  app.get('/partials/about/:name', partials.about);
  app.get('/partials/post/:name', partials.post);
  app.get('/partials/:name', partials.index);

  apiRoutes(app);

  //Angular will take care of the 404 page
  app.get('*', function(req, res){
    return res.render('base');
  });
}
