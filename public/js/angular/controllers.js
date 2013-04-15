'use strict';
/* Controllers
 * Angular controllers contain 2 way data-binded variables that are shared in the view.
 * The Angular router will detect url changes and route us to the correct controller + template.
 * The template will be used to fill ng-view, which represents all the html inside the <body></body>
 * Resolve functions are executed before routing to a specific controller.
 */
 
function FrontController($scope, $rootScope, $http, $location, $templateCache, $timeout, $routeParams, resolveFront,
                         gamepinService, $window){
  console.log('frontController');
  $scope.showPins = [];
  $scope.gamePins = resolveFront;
  //console.log($scope.gamePins);
  var imgCount = 0;
  
  //console.log(beforeFront);
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
    console.log($scope.showPins[index]);
    $('.view_vid').empty();
    gamepinService.getPinData($scope.showPins[index].id, function(data){
      //console.log(data);
      $scope.bigPin.index = index;
      $scope.bigPin = $scope.showPins[index];  //category, comments, description, id, imageUrl, imgPath, poster, posterImg
      $scope.bigPin.posterImg = $scope.bigPin.posterImg || $rootScope.rootPath + '/images/30x30.gif';
      $scope.bigPin.gameName = data.gameName;
      $scope.bigPin.publisher = data.publisher;
      $scope.bigPin.datePosted = data.datePosted;
      $scope.bigPin.videoEmbed = data.videoEmbed;
      if($scope.bigPin.videoEmbed){
        var videoIframe = $.parseHTML($scope.bigPin.videoEmbed);
        videoIframe[0].width = "560";
        videoIframe[0].height = "341";
        $('.view_vid').append(videoIframe);
      }
      $('#gamePinModal').modal({ dynamic: true });
      //then spawn modal $('#gamePinModal').modal({dynamic: true});
    });
  }
  
  //follow user while looking at big Pin.  Need to fetch user id, then pass that to /api/follow
  $scope.follow = function(targetName){
    console.log('bigPin follow');
    $http({ method: 'post', url: '/api/getUser', data:{ name: targetName } })
      .success(function(data, status, headers, config){
        if(!data.exists) return;
        console.log(data.email);
        next(data.email);
      })
      .error(function(data, status, headers, config){
        console.log("AJAX Error: " + data);
        return;
      });
    function next(targetId){
      $http({ method:'post', url:'/api/follow', data: {sourceId: $rootScope.userId, targetId: targetId} })
        .success(function(data, status, headers, config){
          if(data.success){
            console.log('Now following' + targetId);
            $rootScope.popNotify('Now Following ' + targetName);
            $('#follow_user').attr('disabled', 'disabled');
          }
          if(data.error){
            $('#gamePinModal').modal('hide');
            $rootScope.popNotify('Error', data.error);
            console.log(data.error);
          }
        })
        .error(function(data, status, headers, config){
          console.log('Error: ' + status);
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
          console.log('fb = true');
          $rootScope.register.email = data.fbEmail;
          $rootScope.register.name = data.fbName;
          $rootScope.register.fbConnect = true;
          $('#fbRegisterModal').modal();
        }
        else{
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
    console.log($rootScope.avatarUrl);
    $scope.bigPin.comments.push({ posterName: $rootScope.rootSettings.username, content: text, posterImg: $rootScope.avatarUrl });
    $http({ method:'post', url:'/api/gamepin/addComment',
      data:{pinId:  $scope.bigPin.id, posterId: $rootScope.userId, posterName: $rootScope.userName, content: text} })
      .success(function(data, status, headers, config){
        console.log('post big comment success!');
        $('textarea.view_respond_txtarea').val('');
        //$scope.big_text = null;
        $rootScope.remason();
      })
      .error(function(data, status, headers, config){
        console.log('error');
      });
  }
  
  //add comment via the front page
  $scope.addComment = function(text, index){
    //add the comment in the view
    $scope.showPins[index].comments.push({posterName: $rootScope.rootSettings.username, content: text, posterImg: $rootScope.avatarUrl});
    
    $http({ method:'post', url:'/api/gamepin/addComment',
      data:{pinId: $scope.showPins[index].id, posterId: $rootScope.userId, posterName: $rootScope.userName, content: text} })
      .success(function(data, status, headers, config){
        console.log('post comment success!');
        $scope.text = null;
        $rootScope.remason();
      })
      .error(function(data, status, headers, config){
        console.log('error');
      });
    //API call to add comment to DB
  }
  //loadFirst to load initial gamepins into view
  function loadFirst(){
    //console.log('loadFirst');
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
    console.log($scope.showPins[3]);
  }
  //loadMore invoked to show more gamepins when the user scrolls down
  $scope.loadMore = function(){
    //console.log('loadMore');
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
    console.log('load Zs');
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
        console.log(data);
        if(data.objects){
          deferred.resolve(data.objects);
        }
        else
          deferred.reject("Error");
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
    console.log(playerId);
    console.log('onYouTubePlayerReady');
  }*/
  
  /* AJAX FUNCTIONS */
  $scope.ajaxLogin = function(){
    console.log('rootScope.login()');
    $http({ method: 'POST', url: '/api/login', data:
          {"email": $scope.login.email, "password": $scope.login.password }})
      .success(function(data, status, headers, config){
        if(data.login){
          $rootScope.loggedIn = true;
          $rootScope.userEmail = data.userEmail;
          $rootScope.userName = data.userName;
          $rootScope.userId = data.userId;
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
          console.log("Login success: remason()");
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
          $rootScope.userId = data.userId;
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
function ProfileController($scope, $rootScope, $http, $location, $timeout , resolveProfile){
  console.log('ProfileController');
  $scope.activityPins = resolveProfile.activity;
  $scope.groupPins = resolveProfile.groups;
  $scope.showPins = $scope.activityPins;
  
  $rootScope.css = 'profile';
  $rootScope.title = 'profile';
  $scope.modals = $rootScope.rootPath + '/partials/modals';
  $scope.subnav = null;
  $scope.nav = $rootScope.rootPath + '/partials/navbar';
  $scope.content = $rootScope.rootPath + '/partials/profile_content';
  $scope.settings = {email: null, username: $scope.userName, gender: null, bio: null};
  $scope.groupToggle = false;
  
  $scope.profile = {  name: null,
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
  };
  $scope.changeImage = false;
  
  $scope.setup = function(){
    console.log('setup profile UI');
    
    //"Scroll to Top" button
    $(window).scroll(function(){
        if ($(this).scrollTop() > 200) {
            $('#scrollup').fadeIn();
        } else {
            $('#scrollup').fadeOut();
        }
    });
    
    var $changeAvatar = $('.change_avatar');
    /*$timeout(function(){ console.log($('.profile_pic')); }, 1000);
    console.log($('.profile_pic'));
    $(document).on('mouseenter', '.profile_pic', function(){$changeAvatar.removeClass('hidden'); });
    $(document).on('mouseleave', '.profile_pic', function(){$changeAvatar.addClass('hidden'); });*/
    
    /*$('.profile_pic').mouseenter(function(e){
      $changeAvatar.removeClass('hidden');
    }).mouseleave(function(e){
      $changeAvatar.addClass('hidden');
    });*/
    
    $scope.scrollup = function(){
      console.log('scrollup');
      $("html, body").animate({ scrollTop: 0 }, 600);
    }
  }
  
  /* AJAX FUNCTIONS */
  $scope.ajaxLogout = function(){
    $rootScope.logout( function(res){
      if(res.message) $scope.status = res.message;
    });
  }
  /* dummy profile for front end completion */
  
  $scope.getProfile = function(){
    $http({method:'post', url:'/api/getProfile', data:{ userEmail: $rootScope.userId }})
      .success(function(data, status, headers, config){
        if(data.error){
          console.log(error);
          return;
        }
        $scope.profile = data;
        //deal with logic in controller, not view
        //$scope.profile.profileImg = $scope.profile.profileImg || $rootScope.rootPath + '/images/160x160.gif';
        console.log($scope.profile);
      })
      .error(function(data, status, headers, config){
        console.log('Error: ' + status);
      });
  }
  
  $scope.toggleCategories = function(){
    console.log('showCategories');
    if(!$scope.groupToggle){
      console.log('show');
      $('#view_groups .dropdown-menu').css('display', 'block');
      $scope.groupToggle = true;
    }
    else{
      console.log('hide');
      $('#view_groups .dropdown-menu').css('display', 'none');
      $scope.groupToggle = false;
    }
  }
  
  $scope.showGroup = function(group){
    console.log('fire the showGroup');
    console.log(group);
    $scope.showPins = $scope.groupPins[group];
    $rootScope.profileRemason();
  }
  $scope.showActivity = function(){
    $scope.showPins = $scope.activityPins;
    $rootScope.profileRemason();
  }
  
  $scope.getProfile();
}
ProfileController.resolve = {
  resolveProfile: function($q, $rootScope, $location, $http){
    var deferred = $q.defer();
    var resultData = {};
    $rootScope.checkLogin(function(err, login){
      if(err) deferred.reject(err);
      else if(!login) $location.path('/');
      else next();
    });
    //get user Activity gamepin Data
    function next(){
      $http({ method: 'get', url:'/api/getActivity/' + $rootScope.rootSettings.username})
      .success(function(data, status, headers, config){
        if(data.error) deferred.reject(error);
        resultData.activity = data.activity;
        next2();
      })
      .error(function(data, status, headers, config){
        deffered.reject(data);
      });
    }
    //get user Group gamepin Data
    function next2(){
      $http({ method: 'get', url:'/api/getGroups/' + $rootScope.rootSettings.username})
      .success(function(data, status, headers, config){
        if(data.error) deferred.reject(data.error);
        resultData.groups = data.groups;
        deferred.resolve(resultData);
      })
      .error(function(data, status, headers, config){
        deffered.reject(data);
      });
    }
    return deferred.promise;
  }
}

//Looking at another user's page
function UserController($scope, $rootScope, $http, $location, $routeParams, resolveUser){
  console.log(resolveUser);
  $scope.activityPins = resolveUser.activity;
  $scope.groupPins = resolveUser.groups;
  $scope.showPins = $scope.activityPins;
  
  
  $rootScope.css = 'profile';
  $rootScope.title = 'user';
  console.log('UserController');
  
  /*$scope.activityPins = resolveUser.activity;
  $scope.groupPins = resolveUser.groups;
  $scope.showPins = $scope.activityPins;*/
  
  $scope.modals = $rootScope.rootPath + '/partials/modals';
  $scope.subnav = null;
  $scope.nav = $rootScope.rootPath + '/partials/navbar';
  $scope.content = $rootScope.rootPath + '/partials/user_content';
  //$scope.profile = {};
  $scope.user = {};
  $scope.isFollowing = false;
  
  $scope.setup = function(){
    //profileSetup($scope);
  }
  
  $scope.follow = function(targetName){
    console.log('userContoller follow');
    $http({ method: 'post', url: '/api/getUser', data:{ name: targetName } })
      .success(function(data, status, headers, config){
        if(!data.exists) return;
        console.log(data.email);
        next(data.email);
      })
      .error(function(data, status, headers, config){
        console.log("AJAX Error: " + data);
        return;
      });
    function next(targetId){
      $http({ method:'post', url:'/api/follow', data: {sourceId: $rootScope.userId, targetId: targetId} })
        .success(function(data, status, headers, config){
          if(data.success){
            console.log('Now following' + targetId);
            $rootScope.popNotify('Now Following ' + targetName);
            $('#follow_user').attr('disabled', 'disabled');
          }
          if(data.error){
            console.log(error);
          }
        })
        .error(function(data, status, headers, config){
          console.log('Error: ' + status);
        }); 
    }
  }
  
  //get profile data for this user
  $scope.getProfile = function(){
    $http({method:'post', url:'/api/getProfile', data:{ userName: $routeParams.username}})
      .success(function(data, status, headers, config){
        if(data.error){
          console.log(error);
          return;
        }
        for(var f in data.followers){
          console.log(data.followers[f]);
          if($rootScope.userId === data.followers[f]){
            $scope.isFollowing = true;
          }
        }
        $scope.user = data;
      })
      .error(function(data, status, headers, config){
        console.log('Error: ' + status);
      });
  }
  
  $scope.toggleCategories = function(){
    console.log('showCategories');
    if(!$scope.groupToggle){
      console.log('show');
      $('#view_groups .dropdown-menu').css('display', 'block');
      $scope.groupToggle = true;
    }
    else{
      console.log('hide');
      $('#view_groups .dropdown-menu').css('display', 'none');
      $scope.groupToggle = false;
    }
  }
  $scope.showGroup = function(group){
    console.log('fire the showGroup');
    console.log(group);
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
  $scope.getProfile();
}
UserController.resolve = {
  resolveUser: function($q, $route, $rootScope, $location, $http, $routeParams, $window){
    var deferred = $q.defer();
    var resultData = {};
    var user = $route.current.params.username;
    console.log(user);
    $rootScope.checkLogin(function(err, login){
      if(user === $rootScope.rootSettings.username) $location.path('/profile');
      if(err) deferred.reject(err);
      else if(!login) $location.path('/');
      else next();
    });
    //get user Activity gamepin Data
    function next(){
      $http({ method: 'get', url:'/api/getActivity/' + user})
      .success(function(data, status, headers, config){
        if(data.error){
          //deferred.reject(error);
          $window.location = '/notfound';
        }
        resultData.activity = data.activity;
        next2();
      })
      .error(function(data, status, headers, config){
        deffered.reject(data);
      });
    }
    //get user Group gamepin Data
    function next2(){
      $http({ method: 'get', url:'/api/getGroups/' + user})
      .success(function(data, status, headers, config){
        if(data.error) deferred.reject(data.error);
        resultData.groups = data.groups;
        deferred.resolve(resultData);
      })
      .error(function(data, status, headers, config){
        deffered.reject(data);
      });
    }
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
  
  console.log($routeParams);
  
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
    console.log('AboutController');
    $rootScope.checkLogin(function(err, login){
      if(err) deferred.reject(err);
      else if(!login) $location.path('/');
      else deferred.resolve();
    });
    return deferred.promise;
  }
}


function TempController($scope, $rootScope, $http, $location, $routeParams){
  console.log('TempController');
}