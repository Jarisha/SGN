var AboutController = ['$scope', '$rootScope', '$http', '$location', 'resolveAbout', '$routeParams',
  function($scope, $rootScope, $http, $location, resolveAbout, $routeParams){
    $rootScope.css = 'about';
    $rootScope.title = 'about';
    $scope.modals = $rootScope.rootPath + '/partials/modals';
    $scope.subnav = null;
    $scope.nav = $rootScope.rootPath + '/partials/navbar';
    $scope.content = $rootScope.rootPath + '/partials/about/about_content';
    $scope.section = $rootScope.rootPath + '/partials/about/faq';
    
    $scope.textsearch = function(txt){
      console.log('textsearch from about controller');
      $rootScope.textSearchFlag = true;
      $rootScope.textSearchString = txt;
      $location.path('/');
    }
    
    $scope.setup = function(){
      aboutSetup($scope);
    }
    $scope.viewFAQ = function(){
      $('.about_selected').removeClass('about_selected');
      $('.faq_slice').addClass('about_selected');
      $scope.section = $rootScope.rootPath + '/partials/about/faq';
    }
    $scope.viewToS = function(){
      $('.about_selected').removeClass('about_selected');
      $('.tos_slice').addClass('about_selected');
      $scope.section = $rootScope.rootPath + '/partials/about/tos';
    }
    $scope.viewPrivacy = function(){
      $('.about_selected').removeClass('about_selected');
      $('.privacy_slice').addClass('about_selected');
      $scope.section = $rootScope.rootPath + '/partials/about/privacy';
    }
    $scope.viewAcceptable = function(){
      $('.about_selected').removeClass('about_selected');
      $('.view_slice').addClass('about_selected');
      $scope.section = $rootScope.rootPath + '/partials/about/acceptable';
    }
    
    switch($routeParams.area){
      case 'faq':
        $('.about_selected').removeClass('about_selected');
        $('.faq_slice').addClass('about_selected');
        $scope.section = $rootScope.rootPath + '/partials/about/faq';
        $scope.viewFAQ();
        break;
      case 'tos':
        $('.about_selected').removeClass('about_selected');
        $('.tos_slice').addClass('about_selected');
        $scope.section = $rootScope.rootPath + '/partials/about/tos';
        $scope.viewToS();
        break;
      case 'privacy':
        $('.about_selected').removeClass('about_selected');
        $('.privacy_slice').addClass('about_selected');
        $scope.section = $rootScope.rootPath + '/partials/about/privacy';
        $scope.viewPrivacy();
        break;
      case 'acceptable':
        $('.about_selected').removeClass('about_selected');
        $('.view_slice').addClass('about_selected');
        $scope.section = $rootScope.rootPath + '/partials/about/acceptable';
        $scope.viewAcceptable();
        break;
    }
    
    /* AJAX FUNCTIONS */
    $scope.ajaxLogout = function(){
      $rootScope.logout( function(res){
        if(res.message) $scope.status = res.message;
      });
    }
  }
];

AboutController.resolve = {
  resolveAbout: ['$q', '$rootScope', '$location', function($q, $rootScope, $location){
    var deferred = $q.defer();
    
    //hack to deal with links from modal windows
    $('#gamePinModal').modal('hide');
    
    $rootScope.checkLogin(function(err, login){
      if(err) deferred.reject(err);
      //else if(!login) $location.path('/');
      else deferred.resolve();
    });
    return deferred.promise;
  }]
}