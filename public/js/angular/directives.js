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
  .directive('repeatDone', function(version) {
    return {
      restrict: 'A',
      //link gets called for every element in ng-repeat.  Every add to the list calls link for that element.
      link: function(scope, element, attrs){
        //Whenever we extend our pinList array, we trigger a new $last event
        if(scope.$last){
          console.log('last');
          //If this is our first time, 
          if(scope.masonInit){
            scope.setup();
            scope.changeState();
            scope.masonry();
          }
          else{
            scope.masonry();
            scope.remason();
          }
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