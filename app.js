var express = require('express');
var mongoose = require('mongoose');

//create new server
var app = express();

//configure mongodb
var db = mongoose.createConnection('localhost','test');
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log('mongodb connected!');
});
//define schema
var userSchema = mongoose.Schema({
  email: { type: String, unique: true },
  name: { type: String, unique: true},
  password: String
});
//index using name
userSchema.index({name: 1});
//userSchema.set('autoIndex', false);
var User = db.model('siteUser', userSchema);

//configure app
app.configure(function(){
  //settings
  app.set('view engine', 'ejs');
  app.set('views', __dirname + '/views');
  app.set('view options', {layout: false});
  //set view globals
  app.locals.title = 'SGN_Express';
  app.locals.nav = false;
  app.locals.subnav = false;
  app.locals.cssFiles = [];
  app.locals.jsFiles = [];
  app.locals.error = false;
  //middleware
  app.use(express.static(__dirname + '/public'));
  app.use(express.favicon(__dirname + '/public'));
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.cookieSession({secret: 'secret'}));
  app.use(function(req, res, next){
	res.locals.path = req.path;
    console.log('%s %s', req.method, req.url);
    console.log('logged in: %s', req.session.loggedIn);
    next();
  });
  //check session is user is logged in
  //if so get user and pass to views
  app.use(function(req, res, next){
	if(req.session.loggedIn){
		res.locals.loggedIn = true;
		User.findById(req.session.loggedIn, function(err, result){
			if(err){ console.log('next( %s )', err); next(err);}
			res.locals.loggedUser = result;
			next();
		});
	}
	else{
		res.locals.loggedIn = false;
		next();
	}
  });
   //app.use(express.logger('tiny'));
});

/* configure based on NODE_ENV var */
app.configure('development', function(){
  //
});
app.configure('production', function(){
  //
});

/* Routes */
// front, store, about accessible to guest user
// all others redirect to login

//front page
app.get('/', function(req, res){
  res.locals.title = app.locals.title +  ' | Front';
  res.locals.cssFiles = ['front.css'];
  res.locals.jsFiles = ['front.js'];
  res.render('index');
});
//store
app.get('/store', function(req, res){
  //res locals override app locals
  res.locals.title = app.locals.title +  ' | Store';
  res.locals.cssFiles = ['store.css'];
  res.locals.jsFiles = ['store.js'];
  res.render('store');
});
//profile
app.get('/profile', function(req, res){
  res.locals.title =  app.locals.title +  ' | Profile';
  res.locals.cssFiles = ['profile.css'];
  res.locals.jsFiles = ['profile.js'];
  res.render('profile');
});
//settings
app.get('/settings', function(req, res){
	res.locals.title = app.locals.title +  ' | Settings';
	res.locals.cssFiles = ['settings.css'];
	res.locals.jsFiles = ['settings.js'];
	res.render('settings');
});
//register
app.get('/register', function(req, res){
	if(req.session.loggedIn) res.redirect('/');
	res.locals.title =app.locals.title +  ' | Register';
	res.render('register');
});
app.post('/register', function(req, res, next){
	if(req.session.loggedIn) res.redirect('/');
	console.log(req.body.user);
	//validate signup params (id rather do this on client side w/HTML5)
	if(req.body.user.password !== req.body.user.confirm){
		res.locals.error = 'confirm password does not match password';
		res.render('register');
	}
	else{
		//don't combine create user & save user into one statement
		var user = new User({email: req.body.user.email, 
											name: req.body.user.name, 
											password: req.body.user.password});
		if(!user){ 
			console.log('create user failed'); 
			next('create user failed');
		}
		user.save(function(err){
			if(err){ console.log('next( %s )', err); next(err);}
			req.session.loggedIn = user._id.toString();
			res.redirect('/');
		});
	}
});
//login
app.get('/login', function(req, res){
	if(req.session.loggedIn) res.redirect('/');
	res.locals.title =app.locals.title +  ' | Login';
	res.render('login');
});
app.post('/login', function(req, res){
	if(req.session.loggedIn) res.redirect('/');
	//query database for user
	//query database for psswd
	console.log(req.body.user);
	User.findOne({ email: req.body.user.email, password: req.body.user.password }, function(err, result){
		if(err){ console.log('next( %s )', err); next(err); }
		if(!result) return res.send('<p>Wrong username or password</p>');
		req.session.loggedIn = result._id.toString();
		console.log(result);
		res.redirect('/');
	});
});
app.get('/logout', function(req, res){
	req.session = null;
	res.redirect('/');
});
app.get('/cleardb', function(req, res){
	User.remove({}, function(err) { 
	   console.log('collection removed');
	});
	res.send('<p>Db cleared</p><br/><a href="/">Back to Front<a>');
});

//test
app.get('/test', function(req, res){
	res.locals.title = app.locals.title +  ' | LocalOverride';
	res.render('test');
});
//test redirect
app.get('/redirect', function(req, res){
	res.redirect('/test');
});

//404 goes last
app.all('/*', function(req, res){
	res.send('<p>404: Page Not Found</p>')
});

app.listen(3000);
console.log('listening on port 3000');

//debug
//console.log(process.env.NODE_ENV);