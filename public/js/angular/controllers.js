'use strict';
/* Controllers */

function FrontController($scope, $rootScope, $http, $location, $templateCache, $timeout){
  $rootScope.section = 'front';
  $scope.modals = 'partials/modals';
  $scope.subnav = 'partials/front_subnav';
  $scope.nav = 'partials/navbar';
  $scope.content = 'partials/front_content';
  $scope.register = { email: null, name: null, password: null, confirm: null};
  $scope.login = {name: null, password: null};
  
  
  //Setup non AJAX related javascript
  $scope.setup = function(){
    frontSetup($scope);
  }
  
  /* AJAX FUNCTIONS */
  $scope.ajaxLogin = function(){
    $rootScope.login($scope.login.email, $scope.login.password, function(res){
      if(res.message) $scope.status = res.message;
      console.log('remason');
      remason();
    });
  }
  $scope.ajaxLogout = function(){
    $rootScope.logout( function(res){
      if(res.message) $scope.status = res.message;
      remason();
    });
  }
  $scope.ajaxRegister = function(){
    console.log('pigs');
    console.log($scope.register.email + ' ' + $scope.register.name + ' ' + $scope.register.password + ' ' + $scope.register.confirm);
    $rootScope.register($scope.register.email, $scope.register.name, $scope.register.password, $scope.register.confirm, function(res){
      if(res.message) $scope.status = res.message;
      remason();
    });
  }
}

function StoreController($scope, $rootScope, $http, $location){
  $rootScope.section = 'store';
  $scope.modals = 'partials/modals';
  $scope.subnav = 'partials/store_subnav';
  $scope.nav = 'partials/navbar';
  $scope.content = 'partials/store_content';
  $scope.register = {name: null, password: null, confirm: null};
  $scope.login = {name: null, password: null};
  
  //Setup non AJAX related javascript
  $scope.setup = function(){
    storeSetup($scope);
  }
  //Youtube video functionality
  /*function onYouTubePlayerReady(playerId){
    console.log(playerId);
    console.log('onYouTubePlayerReady');
  }*/
  
  /* AJAX FUNCTIONS */
  /*$scope.ajaxLogin = function(){
    $rootScope.login($scope.login.name, $scope.login.password, function(res){
      if(res.message) $scope.status = res.message;
    });
  }*/
  $scope.ajaxLogout = function(){
    $rootScope.logout( function(res){
      if(res.message) $scope.status = res.message;
    });
  }
  /*$scope.ajaxRegister = function(){
    $rootScope.register($scope.register.name, $scope.register.password, $scope.register.confirm, function(res){
      if(res.message) $scope.status = res.message;
    });
  }*/
}

function ProfileController($scope, $rootScope, $http, $location){
  //redirect if not logged in
  if(!$rootScope.loggedIn)
    $location.path('/');
  
  $rootScope.section = 'profile';
  $scope.modals = 'partials/modals';
  $scope.subnav = null;
  $scope.nav = 'partials/navbar';
  $scope.content = 'partials/profile_content';
  $scope.settings = {email: null, username: $scope.userName, gender: null, bio: null}
  
  $scope.setup = function(){
    profileSetup($scope);
  }
  
  /* AJAX FUNCTIONS */
  $scope.ajaxLogout = function(){;
    $rootScope.logout( function(res){
      if(res.message) $scope.status = res.message;
    });
  }
  
  $scope.getSettings = function(){
    $http.get('api/getSettings')
      .success(function(data, status, headers, config){
        if(data.email) $scope.settings.email = data.email;
        if(data.username) $scope.settings.username = data.username;
        if(data.gender) $scope.settings.gender = data.gender;
        if(data.bio) $scope.settings.bio = data.bio;
      })
      .error(function(data, status, headers, config) {
        result.message = 'Error: ' + status;
      });
  }
  $scope.getSettings();
}
function AboutController($scope, $rootScope, $http, $location){
  $rootScope.section = 'about';
  $scope.modals = 'partials/modals';
  $scope.subnav = null;
  $scope.nav = 'partials/navbar';
  $scope.content = 'partials/about_content';
  
  $scope.setup = function(){
    aboutSetup($scope);
  }
  
  /* AJAX FUNCTIONS */
  $scope.ajaxLogout = function(){
    $rootScope.logout( function(res){
      if(res.message) $scope.status = res.message;
    });
  }
}
function SettingsController($scope, $rootScope, $http, $location){
  //redirect if not logged in
  if(!$rootScope.loggedIn)
    $location.path('/');
  
  $rootScope.section = 'settings';
  $scope.modals = 'partials/modals';
  $scope.subnav = null;
  $scope.nav = 'partials/navbar';
  $scope.content = 'partials/settings_content';
  $scope.settings = {email: null, username: $scope.userName, gender: null, bio: null}
  
  $scope.setup = function(){
    settingsSetup($scope);
  }
  
  $scope.ajaxLogout = function(){
    $rootScope.logout( function(res){
      if(res.message){
        $scope.status = res.message;
      }
    });
  }
  $scope.getSettings = function(){
    $http.get('api/getSettings')
      .success(function(data, status, headers, config){
        if(data.email) $scope.settings.email = data.email;
        if(data.username) $scope.settings.username = data.username;
        if(data.gender) $scope.settings.gender = data.gender;
        if(data.bio) $scope.settings.bio = data.bio;
      })
      .error(function(data, status, headers, config) {
        result.message = 'Error: ' + status;
      });
  }
  $scope.editSettings = function(){
    $http({ method: 'POST', url: 'api/editSettings', data:
          { id: $rootScope.userId, settings: $scope.settings }})
      .success(function(data, status, headers, config){
        if(data.error) console.log('error ' + data.error);
        if(data.edit) alert('settings saved!');
      })
      .error(function(data, status, headers, config){
        console.log('Error' + status);
      });
  }
  $scope.getSettings();
}