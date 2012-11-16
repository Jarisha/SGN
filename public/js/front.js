/* 
  TODO:
  Fix "Infinite Scroll" bugs
  Replace .live() with .on()
  Newline in notepad++
*/
/*$(window).load(function() {
});*/


$(document).ready(function(e){
  
  //ensure support for HTML5 localstorage
  if(typeof(Storage)!=="undefined"){
  }
  else{
    alert('localstorage not supported!');
  }
    
  /* Front Page & Pin functionality */
  $(document).on('mouseenter', '.game_pin', function(e){
    $(this).find('.game_options').removeClass('hidden');
  });
  $(document).on('mouseleave', '.game_pin', function(e){
    $(this).find('.game_options').addClass('hidden');
  });
  
  /* Temporarary Mock Login functionality */
  $('.log_state').text(localStorage["logged_in"]);
  $('button.login_btn').click(function(){
    localStorage["logged_in"] = 'true';
    console.log(localStorage["logged_in"]);
    $('.log_state').text(localStorage["logged_in"]);
  });
  $('button.register_btn').click(function(){
  });
  $('button.logout_btn').click(function(){
    localStorage["logged_in"] = '';
    console.log(localStorage["logged_in"]);
    $('.log_state').text(localStorage["logged_in"]);
  });
  
  
  // "Scroll to Top" button
  $(window).scroll(function(){
      if ($(this).scrollTop() > 200) {
          $('.scrollup').fadeIn();
      } else {
          $('.scrollup').fadeOut();
      }
  });
  $('.scrollup').click(function(){
      $("html, body").animate({ scrollTop: 0 }, 600);
      return false;
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
  var comment = '<div class="comment"><img class="profile_img" src="images/30x30.gif"><p class="post_text"></p></div>';
  $(document).on('click', '.respond_btn', function(e){
    var response = $.trim($(this).prevAll('.respond_txtarea').val());
    $(this).prevAll('.respond_txtarea').val('');
    $(this).parent().prev('.comment').after('<div class="comment"><img class="profile_img" src="images/30x30.gif"><p class="post_text">' + 
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
    $(this).parent().prev('.view_comment').after('<div class="view_comment"><img class="profile_img" src="images/50x50.gif"><p class="view_post_text">' + 
                                            '<b>User</b><br/>' + response + '</p></div>');
  });
 
  /* Post Pin Step 2 */
  //Activate carousel
  //$('#myCarousel').carousel({
  //  interval: false
  //});
  $(document).on('mouseleave','#myCarousel', function(){
    $(this).carousel('pause');
  });
});