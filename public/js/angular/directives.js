'use strict';

/* Directives */
/* NOTE: directives must be lowercase letters ONLY. '_' and '-' chars will screw them up as well. */

angular.module('myApp.directives', [])
  .directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }])
  
  //
  .directive('mason', function(version) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs){
        if(scope.$last){
          console.log('last proc!');
          scope.setup();
          remason();
        }
      }
    };
  });    
    
/*    function(scope, element, attrs) {
      console.log('test');
      if (scope.$last){
        //element.parent().css('border', '1px solid black');
        console.log('This is last')
      }
      else{
        console.log(scope);
      }
    };
  });*/