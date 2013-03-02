'use strict';
/* Controllers
 * Angular controllers contain 2 way data-binded variables that are shared in the view.
 * The Angular router will detect url changes and route us to the correct controller + template.
 * The template will be used to fill ng-view, which represents all the content inside the <body></body>
 */
 
function FrontController($scope, $rootScope, $http, $location, $templateCache, $timeout, $routeParams, beforeFront,
                         gamepinService, $window){
  console.log('frontController');
  $scope.showPins = [];
  $scope.gamePins = beforeFront;
  var imgCount = 0;
  
  
  for(var i = 0; i < $scope.gamePins.length; i++){
    imgCount++;
    if(imgCount > 36)
      imgCount = 1;
    $scope.gamePins[i].imgPath = "http://localhost:3001/images/game_images/images%20%28"+ imgCount +"%29.jpg";
  }
  
  var start = 0;
  var interval = 20;
  var stop;
  
  loadFirst();
  //console.log(beforeFront);
  /* $scope wide variables, binded to view */
  $rootScope.css = 'front';
  $rootScope.title = 'front';
  $scope.modals = $rootScope.rootPath + '/partials/modals';
  $scope.subnav = $rootScope.rootPath + '/partials/front_subnav';
  $scope.nav = $rootScope.rootPath + '/partials/navbar';
  $scope.content = $rootScope.rootPath + '/partials/front_content';
  //$scope.showPins = [];
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
  
  $scope.fbModal = function(){
    $('#fbRegisterModal').modal();
  }
  $scope.changeState = function(){
    $scope.masonInit = false;
  }
  
  $scope.lol = function(){
    console.log('lol');
  }
  
  //load more pins when user scrolls down to a certain point
  $window.onscroll = function(e){
    var a = $window.scrollMaxY;
    var b = $window.pageYOffset;
    if($scope.flag && (a-b) <= 300){
      $scope.$apply($scope.loadMore());
      $scope.flag = false;
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
  //If doing facebook register, spawn modal with fb data prefilled
  $scope.catSearch = function(cat){
    gamepinService.categorySearch(cat ,function(data){
      $scope.showPins = [];
      start = 0, interval = 20, stop = 0;
      $scope.gamePins = data.objects;
      //temporary code
      for(var i = 0; i < $scope.gamePins.length; i++){
        imgCount++;
        if(imgCount > 36)
          imgCount = 1;
        $scope.gamePins[i].imgPath = "http://10.0.1.17:3001/images/game_images/images%20%28"+ imgCount +"%29.jpg";
      }
      loadFirst();
    });
  }
  $scope.textsearch = function(txt){
    gamepinService.textSearch(txt ,function(data){
      $scope.showPins = [];
      start = 0, interval = 20, stop = 0;
      $scope.gamePins = data.objects;
      for(var i = 0; i < $scope.gamePins.length; i++){
        imgCount++;
        if(imgCount > 36)
          imgCount = 1;
        $scope.gamePins[i].imgPath = "http://10.0.1.17:3001/images/game_images/images%20%28"+ imgCount +"%29.jpg";
      }
      loadFirst();
    });
  }
  
  //Must do a POST, otherwise response is cached
  $scope.facebookRegister = function(){
    /* Setup modals */
    console.log('wtf');
    $scope.promptLogin = function(){
      //clear modal
      $scope.status = null;
      $scope.login.email = null;
      $scope.login.password = null;
      //spawn
      $('#loginModal').modal();
    }
    $scope.promptRegister = function(){
      //clear modal
      $scope.status = null;
      $scope.register.email = null;
      $scope.register.name = null;
      $scope.register.password = null;
      $scope.register.confirm = null;
      $('#registerModal').modal();
    }
    
    //$('#content.masonry').masonry( 'destroy' );
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
  }
  $scope.addComment = function(text, index){
    //add the comment in the view
    $scope.showPins[index].comments.push({posterName: $rootScope.userName, content: text});
    
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
    
    //$scope.pinList[index]
  }
  //loadFirst to load initial gamepins into view
  function loadFirst(){
    for(stop = start + interval ;start < stop && start < $scope.gamePins.length; start++){
      $scope.showPins.push($scope.gamePins[start]);
    }
  }
  //loadMore invoked to show more gamepins when the user scrolls down
  $scope.loadMore = function(){
    for(stop = start + interval ;start < stop && start < $scope.gamePins.length; start++){
      $scope.showPins.push($scope.gamePins[start]);
    }
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

function StoreController($scope, $rootScope, $http, $location, $templateCache){
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
    $http({ method: 'POST', url: 'api/login', data:
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
    $http({ method: 'POST', url: 'api/register', data:
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

function ProfileController($scope, $rootScope, $http, $location){
  console.log('did we make it?');
  //redirect if not logged in
  //if(!$rootScope.loggedIn)
  //  $location.path('/');
  
  $rootScope.css = 'profile';
  $rootScope.title = 'profile';
  $scope.modals = $rootScope.rootPath + '/partials/modals';
  $scope.subnav = null;
  $scope.nav = $rootScope.rootPath + '/partials/navbar';
  $scope.content = $rootScope.rootPath + '/partials/profile_content';
  $scope.settings = {email: null, username: $scope.userName, gender: null, bio: null}
  
  $scope.profile = {  name: null,
                      email: null,
                      fbConnect: null,
                      favCat: null,
                      profileImg: null,
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
  
  $scope.setup = function(){
    profileSetup($scope);
  }
  
  /* AJAX FUNCTIONS */
  $scope.ajaxLogout = function(){
    $rootScope.logout( function(res){
      if(res.message) $scope.status = res.message;
    });
  }
  
  $scope.getProfile = function(){
    $http({method:'post', url:'/api/getProfile', data:{ userEmail: $rootScope.userId }})
      .success(function(data, status, headers, config){
        //TODO: do this via for..in loop.  Maybe.
        $scope.profile.name = data.username;
        $scope.profile.email = data.email;
        $scope.profile.fbConnect = data.fbConnect;
        $scope.profile.favCat = data.favCat;
        $scope.profile.profileImg = data.profileImg || '/images/profile/csbiophoto.png';
        $scope.profile.gender = data.gender;
        $scope.profile.bio = data.bio;
        $scope.profile.dateJoined = data.dateJoined;
        $scope.profile.currXP = data.currXP;
        $scope.profile.nextXP = data.nextXP;
        $scope.profile.level = data.level;
        $scope.profile.posts = data.posts;
        $scope.profile.likes = data.likes;
        $scope.profile.followers = data.followerNames;
        $scope.profile.following = data.followingNames;
        $scope.profile.friends = data.friends;
        console.log($scope.profile);
      })
      .error(function(data, status, headers, config){
        console.log('Error: ' + status);
      });
  }
  $scope.getProfile();
}
function AboutController($scope, $rootScope, $http, $location){
  $rootScope.css = 'about';
  $rootScope.title = 'about';
  $scope.modals = $rootScope.rootPath + '/partials/modals';
  $scope.subnav = null;
  $scope.nav = $rootScope.rootPath + '/partials/navbar';
  $scope.content = $rootScope.rootPath + '/partials/about_content';
  
  $scope.setup = function(){
    aboutSetup($scope);
  }
  
  /* AJAX FUNCTIONS */
  $scope.ajaxLogout = function(){
    $rootScope.logout( function(res){
      if(res.message) $scope.status = res.message;
    });
  }
}
function SettingsController($scope, $rootScope, $http, $location, $templateCache){
  //redirect if not logged in
  if(!$rootScope.loggedIn)
    $location.path('/');
  
  $rootScope.css = 'settings';
  $rootScope.title = 'settings';
  $scope.modals = $rootScope.rootPath + '/partials/modals';
  $scope.subnav = null;
  $scope.nav = $rootScope.rootPath + '/partials/navbar';
  $scope.content = $rootScope.rootPath + '/partials/settings_content';
  $scope.settings = {email: null, username: null, gender: null, bio: null}
  
  $scope.setup = function(){
    settingsSetup($scope);
  }
  
  $scope.ajaxLogout = function(){
    $rootScope.logout( function(res){
      if(res.message){
        $scope.status = res.message;
      }
    });
  }
  $scope.getSettings = function(){
    $http.get('api/getSettings')
      .success(function(data, status, headers, config){
        if(data.email) $scope.settings.email = data.email;
        if(data.username){
          $scope.settings.username = data.username;
          $rootScope.userName = data.username;
        }
        if(data.gender) $scope.settings.gender = data.gender;
        if(data.bio) $scope.settings.bio = data.bio;
      })
      .error(function(data, status, headers, config) {
        result.message = 'Error: ' + status;
      });
  }
  $scope.editSettings = function(){
    $http({ method: 'POST', url: 'api/editSettings', data:
          { id: $rootScope.userId, settings: $scope.settings }})
      .success(function(data, status, headers, config){
        if(data.error) console.log('error ' + data.error);
        if(data.success){
          if(data.username){
            console.log(data.username);
            $rootScope.userName = data.username;
            $scope.settings.username = data.username;
          }
          console.log($rootScope.userName);
          console.log($scope.settings.username);
          console.log('settings saved!');
        }
      })
      .error(function(data, status, headers, config){
        console.log('Error' + status);
      });
  }
  $scope.getSettings();
}
//Looking at another user's page
function UserController($scope, $rootScope, $http, $location, $routeParams, beforeUser){
  $rootScope.css = 'profile';
  $rootScope.title = 'user';
  $scope.modals = $rootScope.rootPath + '/partials/modals';
  $scope.subnav = null;
  $scope.nav = $rootScope.rootPath + '/partials/navbar';
  $scope.content = $rootScope.rootPath + '/partials/user_content';
  $scope.profile = {  name: null,
                      email: null,
                      fbConnect: null,
                      favCat: null,
                      profileImg: null,
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
  
  $scope.setup = function(){
    profileSetup($scope);
  }
  
  $scope.follow = function(target){
    $http({ method:'post', url:'/api/follow', data: {sourceId: $rootScope.userId, targetId: target} })
      .success(function(data, status, headers, config){
        if(data.success){
          console.log('Now following' + target);
        }
        if(data.error){
          console.log(error);
        }
        //TODO: update user's follower list in REAL TIME!
      })
      .error(function(data, status, headers, config){
        console.log('Error: ' + status);
      });
  }
  
  console.log($routeParams.username);
  //get profile data for this user
  $scope.getProfile = function(){
    $http({method:'post', url:'/api/getProfile', data:{ userName: $routeParams.username}})
      .success(function(data, status, headers, config){
        //TODO: do this via for..in loop
        $scope.profile.name = data.username;
        $scope.profile.email = data.email;
        $scope.profile.fbConnect = data.fbConnect;
        $scope.profile.favCat = data.favCat;
        $scope.profile.profileImg = data.profileImg;
        $scope.profile.gender = data.gender;
        $scope.profile.bio = data.bio;
        $scope.profile.dateJoined = data.dateJoined;
        $scope.profile.currXP = data.currXP;
        $scope.profile.nextXP = data.nextXP;
        $scope.profile.level = data.level;
        $scope.profile.posts = data.posts;
        $scope.profile.likes = data.likes;
        $scope.profile.followers = data.followerNames;
        $scope.profile.following = data.followingNames;
        $scope.profile.friends = data.friends;
        console.log($scope.profile);
      })
      .error(function(data, status, headers, config){
        console.log('Error: ' + status);
      });
  }
  
  $scope.ajaxLogout = function(){
    $rootScope.logout( function(res){
      if(res.message) $scope.status = res.message;
    });
  }
  $scope.getProfile();
}

function TempController($scope, $rootScope, $http, $location, $routeParams){
  console.log('TempController');
}