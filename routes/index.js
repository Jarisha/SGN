
/*
 * GET home page.
 */

exports.index = function(req, res){
  //res.render('index');
  res.render('temp_front');
};
//store
exports.store = function(req, res){
	//res.render('store');
  res.render('temp_store');
};
//profile
exports.profile = function(req, res){
	res.render('profile');
};
//settings
exports.settings = function(req, res){
	res.render('settings');
};
//about
exports.about = function(req, res){
	res.render('about');
};
//page not found
exports.notfound = function(req, res){
    res.send('Page Not Found');
};

exports.partials = function (req, res) {
  var name = req.params.name;
  res.render('partials/' + name);
};