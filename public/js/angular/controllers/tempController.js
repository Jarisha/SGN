var TempController = ['$scope', '$rootScope', '$http', '$location', '$routeParams', '$route', 'gamepinService', 'resolveTemp',
  function($scope, $rootScope, $http, $location, $routeParams, $route, gamepinService , resolveTemp){
    var id = $route.current.params.postId;
    console.log($rootScope.loggedIn);
    console.log('TempController');
    console.log('id: ' + id);
    $rootScope.css = 'post';
    $rootScope.title = 'post';
    $scope.pagePin = {};
    gamepinService.getPinData(id, function(data){
      $scope.pagePin = data;
      console.log(data);
    });
  }
];

TempController.resolve = {
  resolveTemp: ['$q', '$rootScope', '$location', function($q, $rootScope, $location){
      var deferred = $q.defer();
      //hack to deal with links from modal windows
      $('#gamePinModal').modal('hide');
      deferred.resolve();
      return deferred.promise;
  }]
}
