var app = angular.module('myApp', ['myApp.filters', 'myApp.services', 'myApp.directives']);

// Declare app level module which depends on filters, and services
app.config(['$routeProvider', '$locationProvider',  function($routeProvider, $locationProvider) {
  console.log('app.config()');
  
  //Router provides templateUrl that fills <body>, controller, and pre-routing logic 
  $routeProvider
    .when('/',  { templateUrl: 'partials/front',
                  controller: FrontController,
                  //this function delays loading the route until content is loaded
                  resolve: {
                    //loadContentloadPins
                    beforeFront:function($q, $rootScope, gamepinService){
                      var deferred = $q.defer();
                      gamepinService.getPinList(function(data){
                        if(data.objects){
                          deferred.resolve(data.objects);
                        }
                        else
                          deferred.reject("Error");
                      });
                      return deferred.promise;
                    }
                  }
                })
    .when('/page/:page', {templateUrl: '../partials/front', controller: FrontController})
    .when('/category/:cat/:page', {templateUrl: '../../partials/front', controller: FrontController})
    .when('/text/:tex/:page', {templateUrl: '../../partials/front', controller: FrontController})
    .when('/store', {templateUrl: 'partials/store', controller: StoreController})
    .when('/profile', {templateUrl: 'partials/profile', controller: ProfileController})
    .when('/settings', {templateUrl: 'partials/settings', controller: SettingsController})
    .when('/about', {templateUrl: 'partials/about', controller: AboutController})
    .when('/user/:username', {  templateUrl: '../partials/profile',
                            controller: UserController,
                            resolve: {
                              beforeUser: function($q, $route, $rootScope, $location){
                                var deferred = $q.defer();
                                var username = $route.current.params.username;
                                console.log($rootScope.userId);
                                console.log('beforeUser');
                                console.log($rootScope.loggedIn);
                                if(!$rootScope.loggedIn){
                                  console.log('not logged in redirect');
                                  $location.path('/');
                                }
                                else if($rootScope.userName === username){
                                  console.log('redirecting to profile');
                                  $location.path('/profile');
                                }
                                else
                                  deferred.resolve();
                                return deferred.promise;
                              }
                            }
                          })
    .otherwise({templateUrl: 'partials/not_found'});
    
  
  $locationProvider.html5Mode(true);
}]);

// Entry Point
app.run(function( $rootScope, $http, $templateCache, $location, $timeout){
  console.log('app.run()');
  /* Detect if HTML5 localstorage is enabled */
  if(typeof(Storage)!=="undefined"){
  }
  else{
    console.log('HTML5 localstorage not enabled, redirect to fail page');
  }
  
  //Global variables - session data
  $rootScope.section = '';
  $rootScope.globalMess = 'Global Message';
  $rootScope.loggedIn = null;
  $rootScope.userName = null;
  $rootScope.userId = null;
  $rootScope.rootPath = '';
  $rootScope.something = 'blah';
  $rootScope.notify = { status: 'Success', message: 'Action Succesfull!' };
  $rootScope.login = {email: null, password: null};
  $rootScope.register = { email: null, name: null, password: null, confirm: null, fbConnect: false};
  $rootScope.rootSettings = {email: null, username: null, gender: null, bio: null};
  
  $rootScope.genericModal = { header:null , body:null , data: {}};
  
  
  //post modal fields. Stored in object
  $rootScope.post = {url:null, content: null, name: null, publisher: null,
    description: null, category: null};
  
  //detect routeChanges
  $rootScope.$on("$routeChangeStart", function(event, next, current){
    console.log('Route Change Started!');
  });
  $rootScope.$on("$routeChangeSuccess", function(event, next, current){
    console.log('Route Change Success!');
  });
  $rootScope.$on("$routeChangeError", function(event, next, current, rejection){
    console.log('Route Change Error: ' + rejection); 
  });
  $rootScope.$on("$viewContentLoaded", function(event, next, current, rejection){
    console.log('ng view loaded');
  });
  
  //Debugging Tools
  //Allows you to execute debug functions from the view
  $rootScope.log = function(variable) {
    console.log(variable);
  };
  $rootScope.alert = function(text) {
    alert(text);
  };
  
  //Masonry calls
  $rootScope.masonry = function(){
    $('#content').imagesLoaded(function(){
      $('#content').masonry({
        itemSelector : '.game_pin, .store_pin',
        isFitWidth: true
      });
    });
  }
  $rootScope.profileMason = function(){
    $('#profile_data_inner').imagesLoaded(function(){
      $('#profile_data_inner').masonry({
        itemSelector : '.game_pin',
        isFitWidth: true
      });
    });
  }
  $rootScope.remason = function(){
    $('#content').masonry('reload');
  }
  
  //Global AJAX calls
  
  //checkLogin checks if we are logged in, and gets our session params and
  //stores them in $rootScope for easy access
  $rootScope.checkLogin = function(){
    var result = {};
    $http.get('/api/checkLogin')
      .success(function(data, status, headers, config){
        //logged in
        if(data.loggedIn){
          $rootScope.loggedIn = true;
          $rootScope.userName = data.userName;
          $rootScope.userId = data.userId;
          console.log('zippy!');
        }
        //logged out
        else if(!data.loggedIn){
          $rootScope.loggedIn = false;
          $rootScope.userName = null;
          $rootScope.userId = null;
        }
        else{
          result.status = "AJAX error";
        }
      })
      .error(function(data, status, headers, config) {
        result.message = 'Error: ' + status;
      }
    );
  }
  $rootScope.logoutSubmit = function(){
    console.log('rootScope.logout()');
    var result = {};
    $http({ method: 'GET', url:'/api/logout'})
      .success(function(data, status, headers, config){
        if(data.logout){
          $rootScope.loggedIn = false;
          $rootScope.userName = null;
          $location.path('/');
          console.log("logout remason");
          $rootScope.notify.message = 'You are now logged out.';
          $rootScope.popNotify();
          $timeout( function(){ $rootScope.remason(); }, 100 );
        }
        else if(!data.logout && data.error){
          console.log(data.error);
        }
        else{
          console.log('AJAX error');
        }
      })
      .error(function(data, status, headers, config){
        result.message = 'Error: ' + status;
      });
  }
  $rootScope.registerSubmit = function(){
    $http({ method: 'POST', url: 'api/register', data:
          {"email": $rootScope.register.email ,"name": $rootScope.register.name,
          "password": $rootScope.register.password, "confirm": $rootScope.register.confirm,
          "fbConnect": $rootScope.register.fbConnect }})
      .success(function(data, status, headers, config){
        //on success go to register step 2
        if(data.register){
          window.location = '/register';
        }
        else if(!data.register && data.error){
          console.log(data.error);
        }
        else{
          console.log('AJAX error');
        }
      })
      .error(function(data, status, headers, config){
        console.log('Error: ' + status);
      });
  }
  $rootScope.loginsubmit = function(){
    $http({ method: 'POST', url: 'api/login', data:
          {"email": $rootScope.login.email, "password": $rootScope.login.password }})
      .success(function(data, status, headers, config){
        //clear password from memory
        $rootScope.login.password = null;
        if(data.login){
          $rootScope.loggedIn = true;
          $rootScope.userEmail = data.userEmail;
          $rootScope.userName = data.userName;
          $rootScope.userId = data.userId;
          $('#loginModal').modal('hide');
          $rootScope.notify.message = 'You are now logged in.';
          $rootScope.popNotify();
          //rootScope.popNotify({status: 'success' || 'error', message: 'Login successful!'});
          
          
          /* If cached, reload and cache partials effected by login */
          if($templateCache.get($rootScope.rootPath +'/partials/front_subnav')){
            $templateCache.remove($rootScope.rootPath +'/partials/front_subnav');
            $http.get($rootScope.rootPath +'/partials/front_subnav', {cache:$templateCache});
          }
          if($templateCache.get($rootScope.rootPath +'/partials/navbar')){
            $templateCache.remove($rootScope.rootPath +'/partials/navbar');
            $http.get($rootScope.rootPath +'/partials/navbar', {cache:$templateCache});
          }
          console.log("login remason");
          $timeout( function(){ $rootScope.remason(); }, 100 );
        }
        else if(!data.login && data.error){
          console.log('Login Failed: ' + data.error);
        }
        else{
          console.log('Login Failed: ' + data.error);
        }
      })
      .error(function(data, status, headers, config){
        //clear password from memory
        $rootScope.login.password = null;
        console.log('Server Error: ' + status);
      });
  } 
  $rootScope.postGamePin = function(){
    //clear post data lying around
    $rootScope.post.name = null;
    $rootScope.post.publisher = null;
    $rootScope.post.category = null;
    $rootScope.post.description = null;
    $rootScope.post.url = null;
    $rootScope.post.content = null;
    
    $('#genericModal').modal();
  }
  $rootScope.getRootSettings = function(){
    $http.get('api/getSettings')
      .success(function(data, status, headers, config){
        if(data.email) $rootScope.rootSettings.email = data.email;
        if(data.username){
          $rootScope.rootSettings.username = data.username;
          $rootScope.userName = data.username;
        }
        if(data.gender) $rootScope.rootSettings.gender = data.gender;
        if(data.bio) $rootScope.rootSettings.bio = data.bio;
      })
      .error(function(data, status, headers, config) {
        result.message = 'Error: ' + status;
      });
  }
  $rootScope.viewSettings = function(){
    $rootScope.getRootSettings();
    
    $('#settingsModal').modal();
  }
  
  var hide = null;
  
  $rootScope.popNotify = function(){
    $('#alertContainer').show();
    console.log('popNotify');
    hide = $timeout(function() {
      $('#alertContainer').fadeOut(500, function(){
        $rootScope.notify.status = 'Success';
        $rootScope.notify.message = 'Action Successful';
      });
    }, 5000);
  }
  $rootScope.hideNotify = function(){
    $timeout.cancel(hide);
    $('#alertContainer').fadeOut(250, function(){
      $rootScope.notify.status = 'Success';
      $rootScope.notify.message = 'Action Successful';
    });
    
    console.log('hideNotify');
  }
  
  //Load correct Post step 2 modal based on type of media selected
  /*$('.post_media').click(function(e){
    console.log('post media selected');
    var media = $(this).val();
    var $modal_header = $('#pinYoutube .modal-header');
    switch(media){
      case 'upload':
        //TODO: do back end functionality
        $modal_header.html('<p>Upload image from Computer</p><br />'+
          '<form method="post" enctype="multipart/form-data">' +
          '<p>Image: <input type="file" name="image" /></p>' +
          '<p><input type="submit" value="Upload" /></p></form>');
        setTimeout(function(){$('#pinYoutube').modal({dynamic: true});}, 500);
        break;
      case 'youtube':
        //Hack. Resolve by spawning this modal once the hide animation completes for the previous modal.
        $modal_header.html('<p>Post video via youtube URL</p>' +
          '<input ng-model="post.url" class="load_input" placeholder="" type="text">' +
          '</input><button class="btn load_vid">Load</button>');
        setTimeout(function(){$('#pinYoutube').modal({dynamic: true});}, 500);
        break;
      //via image URL (direct link to image or call web scraper to return all valid images on page url)
      case 'url':
        $modal_header.html('<p>Upload from the web</p><br /><input type="text"></input>');
        setTimeout(function(){$('#pinYoutube').modal({dynamic: true});}, 500);
        break;
    }
  });*/
  
  //Always check if user is logged in
  $rootScope.checkLogin();
  
  //Get full path to simplify urls for loading images/html
  $http.get('/api/getPath')
    .success(function(data, status, headers, config){
      $rootScope.rootPath = data.path;
      //next();
    })
    .error(function(data, status, headers, config) {
      result.message = 'Error: ' + status;
    });
  //Load front page html partials into cache
  //Load partials we will need regardless of page?
  function next(){
    //$rootScope.modals = $rootScope.rootPath + '/partials/modals';
    /*$http.get($rootScope.rootPath + '/partials/modals', {cache:$templateCache});
    $http.get($rootScope.rootPath + '/partials/front_subnav', {cache:$templateCache});
    $http.get($rootScope.rootPath + '/partials/navbar', {cache:$templateCache});
    $http.get($rootScope.rootPath + '/partials/front_content', {cache:$templateCache});*/
  }
  //example of what $templateCache can do
  //$templateCache.put('test.html', '<b> I emphasize testing</b>');
  
  $rootScope.login = {email: null, password: null};
  $rootScope.register = { email: null, name: null, password: null, confirm: null, fbConnect: false};
  
  //setup modals accessible through more than one page
  //$rootScope.setupGlobalModals = function(){
  //  console.log('setupGlobalModals()');
  $rootScope.promptLogin = function(){
    //clear modal
    $rootScope.login.email = null;
    $rootScope.login.password = null;
    //spawn
    $('#loginModal').modal();
  }
  $rootScope.promptRegister = function(){
    //clear modal
    $rootScope.register.email = null;
    $rootScope.register.name = null;
    $rootScope.register.password = null;
    $rootScope.register.confirm = null;
    $rootScope.register.fbConnect = false;
    $('#registerModal').modal();
  }
  //}
});