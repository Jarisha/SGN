'use strict';
/* Controllers */

function FrontController($scope, $rootScope, $http, $location, $templateCache, $timeout){
  $rootScope.section = 'front';
  $scope.modals = 'partials/modals';
  $scope.subnav = 'partials/front_subnav';
  $scope.nav = 'partials/navbar';
  $scope.content = 'partials/front_content';
  $scope.register = {name: null, password: null, confirm: null};
  $scope.login = {name: null, password: null};
  
  /* PAGE LOADING CODE */
  //scrollup functionality
  $scope.scrollup = function(){
    $("html, body").animate({ scrollTop: 0 }, 600);
  }
  
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
  
  /* USER SESSION AJAX FUNCTIONS */
  
  //Front login calls generic login(), then does view specific work in callback fnc
  $scope.ajaxLogin = function(){
    console.log('ajaxLogin');
    $rootScope.login($scope.login.name, $scope.login.password, function(res){
      if(res.message) $scope.status = res.message;
    });
  }
  $scope.ajaxLogout = function(){
    console.log('ajaxLogout');
    $rootScope.logout( function(res){
      if(res.message) $scope.status = res.message;
    });
  }
  $scope.ajaxRegister = function(){
    console.log('ajaxRegister');
    $rootScope.register($scope.register.name, $scope.register.password, $scope.register.confirm, function(res){
      if(res.message) $scope.status = res.message;
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
  
  $scope.scrollup = function(){
    $("html, body").animate({ scrollTop: 0 }, 600);
  }
  
  /* PAGE LOADING CODE */
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
  
  /* USER SESSION FUNCTIONS */
  $scope.ajaxLogin = function(){
    console.log('ajaxLogin');
    $rootScope.login($scope.login.name, $scope.login.password, function(res){
      if(res.message) $scope.status = res.message;
    });
  }
  $scope.ajaxLogout = function(){
    console.log('ajaxLogout');
    $rootScope.logout( function(res){
      if(res.message) $scope.status = res.message;
    });
  }
  $scope.ajaxRegister = function(){
    console.log('ajaxRegister');
    $rootScope.register($scope.register.name, $scope.register.password, $scope.register.confirm, function(res){
      if(res.message) $scope.status = res.message;
    });
  }
}

function ProfileController($scope, $rootScope, $http, $location){
  
  $rootScope.section = 'profile';
}
function AboutController($scope, $rootScope, $http, $location){
  
  $rootScope.section = 'about';
}
function SettingsController($scope, $rootScope, $http, $location){
  
  $rootScope.section = 'settings';
}

function Acontroller($scope){
  //$scope.nav = '<p> Hello A </p>';
  $scope.modals = 'partials/partial1';
  $scope.nav = 'partials/navbar';
}

function Bcontroller($scope){
  //$scope.nav = '<p> Hello B </p>';
}