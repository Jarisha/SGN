function ProfileController($scope, $rootScope, $http, $location, $timeout, resolveProfile, gamepinService){
  console.log('ProfileController');
  $rootScope.css = 'profile';
  $rootScope.title = 'profile';

  //read resolveData into $scope variables
  $scope.R_Data = resolveProfile;
  $scope.timeline = resolveProfile.timeline;
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
  
  $scope.dummyData = {
    badges: [
      {url: "http://localhost/images/misc_images/badge1.png"},
      {url: "http://localhost/images/misc_images/badge1.png"},
      {url: "http://localhost/images/misc_images/badge1.png"},
      {url: "http://localhost/images/misc_images/badge1.png"}
    ],
    followers: [{url: "http://localhost/images/30x30.gif"}, {url: "http://localhost/images/30x30.gif"}],
    following: [{url: "http://localhost/images/30x30.gif"}, {url: "http://localhost/images/30x30.gif"}]
  };

  $scope.showPins = $scope.activityPins;
  $scope.groupList = [];
  $scope.groupData = {};

  $scope.modals = $rootScope.rootPath + '/partials/modals';
  $scope.subnav = null;
  $scope.nav = $rootScope.rootPath + '/partials/navbar';
  $scope.content = $rootScope.rootPath + '/partials/profile_content';
  //$scope.settings = {email: null, username: $scope.userName, gender: null, bio: null};
  $scope.masonInit = true;
  
  //tab state
  $scope.FOLLOW = 1; $scope.FRIEND = 2;
  $scope.GROUPS = 1; $scope.LIKES = 3;
  $scope.people_tab = $scope.FOLLOW;
  $scope.timeline_tab = "showAll";
  $scope.group_tab = null;
  $scope.bigPin = {};
  $scope.bigFollowBtn = false;
  $scope.changeImage = false;
  $scope.showGroups = false;
  
  $scope.changeState = function(){
    $scope.masonInit = false;
  }
  
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
      if(currEvent.targetData.userName !== $scope.profile.userName){
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

  $scope.getGroupData = function(){
    $scope.showGroups = true;
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
    $scope.group_tab = group;
    $scope.showPins = $scope.groupData[group]; //$scope.groupPins[group];
  }

  $scope.showLikes = function(){
    $scope.showGroups = false;
    $scope.group_tab = null;
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
