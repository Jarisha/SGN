$(document).ready(function(){
  console.log('Document is ready!');
  
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
  
  $('#open').click(function(e){
    $('#loginModal').modal('show');
  });
  $('#close').click(function(e){
    $('#loginModal').modal('hide');
  });
  
  $('#send_email').click(function(e){
    console.log('yea');
    
    /*$.ajax({
      type: 'post',
      url: '/api/sendEmail',
      data: 'email=' + 'dtonys@gmail.com',
      success: function(data){
        
      },
      error:  function(data){
        console.log("AJAX error: " + data);
      }
    });*/
  });
  
  /** Intercept form submits and submit via AJAX, to avoid page reload **/
  $('#user_form').submit(function(e){
    console.log('user form submit');
    if(!validUserName || !validUserEmail) return false;
    $.ajax({
      type: 'post',
      url: '/api/createPending',
      data: $(this).serialize(),
      success: function(data){
        console.log(data);
        $('.user_alert').removeClass('hidden');
        setTimeout(function(){
          $('.user_alert').fadeOut('slow', function() {});
        }, 5000);
      },
      error: function(data){
        consoe.log("AJAX error:" + data);
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
      success: function(data){
        console.log(data);
        $('.company_alert').removeClass('hidden');
        setTimeout(function(){
          $('.company_alert').fadeOut('slow', function() {});
        }, 5000);
      },
      error: function(data){
        console.log("AJAX error:" + data);
      }
    });
    return false;
  });
  $('#login_form').submit(function(e){
    console.log('login form submit');
    $.ajax({
      type: 'post',
      url: '/api/login',
      data: $(this).serialize(),
      success: function(data){
        console.log(data);
        if(!data.login){
          console.log('fail');
          $('.login_alert').text(data.error);
        }
        else window.location = '/';
      },
      error: function(data){
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
        $()
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
      success: function(data){
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
  function checkUniqueEmail(email, callback){
    $.ajax({
      type: 'post',
      url: '/api/checkUniqueEmail',
      data: 'email=' + email,
      success: function(data){
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