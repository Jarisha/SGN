var app = angular.module('myApp', ['myApp.filters', 'myApp.services', 'myApp.directives']);

// Declare app level module which depends on filters, and services
app.config(['$routeProvider', '$locationProvider',  function($routeProvider, $locationProvider) {
  console.log('app.config()');
  //Router provides templateUrl that fills <body>, controller, and pre-routing logic
  $routeProvider
    .when('/',  { templateUrl: '/partials/front',
                  controller: FrontController,
                  resolve: FrontController.resolve
                })
    .when('/store', { templateUrl: '/partials/store',
                      controller: StoreController,
                      resolve: StoreController.resolve
                    })
    .when('/profile', { templateUrl: '/partials/profile',
                      controller: ProfileController,
                      resolve: ProfileController.resolve
                    })
    .when('/about', { templateUrl: '/partials/about',
                      controller: AboutController,
                      resolve: AboutController.resolve
                    })
    .when('/about/:area', {templateUrl: '/partials/about',
                      controller: AboutController,
                      resolve: AboutController.resolve})
    .when('/user/:username', {  templateUrl: '/partials/profile',
                      controller: UserController,
                      resolve: UserController.resolve
                    })

    .when('/notfound', {templateUrl: '/partials/not_found'})
    .otherwise({templateUrl: '/partials/not_found'});
    
  $locationProvider.html5Mode(true).hashPrefix('!');
}]);

// Entry Point
app.run(function( $rootScope, $http, $templateCache, $location, $timeout){
  console.log('app.run()');
  
  $rootScope.badInput = false;
  if(!Modernizr.input.placeholder) $rootScope.badInput = true;
  
  //Global variables - session data
  $rootScope.section = '';
  $rootScope.globalMess = 'Global Message';
  $rootScope.loggedIn = null;
  $rootScope.userId = null;
  $rootScope.avatarUrl = '<%= rootPath %>/images/30x30.gif';
  $rootScope.rootPath = '';
  $rootScope.something = 'blah';
  $rootScope.login = {email: null, password: null};
  $rootScope.register = { email: null, name: null, password: null, confirm: null, fbConnect: false};
  $rootScope.rootSettings = {email: null, username: null, gender: null, bio: null, changePass: null, changeConfirm: null };
  
  $rootScope.popModal = function(){
    $('#changeAvatar').modal();
  }
  
  //post modal fields. Stored in object
  $rootScope.post = {url:null, content: null, name: null, publisher: null,
    description: null, category: null};
  
  //detect routeChanges
  $rootScope.$on("$routeChangeStart", function(event, next, current){
    //console.log('Route Change Started!  ... retreiving session data from server');
  });
  $rootScope.$on("$routeChangeSuccess", function(event, next, current){
    //console.log('Route Change Success!');
  });
  $rootScope.$on("$routeChangeError", function(event, next, current, rejection){
    //console.log('Route Change Error: ' + rejection); 
  });
  $rootScope.$on("$viewContentLoaded", function(event, next, current, rejection){
    //console.log('ng view loaded');
  });
  
  //Debugging Tools
  //Allows you to execute debug functions from the view
  $rootScope.log = function(variable) {
    console.log(variable);
  };
  $rootScope.alert = function(text) {
    alert(text);
  };
  
  //Masonry calls
  $rootScope.masonry = function(){
    $('#content').imagesLoaded(function(){
      $('#content').masonry({
        itemSelector : '.game_pin, .store_pin',
        isFitWidth: true
      });
    });
  }
  $rootScope.remason = function(){
    $('#content').imagesLoaded(function(){
      console.log('reload masonry');
      $('#content').masonry('reload');
    });
  }
  /*$rootScope.profileMason = function(){
    $('#profile_data_inner').imagesLoaded(function(){
      $('#profile_data_inner').masonry({
        itemSelector : '.game_pin',
        isFitWidth: true
      });
    });
  }
  $rootScope.profileRemason = function(){
    $('#profile_data_inner').masonry('reload');
  }*/

  
  //Global AJAX calls
  
  //checkLogin fetches session data from the server, returning login data if user is logged in
  //it also sets $rootScope global variables which keep track of data of the currently logged in user
  //returns true if loggedin, false if not
  $rootScope.checkLogin = function(callback){
    var result = {};
    $http({ method: 'POST', url: '/api/checkLogin' })
      .success(function(data, status, headers, config){
        //logged in
        if(data.loggedIn){
          $rootScope.loggedIn = true;
          $rootScope.rootSettings.username = data.userName;
          $rootScope.userId = data.userId;
          $rootScope.avatarUrl = data.avatarImg || '/images/30x30.gif';
          return callback(null, true);
        }
        //logged out
        else if(!data.loggedIn){
          $rootScope.loggedIn = false;
          $rootScope.rootSettings.username = null;
          $rootScope.userId = null;
          $rootScope.avatarUrl = null;
          return callback(null, false);
        }
        else{
          result.status = "AJAX error";
          next("AJAX error", true);
          return callback("AJAX error", null);
        }
      })
      .error(function(data, status, headers, config) {
        result.message = 'Error: ' + status;
        return callback(status, null);
      });
  }
  $rootScope.logoutSubmit = function(){
    console.log('rootScope.logout()');
    var result = {};
    $http({ method: 'POST', url:'/api/logout'})
      .success(function(data, status, headers, config){
        if(data.logout){
          $rootScope.loggedIn = false;
          $rootScope.rootSettings.username = null;
          //$location.path('/');
          window.location = '/';
          //console.log("logout remason");
          //$rootScope.popNotify('You are now logged out.');
          //$timeout( function(){ $rootScope.remason(); }, 100 );
        }
        else if(!data.logout && data.error){
          console.log(data.error);
        }
        else{
          console.log('AJAX error');
        }
      })
      .error(function(data, status, headers, config){
        result.message = 'Error: ' + status;
      });
  }
  
  //register without selecting avatar
  $rootScope.registerSubmit = function(avatarPath){
    $http({ method: 'POST', url: '/api/register', data:
          {"email": $rootScope.register.email ,"name": $rootScope.register.name,
          "password": $rootScope.register.password, "confirm": $rootScope.register.confirm,
          "fbConnect": $rootScope.register.fbConnect, "avatarUrl": avatarPath }})
      .success(function(data, status, headers, config){
        //on success go to register step 2
        if(data.register){
          $('#registerModal').modal('hide');
          $('#registerModal_2').modal();
          //window.location = '/register';
        }
        else if(!data.register && data.error){
          console.log(data.error);
        }
        else{
          console.log('AJAX error');
        }
      })
      .error(function(data, status, headers, config){
        console.log('Error: ' + status);
      });
  }
  $rootScope.loginsubmit = function(){
    $http({ method: 'POST', url: '/api/login', data:
          {"email": $rootScope.login.email, "password": $rootScope.login.password }})
      .success(function(data, status, headers, config){
        //clear password from memory
        $rootScope.login.password = null;
        if(data.login){
          $rootScope.loggedIn = true;
          $rootScope.userEmail = data.userEmail;
          $rootScope.rootSettings.username = data.userName;
          $rootScope.userId = data.userId;
          $rootScope.avatarUrl = data.avatarUrl;
          $('#loginModal').modal('hide');
          $rootScope.popNotify('Success', 'You are now logged in.');
          //rootScope.popNotify({status: 'success' || 'error', message: 'Login successful!'});
          
          /* If cached, reload and cache partials effected by login */
          if($templateCache.get($rootScope.rootPath +'/partials/front_subnav')){
            $templateCache.remove($rootScope.rootPath +'/partials/front_subnav');
            $http.get($rootScope.rootPath +'/partials/front_subnav', {cache:$templateCache});
          }
          if($templateCache.get($rootScope.rootPath +'/partials/navbar')){
            $templateCache.remove($rootScope.rootPath +'/partials/navbar');
            $http.get($rootScope.rootPath +'/partials/navbar', {cache:$templateCache});
          }
          console.log("login remason");
          $timeout( function(){ $rootScope.remason(); }, 100 );
        }
        else if(!data.login && data.error){
          console.log('Login Failed: ' + data.error);
        }
        else{
          console.log('Login Failed: ' + data.error);
        }
      })
      .error(function(data, status, headers, config){
        //clear password from memory
        $rootScope.login.password = null;
        console.log('Server Error: ' + status);
      });
  } 
  $rootScope.postGamePin = function(){
    console.log('postGamePin');
    //clear post data lying around
    $rootScope.post.name = null;
    $rootScope.post.publisher = null;
    $rootScope.post.category = null;
    $rootScope.post.description = null;
    $rootScope.post.url = null;
    $rootScope.post.content = null;
    clearModalFields();
    $('#postModal').modal();
  }
  //clear all fields and images, disable all forms
  function clearModalFields(){
    /* if($rootScope.badInput){
      $('#imageUrlModal form').resetForm();
      $('#imageUrlModal .urlInput').val('');
      $('#imageUrlModal .thumbnail').empty();
      $('#fileUploadModal form').resetForm();
      $('#fileUploadModal .thumbnail').empty();
      $('#youtubeModal form').resetForm();
      $('#youtubeModal .urlInput').val('');
      $('#youtubeModal .fileupload').empty();
    }
    else{
      $('#imageUrlModal form').resetForm();
      $('#imageUrlModal .urlInput').val('');
      $('#imageUrlModal .thumbnail').empty();
      $('#fileUploadModal form').resetForm();
      $('#fileUploadModal .thumbnail').empty();
      $('#youtubeModal form').resetForm();
      $('#youtubeModal .urlInput').val('');
      $('#youtubeModal .fileupload').empty();
    }
    $('#imageUrlForm input[type="submit"], \
                  #uploadForm input[type="submit"], \
                  #youtubeUrlForm input[type="submit"]').attr('disabled', 'disabled');*/
    
  }
  $rootScope.imageUrl = function(){
    $('#postModal').modal('hide');
    $('#imageUrlModal').modal();
  }
  $rootScope.fileUpload = function(){
    $('#postModal').modal('hide');
    $('#fileUploadModal').modal();
  }
  $rootScope.youtubeUrl = function(){
    $('#postModal').modal('hide');
    $('#youtubeModal').modal();
  }
  
  $rootScope.getRootSettings = function(){
    $http.get('api/getSettings')
      .success(function(data, status, headers, config){
        if(data.email) $rootScope.rootSettings.email = data.email;
        if(data.username){
          $rootScope.rootSettings.username = data.username;
        }
        if(data.gender) $rootScope.rootSettings.gender = data.gender;
        console.log($rootScope.rootSettings.gender);
        if(data.bio) $rootScope.rootSettings.bio = data.bio;
      })
      .error(function(data, status, headers, config) {
        result.message = 'Error: ' + status;
      });
  }
  $rootScope.viewSettings = function(){
    $rootScope.getRootSettings();
    
    $('#settingsModal').modal();
  }
  $rootScope.editSettings = function(){
    console.log('editSettings');
    console.log($rootScope.rootSettings);
    $http({ method: 'POST', url: '/api/editSettings', data:
          { id: $rootScope.userId, settings: $rootScope.rootSettings }})
      .success(function(data, status, headers, config){
        if(data.error){
          console.log('error ' + data.error);
          $rootScope.popNotify('Error', data.error);
        }
        if(data.success){
          if(data.username){
            $rootScope.rootSettings.username = data.username;
            $rootScope.popNotify('Success', data.notify);
            //$rootScope.popNotify('Settings Saved!');
          }
        }
      })
      .error(function(data, status, headers, config){
        console.log('Error' + status);
      });
  }
  
  var hide = null;
  
  $rootScope.popNotify = function(status, message){
    $('#notify_status').text(status);
    $('#notify_message').text(message);
    $('#alertContainer').show();
    console.log('popNotify');
    hide = $timeout(function() {
      $('#alertContainer').fadeOut(500, function(){
        $('#notify_message').text('');
      });
    }, 5000);
  }
  $rootScope.hideNotify = function(){
    $timeout.cancel(hide);
    $('#alertContainer').fadeOut(250, function(){
      $('#notify_message').text('');
    });
    console.log('hideNotify');
  }
  
  //Always check if user is logged in
  //$rootScope.checkLogin();
  
  //Get full path to simplify urls for loading images/html
  $http.get('/api/getPath')
    .success(function(data, status, headers, config){
      $rootScope.rootPath = data.path;
      //next();
    })
    .error(function(data, status, headers, config){
      result.message = 'Error: ' + status;
    });
  //Load front page html partials into cache
  //Load partials we will need regardless of page?
  function next(){
    //$rootScope.modals = $rootScope.rootPath + '/partials/modals';
    /*$http.get($rootScope.rootPath + '/partials/modals', {cache:$templateCache});
    $http.get($rootScope.rootPath + '/partials/front_subnav', {cache:$templateCache});
    $http.get($rootScope.rootPath + '/partials/navbar', {cache:$templateCache});
    $http.get($rootScope.rootPath + '/partials/front_content', {cache:$templateCache});*/
  }
  //example of what $templateCache can do
  //$templateCache.put('test.html', '<b> I emphasize testing</b>');
  
  //setup modals accessible through more than one page
  //$rootScope.setupGlobalModals = function(){
  //  console.log('setupGlobalModals()');
  $rootScope.promptLogin = function(){
    //clear modal
    $rootScope.login.email = null;
    $rootScope.login.password = null;
    //spawn
    $('#loginModal').modal();
  }
  $rootScope.promptRegister = function(){
    //clear modal
    $rootScope.register.email = null;
    $rootScope.register.name = null;
    $rootScope.register.password = null;
    $rootScope.register.confirm = null;
    $rootScope.register.fbConnect = false;
    $('#registerModal').modal();
  }
  
  //setup JQuery needed to deal with post content
  $rootScope.setupPostContent = function(){
    //setup form polyfill
    $('input, textarea').placeholder();
    
    //disable all form submits    
    $('.btn-file input').click(function(e){
      $('#uploadForm .fileSubmit').removeAttr('disabled');
    });
    $("#uploadForm a[data-dismiss='fileupload']").click(function(e){
      $('#uploadForm .fileSubmit').attr('disabled', 'disabled');
    });
    
    //Post via File Upload
    $('#uploadForm').submit(function(){
      $('#' + $(this)[0].id + ' input[type="submit"]').attr('disabled', 'disabled');
      $('#fileUploadModal *').css('cursor', 'wait');
      
      $(this).ajaxSubmit({
        beforeSubmit: function(formData, jqForm, options){
          console.log($.param(formData));
          percent = 0;
          setTimeout(function(){}, 5000);
        },
        uploadProgress: function(event, position, total, percentComplete){
          var percent = percentComplete;
          console.log(percentComplete);
        },
        success: function(responseText, statusText, xhr, $form){
          $('#' + $(this)[0].id + ' input[type="submit"]').removeAttr('disabled');
          $('#fileUploadModal *').css('cursor', 'auto');
          if(responseText.error){
            console.log('Error: ' + responseText.error);
            return;
          }
          console.log(responseText.gamepin);
          $('#fileUploadModal').modal('hide');
          $rootScope.popNotify('Success' ,'Post Image Success!');
        },
        error: function(responseText, statusText, xhr, $form){
          $('#' + $(this)[0].id + ' input[type="submit"]').removeAttr('disabled');
          $('#fileUploadModal *').css('cursor', 'auto');
          $form.css('cursor', 'auto');
          console.log(responseText);
        },
        dataType: 'json'
      });
      return false;
    });
    
    //Post via Image Url
    var $getUrl = $('.get_image');
    var $imgContainer = $('#imageUrlForm').find('.thumbnail');
    var url;
    var content_type;
    $getUrl.click(function(e){
      url = $getUrl.next('.urlInput').val();
      urlExists(url, function(valid, contentType){
        if(!valid){
          console.log("Invalid Url");
          return;
        }
        content_type = contentType;
        $('#imageUrlForm .fileSubmit').removeAttr('disabled');
        $imgContainer.empty();
        $imgContainer.append('<img src="'+ url +'"/>');
      });
    });
    
    $('#imageUrlForm').submit(function(e){
      $('#' + $(this)[0].id + ' input[type="submit"]').attr('disabled', 'disabled');
      $('#imageUrlModal *').css('cursor', 'wait');
      
      $.ajax({
        type: 'post',
        url: '/api/gamepin/postImageUrl',
        data: $(this).serialize()+ '&url='+ url + '&type=' + content_type,
        success: function(data){
          $('#' + $(this)[0].id + ' input[type="submit"]').removeAttr('disabled');
          $('#imageUrlModal *').css('cursor', 'auto');
          if(data.error){
            console.log(data.error);
            return;
          }
          $('#imageUrlModal').modal('hide');
          $rootScope.popNotify('Post Image Success!');
        },
        error: function(err){
          $('#' + $(this)[0].id + ' input[type="submit"]').removeAttr('disabled');
          $('#imageUrlModal *').css('cursor', 'auto');
          console.log('error: ' + err);
        }
      });
      return false;
    });
    
    function urlExists(url, callback){
      $.ajax({
        type: 'post',
        url: '/api/util/validImg',
        data: 'url='+ url,
        success: function(data){
          if(data.valid){
            callback(true, data.contentType);
          }
          else{
            callback(false, null);
          }
        },
        error: function(data) {
          callback(false, null);
        }
      });
    }
    
    //post via Youtube Video
    var $get_video = $('.get_video');
    var vid_url;
    var vid_img;
    var vid_embed;
    $get_video.click(function(){
      vid_url = $get_video.next('.urlInput').val();
      validVideo(vid_url, function(valid, data){
        if(!valid){
          console.log('invalid video');
          return;
        }
        vid_img = data.url;
        vid_embed = data.embed;
        $('#youtubeModal .fileupload-new').append(data.embed);
        $('#youtubeModal .fileSubmit').removeAttr('disabled');
      });
    });
    
    $('#youtubeUrlForm').submit(function(e){
      console.log('youtubeSubmit');
      //disable submit input while AJAX request is processing
      $('#' + $(this)[0].id + ' input[type="submit"]').attr('disabled', 'disabled');
      $('#youtubeUrlForm *').css('cursor', 'wait');
      $.ajax({
        type: 'post',
        url: '/api/gamepin/postYoutubeUrl',
        data: $(this).serialize() + '&imgUrl=' + vid_img + '&embedHtml='+ vid_embed,
        success: function(data){
          //re-enable
          $('#' + $(this)[0].id + ' input[type="submit"]').removeAttr('disabled');
          $('#youtubeUrlForm *').css('cursor', 'auto');
          if(data.error){
            console.log(error);
            return;
          }
          console.log(data.gamepin);
          $('#youtubeModal').modal('hide');
          $rootScope.popNotify('Post Video Success!');
        },
        error: function(){
          //re-enable
          $('#' + $(this)[0].id + ' input[type="submit"]').removeAttr('disabled');
          $('#youtubeUrlForm *').css('cursor', 'auto');
          console.log('error: ' + err);
        }
      });
      return false;
    });
    
    function validVideo(url, callback){
      $.ajax({
        type: 'post',
        url: '/api/util/validVideo',
        data: 'url='+ vid_url,
        success: function(data){
          if(data.valid){
            callback(true, data);
          }
          else{
            callback(false, null);
          }
        },
        error: function(data) {
          callback(false, null);
        }
      });
    }
    //register after selecting avatar img
    $('#uploadAvatar').submit(function(){
      console.log('uploadAvatar submit');
      $(this).ajaxSubmit({
        success: function(responseText, statusText, xhr, $form){
          if(responseText.error){
            console.log('Error: ' + responseText.error);
            return;
          }
          console.log(responseText.success);
          window.location = '/register';
        },
        error: function(responseText, statusText, xhr, $form){
          console.log(responseText);
        },
        dataType: 'json'
      });
      return false;
    });
    
    //Change avatar via profile page
    $rootScope.changeavatar = function(){
      console.log('changeAvatar');
      $('#changeAvatar').modal();
      $('#changeAvatarForm').submit(function(){
        $('#changeAvatar :submit').attr('disabled', 'disabled');
        $('#changeAvatar *').css('cursor', 'wait');
        $(this).ajaxSubmit({
          dataType: 'text',
          success: function(responseText, statusText, xhr, $form){
            $('#changeAvatar :submit').removeAttr('disabled');
            $('#changeAvatar *').css('cursor', 'auto');
            window.location = '/profile';
            if(responseText.error){
              console.log('Error: ' + responseText.error);
              return;
            }
            console.log(responseText.success);
            $('#changeAvatar').modal('hide');
            $rootScope.popNotify(responseText.success);
          },
          error: function(responseText, statusText, xhr, $form){
            $('#changeAvatar :submit').removeAttr('disabled');
            $('#changeAvatar *').css('cursor', 'auto');
            console.log(responseText);
          }
        });
        return false;
      });
    }
  }
});