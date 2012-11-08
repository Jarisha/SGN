
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index');
};
//store
exports.store = function(req, res){
	res.render('store');
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

exports.partials = function (req, res) {
  var name = req.params.name;
  res.render('partials/' + name);
};