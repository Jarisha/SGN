/* 
  TODO:
  Fix "Infinite Scroll" bugs
  Replace .live() with .on()
  Newline in notepad++
*/
$(document).ready(function(e){

  /* Front Page MasonScroll Loading*/
  //Enable masonry after images load
  var $container = $('#content');
  $container.imagesLoaded(function(){
    $container.masonry({
      itemSelector : '.game_pin, .store_pin'
    });
  });
  
  // "Infinite Scroll"
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
    
  /* Store Page & Pin functionality */
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
  // Load content into enlarged pin upon click
  $('.view_trigger').click(function(e){
    var img_src;
    //load carousel img if there is carousel
    img_src = $(this).find('.carousel-inner .item:first-child img').attr('src');
    $('#storePinModal').find('.view_img').attr('src', img_src);
    //load pin image otherwise
    img_src = $(this).children('.game_img').attr('src');
    $('#storePinModal').find('.view_img').attr('src', img_src);
  });
  
  //Youtube video functionality
  var myPlayer = $('#playerid')[0];
  
  //Stop video if user clicks anywhere outside it (¿innefficient?)
  $('html *:not(.vid_container)').click(function(e){
    if(myPlayer.getPlayerState() === 1){
      myPlayer.pauseVideo();
    }
  });
  
  //Enable store pin slides
  $('.carousel').carousel({interval: false});
  $('.carousel').live('mouseenter', function(){
    $(this).children('.carousel-control').removeClass('hidden');
  }).live('mouseleave', function(){
    $(this).children('.carousel-control').addClass('hidden');
  });
});