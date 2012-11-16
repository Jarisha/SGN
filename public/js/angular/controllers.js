'use strict';
/* Controllers */

/* App level controller (not used)*/
function AppCtrl($scope, $http, $location) {
  console.log('in AppCtrl');
  $scope.name = $location.path();
  console.log($scope.name);
}

function FrontController($scope, $rootScope, $http, $location){
  //not very DRY yet...
  $scope.nav = 'partials/front_navbar';
  $scope.subnav = 'partials/front_subnav';
  $scope.content = 'partials/front_content';
  $scope.modals = 'partials/modals';
  $scope.subnavBool = true;
  $scope.register = {name: null, password: null, confirm: null};
  $scope.login = {name: null, password: null};
  
  /* PAGE LOADING CODE */
  //enable masonry & infiniteScroll for content after it loads
  $scope.masonScroll = function(){
    var $container = $('#content');
    $container.imagesLoaded(function(){
      $container.masonry({
        itemSelector : '.game_pin, .store_pin'
      });
    });
    // "Infinite Scroll"
    $container.infinitescroll({
      navSelector  : '#pag_nav',    // selector for the paged navigation
      nextSelector : '#pag_nav a',  // selector for the NEXT link (to page 2)
      itemSelector : '.game_pin, .store_pin',   // selector for all items you'll retrieve
      loading: {
          finishedMsg: 'No more pages to load.'
        }
      },
      // trigger Masonry as a callback
      function( newElements ) {
        // hide new items while they are loading
        var $newElems = $( newElements ).css({ opacity: 0 });
        // ensure that images load before adding to masonry layout
        $newElems.imagesLoaded(function(){
          // show elems now they're ready
          $newElems.animate({ opacity: 1 });
          $container.masonry( 'appended', $newElems, true );
        });
      }
    );
  }
  //affix subnav to top after it is loaded
  $scope.affix = function(){
    $('#subnav').affix({ offset: 42 });
  }
  
  /* Trigger modals */
  $scope.promptLogin = function(){
    $('#loginModal').modal();
  }
  $scope.promptRegister = function(){
    $('#registerModal').modal();
  }
  
  /* USER SESSION FUNCTIONS */
  $scope.postLogin = function(){
    $http({ method: 'POST', url: 'api/login', data:
          {"name": $scope.login.name, "password": $scope.login.password }})
      .success(function(data, status, headers, config){
        if(data.login){
          $scope.status = 'Login Successful!';
          $scope.logMsg = 'Logged In';
          $scope.currUser = data.userName;
          //$scope.userId = data.userId;
          //$location.path('/');
        }
        else if(!data.login && data.error){
          $scope.status = data.error;
        }
        else{
          $scope.status = 'AJAX error';
        }
      })
      .error(function(data, status, headers, config){
        $scope.status = 'Error: ' + status;
      });
  }
  $scope.postRegister = function(){
    $http({ method: 'POST', url: 'api/register', data:
          {"name": $scope.register.name, "password": $scope.register.password, "confirm": $scope.register.confirm }})
      .success(function(data, status, headers, config){
        //on success set view vars and log in user
        if(data.register){
          $scope.status = 'Registration Successful!';
          $scope.logMsg = 'Logged In';
          $scope.currUser = data.userName;
        }
        else if(!data.register && data.error){
          $scope.status = data.error;
        }
        else{
          $scope.status = 'AJAX error';
        }
      })
      .error(function(data, status, headers, config){
        $scope.status = 'Error: ' + status;
      });
  }
  $scope.logout = function(){
    $http({ method: 'GET', url:'/api/logout'})
      .success(function(data, status, headers, config){
        if(data.logout){
          $scope.status = 'Logout Successful!';
          $scope.logMsg = 'Logged Out';
          $scope.currUser = null;
        }
        else if(!data.logout && data.error){
          $scope.status = data.error;
        }
        else{
          $scope.status = 'AJAX error';
        }
      })
      .error(function(data, status, headers, config){
        $scope.message = 'Error: ' + status;
      });
  }
  $scope.log = function(){
    console.log($scope.register.name);
    console.log($scope.register.password);
    console.log($scope.register.confirm);
  }
  /*$rootScope.checkLogin(function(res){
    if(res.message) $scope.status = res.status;
  });*/
  /* $scope.frontLogin = function(){
    $rootScope.login($scope.login.name, $scope.login.password, function(res){
      if(res.message) $scope.status = res.message;
    });
  }*/
}

function StoreController($scope, $http, $location){
  $scope.nav = 'partials/front_navbar';
  $scope.subnav = 'partials/front_subnav';
  $scope.content = 'partials/front_content';
  $scope.modals = 'partials/modals';
  $scope.subnavBool = true;
  
  //enable masonry for content after it loads
  /*$scope.enableMasonry = function(){
    runBootstrap();
    $('.carousel').carousel({interval: false});
    var $container = $('#content');
    $container.imagesLoaded(function(){
      $container.masonry({
        itemSelector : '.game_pin, .store_pin'
      });
    });
  }*/
  $scope.affix = function(){
    $('#subnav').affix({ offset: 42 });
  }
  
  /* Trigger modals */
  $scope.promptLogin = function(){
    $('#loginModal').modal();
  }
  $scope.promptRegister = function(){
    $('#registerModal').modal();
  }
  
  /* USER SESSION FUNCTIONS */
  $scope.checkLogin = function(){
    $http({ method: 'GET', url: '/api/checkLogin'})
      .success(function(data, status, headers, config){
        //logged in
        if(data.loggedIn){
          $scope.logMsg = "Logged In";
          $scope.currUser = data.userName;
          //$scope.userId = data.userId;
        }
        //logged out
        else if(!data.loggedIn){
          $scope.logMsg = "Logged Out";
          $scope.currUser = '';
        }
        else{
          $scope.message = "AJAX error";
        }
      })
      .error(function(data, status, headers, config) {
        $scope.message = 'Error: ' + status;
      });
  }
  $scope.postLogin = function(){
    $http({ method: 'POST', url: 'api/login', data:
          {"name": $scope.login.name, "password": $scope.login.password }})
      .success(function(data, status, headers, config){
        if(data.login){
          $scope.status = 'Login Successful!';
          $scope.logMsg = 'Logged In';
          $scope.currUser = data.userName;
          //$scope.userId = data.userId;
          //$location.path('/');
        }
        else if(!data.login && data.error){
          $scope.status = data.error;
        }
        else{
          $scope.status = 'AJAX error';
        }
      })
      .error(function(data, status, headers, config){
        $scope.status = 'Error: ' + status;
      });
  }
  $scope.postRegister = function(){
    $http({ method: 'POST', url: 'api/register', data:
          {"name": $scope.register.name, "password": $scope.register.password, "confirm": $scope.register.confirm }})
      .success(function(data, status, headers, config){
        //on success set view vars and log in user
        if(data.register){
          $scope.status = 'Registration Successful!';
          $scope.logMsg = 'Logged In';
          $scope.currUser = data.userName;
        }
        else if(!data.register && data.error){
          $scope.status = data.error;
        }
        else{
          $scope.status = 'AJAX error';
        }
      })
      .error(function(data, status, headers, config){
        $scope.status = 'Error: ' + status;
      });
  }
  $scope.logout = function(){
    $http({ method: 'GET', url:'/api/logout'})
      .success(function(data, status, headers, config){
        if(data.logout){
          $scope.status = 'Logout Successful!';
          $scope.logMsg = 'Logged Out';
          $scope.currUser = null;
        }
        else if(!data.logout && data.error){
          $scope.message = data.error;
        }
        else{
          $scope.message = 'AJAX error';
        }
      })
      .error(function(data, status, headers, config){
        $scope.message = 'Error: ' + status;
      });
  }
  $scope.checkLogin();
}

function ProfileController($scope, $http, $location){
  $scope.nav = 'partials/front_navbar';
  $scope.subnav = 'partials/front_subnav';
  $scope.content = 'partials/profile_content';
  $scope.modals = 'partials/modals';
  $scope.subnavBool = false;
  
  $scope.enableMasonry = function(){
    runBootstrap();
    $('.carousel').carousel({interval: false});
    var $container = $('#content');
    $container.imagesLoaded(function(){
      $container.masonry({
        itemSelector : '.game_pin, .store_pin'
      });
    });
  }
  
  $scope.checkLogin = function(){
    $http({ method: 'GET', url: '/api/checkLogin'})
      .success(function(data, status, headers, config){
        //logged in
        if(data.loggedIn){
        }
        //logged out
        else if(!data.loggedIn){
          window.location.pathname = '/';
        }
        else{
          $scope.message = "AJAX error";
        }
      })
      .error(function(data, status, headers, config) {
        $scope.message = 'Error: ' + status;
      });
  }
  $scope.checkLogin();
}
function AboutController($scope, $http, $location){
  $scope.nav = 'partials/front_navbar';
  $scope.subnav = 'partials/front_subnav';
  $scope.content = 'partials/about_content';
  $scope.modals = 'partials/modals';
  $scope.subnavBool = false;
}
function SettingsController($scope, $http, $location){
  $scope.nav = 'partials/front_navbar';
  $scope.subnav = 'partials/front_subnav';
  $scope.content = 'partials/settings_content';
  $scope.modals = 'partials/modals';
  $scope.subnavBool = false;
  
  $scope.checkLogin = function(){
    $http({ method: 'GET', url: '/api/checkLogin'})
      .success(function(data, status, headers, config){
        //logged in
        if(data.loggedIn){
        }
        //logged out
        else if(!data.loggedIn){
          window.location.pathname = '/';
        }
        else{
          $scope.message = "AJAX error";
        }
      })
      .error(function(data, status, headers, config) {
        $scope.message = 'Error: ' + status;
      });
  }
  $scope.checkLogin();
}