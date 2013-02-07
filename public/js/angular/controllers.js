'use strict';
/* Controllers
 * Angular controllers contain 2 way data-binded variables that are shared in the view.
 * The Angular router will detect url changes and route us to the correct controller + template.
 * The template will be used to fill ng-view, which represents all the content inside the <body></body>
 */
 
function FrontController($scope, $rootScope, $http, $location, $templateCache, $timeout, $routeParams, beforeRoute){
  console.log('frontController');
  console.log(beforeRoute);
  /* $scope wide variables, binded to view */
  $rootScope.css = 'front';
  $rootScope.title = 'front';
  $scope.modals = $rootScope.rootPath + '/partials/modals';
  $scope.subnav = $rootScope.rootPath + '/partials/front_subnav';
  $scope.nav = $rootScope.rootPath + '/partials/navbar';
  $scope.content = $rootScope.rootPath + '/partials/front_content';
  $scope.pinList = [];
  $scope.showPins = [];
  $scope.loadIndex = 0;
  $scope.pages = [];
  $scope.newComment = { text: null };
  $scope.searchText = '';
  
  /* temp variables - used only in this controller */
  var commentList = [];
  var interval = 20;
  console.log($scope.content);
  
  /* $scope wide functions, can be called from view */
  $scope.mason = function(){
    remason();
  }
  
  //Setup non AJAX related javascript => goto front.js
  $scope.setup = function(){
    frontSetup($scope, $rootScope, $http);
  }
  
  $scope.textSearch = function(text){
    $scope.getPinList('', text);
  }
  
  /* AJAX FUNCTIONS */
  //If doing facebook register, spawn modal with fb data prefilled
  $scope.facebookRegister = function(){
    $('#content.masonry').masonry( 'destroy' );
    $http.get('/api/facebookRegister')
      .success(function(data, status, headers, config){
        remason();
        if(data.fb){
          $scope.register.email = data.fbEmail;
          $scope.register.name = data.fbName;
          $scope.register.fbConnect = true;
          $('#fbRegisterModal').modal();
        }
        else{
        }
      })
      .error(function(data, status, headers, config) {
        $scope.message = 'Server Error: ' + status;
      });
  }

  /*$scope.ajaxRegister = function(){
    $http({ method: 'POST', url: 'api/register', data:
          {"email": $scope.register.email ,"name": $scope.register.name,
          "password": $scope.register.password, "confirm": $scope.register.confirm,
          "fbConnect": $scope.register.fbConnect }})
      .success(function(data, status, headers, config){
        //on success go to register step 2
        if(data.register){
          window.location = '/register';
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
  }*/
  
  $scope.ajaxLogout = function(){
    $rootScope.logout( function(res){
      if(res.message) $scope.status = res.message;
      console.log("logout remason");
      remason();
    });
  }
  //gets list of pins.  Takes in options for text search or category search.
  //warning: very nasty code lies ahead
  $scope.getPinList = function(cat, text){
    cat = cat || $routeParams.cat;
    text = text || $routeParams.tex;
    
    $http({ method: 'POST', url: $rootScope.rootPath +'/api/getPinList', data:{category:cat, searchTerm: text}})
      .success(function(data, status, headers, config){
        var cmtResolve = [];
        if(data.error){
          console.log(data.error);
        };
        //fill commentList and pinList with empty values to start
        for(var i = 0; i < data.objects.length; i++){
          commentList.push([]);
          $scope.pinList.push({id:null, description:null, poster:null, category:null, comments:[]});
          if(data.objects[i].fields.comments){
            cmtResolve.push({index:i, cmtIds: data.objects[i].fields.comments.split(" ")});
          }
        }
        //send comment IDs to server, get comments back and store them in pinList
        if(cmtResolve.length < 1){
          next();
        }
        for(var i = 0; i < cmtResolve.length; i++){
          (function(j){
            $http({ method: 'POST', url: 'api/gamepin/getComments', data: {commentIds: cmtResolve[j].cmtIds} })
              .success(function(data, status, headers, config){
                if(data.error) console.log(data.error);
                if(data.success){
                  $scope.pinList[cmtResolve[j].index].comments = data.list;
                  if(j === cmtResolve.length - 1) next();
                }
              })
              .error(function(data, status, headers, config){
                console.log('AJAX error');
              });
          })(i);
        }
        function next(){
          if(cmtResolve.length > 0){
            //console.log("getComments remason");
            //remason();
            $('#subnav').affix({ offset: 42 });
          }
          for(var i = 0; i < data.objects.length; i++){
            $scope.pinList[i].id = data.objects[i].id;
            $scope.pinList[i].description = data.objects[i].fields.description;
            $scope.pinList[i].poster = data.objects[i].fields.posterId;
            $scope.pinList[i].category = data.objects[i].fields.category;
          }
          //load first 'page' into the view
          for(var i = 0; i < interval; i++){
            $scope.showPins[i] = $scope.pinList[i];
          }
          $scope.loadIndex = interval;
          //console.log($scope.showPins);
        }
      })
      .error(function(data, status, headers, config){
        console.log('error');
      });
  }
  $scope.addComment = function(text, index){
    //add the comment in the view
    $scope.pinList[index].comments.push({poster: $rootScope.userId, content: text});
    console.log("addComment: remason()");
    remason();
    $http({ method:'post', url:'/api/gamepin/addComment',
      data:{pinId: $scope.pinList[index].id, posterId: $rootScope.userId, content: text} })
      .success(function(data, status, headers, config){
        console.log('post comment success!');
      })
      .error(function(data, status, headers, config){
        console.log('error');
      });
    //API call to add comment to DB
    
    //$scope.pinList[index]
  }
  $scope.loadMore = function(){
    console.log('loadMore');
    for(var i = $scope.loadIndex; i < $scope.loadIndex + interval; i++){
      $scope.showPins[i] = $scope.pinList[i];
    }
    $scope.showPins = $scope.showPins;
    console.log($scope.showPins);
  }
  $scope.loadOne = function(){
    $scope.showPins.push({id:'Z', description:'Z', poster:'Z', category:'Z'});
  }
  $scope.getPinList();
  //affix subnav
}

FrontController.beforePage = function(){
  console.log('beforePageLoad');
}

function StoreController($scope, $rootScope, $http, $location, $templateCache){
  /* $scope wide variables, binded to view */
  $rootScope.css = 'store';
  $rootScope.title = 'front';
  $scope.modals = $rootScope.rootPath + '/partials/modals';
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
          remason();
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
    $http({method:'post', url:'/api/getProfile', data:{ userEmail: $rootScope.userId}})
      .success(function(data, status, headers, config){
        //TODO: do this via for..in loop.  Maybe.
        $scope.profile.name = data.name;
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
        $scope.profile.followers = data.followers;
        $scope.profile.following = data.following;
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
  $scope.settings = {email: null, username: $scope.userName, gender: null, bio: null}
  
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
        if(data.name) $scope.settings.username = data.name;
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
          if(data.name) $rootScope.userName = data.name;
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
function UserController($scope, $rootScope, $http, $location, $routeParams){
  //redirect if not logged in
  if(!$rootScope.loggedIn)
    $location.path('/');
    
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
  
  console.log($routeParams.user);
  //get profile data for this user
  $scope.getProfile = function(){
    $http({method:'post', url:'/api/getProfile', data:{ userEmail: $routeParams.user}})
      .success(function(data, status, headers, config){
        //redirect to my_profile is username matches current user
        if($rootScope.userName === data.name) $location.path('/profile');
        //TODO: do this via for..in loop
        $scope.profile.name = data.name;
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
        $scope.profile.followers = data.followers;
        $scope.profile.following = data.following;
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