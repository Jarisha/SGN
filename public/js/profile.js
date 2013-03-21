/* 
  Profile page JS for My Profile and View Other User's Profile
*/

function profileSetup($scope){
  console.log('profileSetup');
  /* Setup modals */
  
  // "Scroll to Top" button
  $(window).scroll(function(){
      if ($(this).scrollTop() > 200) {
          $('#scrollup').fadeIn();
      } else {
          $('#scrollup').fadeOut();
      }
  });
  $changeAvatar = $('.change_avatar');
  $('.profile_pic').mouseenter(function(e){
    $changeAvatar.removeClass('hidden');
  }).mouseleave(function(e){
    $changeAvatar.addClass('hidden');
  });
  
  $scope.scrollup = function(){
    console.log('scrollup');
    $("html, body").animate({ scrollTop: 0 }, 600);
  }
}