// variables for Strava authorization codes
var stravaClientID = 31392;		// ID for Strava App
var stravaAppCode = '62b8199e3a3b620dd6e76e790d3476fb3932edd5'; // only works with specific website
var stravaExpiresAt = 0; 			// expiry time for token (epoch time)
var stravaAccessToken = '';		// used to get data
var stravaRefreshToken = '';	// used to get new AccessToken if expired
//var stravaCode = ''; 					// returned by redirect
var stravaScope = '';					// returned by redirect
var stravaReady = false;			// are Strava Tokens etc set up?
var stravaActivityID = 0;			// current activityID
var stravaRequest = '&approval_prompt=auto&scope=read,activity:read,activity:read_all,activity:write'; // request string

function stravaTokens() { // handle Strava token, do this early to avoid any asynchronicity issue
  // get 'redirect' access code from browser window (if that fails then force reconnect to Strava - how to avoid cycle?)
  // To do - use saved token for refresh (if enabled) - will need to save scope too
  var authString = window.location.search;
  var authArray = {};
  var pairs = (authString[0] === '?' ? authString.substr(1) : authString).split('&');
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split('=');
    authArray[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
  }
  //console.log(authArray);
  // expect - .scope: "read,activity:read,activity:read_all,activity:write"
  // 					.code = access token
  //   alternativelty .strava = numericID

  if (typeof authArray.strava !== 'undefined') { // for now only do refresh with stired data
    stravaActivityID = parseInt(authArray.strava);
    if (linkStrava && useLocalStorage && localStorage.getItem('stravaRefreshToken') !== null) {
        stravaRefreshToken = localStorage.stravaRefreshToken;
        stravaScope = localStorage.stravaScope;
        stravaRefresh();
    }
  } else if (typeof authArray.code !== 'undefined' && typeof authArray.scope !== 'undefined') {
    var stravaCode = authArray.code;
    stravaScope = authArray.scope;
    stravaGetToken(stravaCode, true);
  } else {
    stravaReady = false;
  }
}

function stravaGetToken(stravaCode, reTry){
  // now get Tokens
  //console.log(stravaCode);
  stravaReady = true;
  var postURL = 'https://www.strava.com/oauth/token?client_id=' + stravaClientID + '&client_secret=' +
  stravaAppCode + '&code=' + stravaCode + '&grant_type=authorization_code';
  //console.log(postURL);
  var jqPost = $.post(postURL,
    function(data, status){
      //console.log("data: " + data + "\nStatus: " + status);
      //console.log(data);
      stravaExpiresAt = data.expires_at; 			// expiry time for token (epoch time)
      stravaAccessToken = data.access_token;
      stravaRefreshToken = data.refresh_token;	// used to get new AccessToken if expired
      stravaLocalStore();
    })
    .fail(function(response) {
      //console.log(response);
      //var locHostPath = location.protocol + '//' + location.host + location.pathname;
      if (reTry) {
        var locHref = 'https://www.strava.com/oauth/authorize?client_id=' + stravaClientID +
          '&response_type=code&redirect_uri=' +
          location.protocol + '//' + location.host + location.pathname + stravaRequest;
        //window.alert("Strava token exchange failed. URL = " + locHref);
        // how to prevent a loop?
        location.href = locHref;
      }
      stravaReady = false;
    });
  //console.log(jqPost);
}

function stravaRefresh() { // refresh Strava token, assumes stravaReady is true
  stravaReady = true;
  var jqPost = $.post('https://www.strava.com/api/v3/oauth/token?client_id=' + stravaClientID + '&client_secret=' +
        stravaAppCode + '&grant_type=refresh_token&refresh_token=' + stravaRefreshToken,
    function(data, status){
      //console.log("Status: " + status);
      //console.log(data);
      stravaExpiresAt = data.expires_at; 			// expiry time for token (epoch time)
      stravaAccessToken = data.access_token;
      stravaRefreshToken = data.refresh_token;	// used to get new AccessToken if expired
      stravaLocalStore();
      if (stravaActivityID > 0) {
        loadStravaID();
      }
    })
    .fail(function(response) {
      stravaReady = false;
      window.alert("Strava token exchange failed (during refresh).");
    });
  return;
}

function stravaLocalStore() {
  if (useLocalStorage) {
    //localStorage.setItem("stravaAccessToken", stravaAccessToken);  // stored value not used at moment
    localStorage.setItem("stravaRefreshToken", stravaRefreshToken);
    localStorage.setItem("stravaScope", stravaScope);
    //localStorage.setItem("stravaExpiresAt", stravaExpiresAt);
  } else {  // delete local store items
    localStorage.removeItem("stravaAccessToken");
    localStorage.removeItem("stravaRefreshToken");
    localStorage.removeItem("stravaExpiresAt");
    localStorage.removeItem("stravaScope");
  }
}

function loginStrava() {
    var stravaOAUTHURL = 'https://www.strava.com/oauth/authorize?client_id=' + stravaClientID + '&response_type=code&redirect_uri='
    //var winurl  =  OAUTHURL + CLIENTID + '&redirect_uri=' + REDIRECT + '&state=' + STATE + '&response_type=code';
    var winurl  =  stravaOAUTHURL + REDIRECT + stravaRequest;
    var win     =  window.open(winurl, "windowname1", 'width=400, height=300');
    var pollTimer   =   window.setInterval(function() {
        try {
            //console.log(win.document.URL);
            if (win.document.URL.indexOf(REDIRECT) != -1) {
                window.clearInterval(pollTimer);
                var url =   win.document.URL;
                var stravaCode = gup(url, 'code');  // could also do same way as Strava link
                stravaScope = gup(url, 'scope');  // could also do same way as Strava link
                //console.log(stravaCode);
                win.close();
                stravaGetToken(stravaCode, false);
            }
        } catch(e) {
        }
    }, 500);
}

function getStravaLink(stActivity) {
  if (stravaReady == true) {
    var epochT = Math.floor(new Date(stActivity.start_time)/1000 + stActivity.clock_duration/2); // go to mid point of activity
    // look for first activity before midpoint
    $.get('https://www.strava.com/api/v3/athlete/activities?before=' + epochT + '&page=1&per_page=1&access_token=' + stravaAccessToken, function(data, status){
      //console.log(data);
      // get activity data
      $.get('https://www.strava.com/api/v3/activities/' + data[0].id + '?include_all_efforts=false&access_token=' + stravaAccessToken, function(data, status){
          //console.log(data);
          if (Math.floor(new Date(data.start_date)/1000 + data.elapsed_time) - epochT > 0 ) {  // check finish time is after STmodi midpoint i.e. activities overlap
            setStravaLink(data.id);
          } else {
            //window.alert("No Strava Activity at same time found.");
            setStravaLink(0);
          }
      })
      .fail(function(error) {
        // silent
        //window.alert("Strava Activity not accessible.");
        setStravaLink(0);
      });
    })
  } else {
    setStravaLink(0);
  }
}

function setStravaLink(id) {
  stravaActivityID = id;
  if (id > 0) {
    document.getElementById("linkStravaURL").innerHTML = 'Strava: ' + id;
    document.getElementById("linkStravaURL").href = STRAVAURL + id;
    document.getElementById("linkFPEURL").innerHTML = 'FPE';
    document.getElementById("linkFPEURL").href = FPEURL + id;
  } else {
    document.getElementById("linkStravaURL").innerHTML = 'Strava: default';
    document.getElementById("linkStravaURL").href = STRAVAURL + id;
    document.getElementById("linkFPEURL").innerHTML = 'FPE: default';
    document.getElementById("linkFPEURL").href = FPEURL + id;
  }
}

function getStravaInfo(){
  var epochT = Math.floor(new Date(stActivityUpdate.start_time)/1000 + stActivityUpdate.clock_duration/2); // go to mid point of activity
  // look for first activity before midpoint
  $( "#getStravaInfo" ).blur(); // remove focus to avoid tooltip remaining
  $.get('https://www.strava.com/api/v3/athlete/activities?before=' + epochT + '&page=1&per_page=1&access_token=' + stravaAccessToken, function(data, status){
    //console.log(data);
    // get activity data
    $.get('https://www.strava.com/api/v3/activities/' + data[0].id + '?include_all_efforts=false&access_token=' + stravaAccessToken, function(data, status){
        //console.log(data);
        if (Math.floor(new Date(data.start_date)/1000 + data.elapsed_time) - epochT > 0 ) {  // check finish time is after STmodi midpoint i.e. activities overlap
          var newDesc = (data.description == undefined ? '' : data.description + '\n') + STRAVAURL + data.id +
              (strydActivityID > 0 ? '\n' + STRYDURL + 'runs/' + strydActivityID : '') + '\n\n';
          var dialogStr = 'Click OK to use Title and Description: \n\n' + data.name + '\n\n' + newDesc;
          //console.log(dialogStr);
          setStravaLink(data.id); // should not have changed, but perhaps changed something on Strava
          if (window.confirm(dialogStr) == true) {
            document.getElementById("STname").value = data.name;
            document.getElementById("STnotes").value = newDesc + document.getElementById("STnotes").value;
            $( "#fieldSTdata" ).trigger('input');  // check if change
          }

        } else {
          setStravaLink(0);
          window.alert("No Strava Activity at same time found.");
        }
    })
    .fail(function(error) {
      setStravaLink(0);
      window.alert("Strava Activity not accessible.");
    });
  })
}

function stravaGetData(id){
  // test function for Streams - not used
  $.get('https://www.strava.com/api/v3/activities/' + id + '/streams?keys=SmoothVelocityStream&access_token='
    + stravaAccessToken, function(data, status){
      console.log(data);
      // do things with activities
  })
  .fail(function(error) {
    window.alert("Strava Activity not accessible.");
    //stravaReady = false;
  });
}

function stravaGetActivity(timeBefore, searchIndex){
  // test function - link to current ST
  if (timeBefore == '' || timeBefore == 0) timeBefore = Date.now();
  var stravaSearch = (searchIndex > 999) ? 1 : searchIndex;
  $.get('https://www.strava.com/api/v3/athlete/activities?before=' + timeBefore + '&page=' + stravaSearch + '&per_page=1&access_token='
    + stravaAccessToken, function(data, status){
      //console.log(data);
      // do things with activities
      if (searchIndex < 1000) {
        stravaActivityID = data[0].id;
      } else {
        stravaActivityID = searchIndex;
      }
      // get activity name
      $.get('https://www.strava.com/api/v3/activities/' + stravaActivityID + '?include_all_efforts=false&access_token='
        + stravaAccessToken, function(data, status){
          console.log(data);
          return data;
      })
      .fail(function(error) {
        window.alert("Strava Activity not accessible.");
        //stravaReady = false;
      });
  })
}
