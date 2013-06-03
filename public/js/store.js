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
      itemSelector : '.game_pin, .store_pin',
      isFitWidth: true
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
    //clear modal
    $scope.status = null;
    $scope.login.email = null;
    $scope.login.password = null;
    //spawn
    $('#loginModal').modal();
  }
  $scope.promptRegister = function(){
    $scope.status = null;
    $scope.register.email = null;
    $scope.register.name = null;
    $scope.register.password = null;
    $scope.register.confirm = null;
    $('#registerModal').modal();
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
}