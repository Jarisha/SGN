
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { cssFiles: ['css/front.css'],
                        jsFiles: ['js/front.js'],
                        nav: true,
                        subnav: true
                      });
};
//store
exports.store = function(req, res){
	res.render('store', { cssFiles: ['css/store.css'],
                        jsFiles: ['js/store.js'],
                        nav: true,
                        subnav: true
                      });
};
//profile
exports.profile = function(req, res){
	res.render('profile', { cssFiles: ['css/profile.css'],
                        jsFiles: ['js/profile.js'],
                        nav: true,
                        subnav: false
                      });
};
//settings
exports.settings = function(req, res){
	res.render('settings', { cssFiles: ['css/settings.css'],
                        nav: true,
                        subnav: false
                      });
};
//about
exports.about = function(req, res){
	res.render('about', { cssFiles: ['css/about.css'],
                        nav: true,
                        subnav: false
                      });
};
//page not found
exports.notfound = function(req, res){
    res.send('Page Not Found');
};

exports.partials = function (req, res) {
  var name = req.params.name;
  res.render('partials/' + name);
};