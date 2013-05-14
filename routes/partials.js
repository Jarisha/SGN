//Serve all partials
/*module.exports = function(req, res){
  var name = req.params.name;
  res.render('partials/' + name);
}*/

exports.index = function(req, res){
  res.render('partials/' + req.params.name);
}
exports.front = function(req, res){
  res.render('partials/front/' + req.params.name);
}
exports.profile = function(req, res){
  res.render('partials/profile/' + req.params.name);
}
exports.user = function(req, res){
  res.render('partials/user/' + req.params.name);
}
exports.about = function(req, res){
  res.render('partials/about/' + req.params.name);
}