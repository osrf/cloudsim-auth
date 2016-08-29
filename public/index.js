window.addEventListener('load', function() {

  var lock = new Auth0Lock(AUTH0_CLIENT_ID, AUTH0_DOMAIN);

  // buttons
  var btn_login = document.getElementById('btn-login');
  var btn_logout = document.getElementById('btn-logout');
  var btn_token = document.getElementById('btn-token');
  var input_email = document.getElementById('input-email');

  btn_login.addEventListener('click', function() {
    lock.show();
  });

  btn_logout.addEventListener('click', function() {
    logout();
  });

  btn_token.addEventListener('click', function() {
    token();
  });

  lock.on("authenticated", function(authResult) {
    lock.getProfile(authResult.idToken, function(error, profile) {
      if (error) {
        // Handle error
        return;
      }

      console.log(JSON.toString(profile));

      localStorage.setItem('id_token', authResult.idToken);
      // Display user information
      show_profile_info(profile);
    });
  });

  //retrieve the profile:
  var retrieve_profile = function() {
    var id_token = localStorage.getItem('id_token');
    if (id_token) {
      lock.getProfile(id_token, function (err, profile) {
        if (err) {
          return alert('There was an error getting the profile: ' +
              err.message);
        }
        // Display user information
        show_profile_info(profile);
      });
    }
  };

  // update profile pic and widget visibility
  var show_profile_info = function(profile) {
    var avatar = document.getElementById('avatar');
    document.getElementById('nickname').textContent = profile.nickname;
    btn_login.style.display = "none";
    avatar.src = profile.picture;
    avatar.style.display = "block";
    btn_logout.style.display = "block";
    btn_token.style.display = "block";
    btn_token.style.display = "block";
    input_email.style.display = "block"
    input_email.value = profile.email;
  };

  // logout
  var logout = function() {
    localStorage.removeItem('id_token');
    window.location.href = "/";
  };

  // get cloudsim's csgrant token
  var token = function() {
    var data = 'username='+input_email.value;
    httpGetAsync('/token', data, function(responseText) {
      var responseObj = JSON.parse(responseText);
      console.log('token: ' + responseObj.token);
      document.getElementById('span-token').textContent = responseObj.token;
    });
  };

  // make a HTTP GET request with Auth0 token in header
  var httpGetAsync = function(theUrl, params, callback)
  {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    var id_token = localStorage.getItem('id_token');
    xmlHttp.open("GET", theUrl+'?'+params, true); // true for asynchronous
    xmlHttp.setRequestHeader('authorization', 'Bearer ' + id_token);
    xmlHttp.send(null);
  }

  retrieve_profile();
});
