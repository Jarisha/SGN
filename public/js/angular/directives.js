'use strict';

/* Directives */
/* NOTE: directives must be lowercase letters ONLY. '_' and '-' chars will screw them up as well. */

angular.module('myApp.directives', [])
  .directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }])
  
  //apply JQuery masonry once last ng-repeat has loaded
  .directive('masonry', function(version) {
    return {
      restrict: 'A',
      //link gets called for every element in ng-repeat.  Every add to the list calls link for that element.
      link: function(scope, element, attrs, $timeout){
        //once the last element has loaded, fire masonry
        if(scope.$last){
          console.log('last');
          scope.masonry();
        }
      }
    };
  })
  .directive('profileMasonry', function(version) {
    return {
      restrict: 'A',
      //link gets called for every element in ng-repeat.  Every add to the list calls link for that element.
      link: function(scope, element, attrs){
        //Whenever we extend our pinList array, we trigger a new $last event
        if(scope.$last){
          console.log('profile last');
          scope.profileMasonry();
        }
      }
    };
  })
  .directive('stopEvent', function () {
    return {
      restrict: 'A',
      link: function (scope, element, attr) {
        element.bind(attr.stopEvent, function (e) {
          e.stopPropagation();
        });
      }
    };
  });