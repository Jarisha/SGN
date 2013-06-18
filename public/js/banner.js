/* Note: IE does crazy shit (downloads a file, opens new tab) when you send it JSON
 * It also has inconsistent behavior depending on both the browser cache, and also whether developer tools are open or not.
 * To satisfy this irrational beast, we will recieve JSON in a text string, and parse it into a data object.
 */
//alert('OUTER BANNER.JS');

$(document).ready(function(){
  console.log('Document is ready!');
  
  var path;
  
  //get path (part of a horrible hack to get us to the home page after we log in)
  $.ajax({
    type: 'get',
    url: '/api/getPath',
    success: function(data){
      console.log(data);
      console.log(data.path);
      path = data.path;
    },
    error: function(data){
      console.log(data);
    }
  });
  
  //Uniqueness flags
  var validUserName = false;
  var validCompanyName = false;
  var validUserEmail = false;
  var validCompanyEmail = false;
  
  /** Change mouse to waiting state when AJAX requests are working **/
  $(document).ajaxStart(function () {
    $('body').css('cursor', 'wait');
  });
  $(document).ajaxComplete(function () {
    $('body').css('cursor', 'auto');
  });
  
  $('#previewTrigger').click(function(e){
    $('div.modal').omniWindow().trigger('show');
  });
  
  /** Do not allow spacebar, remove copy + pasted text with whitespace **/
  $("input").on({
    keydown: function(e) {
      if (e.which === 32)
        return false;
    },
    change: function(e) {
      this.value = this.value.replace(/\s/g, "");
    }
  });
  
  /** Intercept form submits and submit via AJAX, to avoid page reload **/
  $('#user_form').submit(function(e){
    console.log('user form submit');
    if(!validUserName || !validUserEmail) return false;
    $.ajax({
      type: 'post',
      url: '/api/createPending',
      data: $(this).serialize(),
      dataType: 'text',
      success: function(jsonString){
        var data = $.parseJSON(jsonString);
        console.log(data);
        $('.user_alert').removeClass('hidden');
        setTimeout(function(){
          $('.user_alert').fadeOut('slow', function() {});
        }, 5000);
      },
      error: function(jsonString){
        var data = $.parseJSON(jsonString);
        console.log("AJAX error:" + data);
      }
    });
    return false;
  });
  $('#company_form').submit(function(e){
    console.log('company form submit');
    if(!validCompanyName || !validCompanyEmail) return false;
    $.ajax({
      type: 'post',
      url: '/api/createPending',
      data: $(this).serialize() + '&company=true',
      dataType: 'text',
      success: function(jsonString){
        var data = $.parseJSON(jsonString);
        console.log(data);
        $('.company_alert').removeClass('hidden');
        setTimeout(function(){
          $('.company_alert').fadeOut('slow', function() {});
        }, 5000);
      },
      error: function(jsonString){
        var data = $.parseJSON(jsonString);
        console.log("AJAX error:" + data);
      }
    });
    return false;
  });
  $('#login_form').submit(function(e){
    console.log('login form submit');
    $.ajax({
      type: 'post',
      url: '/api/gatewayLogin',
      dataType: 'text',
      //dataType: ($.browser.msie) ? 'text' : 'json',
      data: $(this).serialize(),
      success: function(jsonString){
        var data = $.parseJSON(jsonString);
        if(!data.login) $('.login_alert').show().text(data.error).delay(2000).fadeOut();
        else window.location = path;
      },
      error: function(jsonString){
        var data = $.parseJSON(jsonString);
        $('.login_alert').text(data.error);
        console.log("AJAX error:" + data);
      }
    });
    return false;
  });
  
  /** Check uniqueness of email and username in real time, triggering AJAX on blur **/
  $('#company_name').blur(function(e){
    console.log('company name blur');
    if(!$(this).val()){
      validCompanyName = false;
      return true;
    }
    checkUniqueName($(this).val(), function(err, data){
      if(err){
        validCompanyName = false;
        $('#company_name').next().text("Taken");
      }
      if(data){
        validCompanyName = true;
        $('#company_name').next().text("Available");
      }
    });
  });
  $('#company_email').blur(function(e){
    console.log('company email blur');
    if(!$(this).val()){
      console.log('empty val');
      validCompanyEmail = false;
      return true;
    }
    checkUniqueEmail($(this).val(), function(err, data){
      if(err){
        $('#company_email').next().text("Taken");
        validCompanyEmail = false;
      }
      if(data){
        $('#company_email').next().text("Available");
        validCompanyEmail = true;
      }
    });
  });
  $('#user_name').blur(function(e){
    console.log('user name blur');
    if(!$(this).val()){
      console.log('empty val');
      validUserName = false;
      return true;
    }
    checkUniqueName($(this).val(), function(err, data){
      if(err){
        $('#user_name').next().text("Taken");
        validUserName = false;
      }
      if(data){
        $('#user_name').next().text("Available");
        validUserName = true;
      }
    });
  });
  $('#user_email').blur(function(e){
    console.log('user email blur');
    if(!$(this).val()){
      console.log('empty val');
      validUserEmail = false;
      return true;
    }
    checkUniqueEmail($(this).val(), function(err, data){
      if(err){
        $('#user_email').next().text("Taken");
        validUserEmail = false;
      }
      if(data){
        $('#user_email').next().text("Available");
        validUserEmail = true;
      }
    });
  });
  
  /** Functions to ensure uniqueness of entered fields **/
  function checkUniqueName(userName, callback){
    $.ajax({
      type: 'post',
      url: '/api/checkUniqueName',
      data: 'userName='+ userName,
      success: function(jsonString){
        var data = $.parseJSON(jsonString);
        console.log(data);
        if(data.error) return callback(data.error, null);
        if(data.success) return callback(null, data.success);
        return callback("No data returned from AJAX", null);
      },
      error: function(jsonString){
        var data = $.parseJSON(jsonString);
        console.log("AJAX error:" + data);
        return callback(data, null);
      }
    });
  }
  
  function checkUniqueEmail(email, callback){
    $.ajax({
      type: 'post',
      url: '/api/checkUniqueEmail',
      data: 'email=' + email,
      success: function(jsonString){
        var data = $.parseJSON(jsonString);
        console.log(data);
        if(data.error) return callback(data.error, null);
        if(data.success) return callback(null, data.success);
        return callback("No data returned from AJAX", null);
      },
      error: function(data){
        console.log("AJAX error:" + data);
        return callback(data, null);
      }
    });
  }
});