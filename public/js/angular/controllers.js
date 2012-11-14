'use strict';

/* Controllers */

/* App level controller (not used)*/
function AppCtrl($scope, $http, $location) {
  console.log('in AppCtrl');
  $scope.name = $location.path();
  console.log($scope.name);
}

function FrontController($scope, $http, $location){
  //not very DRY yet...
  $scope.nav = 'partials/front_navbar';
  $scope.subnav = 'partials/front_subnav';
  $scope.content = 'partials/front_content';
  $scope.modals = 'partials/modals'
  $scope.loggedIn = false;
}

function StoreController($scope, $http, $location){
  $scope.nav = 'partials/store_navbar';
  $scope.subnav = 'partials/store_subnav';
  $scope.content = 'partials/store_content';
  $scope.modals = 'partials/modals'
}

function ProfileController($scope, $http, $location){
  $scope.nav = 'partials/profile_navbar';
  $scope.subnav = 'partials/profile_subnav';
  $scope.content = 'partials/profile_content';
  $scope.modals = 'partials/modals'
}
