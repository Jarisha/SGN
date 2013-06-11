var FrontController = ['$scope', '$rootScope', '$http', '$location', '$templateCache',
                       '$timeout', '$routeParams', 'resolveFront', 'gamepinService', '$window',
  function($scope, $rootScope, $http, $location, $templateCache,
           $timeout, $routeParams, resolveFront, gamepinService, $window){
      /**** Resolve Data ***/
    $scope.showPins = [];
    $scope.gamePins = resolveFront;
    
    $scope.recommendedPins = [];
    
    /**** Scope Variables - Variables shared with View ****/
    $rootScope.css = 'front';
    $scope.modals = $rootScope.rootPath + '/partials/modals';
    $scope.subnav = $rootScope.rootPath + '/partials/front/front_subnav';
    $scope.nav = $rootScope.rootPath + '/partials/navbar';
    $scope.content = $rootScope.rootPath + '/partials/front_content';
    $scope.searchText = '';
    $scope.appendHtml = '';
    $scope.container = $('#content');
    $scope.masonInit = true;
    $scope.flag = true;
    
    $scope.bigPin = {};
    $scope.bigPin.followBtn = true;
                      
    var pinIndex = 0;
    var pinLimit = 20;
    var pinStop = 0;
    
    /*** Initialization ***/
    loadFirst();
    
    $scope.fbModal = function(){
      $('#fbRegisterModal').modal();
    }
    $scope.changeState = function(){
      $scope.masonInit = false;
    }
    
    //load more pins when user scrolls down to a certain point
    $window.onscroll = function(e){
      var a = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      var b = $window.pageYOffset;
      
      if($scope.flag && (a-b) <= 300){
        if((a-b) <= 100){
          $('.rackspace_logo').fadeIn();
        }
        //else $('.rackspace_logo').fadeOut();
        $scope.$apply($scope.loadMore());
        $scope.flag = false;
      }
      if(a - b >= 400){
       $('.rackspace_logo').fadeOut();
      }
    }
    
    //Setup non AJAX related javascript => goto front.js
    $scope.setup = function(){
      frontSetup($scope, $rootScope, $http);
    }
    
    /* AJAX FUNCTIONS */
    $scope.getfront = function(){
      $rootScope.destroyMason();
      $scope.showPins = [];
      gamepinService.getPinList(function(data){
        $scope.gamePins = data.objects;
        pinIndex = 0;
        pinLimit = 20;
        pinStop = 0;
        loadFirst();
      });
    }
    //getPinList
    //cat search and text search are currently just filtering the front page content
    $scope.catSearch = function(cat){
      var categoryList = [];
      gamepinService.categorySearch(cat, function(data){
        $scope.gamePins = data.objects;
        next();
      });
      function next(){
        categoryList = $scope.gamePins;
        pinIndex = 0;
        pinLimit = 20;
        pinStop = 0;
        $scope.showPins = [];
        $scope.gamePins = categoryList;
        loadFirst();
      }
    }
    $scope.textsearch = function(txt){
      var textList = [];
      //TODO: Do real text search here.
      gamepinService.textSearch(txt, function(data){
        $scope.gamePins = data.objects;
        next();
      });
      function next(){
        textList = $scope.gamePins;
        pinIndex = 0;
        pinLimit = 20;
        pinStop = 0;
        $scope.showPins = [];
        $scope.gamePins = textList;
        loadFirst();
      }
    }
    
    //simply remove all gamepins that do not match a follower in the list
    $scope.getFollowing = function(){
      var followingHash = {};
      var following;
      $scope.showPins = [];
      $rootScope.destroyMason();
      $http({ method: 'post', url:'/api/user/getProfile', data: {email: $rootScope.userEmail} })
        .success(function(data, status, headers, config){
          following = data.profileData.following;
          for(i = 0, len = following.length; i < len; i++)
            followingHash[following[i].userName] = true;
          next();
        })
        .error(function(data, status, headers, config){
          alert(data);
        });
        
      function next(){
        var temp = $scope.gamePins.slice();
        var remove = [];
        for(i = 0; i < temp.length; i++){
          if(!followingHash[temp[i].poster]){
            temp.splice(i, 1);
            i--;
          }
        }
        $scope.gamePins = temp;
        pinIndex = 0;
        pinLimit = 20;
        pinStop = 0;
        loadFirst();
        $rootScope.masonry();
      }
    }
    
    
    
    //reorder (sort) gamepins list in order of sum of comments + likes
    $scope.getPopular = function(){
      $scope.showPins = [];
      $rootScope.destroyMason();
      var sortedList = $scope.gamePins.slice();
      sortedList.sort(popularSort);
      $scope.gamePins = sortedList;
      pinIndex = 0;
      pinLimit = 20;
      pinStop = 0;
      loadFirst();
      
      $rootScope.masonry();
      
      function popularSort(a, b){
        if((a.comments.length + a.likedBy.length) < (b.comments.length + b.likedBy.length))
          return 1;
        else
          return -1;
      }
      
      /*$rootScope.destroyMason();
      $scope.gamePins.sort(popularSort);
      var sorted_temp = $scope.gamePins;
      $scope.gamePins = [];
      $scope.gamePins = sorted_temp;
      loadFirst();
      
      console.log('hello world where is the beach?');
      
      /*temp = $scope.gamePins;
      $scope.gamePins = [];
      $scope.gamePins = temp;
      for(i = 0, len = $scope.gamePins.length;  i < len; i++){
        console.log($scope.gamePins[i].comments.length + $scope.gamePins[i].likedBy.length);
      }*/
    }
    
    //popRecommended
    $rootScope.popRecommended = function(index){
      $('#gamePinModal').modal('hide');
      $scope.viewBigPin(index);
    }
    
    //trigger enlarged Gamepin
    $scope.viewBigPin = function(index){
      //($scope.showPins[index]);
      
      console.log($scope.showPins[index].poster);
      
      $('.view_vid').empty();
      //pass in ID, get pin obj data.  Access via Angular service.
      gamepinService.getPinData($scope.showPins[index].id, function(data){
        $scope.bigPin.index = index;
        $scope.bigPin = $scope.showPins[index];  //category, comments, description, id, imageUrl, imgPath, posterName, posterImg
        $scope.bigPin.posterImg = $scope.bigPin.posterImg || $rootScope.rootPath + '/images/30x30.gif';
        $scope.bigPin.gameName = data.gameName;
        $scope.bigPin.publisher = data.publisher;
        $scope.bigPin.datePosted = data.datePosted;
        $scope.bigPin.videoEmbed = data.videoEmbed;
        $scope.bigPin.comments = data.comments;
        console.log($scope.bigPin.posterName + ' === ' + $rootScope.userName);
        if($scope.bigPin.videoEmbed){
          var videoIframe = $.parseHTML($scope.bigPin.videoEmbed);
          videoIframe[0].width = "560";
          videoIframe[0].height = "341";
          $('.view_vid').append(videoIframe);
        }
        $scope.recommendedPins = [];
        //populate recommended sidebar and pop modal
        for(i = 0, len = $scope.showPins.length; i < len; i++){
          if(($scope.showPins[i].category === $scope.bigPin.category) && $scope.showPins[i].id !== $scope.bigPin.id){
            $scope.recommendedPins.push({ index: i,
                                          image: $scope.showPins[i].imageUrl || $scope.showPins[i].sourceUrl,
                                          link: '/post/'+$scope.showPins[i].id });
          }
        }
        $('#recommend_sidebar').css('display', 'block');
        $('#gamePinModal').modal({ dynamic: true });
        $http({ method: 'post', url: '/api/getFollowers', data: { email: $rootScope.userEmail } })
          .success(function(data, status, headers, config){
            if(data.error) $rootScope.popNotify('Error', data.error);
            else if(data.success){
              var following = data.following;
              var $followBtn = $('#gamePinModal .follow');
              if( $scope.showPins[index].poster === $rootScope.userName || 
                  following.indexOf($scope.bigPin.posterId) !== -1) $scope.bigFollowBtn = false;
              else $scope.bigFollowBtn = true;
            }
          })
          .error(function(data, status, headers, config){
          });
        
        //then spawn modal $('#gamePinModal').modal({dynamic: true});
      });
    }
    
    //follow user while looking at big Pin.  Need to fetch user id, then pass that to /api/follow
    $scope.follow = function(targetName){
      var promise = $rootScope.follow(targetName);
      promise.then(function(result){
        $scope.bigPin.followBtn = false;
      },
      function(reason){
        console.log('$rootScope follow failed');
        $scope.bigPin.followBtn = false;
      });
    }
    //Must do a POST, otherwise response is cached
    
    //Called after our modals have loaded, do anything that needs to be done
    $scope.setupModals = function(){
      $rootScope.setupPostContent();
      // If user returns from facebook authentication, prompt a register modal prefilled with facebook data
      $http({ method: 'POST', url: '/api/facebookRegister' })
        .success(function(data, status, headers, config){
          if(data.fb){
            $rootScope.register.email = data.fbEmail;
            $rootScope.register.name = data.fbName;
            $rootScope.register.fbConnect = true;
            $('#fbRegisterModal').modal();
          }
        })
        .error(function(data, status, headers, config) {
          $scope.message = 'Server Error: ' + status;
        });
        
      //Pop notification if we just registered a new account successfully
      if(sessionStorage.registerAlert){
        $rootScope.popNotify(sessionStorage.registerAlert);
        sessionStorage.removeItem('registerAlert');
      }
    }
    //add comment via the big Pin
    $scope.addBigComment = function(text, index){
      $scope.bigPin.comments.push({ posterName: $rootScope.userName, content: text, posterImg: $rootScope.userImg });
      $http({ method:'post', url:'/api/gamepin/addComment',
        data:{pinId:  $scope.bigPin.id, posterId: $rootScope.userEmail, posterName: $rootScope.userName, content: text} })
        .success(function(data, status, headers, config){
          $('textarea.view_respond_txtarea').val('');
          $rootScope.remason();
        })
        .error(function(data, status, headers, config){
        });
    }
    
    //add comment via the front page
    $scope.addComment = function(text, index){
      //add the comment in the view
      ($rootScope.rootSettings);
      $scope.showPins[index].comments.push({posterName: $rootScope.userName, content: text, posterImg: $rootScope.userImg});
      
      $http({ method:'post', url:'/api/gamepin/addComment',
        data:{pinId: $scope.showPins[index].id, posterId: $rootScope.userEmail, posterName: $rootScope.userName, content: text} })
        .success(function(data, status, headers, config){
          if(data.error);
          $scope.text = null;
          $rootScope.remason();
        })
        .error(function(data, status, headers, config){
          ('error');
        });
      //API call to add comment to DB
    }
    //loadFirst to load initial gamepins into view
    function loadFirst(){
      for(pinStop = pinIndex + pinLimit; pinIndex < pinStop; pinIndex++){
        if($scope.gamePins[pinIndex]) $scope.showPins.push($scope.gamePins[pinIndex]);
        else break;
      }
    }
    //loadMore invoked to show more gamepins when the user scrolls down
    $scope.loadMore = function(){
      console.log('loadMore');
      var event = false;
      var newElements = [];
      for(pinStop = pinIndex + pinLimit; pinIndex < pinStop; pinIndex++){
        if($scope.gamePins[pinIndex]){
          newElements.push($scope.gamePins[pinIndex]);
          //$scope.showPins.push($scope.gamePins[pinIndex]);
        }
      }
      $scope.showPins = $scope.showPins.concat(newElements);
      $rootScope.reload();
      //force delay so that we don't load too much too fast
      $timeout( function(){ $scope.flag = true }, 100 );
    }
    //test usage only
    $scope.loadOne = function(){
      ('load Zs');
      $scope.showPins.push({id:'Z', description:'Z', poster:'Z', category:'Z'});
      $scope.showPins.push({id:'Z', description:'Z', poster:'Z', category:'Z'});
      $scope.showPins.push({id:'Z', description:'Z', poster:'Z', category:'Z'});
      $scope.showPins.push({id:'Z', description:'Z', poster:'Z', category:'Z'});
      $scope.showPins.push({id:'Z', description:'Z', poster:'Z', category:'Z'});
      $scope.showPins.push({id:'Z', description:'Z', poster:'Z', category:'Z'});
      $timeout( function(){ $scope.flag = true }, 100 );
    }
    
    //affix subnav to top after it is loaded
    $scope.affix = function(){
      $('#subnav').affix({ offset: 42 });
    }
  }
];
FrontController.resolve = {
  resolveFront: ['$q', '$rootScope', 'gamepinService', function($q, $rootScope, gamepinService){
    var deferred = $q.defer();

    //hack to deal with links from modal windows
    $('#gamePinModal').modal('hide');
    
    $rootScope.checkLogin(function(err, login){
      if(err) deferred.reject(err);
      gamepinService.getPinList(function(data){
        if(data.objects){
          deferred.resolve(data.objects);
        }
        else deferred.reject("Error");
      });
    });
    return deferred.promise;
  }]
}