function UserController($scope, $rootScope, $http, $location, $routeParams, resolveUser, gamepinService){
  console.log('UserController');
  $rootScope.css = 'profile';
  $rootScope.title = 'user';
  
  // get resolve data into view
  $scope.activityPins = resolveUser.activityData;
  $scope.timeline = resolveUser.timeline;
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
                                        User bio text. Sample user bio text. Sample user bio text.'; */
  
  $scope.showPins = $scope.activityPins;
  $scope.bigPin = {};
  $scope.bigPin.followBtn = false;
  $scope.isFollowing = false;
  $scope.isFriend = false;
  
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
  $scope.timeline_tab = "showAll";
  
  // confirm the partials we want to load in
  $scope.modals = $rootScope.rootPath + '/partials/modals';
  
    //figure out timeline stuff (too much logic to be done in view)
  for(var event in $scope.timeline){
    var currEvent = $scope.timeline[event]; 
    if(currEvent.action === 'commentPosted'){
      currEvent.message = 'Comment posted to '+currEvent.target;
      switch(currEvent.target){
        case 'Action & Adventure':
          currEvent.sourceImg = '/images/caticon-action22x22.png';
          break;
        case 'Arcade':
          currEvent.sourceImg = '/images/caticon-arcade22x22.png'
          break;
        case 'Board & Card':
          currEvent.sourceImg = '/images/caticon-card22x22.png'
          break;
        case 'Casino & Gambling':
          currEvent.sourceImg = '/images/caticon-casino22x22.png'
          break;
        case 'Educational':
          currEvent.sourceImg = '/images/caticon-educational22x22.png'
          break;
        case 'Family & Kids':
          currEvent.sourceImg = '/images/caticon-family22x22.png'
          break;
        case 'Music & Rhythm':
          currEvent.sourceImg = '/images/caticon-music22x22.png'
          break;
        case 'Puzzle':
          currEvent.sourceImg = '/images/caticon-puzzle22x22.png'
          break;
        case 'Racing':
          currEvent.sourceImg = '/images/caticon-racing22x22.png'
          break;
        case 'Role Playing':
          currEvent.sourceImg = '/images/caticon-rpg22x22.png'
          break;
        case 'Simulation':
          currEvent.sourceImg = '/images/caticon-simulation22x22.png'
          break;
        case 'Sports':
          currEvent.sourceImg = '/images/caticon-sports22x22.png'
          break;
        case 'Strategy':
          currEvent.sourceImg = '/images/caticon-strategy22x22.png'
          break;
        case 'Trivia & Word':
          currEvent.sourceImg = '/images/caticon-arcade22x22.png'
          break;
        default:
          alert('event image: default case');
          break;
      }
    }
    else if(currEvent.action === 'gamepinPosted'){
      currEvent.message = 'Posted to '+currEvent.target;
      switch(currEvent.target){
        case 'Action & Adventure':
          currEvent.sourceImg = '/images/caticon-action22x22.png';
          break;
        case 'Arcade':
          currEvent.sourceImg = '/images/caticon-arcade22x22.png'
          break;
        case 'Board & Card':
          currEvent.sourceImg = '/images/caticon-card22x22.png'
          break;
        case 'Casino & Gambling':
          currEvent.sourceImg = '/images/caticon-casino22x22.png'
          break;
        case 'Educational':
          currEvent.sourceImg = '/images/caticon-educational22x22.png'
          break;
        case 'Family & Kids':
          currEvent.sourceImg = '/images/caticon-family22x22.png'
          break;
        case 'Music & Rhythm':
          currEvent.sourceImg = '/images/caticon-music22x22.png'
          break;
        case 'Puzzle':
          currEvent.sourceImg = '/images/caticon-puzzle22x22.png'
          break;
        case 'Racing':
          currEvent.sourceImg = '/images/caticon-racing22x22.png'
          break;
        case 'Role Playing':
          currEvent.sourceImg = '/images/caticon-rpg22x22.png'
          break;
        case 'Simulation':
          currEvent.sourceImg = '/images/caticon-simulation22x22.png'
          break;
        case 'Sports':
          currEvent.sourceImg = '/images/caticon-sports22x22.png'
          break;
        case 'Strategy':
          currEvent.sourceImg = '/images/caticon-strategy22x22.png'
          break;
        case 'Trivia & Word':
          currEvent.sourceImg = '/images/caticon-arcade22x22.png'
          break;
        default:
          alert('event image: default case');
          break;
      }
    }
    else if(currEvent.action === 'followSent'){
      currEvent.message = 'Following '+currEvent.targetData.userName;
      currEvent.sourceImg = currEvent.targetData.profileImg || '/images/30x30.gif';
    }
    else if(currEvent.action === 'friendAccepted'){
      if(currEvent.targetData.userName !== $scope.user.userName){
        currEvent.message = 'Friended '+currEvent.targetData.userName;
        currEvent.sourceImg = currEvent.targetData.profileImg || '/images/30x30.gif';
        currEvent.targetLink = '/user/'+currEvent.targetData.userName;
      }
      else{
        currEvent.message = 'Friended '+currEvent.sourceData.userName;
        currEvent.sourceImg = currEvent.sourceData.profileImg || '/images/30x30.gif';
        currEvent.targetLink = '/user/'+currEvent.sourceData.userName;
      }
    }
  }
  
  // disable following button if already following ( this should be done on backend )
  for(var i = 0, len = $scope.user.followers.length; i < len; i++){
    if($scope.user.followers[i].userName === $rootScope.userName){
      $scope.isFollowing = true;
      break;
    }
  }
  for(var i = 0, len = $scope.user.friends.length; i < len; i++){
    if($scope.user.friends[i].userName === $rootScope.userName){
      $scope.isFriend = true;
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
      $scope.bigPin.gameName = data.gameName;
      $scope.bigPin.publisher = data.publisher;
      $scope.bigPin.datePosted = data.datePosted;
      $scope.bigPin.videoEmbed = data.videoEmbed;
      $scope.bigPin.comments = data.comments;
      $scope.bigPin.profileImg = data.profileImg || $rootScope.rootPath + '/images/30x30.gif';
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
  
  //popMessageModal
  $scope.popMessage = function(){
    var sourceId = $rootScope.userEmail;
    var targetId = $scope.user.email;
    
    var userData;
    // Fetch logged in user and view conversations to determine if these two users are engaged in conversation
    $http({ method: 'post', url:'/api/user/getProfile', data: { email: sourceId } })
      .success(function(data, status, headers, config){
        if(data.error) return $rootScope.popNotify('Error', 'Server Error');
        userData = data.profileData;
        next();
      })
      .error(function(data, status, headers, config){
        $rootScope.popNotify('Error', 'Server Error');
      });
    //check if users have each other in conversation list
    function next(){
      var flag1 = false;
      var flag2 = false;
      for(var a in userData.conversations){
        if(userData.conversations[a] && userData.conversations[a].target === targetId){
          flag1= true;
          break;
        }
      }
      for(var b in $scope.user.conversations){
        if($scope.user.conversations[b] && $scope.user.conversations[b].target === sourceId){
          flag2 = true;
          break;
        }
      }
      console.log(flag1 && flag2);
      //if so, pop conversation dialogue
      if(flag1 && flag2){
        for(var c in $rootScope.convoData){
          if($rootScope.convoData[c].targetUser === targetId){
            $rootScope.popConversation($rootScope.convoData[c]);
          }
        }
      }
      //else, pop message box
      else{
        $('#messageModal form')[0].reset();
        $('#messageModal').modal();
      }
    }
    /*$('#messageModal form')[0].reset();
    $('#messageModal').modal();*/
  }
  // send message, only used for initial message
  $scope.sendMessage = function(text){
    var sourceId = $rootScope.userEmail;
    var targetId = $scope.user.email;
    $rootScope.message(text, sourceId, targetId, function(errMessage, successMessage){
      if(errMessage) $rootScope.popNotify(errMessage);
      else if(successMessage) $rootScope.popNotify(successMessage);
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
  
  $scope.friend = function(){
    $http({ method: 'post', url:'/api/user/friendRequest', data:{ sourceId:$rootScope.userEmail, targetId: $scope.user.email } })
      .success(function(data, status, headers, config){
        if(data.success){
          $rootScope.popNotify(data.success);
        }
        else if(data.error){
          $rootScope.popNotify('Error', data.error);
        }
      })
      .error(function(data, status, headers, config){
        console.log(data);
      });
  }
}

UserController.resolve = {
  resolveUser: function($q, $route, $rootScope, $location, $http, $routeParams, $window){
    var deferred = $q.defer();
    var user = $route.current.params.username;
    if(user === $rootScope.userName) $location.path('/profile');
    
    //hack to deal with links from modal windows
    $('#gamePinModal').modal('hide');
    
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
