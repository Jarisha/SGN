function remason(){
  console.log('remason!!');
  var $container = $('#content');
  $container.imagesLoaded(function(){
    $container.masonry({
      itemSelector : '.game_pin, .store_pin'
    });
  });
}

function frontSetup($scope){
  //Masonry and InfiniteScroll
  var $container = $('#content');
  $container.imagesLoaded(function(){
    $container.masonry({
      itemSelector : '.game_pin, .store_pin'
    });
  });
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
  );
  /* Setup modals */
  $scope.promptLogin = function(){
    $('#loginModal').modal();
  }
  $scope.promptRegister = function(){
    $('#registerModal').modal();
  }
  $scope.postGamePin = function(){
    $('#pinModal_1').modal();
  }
  $scope.viewGamePin = function(){
    $('#gamePinModal').modal({dynamic: true});
  }
  //scrollup functionality
  $(window).scroll(function(){
      if ($(this).scrollTop() > 200) {
          $('.scrollup').fadeIn();
      } else {
          $('.scrollup').fadeOut();
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
    $container = $('#content');
    $container.masonry({
      itemSelector : '.game_pin, .store_pin'
    });
  });
  
  // Post comment (insert HTML string)
  var comment = '<div class="comment"><img class="profile_img" src="<%= rootPath %>/images/30x30.gif"><p class="post_text"></p></div>';
  $(document).on('click', '.respond_btn', function(e){
    var response = $.trim($(this).prevAll('.respond_txtarea').val());
    $(this).prevAll('.respond_txtarea').val('');
    $(this).parent().prev('.comment').after('<div class="comment"><img class="profile_img" src="<%= rootPath %>/images/30x30.gif"><p class="post_text">' + 
                                            '<b>User</b>&nbsp;' + response + '</p></div>');
    $container.masonry({
      itemSelector : '.game_pin, .store_pin'
    });
  });
  
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