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
  
  /** Intercept form submits and submit via AJAX, to avoid page reload **/
  $('#user_form').submit(function(e){
    console.log('user form submit');
    if(!validUserName || !validUserEmail) return false;
    $.ajax({
      type: 'post',
      url: '/api/pendingAccount',
      data: $(this).serialize(),
      success: function(data){
        console.log(data);
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
      url: '/api/pendingAccount',
      data: $(this).serialize(),
      success: function(data){
        console.log(data);
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
      },
      error: function(data){
        consoe.log("AJAX error:" + data);
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
      if(err) validCompanyName = false;
      if(data) validCompanyName = true;
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
      if(err) validCompanyEmail = false;
      if(data) validCompanyEmail = true;
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
      if(err) validUserName = false;
      if(data) validUserName = true;
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
      if(err) validUserEmail = false;
      if(data) validUserEmail = true;
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