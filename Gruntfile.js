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
    recess: {
      //generates concatted & minifed CSS. Run once before push to production.
      dist: {
        options: {
          compile: true,
          compress: true
        },
        files: {
          'public/less_compiled/compiled.min.css': [  'public/less/default.less',
                                                      'public/less/modal.less',
                                                      'public/less/front.less',
                                                      'public/less/store.less',
                                                      'public/less/profile.less',
                                                      'public/less/about.less',
                                                      'public/less/settings.less',
                                                      'public/less/post.less'
                                                    ]
        }
      },
      //compiles each LESS file into corresonding CSS file. Run in dev cycles.
      dev: {
        options: {
          compile: true,              // Compiles CSS or LESS. Fixes white space and sort order.
        },
        files: {
          'public/less_compiled/default.css': ['public/less/default.less'],
          'public/less_compiled/modal.css': ['public/less/modal.less'],
          'public/less_compiled/front.css': ['public/less/front.less'],
          'public/less_compiled/store.css': ['public/less/store.less'],
          'public/less_compiled/profile.css': ['public/less/profile.less'],
          'public/less_compiled/about.css': ['public/less/about.less'],
          'public/less_compiled/settings.css': ['public/less/settings.less'],
          'public/less_compiled/post.css': ['public/less/post.less'],
        }
      }
    },
    uglify: {
      my_target: {
        files: {
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
    },
    //if change less or JS files, recompile all and reload. For Dev.
    watch: {
      options: { livereload: true },
      css: {
        files:  [ 'public/less/*.less'],
        tasks:  [ 'recess:dev' ]
      },
      js: {
        files:  [ 'public/js/*.js',
                  'public/js/angular/*.js',
                  'public/js/angular/controllers/*.js'
                ],
        tasks: []
      }
    }
  });
  
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-recess');
  grunt.loadNpmTasks('grunt-contrib-watch');
  
  grunt.registerTask('default', ['uglify', 'recess:dev']);
}