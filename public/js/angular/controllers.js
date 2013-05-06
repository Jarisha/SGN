'use strict';
/* Controllers
 * Angular controllers contain 2 way data-binded variables that are shared in the view.
 * The Angular router will detect url changes and route us to the correct controller + template.
 * The template will be used to fill ng-view, which represents all the html inside the <body></body>
 * Resolve functions are executed before routing to a specific controller.
 */
 
function FrontController($scope, $rootScope, $http, $location, $templateCache, $timeout, $routeParams, resolveFront,
                         gamepinService, $window){
  $scope.showPins = [];
  $scope.gamePins = resolveFront;
  //console.log($scope.gamePins);
  var imgCount = 0;
  
  //(beforeFront);
  /* $scope wide variables, binded to view */
  $rootScope.css = 'front';
  //$rootScope.title = 'front';
  $scope.modals = $rootScope.rootPath + '/partials/modals';
  $scope.subnav = $rootScope.rootPath + '/partials/front_subnav';
  $scope.nav = $rootScope.rootPath + '/partials/navbar';
  $scope.content = $rootScope.rootPath + '/partials/front_content';
  $scope.loadIndex = 0;
  $scope.pages = [];
  $scope.newComment = { text: null };
  $scope.searchText = '';
  $scope.masonInit = false;
  $scope.appendHtml = '';
  $scope.container = $('#content');
  $scope.masonInit = true;
  $scope.flag = true;
  $scope.pinIndex = 0;
  $scope.pinInterval = 20;
  
  $scope.bigPin = {};
  $scope.bigFollowBtn = true;
                    
  var pinIndex = 0;
  var pinLimit = 20;
  var pinStop = 0;
  
  loadFirst();
  $scope.fbModal = function(){
    $('#fbRegisterModal').modal();
  }
  $scope.changeState = function(){
    $scope.masonInit = false;
  }
  
  //load more pins when user scrolls down to a certain point
  $window.onscroll = function(e){
    //var a = $window.scrollMaxY;
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

  
  /* temp variables - used only in this controller */
  var commentList = [];
  var interval = 20;
  
  //Setup non AJAX related javascript => goto front.js
  $scope.setup = function(){
    frontSetup($scope, $rootScope, $http);
  }
  
  /* AJAX FUNCTIONS */
  $scope.getfront = function(){
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
    ($scope.showPins[index]);
    $('.view_vid').empty();
    //pass in ID, get pin obj data.  Access via Angular service.
    gamepinService.getPinData($scope.showPins[index].id, function(data){
      $scope.bigPin.index = index;
      $scope.bigPin = $scope.showPins[index];  //category, comments, description, id, imageUrl, imgPath, poster, posterImg
      $scope.bigPin.posterImg = $scope.bigPin.posterImg || $rootScope.rootPath + '/images/30x30.gif';
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
        });
      
      //then spawn modal $('#gamePinModal').modal({dynamic: true});
    });
  }
  
  //follow user while looking at big Pin.  Need to fetch user id, then pass that to /api/follow
  $scope.follow = function(targetName){
    ('bigPin follow');
    $http({ method: 'post', url: '/api/getUser', data:{ name: targetName } })
      .success(function(data, status, headers, config){
        if(!data.exists) return;
        next(data.email);
      })
      .error(function(data, status, headers, config){
        ("AJAX Error: " + data);
        return;
      });
    function next(targetId){
      $http({ method:'post', url:'/api/follow', data: {sourceId: $rootScope.userEmail, targetId: targetId} })
        .success(function(data, status, headers, config){
          if(data.success){
            ('Now following' + targetId);
            $rootScope.popNotify('Now Following ' + targetName);
            $('#follow_user').attr('disabled', 'disabled');
          }
          if(data.error){
            $('#gamePinModal').modal('hide');
            $rootScope.popNotify('Error', data.error);
            (data.error);
          }
        })
        .error(function(data, status, headers, config){
          ('Error: ' + status);
        });
    }
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
        if(data.error) $rootScope.popNotify('Now Following ' + targetName);
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
    for(var i = 0; i < $scope.gamePins.length; i++){
      imgCount++;
      if(imgCount > 36)
        imgCount = 1;
      $scope.gamePins[i].imgPath = "http://dev.quyay.com:3000/images/game_images/images%20%28"+ imgCount +"%29.jpg";
    }
    //$rootScope.remason();
    ($scope.showPins[3]);
  }
  //loadMore invoked to show more gamepins when the user scrolls down
  $scope.loadMore = function(){
    //('loadMore');
    var event = false;
    for(pinStop = pinIndex + pinLimit; pinIndex < pinStop; pinIndex++){
      if($scope.gamePins[pinIndex]){
        $scope.showPins.push($scope.gamePins[pinIndex]);
      }
    }
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
          ("Login success: remason()");
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
  ('ProfileController');
  //read resolveData into $scope variables
  $scope.R_Data = resolveProfile;
  
  $scope.activityPins = resolveProfile.activityData;
  $scope.profile = resolveProfile.profileData;
  
  $scope.showPins = $scope.activityPins;
  
  //(resolveProfile);
  //$scope.activityPins = resolveProfile.activityData;
  //$scope.groupPins = resolveProfile.groups;
  /*$scope.showPins = $scope.activityPins;
  $scope.profile = resolveProfile.profileData;
  (resolveProfile.profileData);*/
  
  $rootScope.css = 'profile';
  $rootScope.title = 'profile';
  $scope.modals = $rootScope.rootPath + '/partials/modals';
  $scope.subnav = null;
  $scope.nav = $rootScope.rootPath + '/partials/navbar';
  $scope.content = $rootScope.rootPath + '/partials/profile_content';
  //$scope.settings = {email: null, username: $scope.userName, gender: null, bio: null};
  $scope.groupToggle = false;
  $scope.masonInit = true;
  
  $scope.bigPin = {};
  
  /*$scope.profile = {  name: null,
                      email: null,
                      fbConnect: null,
                      favCat: null,
                      profileImg: "",
                      gender: null,
                      bio: null,
                      dateJoined: null,
                      currXP: null,
                      nextXP: null,
                      level: null,
                      posts: [],
                      likes: [],
                      followers: [],
                      following: [],
                      friends: []
  };*/
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
  $scope.viewBigPin = function(index){
    console.log('viewBigPin');
    $('.view_vid').empty();
    console.log($scope.showPins[index]);
    //pass in ID, get pin obj data.  Access via Angular service.
    gamepinService.getPinData($scope.showPins[index].id, function(data){
      //(data);
      $scope.bigPin.index = index;
      $scope.bigPin = $scope.showPins[index];  //category, comments, description, id, imageUrl, imgPath, poster, posterImg
      $scope.bigPin.posterImg = $scope.bigPin.posterImg || $rootScope.rootPath + '/images/30x30.gif';
      $scope.bigPin.gameName = data.gameName;
      $scope.bigPin.publisher = data.publisher;
      $scope.bigPin.datePosted = data.datePosted;
      $scope.bigPin.videoEmbed = data.videoEmbed;
      $scope.bigPin.comments = data.comments;
      console.log($scope.bigPin);
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
  
  $scope.toggleCategories = function(){
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
  }
  
  $scope.showGroup = function(group){
    ('fire the showGroup');
    (group);
    $scope.showPins = $scope.groupPins[group];
    $rootScope.profileRemason();
  }
  $scope.showActivity = function(){
    $scope.showPins = $scope.activityPins;
    $rootScope.profileRemason();
  }
  
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

//Looking at another user's page
function UserController($scope, $rootScope, $http, $location, $routeParams, resolveUser){
  ('UserController');
  $rootScope.css = 'profile';
  $rootScope.title = 'user';
  
  // confirm the partials we want to load in
  $scope.modals = $rootScope.rootPath + '/partials/modals';
  $scope.subnav = null;
  $scope.nav = $rootScope.rootPath + '/partials/navbar';
  $scope.content = $rootScope.rootPath + '/partials/user_content';
  
  // get resolve data into view
  $scope.activityPins = resolveUser.activityData;
  $scope.user = resolveUser.profileData;
  $scope.isFollowing = false;
  
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
  
  //Doing 2 AJAX calls is retarded
  //TODO: Change to 1 AJAX call, let backend do the work
  $scope.follow = function(targetName){
    function next(targetId){
      $http({ method:'post', url:'/api/follow', data: {sourceId: $rootScope.userEmail, targetName: targetName} })
        .success(function(data, status, headers, config){
          if(data.success){
            $rootScope.popNotify('Success', 'Now Following ' + targetName);
            $('#follow_user').attr('disabled', 'disabled');
          }
          if(data.error){
            (error);
          }
        })
        .error(function(data, status, headers, config){
          ('Error: ' + status);
        });
    }
  }
  
  $scope.toggleCategories = function(){
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
  }
  
  $scope.showGroup = function(group){
    ('fire the showGroup');
    (group);
    $scope.showPins = $scope.groupPins[group];
    $rootScope.profileRemason();
  }
  $scope.showActivity = function(){
    $scope.showPins = $scope.activityPins;
    $rootScope.profileRemason();
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
  $scope.content = $rootScope.rootPath + '/partials/about_content';
  $scope.section = $rootScope.rootPath + '/partials/faq';
  
  ($routeParams);
  
  $scope.setup = function(){
    aboutSetup($scope);
  }
  $scope.viewFAQ = function(){
    $('.about_selected').removeClass('about_selected');
    $('.faq_slice').addClass('about_selected');
    $scope.section = $rootScope.rootPath + '/partials/faq';
  }
  $scope.viewToS = function(){
    $('.about_selected').removeClass('about_selected');
    $('.tos_slice').addClass('about_selected');
    $scope.section = $rootScope.rootPath + '/partials/tos';
  }
  $scope.viewPrivacy = function(){
    $('.about_selected').removeClass('about_selected');
    $('.privacy_slice').addClass('about_selected');
    $scope.section = $rootScope.rootPath + '/partials/privacy';
  }
  $scope.viewAcceptable = function(){
    $('.about_selected').removeClass('about_selected');
    $('.view_slice').addClass('about_selected');
    $scope.section = $rootScope.rootPath + '/partials/acceptable';
  }
  
  switch($routeParams.area){
    case 'faq':
      $('.about_selected').removeClass('about_selected');
      $('.faq_slice').addClass('about_selected');
      $scope.section = $rootScope.rootPath + '/partials/faq';
      $scope.viewFAQ();
      break;
    case 'tos':
      $('.about_selected').removeClass('about_selected');
      $('.tos_slice').addClass('about_selected');
      $scope.section = $rootScope.rootPath + '/partials/tos';
      $scope.viewToS();
      break;
    case 'privacy':
      $('.about_selected').removeClass('about_selected');
      $('.privacy_slice').addClass('about_selected');
      $scope.section = $rootScope.rootPath + '/partials/privacy';
      $scope.viewPrivacy();
      break;
    case 'acceptable':
      $('.about_selected').removeClass('about_selected');
      $('.view_slice').addClass('about_selected');
      $scope.section = $rootScope.rootPath + '/partials/acceptable';
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