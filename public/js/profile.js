/* 
  Profile page JS
*/

function profileSetup($scope){
  console.log('profileSetup');
  /* Setup modals */
  $scope.postGamePin = function(){
    $('#pinModal_1').modal();
  }
}

/*$(document).ready(function(e){

  //Enable masonry
  var $container = $('#tab_content');
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

  //Edit bio when clicked upon
  var bio_text;
  var $bio_p = $('.bio_text');
  var $bio_txtarea = $('.bio_txtarea');
  var $text_limit = $('.bio_opts_container');
  
  $bio_p.click(function(e){
    console.log($(this).text());
    bio_text = $.trim($(this).text());
    $(this).addClass('hidden');
    $bio_txtarea.removeClass('hidden')
                .val(bio_text)
                .focus();
    $text_limit.removeClass('hidden');
  });
  //Save bio when focus is lost
  $bio_txtarea.blur(function(e){
    bio_text = $.trim($(this).val());
    console.log(bio_text);
    $bio_txtarea.addClass('hidden');
    $text_limit.addClass('hidden');
    $bio_p.removeClass('hidden')
          .text(bio_text);
  });
});*/