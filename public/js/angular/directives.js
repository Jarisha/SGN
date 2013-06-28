/* Directives */
/* NOTE: directives must be lowercase letters ONLY. '_' and '-' chars will screw them up as well. */

angular.module('myApp.directives', [])
  .directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }])
  
  //apply JQuery masonry once last ng-repeat has loaded
  .directive('masonry', function() {
    return {
      restrict: 'A',
      //link gets called for every element in ng-repeat.  Every add to the list calls link for that element.
      link: function(scope){
        //once the last element has loaded, and if we are on our initial load, fire masonry
        if(scope.$last && first){
          console.log('last');
          scope.masonry();
        }
      }
    };
  })
  .directive('profileMasonry', function() {
    return {
      restrict: 'A',
      //link gets called for every element in ng-repeat.  Every add to the list calls link for that element.
      link:function(scope){
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
  })
  .directive('scrollBottom', function() {
    return {
      link: function(scope){
        if(scope.$last){
          $('#respond_message').focus();
          var height = $('.convo_right')[0].scrollHeight;
          $('.convo_right').scrollTop(height);
        }
      }
    }
  });