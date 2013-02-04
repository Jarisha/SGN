'use strict';
var app = angular.module('myApp', ['myApp.filters', 'myApp.services', 'myApp.directives']);
//var app = angular.module('myApp', []);

// Declare app level module which depends on filters, and services
app.config(['$routeProvider', '$locationProvider',  function($routeProvider, $locationProvider) {
  $routeProvider.when('/', {templateUrl: 'partials/front', controller: FrontController});
  $routeProvider.when('/store', {templateUrl: 'partials/store', controller: StoreController});
  $routeProvider.when('/profile', {templateUrl: 'partials/profile', controller: ProfileController});
  $routeProvider.when('/settings', {templateUrl: 'partials/settings', controller: SettingsController});
  $routeProvider.when('/about', {templateUrl: 'partials/about', controller: AboutController});
  $routeProvider.when('/user/:user', {templateUrl: '../partials/profile', controller: UserController});
  
  $locationProvider.html5Mode(true);
}]);

// Entry Point
app.run(function($rootScope, $http, $templateCache, $location){
  console.log('entryPoint');
  //declare globals we will use
  $rootScope.section = '';
  $rootScope.globalMess = 'Global Message';
  $rootScope.loggedIn = null;
  $rootScope.userName = null;
  $rootScope.userId = null;
  $rootScope.rootPath = '';
  
  //post modal fields. Stored in object
  $rootScope.post = {url:null, content: null, name: null, publisher: null,
    description: null, category: null};
  
  /**
  * Debugging Tools
  *
  * Allows you to execute debug functions from the view
  */
  $rootScope.log = function(variable) {
    console.log(variable);
  };
  $rootScope.alert = function(text) {
    alert(text);
  };
  
  /* AJAX requests
  * - Takes $http post params as arguments
  * - Sets global rootScope vars
  * - Return result{} object for view specific data
  */
  $rootScope.checkLogin = function(callback){
    console.log('rootScope.checkLogin()');
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
        callback(result);
      })
      .error(function(data, status, headers, config) {
        result.message = 'Error: ' + status;
        callback(result);
      }
    );
  }
  $rootScope.login = function(email, password, callback){
    console.log('rootScope.login()');
    var result = {};
    $http({ method: 'POST', url: 'api/login', data:
          {"email": email, "password": password }})
      .success(function(data, status, headers, config){
        if(data.login){
          $rootScope.loggedIn = true;
          $rootScope.userEmail = data.userEmail;
          $rootScope.userName = data.userName;
          $rootScope.userId = data.userId;
          result.message = 'Login Successful!';

          /* If cached, reload and cache partials effected by login */
          if($templateCache.get('partials/front_subnav')){
            $templateCache.remove('partials/front_subnav');
            $http.get('partials/front_subnav', {cache:$templateCache});
          }
          if($templateCache.get('partials/navbar')){
            $templateCache.remove('partials/navbar');
            $http.get('partials/navbar', {cache:$templateCache});
          }
        }
        else if(!data.login && data.error){
          result.message = 'Login Failed: ' + data.error;
        }
        else{
          result.message = 'Login Failed: AJAX error';
        }
        callback(result);
      })
      .error(function(data, status, headers, config){
        result.message = 'Server Error: ' + status;
        callback(result);
      }
    );
  }
  $rootScope.logout = function(callback){
    console.log('rootScope.logout()');
    var result = {};
    $http({ method: 'GET', url:'/api/logout'})
      .success(function(data, status, headers, config){
        if(data.logout){
          $rootScope.loggedIn = false;
          $rootScope.userName = null;
          result.message = 'Logout Successful!';
          $location.path('/');
        }
        else if(!data.logout && data.error){
          result.message = data.error;
        }
        else{
          result.message = 'AJAX error';
        }
        callback(result);
      })
      .error(function(data, status, headers, config){
        result.message = 'Error: ' + status;
        callback(result);
      });
  }
  $rootScope.register = function(email, name, password, confirm, callback){
    console.log('rootScope.register()');
    var result = {};
    $http({ method: 'POST', url: 'api/register', data:
          {"email": email ,"name": name, "password": password, "confirm": confirm }})
      .success(function(data, status, headers, config){
        //on success set view vars and log in user
        if(data.register){
          $rootScope.loggedIn = true;
          $rootScope.userEmail = data.userEmail;
          $rootScope.userName = data.userName;
          $rootScope.userId = data.userId;
          result.message = 'Registration Successful!';
          
          /* Reload and cache partials */
          if($templateCache.get('partials/front_subnav')){
            $templateCache.remove('partials/front_subnav');
            $http.get('partials/front_subnav', {cache:$templateCache});
          }
          if($templateCache.get('partials/navbar')){
            $templateCache.remove('partials/navbar');
            $http.get('partials/navbar', {cache:$templateCache});
          }
        }
        else if(!data.register && data.error){
          result.message = data.error;
        }
        else{
          result.message = 'AJAX error';
        }
        callback(result);
      })
      .error(function(data, status, headers, config){
        result.message = 'Error: ' + status;
        callback(result);
      });
  }
  
  //Set root path by getting config port
  $http.get('/api/getPath')
    .success(function(data, status, headers, config){
      $rootScope.rootPath = data.path;
      console.log(data.path);
    })
    .error(function(data, status, headers, config) {
      result.message = 'Error: ' + status;
    });
    
  //Always check if user is logged in
  $rootScope.checkLogin(function(res){
    if(res.message) $rootScope.status = res.status;
  });
  
  //load templates into cache
  $http.get('partials/modals', {cache:$templateCache});
  $http.get('partials/front_subnav', {cache:$templateCache});
  $http.get('partials/navbar', {cache:$templateCache});
  $http.get('partials/front_content', {cache:$templateCache});
  //$templateCache.put('test.html', '<b> I emphasize testing</b>');
});