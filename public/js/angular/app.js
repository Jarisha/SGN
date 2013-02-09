var app = angular.module('myApp', ['myApp.filters', 'myApp.services', 'myApp.directives']);

// Declare app level module which depends on filters, and services
app.config(['$routeProvider', '$locationProvider',  function($routeProvider, $locationProvider) {
  console.log('app.config()');
  
  $routeProvider
    .when('/',  { templateUrl: 'partials/front',
                  controller: FrontController,
                  //this function delays loading the route until content is loaded
                  resolve: {
                    //loadContentloadPins
                    beforeRoute:function($q, gamepinService){
                      console.log('beforeRoute');
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
    .when('/user/:user', {templateUrl: '../partials/profile', controller: UserController});
    
  
  $locationProvider.html5Mode(true);
}]);

// Entry Point
app.run(function( $rootScope, $http, $templateCache, $location){
  console.log('app.run()');
  //Global variables - session data
  $rootScope.section = '';
  $rootScope.globalMess = 'Global Message';
  $rootScope.loggedIn = null;
  $rootScope.userName = null;
  $rootScope.userId = null;
  $rootScope.rootPath = '';
  $rootScope.something = 'blah';
  $rootScope.login = {email: null, password: null};
  $rootScope.register = { email: null, name: null, password: null, confirm: null, fbConnect: false};
  
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
          remason();
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
  $rootScope.loginSubmit = function(){
    console.log($rootScope.login.email + ' ' + $rootScope.login.password);
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
          remason();
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
  
});