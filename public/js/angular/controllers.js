'use strict';

/* Controllers */

/* App level controller */
function AppCtrl($scope, $http, $location) {
  console.log('in AppCtrl');
  /* $http({method: 'GET', url: '/api/name'}).
  success(function(data, status, headers, config) {
    $scope.name = data.name;
  }).
  error(function(data, status, headers, config) {
    $scope.name = 'Error!';
  });*/
  $scope.name = $location.path();
  console.log($scope.name);
}

/* Controllers for Content partial*/
function MyCtrl1() {
}
MyCtrl1.$inject = [];


function MyCtrl2() {
}
MyCtrl2.$inject = [];
