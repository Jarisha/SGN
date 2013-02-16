'use strict';

/* Services & Factories
 * Services are functions that Angular recognizes.  Think of them as utility functions visible
 * anywhere they are injected.
 * Service is an object, use 'this' to add member variables
 * Factory returns an object, allowing for one time initialization code.
 * We will most likely be using factories.
 */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('myApp.services', []).
  value('version', '0.1')
  
  //a service is an obj with a function (or set of functions) that does some work
  .service('printService', function(){
    this.printSomething = function(thing){
      console.log(thing);
      return thing;
    }
  })
  //factory methods returns an object w/function, but has its own local scope (vaguely similiar to closures),
  //which typically can be used to run inialization code once
  .factory('printFactory', function(){
    //initialize count var once
    var count = 0;
    //returns an obj with function (or set of functions) that does some work
    return {
      printSomething: function(thing){
        count++;
        console.log(thing);
        console.log(count);
        return thing;
      }
    }
  })
  //modifies obj declared in this local scope and returns reference to it
  .factory('objFactory', function(){
    var obj = {param1:null, param2: null};
    //return obj;
    return function(p1, p2){
      obj.param1 = p1;
      obj.param2 = p2;
      return obj;
    }
  })
  .factory('gamepinService', function($http, $rootScope){
    return {
      getPinList: function(callback){
        $http({ method: 'POST', url: $rootScope.rootPath +'/api/getPinList' })
          .success(function(data, status, headers, config){
            if(data.objects){
              callback(data);
            }
            else{
              console.log("getPinList Error");
              callback('error');
            }
          })
          .error(function(data, status, headers, config){
            console.log('AJAX error');
          });
      },
      categorySearch: function(cat, callback){
        $http({ method: 'POST', url: $rootScope.rootPath +'/api/categorySearch',
                data: {category: cat} })
          .success(function(data, status, headers, config){
            if(data.objects){
              callback(data);
            }
            else{
              console.log("getPinList Error");
              callback('error');
            }
          })
          .error(function(data, status, headers, config){
            console.log('AJAX error');
          });
      },
      textSearch: function(txt, callback){
        $http({ method: 'POST', url: $rootScope.rootPath +'/api/textSearch',
              data: {text: txt} })
          .success(function(data, status, headers, config){
            if(data.objects){
              callback(data);
            }
            else{
              console.log("getPinList Error");
              callback('error');
            }
          })
          .error(function(data, status, headers, config){
            console.log('AJAX error');
          });
      }
    }
  })
  .service('loadContent', function($q, gamepinService){
    console.log('bunnies!');
    this.loadPins = function(){
      var deferred = $q.defer();
      gamepinService.getPinList(function(data){
        if(data.objects)
          deferred.resolve(data.objects);
        else
          deferred.reject("Error");
      });
      return deferred.promise;
    }
  });
  /*.service('debugService', function(){
    this.log = function(variable) {
      console.log(variable);
    };
    this.alert = function(text) {
      alert(text);
    };
  });*/
