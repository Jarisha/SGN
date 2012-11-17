'use strict';
var app = angular.module('myApp', ['myApp.filters', 'myApp.services', 'myApp.directives']);

// Declare app level module which depends on filters, and services
app.config(['$routeProvider', '$locationProvider',  function($routeProvider, $locationProvider) {
  //$routeProvider.when('/view1', {templateUrl: 'partials/partial1', controller: MyCtrl1});
  //$routeProvider.when('/view2', {templateUrl: 'partials/partial2', controller: MyCtrl2});
  //$routeProvider.when('/#loginModal', {redirectTo: '/view1'});
  //$routeProvider.otherwise({redirectTo: '/view1'});
  $routeProvider.when('/', {templateUrl: 'partials/front', controller: FrontController});
  $routeProvider.when('/store', {templateUrl: 'partials/store', controller: StoreController});
  $routeProvider.when('/profile', {templateUrl: 'partials/profile', controller: ProfileController});
  $routeProvider.when('/settings', {templateUrl: 'partials/settings', controller: SettingsController});
  $routeProvider.when('/about', {templateUrl: 'partials/about', controller: AboutController});

  
  $locationProvider.html5Mode(true);
}]);


// Entry Point
app.run(function($rootScope, $http, $templateCache){
  //declare globals we will use
  $rootScope.globalMess = 'Global Message';
  $rootScope.loggedIn = null;
  $rootScope.userName = null;
  $rootScope.userId = null;
  
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
  $rootScope.login = function(name, password, callback, $timeout){
    var result = {};
    $http({ method: 'POST', url: 'api/login', data:
          {"name": name, "password": password }})
      .success(function(data, status, headers, config){
        if(data.login){
          $rootScope.loggedIn = true;
          $rootScope.userName = data.userName;
          $rootScope.userId = data.userId;
          result.message = 'Login Successful!';
          /* refresh header */
          $templateCache.remove('partials/front_subnav');
          $templateCache.remove('partials/front_navbar');
          $timeout(function() {

            $http.get('partials/front_subnav', {cache:$templateCache});
            $http.get('partials/front_navbar', {cache:$templateCache});
          },1000);
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
  $rootScope.logout = function(name, password, callback){
    var result = {};
  }
  $rootScope.register = function(name, password, confirm, callback){
    var result = {};
  }
  
  //Immediately check if user is logged in
  $rootScope.checkLogin(function(res){
    if(res.message) $rootScope.status = res.status;
  });
  
  //load templates into cache
  $http.get('partials/modals', {cache:$templateCache});
  $http.get('partials/front_subnav', {cache:$templateCache});
  $http.get('partials/front_navbar', {cache:$templateCache});
  $http.get('partials/front_content', {cache:$templateCache});
  //$templateCache.put('test.html', '<b> I emphasize testing</b>');
});