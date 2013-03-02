
function test(){
  console.log('test111!!!');
}
//frontSetup applies UI related, JQuery, and non angular functionality to our html
function frontSetup($scope, $rootScope, $http){
  console.log('frontSetup');
  
  /*$scope.initMasonry = function(){
    var $container = $('#content');
    $container.imagesLoaded(function(){
      $container.masonry({
        itemSelector : '.game_pin, .store_pin',
        isAnimated: true
      });
    });
  }*/
  
  
  //InfiniteScroll
  /*var $container = $('#content');
  $container.infinitescroll({
    navSelector  : '#pag_nav',    // selector for the paged navigation
    nextSelector : '#pag_nav a',  // selector for the NEXT link (to page 2)
    itemSelector : '.game_pin, .store_pin',   // selector for all items you'll retrieve
    loading: {
        finishedMsg: 'No more pages to load.'
      }
    },
    // trigger Masonry as a callback
    function( newElements ) {
      // hide new items while they are loading
      var $newElems = $( newElements ).css({ opacity: 0 });
      // ensure that images load before adding to masonry layout
      $newElems.imagesLoaded(function(){
        // show elems now they're ready
        $newElems.animate({ opacity: 1 });
        $container.masonry( 'appended', $newElems, true );
      });
    }
  );*/
  
  /* Setup modals 
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
  }*/
  $scope.postGamePin = function(){
    //clear modal
    $rootScope.post.name = null;
    $rootScope.post.publisher = null;
    $rootScope.post.category = null;
    $rootScope.post.description = null;
    $rootScope.post.url = null;
    $rootScope.post.content = null;
    $('.post_content').empty();
    
    $('#pinModal_1 button.active').removeClass('active');
    $('#pinModal_1').modal({dynamic: true});
    //$('#pinYoutube').modal({dynamic: true});
  }
  $scope.viewGamePin = function(){
    $('#gamePinModal').modal({dynamic: true});
  }
  //Load correct Post step 2 modal based on type of media selected
  $('.post_media').click(function(e){
    
    var media = $(this).val();
    var $modal_header = $('#pinYoutube .modal-header');
    switch(media){
      case 'upload':
        //TODO: do back end functionality
        $modal_header.html('<p>Upload image from Computer</p><br />'+
          '<form method="post" enctype="multipart/form-data">' +
          '<p>Image: <input type="file" name="image" /></p>' +
          '<p><input type="submit" value="Upload" /></p></form>');
        setTimeout(function(){$('#pinYoutube').modal({dynamic: true});}, 500);
        break;
      case 'youtube':
        //Hack. Resolve by spawning this modal once the hide animation completes for the previous modal.
        $modal_header.html('<p>Post video via youtube URL</p>' +
          '<input ng-model="post.url" class="load_input" placeholder="" type="text">' +
          '</input><button class="btn load_vid">Load</button>');
        setTimeout(function(){$('#pinYoutube').modal({dynamic: true});}, 500);
        break;
      //via image URL (direct link to image or call web scraper to return all valid images on page url)
      case 'url':
        $modal_header.html('<p>Upload from the web</p><br /><input type="text"></input>');
        setTimeout(function(){$('#pinYoutube').modal({dynamic: true});}, 500);
        break;
    }
  });
  //Post youtube video functionality
  var url;
  var embed;
  var arr;
  $(document).on('click', '#pinYoutube .load_vid', function(e){
    //if url is empty do nothing
    if(!$('input.load_input').val()) return false;
    url = $('input.load_input').val();
    arr = url.split("?v=");
    embed = arr[1];
    $('.post_content').html('<iframe width="560" height="315" src="http://www.youtube.com/embed/' +
                            arr[1] +'" frameborder="0" allowfullscreen></iframe>');
    $rootScope.post.content = embed;
    return true;
  });
  
  //post game_pin
  $('.post_vid').click(function(){
    $http({method:'post', url:'/api/gamepin/post', data:{'data': $rootScope.post}})
      .success(function(data, status, headers, config){
        if(data.success){
          //close modal
          $('#pinYoutube').modal('hide');
          $scope.status = data.message;
        }
        else if(!data.success && data.error){
          //display error in modal
          $scope.status = 'Error: ' + data.error;
        }
        else{
          $scope.status = 'AJAX error';
        }
      })
      .error(function(data, status, headers, config){
        $scope.status = 'Error: ' + status;
      });
  });
  
  //fade in scroll-to-top tab
  $(window).scroll(function(){
      if ($(this).scrollTop() > 200) {
          $('#scrollup').fadeIn();
      } else {
          $('#scrollup').fadeOut();
      }
  });
  $scope.scrollup = function(){
    $("html, body").animate({ scrollTop: 0 }, 600);
  }
  //affix subnav to top after it is loaded
  $scope.affix = function(){
    $('#subnav').affix({ offset: 42 });
  }
  
  /* Front Page & Pin functionality */
  $(document).on('mouseenter', '.game_pin', function(e){
    $(this).find('.game_options').removeClass('hidden');
  });
  $(document).on('mouseleave', '.game_pin', function(e){
    $(this).find('.game_options').addClass('hidden');
  });
  
  // Show "Comment" button when textarea focused
  $(document).on('focus', '.respond_txtarea', function(e){
    $(this).nextAll('.respond_btn').removeClass('hidden');
    //Remason layout to account for button appearing
    $('#content').masonry({
      itemSelector : '.game_pin, .store_pin'
    });
  });
  
  // Post comment (insert HTML string)
  var comment = '<div class="comment"><img class="profile_img" src="<%= rootPath %>/images/30x30.gif"><p class="post_text"></p></div>';
  /*$(document).on('click', '.respond_btn', function(e){
    var response = $.trim($(this).prevAll('.respond_txtarea').val());
    $(this).prevAll('.respond_txtarea').val('');
    $(this).parent().prev('.comment').after('<div class="comment"><img class="profile_img" src="{{rootPath}}/images/30x30.gif"><p class="post_text">' + 
                                            '<b>User</b>&nbsp;' + response + '</p></div>');
    $container.masonry({
      itemSelector : '.game_pin, .store_pin'
    });
  });*/
  
  /* View Pin */ 
  // Load image into enlarged pin upon click
  $('.view_trigger').click(function(e){
    console.log($(this).children('.game_img').attr('src'));
    var img_src = $(this).children('.game_img').attr('src');
    $('#viewPinModal').find('.view_img').attr('src', img_src);
  });
  
  // Show "Comment" button when textarea focused
  $('.view_respond_txtarea').focus(function(e){
    $(this).nextAll('.view_respond_btn').removeClass('hidden');
  });
  // Post comment
  $('.view_respond_btn').click(function(e){
    var response = $.trim($(this).prevAll('.view_respond_txtarea').val());
    $(this).prevAll('.view_respond_txtarea').val('');
    $(this).parent().prev('.view_comment').after('<div class="view_comment"><img class="profile_img" src="<%= rootPath %>/images/50x50.gif"><p class="view_post_text">' + 
                                            '<b>User</b><br/>' + response + '</p></div>');
  });
  $(document).on('mouseleave','#myCarousel', function(){
    $(this).carousel('pause');
  });
}