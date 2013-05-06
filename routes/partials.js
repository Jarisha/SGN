//Serve all partials
module.exports = function(req, res){
  var name = req.params.name;
  res.render('partials/' + name);
}

/*exports.partials = function (req, res) {
  var name = req.params.name;
  res.render('partials/' + name);
};*/