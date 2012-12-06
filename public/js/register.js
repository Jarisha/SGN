$(document).ready(function(){
  var postData = '';
  $('#registerSubmit').click(function(e){
    $('button.active').each(function(){
      postData += 'categories[]='+$(this).text()+'&';
    });
    $.post('/api/register_2', postData , function(data) {
      if(data.register){
        console.log(data.register);
        console.log(postData);
        window.location = '/';
      }
      else if(error)
        console.log('error: ' + error);
    });
  });
});