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