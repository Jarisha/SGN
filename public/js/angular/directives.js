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
      link: function(scope, element, attrs, $timeout){
        //Whenever we extend our pinList array, we trigger a new $last event
        if(scope.$last){
          ('last');
          //If this is our first time, 
          if(scope.masonInit){
            scope.setup();
            scope.changeState();
            scope.masonry();
            scope.remason();
          }
          else{
            setTimeout(function(){ scope.remason() }, 0);
          }
        }
      }
    };
  })
  .directive('activityDone', function(version) {
    return {
      restrict: 'A',
      //link gets called for every element in ng-repeat.  Every add to the list calls link for that element.
      link: function(scope, element, attrs){
        //Whenever we extend our pinList array, we trigger a new $last event
        if(scope.$last){
          scope.setup();
          scope.changeState();
          scope.profileMason();
          scope.profileRemason();
        }
        else{
          scope.profileRemason();
        }
      }
    };
  });