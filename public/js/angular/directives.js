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
  })
  .directive('sampleDone', function(version) {
    var flag = true;
    return {
      restrict: 'A',
      //link gets called for every element in ng-repeat.  Every add to the list calls link for that element.
      link: function(scope, element, attrs){
        //Whenever we extend our pinList array, we trigger a new $last event
        if(scope.$last){
          console.log('sampleDone');
          if(flag){
            scope.setup();
            scope.profileMason();
            flag = false;
          }
          else{
            scope.profileMason();
          }
        }
      }
    };
  });