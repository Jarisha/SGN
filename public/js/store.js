//Youtube player functionality (my implementation a bit shoddy)
function videoHandler(){
  if(ytplayer.getPlayerState() === 1){
    ytplayer.pauseVideo();
  }
}

function onYouTubePlayerReady(playerid) {
    ytplayer = document.getElementById("playerid");
    $('html *:not(.vid_container)').bind('click', videoHandler);
};

function storeSetup($scope){
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
  $scope.viewStorePin = function(){
    $('#storePinModal').modal({dynamic: true});
  }
  // "Scroll to Top" button
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
  $scope.affix = function(){
    $('#subnav').affix({ offset: 42 });
  }
  
  //Show Pin options on hover
  $(document).on('mouseenter', '.store_pin' ,function(e){
    $(this).find('.fav_game').removeClass('hidden');
    $(this).find('.fav_friends').removeClass('hidden');
  });
  $(document).on('mouseleave', '.store_pin' , function(e){
    $(this).find('.fav_game').addClass('hidden');
    $(this).find('.fav_friends').addClass('hidden');
  });
  
  /* Store page enlarged pin */ 
  $('.view_trigger').click(function(e){
    var img_src;
    //load carousel img if there is carousel
    img_src = $(this).find('.carousel-inner .item:first-child img').attr('src');
    $('#storePinModal').find('.view_img').attr('src', img_src);
    //load pin image otherwise
    img_src = $(this).children('.game_img').attr('src');
    $('#storePinModal').find('.view_img').attr('src', img_src);
  });
  //Enable store pin slides
  $('.carousel').carousel({interval: false});
  $(document).on('mouseenter', '.carousel', function(){
    $(this).children('.carousel-control').removeClass('hidden');
  });
  $(document).on('mouseleave', '.carousel', function(){
    $(this).children('.carousel-control').addClass('hidden');
  });
  
}