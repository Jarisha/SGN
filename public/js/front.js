//frontSetup applies UI related, JQuery, and non angular functionality to our html
function frontSetup($scope, $rootScope, $http){
  //post game_pin
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
  
  /* Front Page & Pin functionality */
  $(document).on('mouseenter', '.game_pin', function(e){
    $(this).find('.game_options').removeClass('hidden');
  });
  $(document).on('mouseleave', '.game_pin', function(e){
    $(this).find('.game_options').addClass('hidden');
  });
}