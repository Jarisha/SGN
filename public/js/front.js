//frontSetup applies UI related, JQuery, and non angular functionality to our html
function frontSetup($scope, $rootScope, $http){
  console.log('frontSetup');
  
  $scope.viewGamePin = function(){
    $('#gamePinModal').modal({dynamic: true});
  }
  
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