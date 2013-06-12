module.exports = function(grunt){
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      //files: ['Gruntfile.js'],
      all: ['Gruntfile.js', 'public/js/angular/controllers/*.js'],
      options : {
				validthis : true,
				laxcomma : true,
				laxbreak : true,
				browser : true,
				eqnull : true,
				debug : true,
				devel : true,
				boss : true,
				expr : true,
				asi : true,
				globals : {
					jQuery : true
				}
			}
    },
    uglify: {
      my_target: {
        files: {
          //js for Banner Page
          
          //js for main Quyay App
          'public/js/everything.min.js': [  'public/js/angular/app.js',
                                            'public/js/angular/directives.js',
                                            'public/js/angular/filters.js',
                                            'public/js/angular/services.js',
                                            'public/js/angular/controllers/aboutController.js',
                                            'public/js/angular/controllers/frontController.js',
                                            'public/js/angular/controllers/storeController.js',
                                            'public/js/angular/controllers/profileController.js',
                                            'public/js/angular/controllers/tempController.js',
                                            'public/js/angular/controllers/userController.js',
                                            'public/js/front.js',
                                            'public/js/store.js',
                                            'public/js/about.js',
                                            'public/js/settings.js',
                                          ]
        }
      }
    }
  });
  
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  
  grunt.registerTask('default', ['uglify', 'jshint']);
  grunt.registerTask('custom', 'log stuff', function(){
    console.log('custom tasks executed');
  });
}