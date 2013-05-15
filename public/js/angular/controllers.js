'use strict';
/* Controllers
 * Angular controllers contain 2 way data-binded variables that are shared in the view.
 * The Angular router will detect url changes and route us to the correct controller + template.
 * The template will be used to fill ng-view, which represents all the html inside the <body></body>
 * Resolve functions are executed before routing to a specific controller.
 */

function FrontController($scope, $rootScope, $http, $location, $templateCache, $timeout, $routeParams, resolveFront,
                         gamepinService, $window){
  /**** Resolve Data ***/
  $scope.showPins = [];
  $scope.gamePins = resolveFront;

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
  //If doing facebook register, spawn modal with fb data prefilled
  $scope.catSearch = function(cat){
    var categoryList = [];
    gamepinService.getPinList(function(data){
      $scope.gamePins = data.objects;
      next();
    });
    function next(){
      for(var pin in $scope.gamePins){
        if($scope.gamePins[pin].category === cat) categoryList.push($scope.gamePins[pin]);
      }
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
    gamepinService.getPinList(function(data){
      $scope.gamePins = data.objects;
      next();
    });
    function next(){
      for(var pin in $scope.gamePins){
        if($scope.gamePins[pin].description.indexOf(txt) !== -1) textList.push($scope.gamePins[pin]);
      }
      pinIndex = 0;
      pinLimit = 20;
      pinStop = 0;
      $scope.showPins = [];
      $scope.gamePins = textList;
      loadFirst();
    }
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
    ($rootScope.userImg);
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
  /* code run in front controller */
  //$scope.facebookRegister();
  
  //affix subnav
}
FrontController.resolve = {
  resolveFront: function($q, $rootScope, gamepinService){
    var deferred = $q.defer();
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
  }
}
function StoreController($scope, $rootScope, $http, $location, $templateCache, resolveStore){
  /* $scope wide variables, binded to view */
  $rootScope.css = 'store';
  $rootScope.title = 'front';
  //$scope.modals = $rootScope.rootPath + '/partials/modals';
  $scope.subnav = $rootScope.rootPath + '/partials/store_subnav';
  $scope.nav = $rootScope.rootPath + '/partials/navbar';
  $scope.content = $rootScope.rootPath + '/partials/store_content';
  $scope.register = {name: null, password: null, confirm: null};
  $scope.login = {name: null, password: null};
  
  /* temp variables - used only in this controller */
  
  //Setup non AJAX related javascript
  $scope.setup = function(){
    storeSetup($scope);
  } 
  //Youtube video functionality
  /*function onYouTubePlayerReady(playerId){
    (playerId);
    ('onYouTubePlayerReady');
  }*/
  
  /* AJAX FUNCTIONS */
  $scope.ajaxLogin = function(){
    ('rootScope.login()');
    $http({ method: 'POST', url: '/api/login', data:
          {"email": $scope.login.email, "password": $scope.login.password }})
      .success(function(data, status, headers, config){
        if(data.login){
          $rootScope.loggedIn = true;
          $rootScope.userEmail = data.userEmail;
          $rootScope.userName = data.userName;
          $rootScope.userEmail = data.userId;
          $scope.status = 'Login Successful!';
          $('#loginModal').modal('hide');
          
          /* If cached, reload and cache partials effected by login */
          /* This is a method to force reload subsections of pages */
          if($templateCache.get('partials/front_subnav')){
            $templateCache.remove('partials/front_subnav');
            $http.get('partials/front_subnav', {cache:$templateCache});
          }
          if($templateCache.get('partials/navbar')){
            $templateCache.remove('partials/navbar');
            $http.get('partials/navbar', {cache:$templateCache});
          }
          $rootScope.remason();
        }
        else if(!data.login && data.error){
          $scope.status = 'Login Failed: ' + data.error;
        }
        else{
          $scope.status = 'Login Failed: AJAX error';
        }
      })
      .error(function(data, status, headers, config){
        $scope.message = 'Server Error: ' + status;
      });
  }
  $scope.ajaxRegister = function(){
    $http({ method: 'POST', url: '/api/register', data:
          {"email": $scope.register.email ,"name": $scope.register.name,
          "password": $scope.register.password, "confirm": $scope.register.confirm }})
      .success(function(data, status, headers, config){
        //on success set view vars and log in user
        if(data.register){
          $rootScope.loggedIn = true;
          $rootScope.userEmail = data.userEmail;
          $rootScope.userName = data.userName;
          $rootScope.userEmail = data.userId;
          $scope.status = 'Registration Successful!';
          
          $('#registerModal').modal('hide');
          $location.path('/');
        }
        else if(!data.register && data.error){
          $scope.status = data.error;
        }
        else{
          $scope.status = 'AJAX error';
        }
      })
      .error(function(data, status, headers, config){
        $scope.status = 'Error: ' + status;
      });
  }
  $scope.ajaxLogout = function(){
    $rootScope.logout( function(res){
      if(res.message) $scope.status = res.message;
    });
  }
}
StoreController.resolve = {
  resolveStore: function($q, $rootScope, $location){
    var deferred = $q.defer();
    $rootScope.checkLogin(function(err, login){
      if(err) deferred.reject(err);
      else if(!login) $location.path('/');
      else deferred.resolve();
    });
    return deferred.promise;
  }
}
function ProfileController($scope, $rootScope, $http, $location, $timeout, resolveProfile, gamepinService){
  console.log('ProfileController');
  //read resolveData into $scope variables
  $scope.R_Data = resolveProfile;
  
  $scope.activityPins = resolveProfile.activityData;
  $scope.profile = resolveProfile.profileData;
  
  $scope.profile.bio = $scope.profile.bio || null;
                                       /*'User bio text. Sample user bio text. Sample user bio text staggered.\
                                        User bio text. Sample user bio text. Sample user bio text staggered.\
                                        User bio text. Sample user bio text. Sample user bio text staggered.\
                                        User bio text. Sample user bio text. Sample user bio text staggered.\
                                        User bio text. Sample user bio text. Sample user bio text staggered.\
                                        User bio text. Sample user bio text. Sample user bio text staggered.\
                                        User bio text. Sample user bio text. Sample user bio text staggered.\
                                        User bio text. Sample user bio text. Sample user bio text staggered.\
                                        User bio text. Sample user bio text. Sample user bio text staggered.\
                                        User bio text. Sample user bio text. Sample user bio text staggered.\
                                        User bio text. Sample user bio text. Sample user bio text staggered.\
                                        User bio text. Sample user bio text. Sample user bio text staggered.\
                                        User bio text. Sample user bio text. Sample user bio text.'; */
  
  $scope.showPins = $scope.activityPins;
  console.log('here');
  
  $scope.groupList = [];
  $scope.groupData = {};
  
  $rootScope.css = 'profile';
  $rootScope.title = 'profile';
  $scope.modals = $rootScope.rootPath + '/partials/modals';
  $scope.subnav = null;
  $scope.nav = $rootScope.rootPath + '/partials/navbar';
  $scope.content = $rootScope.rootPath + '/partials/profile_content';
  //$scope.settings = {email: null, username: $scope.userName, gender: null, bio: null};
  $scope.groupToggle = false;
  $scope.masonInit = true;
  console.log('here1');
  
  //$scope.displayMode = 'activity';
  $scope.displayMode = {};
  $scope.displayMode.activity = true;
  $scope.displayMode.group = false;
  
  //tab state
  $scope.FOLLOW = 1; $scope.FRIEND = 2;
  $scope.GROUPS = 1; $scope.POSTS = 2; $scope.LIKES = 3; $scope.ACTIVITY = 4;
  $scope.people_tab = $scope.FOLLOW;
  $scope.content_tab = $scope.ACTIVITY;
  
  $scope.bigPin = {};
  $scope.bigFollowBtn = false;
  $scope.changeImage = false;
  
  $scope.changeState = function(){
    $scope.masonInit = false;
  }
  
  $scope.setup = function(){
    ('setup profile UI');
    
    //"Scroll to Top" button
    $(window).scroll(function(){
        if ($(this).scrollTop() > 200) {
            $('#scrollup').fadeIn();
        } else {
            $('#scrollup').fadeOut();
        }
    });
    
    var $changeAvatar = $('.change_avatar');
    
    $scope.scrollup = function(){
      ('scrollup');
      $("html, body").animate({ scrollTop: 0 }, 600);
    }
  }

  /* AJAX FUNCTIONS */
  $scope.ajaxLogout = function(){
    $rootScope.logout( function(res){
      if(res.message) $scope.status = res.message;
    });
  }
  
  //trigger enlarged Gamepin
  $scope.viewBigPin = function(pin){
    $('.view_vid').empty();
    //pass in ID, get pin obj data.  Access via Angular service.
    gamepinService.getPinData(pin.id, function(data){
      $scope.bigPin = pin; //category, comments, description, id, imageUrl, imgPath, poster, posterImg
      //$scope.bigPin.posterImg = $scope.bigPin.posterImg || $rootScope.rootPath + '/images/30x30.gif';
      $scope.bigPin.gameName = data.gameName;
      $scope.bigPin.publisher = data.publisher;
      $scope.bigPin.datePosted = data.datePosted;
      $scope.bigPin.videoEmbed = data.videoEmbed;
      $scope.bigPin.comments = data.comments;
      if($scope.bigPin.videoEmbed){
        var videoIframe = $.parseHTML($scope.bigPin.videoEmbed);
        videoIframe[0].width = "560";
        videoIframe[0].height = "341";
        $('.view_vid').append(videoIframe);
      }
      $('#gamePinModal').modal({ dynamic: true });
      $http({ method: 'post', url: '/api/getFollowers', data: { email: $rootScope.userEmail } })
        .success(function(data, status, headers, config){
          if(data.error) $rootScope.popNotify('Error', data.error);
          else if(data.success){
            var following = data.following;
            var $followBtn = $('#gamePinModal .follow');
            if(following.indexOf($scope.bigPin.posterId) !== -1) $scope.bigFollowBtn = false;
            else $scope.bigFollowBtn = true;
          }
        })
        .error(function(data, status, headers, config){
          console.log(data);
        });
    });
  }
  
  $scope.addBigComment = function(text, index){
    $scope.bigPin.comments.push({ posterName: $rootScope.userName, content: text, posterImg: $rootScope.userImg });
    $http({ method:'post', url:'/api/gamepin/addComment',
      data:{pinId:  $scope.bigPin.id, posterId: $rootScope.userEmail, posterName: $rootScope.userName, content: text} })
      .success(function(data, status, headers, config){
        $('textarea.view_respond_txtarea').val('');
      })
      .error(function(data, status, headers, config){
      });
  }
  
  $scope.toggleCategories = function(){
    if(!$scope.groupToggle){
      $('#view_groups .dropdown-menu').css('display', 'block');
      $scope.groupToggle = true;
    }
    else{
      ('hide');
      $('#view_groups .dropdown-menu').css('display', 'none');
      $scope.groupToggle = false;
    }
  }
  
  $scope.getGroupData = function(){
    $scope.displayMode.activity = false;
    $scope.displayMode.group = true;
    $http({ method:'post', url:'/api/user/getGroups', data: {userName: $scope.profile.userName} })
      .success(function(data, status, headers, config){
        $scope.groupList = [];
        $scope.groupData = data.groups;
        for(var g in data.groups){
          $scope.groupList.push(g);
        }
        $scope.showPins = null;
      })
      .error(function(data, status, headers, config){
        console.log(data);
      });
  }
  $scope.showGroup = function(group){
    $scope.showPins = $scope.groupData[group]; //$scope.groupPins[group];
  }
  $scope.showActivity = function(){
    $scope.displayMode.activity = true;
    $scope.displayMode.group = false;
    $scope.showPins = $scope.activityPins;
  }
  $scope.showLikes = function(){
    $http({ method: 'post', url:'/api/user/getLikedPins', data: { email: $scope.profile.email, pinIds: $scope.profile.likes} })
      .success(function(data, status, headers, config){
        if(data.error) $rootScope.popNotify('Error', data.error);
        else if(data.likedPins){
          //$rootScope.popNotify('Success', data.success);
          $scope.showPins = data.likedPins;
        }
      })
      .error(function(data, status, headers, config){
        console.log(data);
      });
  }
  
  //TODO: this
  /*$scope.getLikes = function(){
    console.log(userEmail);
    $http({ method:'post', url:'/api/user/getLikes', data: {likeIds } })
      .success(function(data, status, headers, config){
      })
      .error(function(data, status, headers, config){
      });
  }*/
  
  //$scope.getProfile();
}
ProfileController.resolve = {
  resolveProfile: function($q, $rootScope, $location, $http, $timeout){
    var deferred = $q.defer();
    
    //get session data + login state
    $rootScope.checkLogin(function(err, login){
      if(err) deferred.reject(err);
      else if(!login) $location.path('/');
      else {
        //get User Profile data + activity pins
        $http({ method: 'post', url:'/api/user/getProfile', data: {userName: $rootScope.userName} })
          .success(function(data, status, headers, config){
            if(data.error) deferred.reject(); //$rootScope.$apply(deferred.reject(data.error));
            deferred.resolve(data);
            //$rootScope.$apply(deferred.resolve(data));
          })
          .error(function(data, status, headers, config){
            deferred.reject(data);  //$rootScope.$apply(deferred.reject(data));
          });
      }
    });
    return deferred.promise;
  }
}
function UserController($scope, $rootScope, $http, $location, $routeParams, resolveUser, gamepinService){
  console.log('UserController');
  $rootScope.css = 'profile';
  $rootScope.title = 'user';
  
  // get resolve data into view
  $scope.activityPins = resolveUser.activityData;
  $scope.user = resolveUser.profileData;
  $scope.user.bio = $scope.user.bio || null;
                                       /* 'User bio text. Sample user bio text. Sample user bio text staggered.\
                                        User bio text. Sample user bio text. Sample user bio text staggered.\
                                        User bio text. Sample user bio text. Sample user bio text staggered.\
                                        User bio text. Sample user bio text. Sample user bio text staggered.\
                                        User bio text. Sample user bio text. Sample user bio text staggered.\
                                        User bio text. Sample user bio text. Sample user bio text staggered.\
                                        User bio text. Sample user bio text. Sample user bio text staggered.\
                                        User bio text. Sample user bio text. Sample user bio text staggered.\
                                        User bio text. Sample user bio text. Sample user bio text staggered.\
                                        User bio text. Sample user bio text. Sample user bio text staggered.\
                                        User bio text. Sample user bio text. Sample user bio text staggered.\
                                        User bio text. Sample user bio text. Sample user bio text staggered.\
                                        User bio text. Sample user bio text. Sample user bio text.'; */
  
  $scope.showPins = $scope.activityPins;
  $scope.bigPin = {};
  $scope.bigPin.followBtn = false;
  $scope.isFollowing = false;
  
  //$scope.displayMode = 'activity';
  $scope.displayMode = {};
  $scope.displayMode.activity = true;
  $scope.displayMode.group = false;
  
  $scope.groupList = [];
  $scope.groupData = {};
  $scope.showGroup = null;
  
  $scope.FOLLOW = 1; $scope.FRIEND = 2;
  $scope.GROUPS = 1; $scope.POSTS = 2; $scope.LIKES = 3; $scope.ACTIVITY = 4;
  $scope.people_tab = $scope.FOLLOW;
  $scope.content_tab = $scope.ACTIVITY;
  
  // confirm the partials we want to load in
  $scope.modals = $rootScope.rootPath + '/partials/modals';
  /*$scope.modals = $rootScope.rootPath + '/partials/modals';
  $scope.subnav = null;
  $scope.nav = $rootScope.rootPath + '/partials/navbar';
  $scope.content = $rootScope.rootPath + '/partials/user_content';
  $scope.content = $rootScope.rootPath + '/partials/user_content';*/
  
  // disable following button if already following ( this should be done on backend )
  for(var i = 0, len = $scope.user.followers.length; i < len; i++){
    ($scope.user.followers[i]);
    if($scope.user.followers[i].userName === $rootScope.userName){
      $scope.isFollowing = true;
      break;
    }
  }
  
  //hack to get masonry to work.  This code works with an Angular directive.
  $scope.masonInit = true;
  $scope.changeState = function(){
    $scope.masonInit = false;
  }
  
  //setup UI related things
  $scope.setup = function(){
    //"Scroll to Top" button
    $(window).scroll(function(){
        if ($(this).scrollTop() > 200) {
            $('#scrollup').fadeIn();
        } else {
            $('#scrollup').fadeOut();
        }
    });
    
    var $changeAvatar = $('.change_avatar');
    
    $scope.scrollup = function(){
      $("html, body").animate({ scrollTop: 0 }, 600);
    }
  }
  
  $scope.viewBigPin = function(pin){
    gamepinService.getPinData(pin.id, function(data){
      $scope.bigPin = pin;
      //$scope.bigPin = $scope.showPins[index];  //category, comments, description, id, imageUrl, imgPath, poster, posterImg
      //$scope.bigPin.posterImg = $scope.bigPin.posterImg || $rootScope.rootPath + '/images/30x30.gif';
      $scope.bigPin.gameName = data.gameName;
      $scope.bigPin.publisher = data.publisher;
      $scope.bigPin.datePosted = data.datePosted;
      $scope.bigPin.videoEmbed = data.videoEmbed;
      $scope.bigPin.comments = data.comments;
      if($scope.bigPin.videoEmbed){
        var videoIframe = $.parseHTML($scope.bigPin.videoEmbed);
        videoIframe[0].width = "560";
        videoIframe[0].height = "341";
        $('.view_vid').append(videoIframe);
      }
      $('#gamePinModal').modal({ dynamic: true });
      $http({ method: 'post', url: '/api/getFollowers', data: { email: $rootScope.userEmail } })
        .success(function(data, status, headers, config){
          if(data.error) $rootScope.popNotify('Error', data.error);
          else if(data.success){
            var following = data.following;
            if(following.indexOf($scope.bigPin.posterId) !== -1) $scope.bigPin.followBtn = false;
            else $scope.bigPin.followBtn = true;
          }
        })
        .error(function(data, status, headers, config){
          console.log(data);
        });
    });
  }
  
  $scope.addBigComment = function(text, index){
    $scope.bigPin.comments.push({ posterName: $rootScope.userName, content: text, posterImg: $rootScope.userImg });
    $http({ method:'post', url:'/api/gamepin/addComment',
      data:{pinId:  $scope.bigPin.id, posterId: $rootScope.userEmail, posterName: $rootScope.userName, content: text} })
      .success(function(data, status, headers, config){
        $('textarea.view_respond_txtarea').val('');
      })
      .error(function(data, status, headers, config){
      });
  }
  
  //TODO: Change to 1 AJAX call, let backend do the work
  $scope.follow = function(targetName){
    var promise = $rootScope.follow(targetName);
    promise.then(function(result){
      $('#follow_user').attr('disabled', 'disabled');
    },
    function(reason){
      console.log('$rootScope follow failed');
      $scope.bigFollowBtn = false;
    });
  }
  
  /*$scope.toggleCategories = function(){
    ('showCategories');
    if(!$scope.groupToggle){
      ('show');
      $('#view_groups .dropdown-menu').css('display', 'block');
      $scope.groupToggle = true;
    }
    else{
      ('hide');
      $('#view_groups .dropdown-menu').css('display', 'none');
      $scope.groupToggle = false;
    }
  }*/
  
  $scope.getGroupData = function(){
    //$scope.displayMode = 'group';
    $scope.displayMode.activity = false;
    $scope.displayMode.group = true;
    $http({ method:'post', url:'/api/user/getGroups', data: {userName: $scope.user.userName} })
      .success(function(data, status, headers, config){
        $scope.groupList = [];
        $scope.groupData = data.groups;
        for(var g in data.groups){
          $scope.groupList.push(g);
        }
        $scope.showPins = null;
      })
      .error(function(data, status, headers, config){
        console.log(data);
      });
  }
  
  $scope.showGroup = function(group){
    $rootScope.destroyProfileMason();
    $scope.showPins = $scope.groupData[group]; //$scope.groupPins[group];
    //$rootScope.profileReload();
  }
  $scope.showActivity = function(){
    $rootScope.destroyProfileMason();
    $scope.displayMode.activity = true;
    $scope.displayMode.group = false;
    $scope.showPins = $scope.activityPins;
    $rootScope.profileMasonry();
    //$rootScope.profileReload();
  }  
  $scope.showLikes = function(){
    $rootScope.destroyProfileMason();
    $http({ method: 'post', url:'/api/user/getLikedPins', data: { email: $scope.user.email, pinIds: $scope.user.likes} })
      .success(function(data, status, headers, config){
        if(data.error) $rootScope.popNotify('Error', data.error);
        else if(data.likedPins){
          //$rootScope.popNotify('Success', data.success);
          $scope.showPins = data.likedPins;
        }
      })
      .error(function(data, status, headers, config){
        console.log(data);
      });
  }
  
  $scope.ajaxLogout = function(){
    $rootScope.logout( function(res){
      if(res.message) $scope.status = res.message;
    });
  }
}

UserController.resolve = {
  resolveUser: function($q, $route, $rootScope, $location, $http, $routeParams, $window){
    var deferred = $q.defer();
    var user = $route.current.params.username;
    if(user === $rootScope.userName) $location.path('/profile');
    
    $rootScope.checkLogin(function(err, login){
      if(err) deferred.reject();
      else if(!login) $location.path('/');
      else{
        (user);
        //get User Profile data + activity pins
        $http({ method: 'post', url:'/api/user/getProfile', data: {userName: user} })
          .success(function(data, status, headers, config){
            if(data.error) deferred.reject();
            deferred.resolve(data);
          })
          .error(function(data, status, headers, config){
            deferred.reject(data);
          });
      }
    });
    return deferred.promise;
  }
}

function AboutController($scope, $rootScope, $http, $location, resolveAbout, $routeParams){
  $rootScope.css = 'about';
  $rootScope.title = 'about';
  $scope.modals = $rootScope.rootPath + '/partials/modals';
  $scope.subnav = null;
  $scope.nav = $rootScope.rootPath + '/partials/navbar';
  $scope.content = $rootScope.rootPath + '/partials/about/about_content';
  $scope.section = $rootScope.rootPath + '/partials/about/faq';

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
AboutController.resolve = {
  resolveAbout: function($q, $rootScope, $location){
    var deferred = $q.defer();
    ('AboutController');
    $rootScope.checkLogin(function(err, login){
      if(err) deferred.reject(err);
      else if(!login) $location.path('/');
      else deferred.resolve();
    });
    return deferred.promise;
  }
}


function TempController($scope, $rootScope, $http, $location, $routeParams){
  ('TempController');
}