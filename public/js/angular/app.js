var app = angular.module('myApp', ['myApp.services', 'myApp.directives', 'myApp.filters']);

// Declare app level module which depends on filters, and services
app.config(['$routeProvider', '$locationProvider',  function($routeProvider, $locationProvider) {
  console.log('app.config()');
  //Router provides templateUrl that fills <body>, controller, and pre-routing logic
  $routeProvider
    .when('/', { templateUrl: '/partials/front/front', // templateUrl: '/partials/profile/profile'
                  controller: FrontController
                  , resolve: FrontController.resolve
                })
    .when('/store', { templateUrl: '/partials/store',
                      controller: StoreController
                      , resolve: StoreController.resolve
                    })
    .when('/profile', { templateUrl: '/partials/profile/profile', // templateUrl: '/partials/profile/profile'
                      controller: ProfileController
                      , resolve: ProfileController.resolve
                    })
    .when('/about', { templateUrl: '/partials/about/about', // templateUrl: '/partials/about/about'
                      controller: AboutController
                      , resolve: AboutController.resolve
                    })
    .when('/about/:area', {templateUrl: '/partials/about/about', // templateUrl: '/partials/about/about'
                      controller: AboutController
                      , resolve: AboutController.resolve
                    })
    .when('/user/:username', {   templateUrl: '/partials/user/user', //  templateUrl: '/partials/profile/profile',
                      controller: UserController
                      , resolve: UserController.resolve
                    })
    .when('/post/:postId',{ templateUrl: '/partials/post/post',
                      controller: TempController
                      , resolve: TempController.resolve
                    })
    .when('/notfound', {templateUrl: '/partials/not_found'})
    .otherwise({templateUrl: '/partials/not_found'});
    
  $locationProvider.html5Mode(true).hashPrefix('!');
}]);

// Entry Point
app.run(['$rootScope', '$http', '$templateCache', '$location', '$timeout', '$q',
  function($rootScope, $http, $templateCache, $location, $timeout, $q){
  
  console.log('app.run()');

  $rootScope.notificationsDummyData = {
  //The greater the time, the more recent.
    followersData :
      [
        { sourceUser:'user7@u.u', action:'followRecieved', target:'dtonys@gmail.com',
          sourceData: {email:'user7@u.u', userName:'user7',
          profileImg:'http://d45c79c0838c7014df33-00861601181b32db2671b5497da6d8c8.r84.cf1.rackcdn.com/GJUhS9F1oZEJaGD26kwOSdtg'}},
        { sourceUser:'user7@u.u', action:'followRecieved', target:'dtonys@gmail.com',
        sourceData: {email:'user7@u.u', userName:'user7',
        profileImg:'http://d45c79c0838c7014df33-00861601181b32db2671b5497da6d8c8.r84.cf1.rackcdn.com/GJUhS9F1oZEJaGD26kwOSdtg'}},
        { sourceUser:'user7@u.u', action:'followRecieved', target:'dtonys@gmail.com',
        sourceData: {email:'user7@u.u', userName:'user7',
        profileImg:'http://d45c79c0838c7014df33-00861601181b32db2671b5497da6d8c8.r84.cf1.rackcdn.com/GJUhS9F1oZEJaGD26kwOSdtg'}},
        { sourceUser:'user7@u.u', action:'followRecieved', target:'dtonys@gmail.com',
        sourceData: {email:'user7@u.u', userName:'user7',
        profileImg:'http://d45c79c0838c7014df33-00861601181b32db2671b5497da6d8c8.r84.cf1.rackcdn.com/GJUhS9F1oZEJaGD26kwOSdtg'}},
        { sourceUser:'user7@u.u', action:'followRecieved', target:'dtonys@gmail.com',
        sourceData: {email:'user7@u.u', userName:'user7',
        profileImg:'http://d45c79c0838c7014df33-00861601181b32db2671b5497da6d8c8.r84.cf1.rackcdn.com/GJUhS9F1oZEJaGD26kwOSdtg'}},
      ],
    tagsData : [{name: "Bertha", target: "pin", time: 3}, {name: "Joan", target: "comment", time: 4}],
    messagesData : [{name: "Jill", time: 5}]
  };

  $rootScope.badInput = false;
  if(!Modernizr.input.placeholder) $rootScope.badInput = true;
 
  $rootScope.newConvos = 0;
  $rootScope.convoData = [];
  $rootScope.selectedConvo;
  $rootScope.messageList;
  
  //detect routeChanges
  $rootScope.$on("$routeChangeStart", function(event, next, current){
    console.log('Route Change Started!');
    $('body').css('cursor', 'wait');
  });
  $rootScope.$on("$routeChangeSuccess", function(event, next, current){
   // ('Route Change Success!');
   $('body').css('cursor', 'default');
  });
  $rootScope.$on("$routeChangeError", function(event, next, current, rejection){
   // ('Route Change Error: ' + rejection);
  });
  $rootScope.$on("$viewContentLoaded", function(event, next, current, rejection){
    //('ng view loaded');
  });
 
  //Debugging Tools
  //Allows you to execute debug functions from the view
  $rootScope.log = function(variable) {
    console.log(variable);
  };  
  $rootScope.alert = function(text){
    alert(text);
  };

  /******* Global variables ***********/
  //session / login
  $rootScope.loggedIn = null;
  $rootScope.userName = null;
  $rootScope.userEmail = null;
  $rootScope.userImg = '/images/30x30.gif';
  //settings
  $rootScope.set =  { password: null,
                      confirm: null,
                      userName: null,
                      gender: null };
  //post modal fields. Stored in object
  $rootScope.post = { url:null,
                      content: null,
                      name: null,
                      publisher: null,
                      description: null,
                      category: null };
  //Page we are on, full url path
  $rootScope.section = '';
  $rootScope.rootPath = '';
  
  /*********** Initialization Code ********/
  //Get full path, useful for loading in images + html
  $http.get('/api/getPath')
    .success(function(data, status, headers, config){
      $rootScope.rootPath = data.path;
    })
    .error(function(data, status, headers, config){
      result.message = 'Error: ' + status;
    });
  
  /******** UI/UX Functionality & Flow *********/
  $rootScope.popModal = function(){
    $('#changeAvatar').modal();
  }
  //Masonry calls
  $rootScope.masonry = function(){
    console.log('masonry');
    $('#content').imagesLoaded()
      .always(function(instance){
        $('#content').masonry({
          itemSelector : '.game_pin, .store_pin',
          isFitWidth: true
        });
        //hack to fix masonry overlaps. (badge)
        $timeout(function(){
          console.log('time');
          $('#content').masonry('reload');
        }, 1000);
      });
  }
  $rootScope.reload = function(){
    console.log('appendMason');
    $('#content').imagesLoaded()
      .always(function(instance){
        $('#content').masonry('reload');
      });
  }
  $rootScope.remason = function(){
    $('#content').masonry('reload');
  }
  $rootScope.destroyMason = function(){
    $('#content').masonry('destroy');
  }
  $rootScope.profileMasonry = function(){
    $('#profile_data_inner').imagesLoaded()
      .always(function(instance){
        $('#profile_data_inner').masonry({
          itemSelector : '.game_pin',
          isFitWidth: true
        });
        $timeout(function(){
          $('#profile_data_inner').masonry('reload');
        }, 1000);
      });
  }
  $rootScope.profileReload = function(){
    console.log('reload profile masonry');
    $('#profile_data_inner').imagesLoaded()
      .always(function(instance){
        $('#profile_data_inner').masonry('reload');
      });
  }
  $rootScope.destroyProfileMason = function(){
    $('#profile_data_inner').masonry('destroy');
  }
  
  //post Gamepin
  $rootScope.postGamePin = function(){
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
  //clear all post gamepin Modals
  function clearModalFields(){
     if($rootScope.badInput){
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
                  #youtubeUrlForm input[type="submit"]').attr('disabled', 'disabled');
  }
 
  //pop generic placeholder modal
  $rootScope.popGeneric = function(){
    $('#genericModal').modal();
  }
  //pop feedback modal
  $rootScope.popFeedback = function(){
    $('#feedbackModal form')[0].reset();
    $('#feedbackModal').modal();
  }
 
  //fetch all message and then pop conversation modal
  $rootScope.popConversation = function(convo){
    //fetch array of messages, select and highlight current conversation
    $http({ method:'post', url:'/api/user/getMessages', data: {convoId: convo.id} })
      .success(function(data, status, headers, config){
        if(data.messages){
          $rootScope.messageList = data.messages;
          $rootScope.selectedConvo = convo;
        }
      })
      .error(function(data, status, headers, config){
      });
    $('#convo_sidebar').css('display', 'block');
    $('#conversationModal').modal();
    $('#respond_message').focus();
    var height = $('.convo_right')[0].scrollHeight;
    $('.convo_right').scrollTop(height);
  }
 
  //post gamepin modal progression
  $rootScope.popImageUrl = function(){
    $('#postModal').modal('hide');
    $('#imageUrlModal').modal();
  }
  $rootScope.popFileUpload = function(){
    $('#postModal').modal('hide');
    $('#fileUploadModal').modal();
  }
  $rootScope.popYoutubeUrl = function(){
    $('#postModal').modal('hide');
    $('#youtubeModal').modal();
  }

  //Modals for social notifications
  $rootScope.popFollowerNotifications = function(){
    $('#followerNotificationsModal').modal();
  }

  //Modal for badges
  $rootScope.popBadgeModal = function(){
    $('#badgeModal').modal();
  }
  
  $rootScope.closeModal = function(rec){
    console.log('close gamePinModal');
    $('#gamePinModal').modal('hide');
    $timeout(function(){
      $location.path(rec.link);
    }, 10);
  }
  
  //Pops a Notification. Error or Success
  var hide = null;
  $rootScope.popNotify = function(status, message){
    $('#alertContainer').removeClass();
    $('#notify_status').text(status);
    $('#notify_message').text(message);
    if (status === "Error") {
      $('#alertContainer').addClass('errorAlert');
    } else {
      $('#alertContainer').addClass('successAlert');
    }
    $('#alertContainer').show();
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
  }
  
  /********* AJAX API ***************/
  //Global AJAX. Interacts with API backend. Called from controller, returns to controller to perform controller specified logic.
  //Contains some mixed UI & AJAX functionality
  
  //Get session data from backend.  callback(err, bool loggedIn)
  $rootScope.checkLogin = function(callback){
    var result = {};
    $http({ method: 'POST', url: '/api/checkLogin' })
      .success(function(data, status, headers, config){
        //logged in
        if(data.loggedIn){
          $rootScope.loggedIn = true;
          $rootScope.userName = data.userName;
          $rootScope.userEmail = data.userId;
          $rootScope.userImg = data.avatarImg || '/images/30x30.gif';
          $rootScope.userEvents = data.userEvents;
          $rootScope.pinEvents = data.pinEvents;
          $rootScope.convoData = data.convoData;
          //If a conversation is new, mark it as new
          for(i = 0, len = $rootScope.convoData.length; i < len; i++){
            if($rootScope.convoData[i].notify === data.userId){
              $rootScope.newConvos++;
              $rootScope.convoData[i].newFlag = true;
            }
          }
          return callback(null, true);
        }
        //logged out
        else if(!data.loggedIn){
          $rootScope.loggedIn = false;
          $rootScope.userName = null;
          $rootScope.userEmail = null;
          $rootScope.userImg = null;
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
  
  //Log out. destroys our session data, redirect to gateway
  $rootScope.logoutSubmit = function(){
    var result = {};
    $http({ method: 'POST', url:'/api/logout'})
      .success(function(data, status, headers, config){
        if(data.logout){
          $rootScope.loggedIn = false;
          $rootScope.userName = null;
          window.location = '/';
        }
      })
      .error(function(data, status, headers, config){
        result.message = 'Error: ' + status;
      });
  }
  
  //registration and login actions on hold, TODO: Replace gateway registration with modal progression
  /*
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
        }
        else if(!data.register && data.error){
        }
        else{
        }
      })
      .error(function(data, status, headers, config){
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
          $rootScope.userName = data.userName;
          $rootScope.userEmail = data.userId;
          $rootScope.userImg = data.avatarUrl;
          $('#loginModal').modal('hide');
          $rootScope.popNotify('Success', 'You are now logged in.');
          
          // If cached, reload and cache partials effected by login
          if($templateCache.get($rootScope.rootPath +'/partials/front_subnav')){
            $templateCache.remove($rootScope.rootPath +'/partials/front_subnav');
            $http.get($rootScope.rootPath +'/partials/front_subnav', {cache:$templateCache});
          }
          if($templateCache.get($rootScope.rootPath +'/partials/navbar')){
            $templateCache.remove($rootScope.rootPath +'/partials/navbar');
            $http.get($rootScope.rootPath +'/partials/navbar', {cache:$templateCache});
          }
          $timeout( function(){ $rootScope.remason(); }, 100 );
        }
        else if(!data.login && data.error){
        }
        else{
        }
      })
      .error(function(data, status, headers, config){
        //clear password from memory
        $rootScope.login.password = null;
      });
  }
  */
  
  //returns promise.  promise.then(function(bool result){})
  $rootScope.follow = function(userName){
    var deferred = $q.defer();
    
    $http({ method:'post', url:'/api/user/follow', data:{sourceId: $rootScope.userEmail, targetName: userName} })
      .success(function(data, status, headers, config){
        if(data.error){
          console.log('error');
          //$rootScope.popNotify('Error', data.error);
          $rootScope.popNotify('Error', 'Follow '+targetName+' failed');
          deferred.resolve(false);
        }
        else{
          console.log('success');
          $rootScope.popNotify('Success', 'Now Following '+userName);
          deferred.resolve(true);
        }
      })
      .error(function(data, status, headers, config){
        console.log(data);
      });
    return deferred.promise;
  };
  
  $rootScope.like = function(pin){
    $http({ method: 'post', url:'/api/gamepin/like', data: {pinId: pin.id, email: $rootScope.userEmail } })
      .success(function(data, status, headers, config){
        if(data.error) $rootScope.popNotify('Error', data.error);
        else if(data.success){
          $rootScope.popNotify('Success', data.success);
          pin.likedFlag = !pin.likedFlag;
          pin.likedBy.length++;
        }
      })
      .error(function(data, status, headers, config){
        $rootScope.popNotify('Error', 'Server Error');
      });
  }
  
  $rootScope.unlike = function(pin){
    $http({ method: 'post', url:'/api/gamepin/unlike', data: {pinId: pin.id, email: $rootScope.userEmail } })
      .success(function(data, status, headers, config){
        if(data.error) $rootScope.popNotify('Error', data.error);
        else if(data.success){
          $rootScope.popNotify('Success', data.success);
          pin.likedFlag = !pin.likedFlag;
          pin.likedBy.length--;
        }
      })
      .error(function(data, status, headers, config){
        $rootScope.popNotify('Error', 'Server Error');
      });
  }
  
  $rootScope.sendFeedback = function(text){
    $http({ method:'post', url:'/api/user/submitFeedback', data:{sourceUser: $rootScope.userEmail, content: text }})
      .success(function(data, status, headers, config){
        if(data.success){
          $('#feedbackModal').modal('hide');
          //alert(data.success);
        }
        if(data.error) alert(data.error);
      })
      .error(function(data, status, headers, config){
        if(data) alert(data);
      });
  }
  
  //send message via user page.  Only for a first message that initiates a conversation
  //callback(errMessage, successMessage)
  $rootScope.message = function(text, sourceId, targetId, callback){
    $http({ method: 'post', url:'/api/user/message', data:{  sourceId: /* $rootScope.userEmail, */ sourceId,
                                                                targetId: /* $rootScope.selectedConvo.showUser.email, */ targetId,
                                                                content: text} })
      .success(function(data, status, headers, config){
        if(data.success){
          //alert(JSON.stringify(data.success));
          return callback(null, JSON.stringify(data.success));
        }
        if(data.error){
          //alert(JSON.stringify(data.error));
          return callback(JSON.stringify(data.error), null);
        }
      })
      .error(function(data, status, headers, config){
        if(data) alert(data);
      });
  }
  
  //send message to targetUser within the context of a conversation
  $rootScope.respond = function(text){
    //find out which user is the 'other'
    
    //send text to conversation from sourceUser to targetUser
    $http({ method:'post', url:'/api/user/message', data:{  sourceId:$rootScope.userEmail,
                                                                targetId: $rootScope.selectedConvo.showUser.email,
                                                                content: text} })
      .success(function(data, status, headers, config){
        if(data.success){
          $rootScope.messageList.push({ sourceData:{ userName: $rootScope.userName, profileImg: $rootScope.userImg }, content: text });
          //alert(JSON.stringify(data.success));
        }
        if(data.error) alert(JSON.stringify(data.error));
      })
      .error(function(data, status, headers, config){
        if(data) alert(data);
      });
    //alert('respond to convo '+convoId+' to targetUser: '+targetId);
  }
  
  //When the user clicks on a notification, consume that notification and go to target
  $rootScope.consume = function(userEvent, index, listRef) {
    console.log('consume + proceed to targetLink');
    //Keep friend request alive
    if(userEvent.action === 'friendRequest'){
      $location.path(userEvent.targetLink);
      return;
    }
    listRef.splice(index, 1);
    $http({ method: 'post', url:'/api/user/consumeEvent', data: {eventId: userEvent.id} })
      .success(function(data, status, headers, config){
        $location.path(userEvent.targetLink);
      })
      .error(function(data, status, headers, config){
        console.log('error');
      });
  }
  
  //When the user clicks on a conversation, decrement newConvos counter, un-New the conversation, and send request to change notify to null
  $rootScope.consumeMessage = function(convo){
    if($rootScope.newConvos <= 0) return;
    $rootScope.newConvos--;
    convo.newFlag = false;
    $http({ method:'post', url:'/api/user/consumeMessage', data: {convoId: convo.id} })
      .success(function(data, status, headers, config){
        if(data.success){
          //alert(JSON.stringify(data.success));
        }
        else if(data.error){
          alert(data.error)
        }
      })
      .error(function(data, status, headers, config){
        alert(data);
      });
  }
  
  $rootScope.ignore = function(userEvent, index, listRef){
    $http({ method: 'post', url:'/api/user/consumeEvent', data: {eventId: userEvent.id} })
      .success(function(data, status, headers, config){
        if(data.success){
          listRef.splice(index, 1);
          $rootScope.popNotify('Success', 'Request Ignored');
        }
        if(data.error){
          $rootScope.popNotify('Error', data.error);
        }
      })
      .error(function(data, status, headers, config){
        console.log(data);
        $rootScope.popNotify('Error', 'Server Error');
      });
  }
  //friends the two users, consuming the event and spawning appropriate followup events
  $rootScope.acceptFriend = function(userEvent, index, listRef){
    console.log('sourceId: '+ userEvent.sourceUser + ' targetId: '+$rootScope.userEmail+' consumedId: '+userEvent.id);
    $http({ method:'post', url:'/api/user/acceptFriend', data: {  sourceId: userEvent.sourceUser,
                                                                  targetId: userEvent.target,
                                                                  consumedId: userEvent.id } })
      .success(function(data, status, headers, config){
        if(data.success){
          listRef.splice(index, 1);
          $rootScope.popNotify('Success', 'Friend Accepted');
        }
        if(data.error){
          $rootScope.popNotify('Error', data.error);
        }
      })
      .error(function(data, status, headers, config){
        console.log(data);
        $rootScope.popNotify('Error', 'Server Error');
      });
  }

  //view and edit settings
  $rootScope.viewSettings = function(){
    var resultData;
    $rootScope.set.password = null;
    $rootScope.set.confirm = null;
    
    $http({method:'post', url:'/api/getSettings', data:{ email: $rootScope.userEmail }})
      .success(function(data, status, headers, config){
        if(data.error) $rootScope.popNotify('Error', data.error);
        if(data.success){
          $rootScope.set.gender = data.gender;
          $rootScope.set.userName = data.userName;
          $('#settingsModal').modal();
        }
      })
      .error(function(data, status, headers, config){
        $rootScope.popNotify('Error', data);
      });
  }
  $rootScope.editSettings = function(){
    $http({ method: 'POST', url: '/api/editSettings', data:
          { email: $rootScope.userEmail, settings: $rootScope.set }})
      .success(function(data, status, headers, config){
        if(data.error){
          $rootScope.popNotify('Error', data.error);
        }
        if(data.success){
          if(data.userName) $rootScope.userName = data.userName;
          $rootScope.popNotify('Success', data.notify);
        }
        $rootScope.set.password = null;
        $rootScope.set.confirm = null;
      })
      .error(function(data, status, headers, config){
      });
  }
  
  //Setup
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
          percent = 0;
          setTimeout(function(){}, 5000);
        },
        uploadProgress: function(event, position, total, percentComplete){
          var percent = percentComplete;
        },
        success: function(responseText, statusText, xhr, $form){
          $('#' + $(this)[0].id + ' input[type="submit"]').removeAttr('disabled');
          $('#fileUploadModal *').css('cursor', 'auto');
          if(responseText.error){
            return;
          }
         // (responseText.gamepin);
          $('#fileUploadModal').modal('hide');
          $rootScope.popNotify('Success' ,'Post Image Success!');
        },
        error: function(responseText, statusText, xhr, $form){
          $('#' + $(this)[0].id + ' input[type="submit"]').removeAttr('disabled');
          $('#fileUploadModal *').css('cursor', 'auto');
          $form.css('cursor', 'auto');
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
      //check to see if Url is valid, return content type
      urlExists(url, function(valid, contentType){
        if(!valid){
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
            $('#imageUrlModal').modal('hide');
            $rootScope.popNotify(data.error);
            return;
          }
          $('#imageUrlModal').modal('hide');
          $rootScope.popNotify('Post Image Success!');
        },
        error: function(err){
          $('#' + $(this)[0].id + ' input[type="submit"]').removeAttr('disabled');
          $('#imageUrlModal *').css('cursor', 'auto');
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
          return;
        }
        vid_img = data.url;
        vid_embed = data.embed;
        $('#youtubeModal .fileupload-new').append(data.embed);
        $('#youtubeModal .fileSubmit').removeAttr('disabled');
      });
    });
    
    $('#youtubeUrlForm').submit(function(e){
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
            return;
          }
         // (data.gamepin);
          $('#youtubeModal').modal('hide');
          $rootScope.popNotify('Post Video Success!');
        },
        error: function(){
          $('#' + $(this)[0].id + ' input[type="submit"]').removeAttr('disabled');
          $('#youtubeUrlForm *').css('cursor', 'auto');
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
      $(this).ajaxSubmit({
        success: function(responseText, statusText, xhr, $form){
          if(responseText.error){
            return;
          }
          window.location = '/register';
        },
        error: function(responseText, statusText, xhr, $form){
        },
        dataType: 'json'
      });
      return false;
    });
    
    //Change avatar via profile page
    $rootScope.changeavatar = function(){
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
              return;
            }
            $('#changeAvatar').modal('hide');
            $rootScope.popNotify(responseText.success);
          },
          error: function(responseText, statusText, xhr, $form){
            $('#changeAvatar :submit').removeAttr('disabled');
            $('#changeAvatar *').css('cursor', 'auto');
          }
        });
        return false;
      });
    }
  }
}]);