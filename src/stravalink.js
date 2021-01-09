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

function strydGetData(id){
  // test function -
  //$.get('https://www.stryd.com/b/api/v1/activities/' + id + '??keys=SmoothVelocityStream&access_token='
  strydBearer = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJFbWFpbCI6InJpY2hhcmRqeTQ0QGdtYWlsLmNvbSIsIlVzZXJOYW1lIjoicmljaGFyZGp5IiwiRmlyc3ROYW1lIjoiUmljaGFyZCAiLCJMYXN0TmFtZSI6IllvdW5nIiwiSUQiOiI0MWYwMDg4MS1kYzk2LTVlMWMtNzgzOS0xNTRkZWI0YWMyZGQiLCJJbWFnZSI6Imh0dHBzJTNBJTJGJTJGc3RvcmFnZS5nb29nbGVhcGlzLmNvbSUyRnN0cnlkX3N0YXRpY19hc3NldHMlMkZwcm9maWxlX2ltYWdlJTJGcHJvZmlsZV9zdHJ5ZF9kZWZhdWx0LnBuZyUzRkV4cGlyZXMlM0Q0MTg5MjQ0NDAwJTI2R29vZ2xlQWNjZXNzSWQlM0Rnb29nbGUtY2xvdWQtc3RvcmFnZSUyNTQwc3RyeWR3ZWIuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20lMjZTaWduYXR1cmUlM0RweTBNdFFIRlNWa1k2ZHA3MnE2N0pnJTI1MkJhejhBMGxGTzdRbnFwSW44R1NlVTVMbVYzJTI1MkJJWFhDenRTcW9nRWJDZTBkRFZRTllFcGh3VUlaaVQlMjUyQjl1aVZuempKMFhxYkhyeWhqaXdGZjglMjUyQjdTNHFvUVRZc085Y2RBdEhscDQlMjUyQkVJUENVcklnYVJMJTI1MkJrUWN0QWNiTk9GMTJhcUhKMFZobEIzMnlVa3ZNZFFqNDhuOEZDR2hBMUNBc1JSSXRmbWJyVnFFMldtdEQ1V24wJTI1MkI2anYlMjUyQmlzUWE1YVNhVjR0SzBmd3dJNFc4Y2dEVmhhRURtVEs4azh3cnA4QjhUTmZMRlRRb2hWR0tlOFBIaDdQc0ZSM3RmUVclMjUyRiUyNTJCWW56Vml4TnVDUXRvJTI1MkZsciUyNTJGQUo4JTI1MkJuSjllcCUyNTJGNzFERndBdVU1cWlkOE4yRWN3d0swd1QxVmslMjUyRlAxZHlWVkJnYndsS1hUMmclMjUzRCUyNTNEIiwiQWNjZXNzVHlwZXMiOm51bGwsImV4cCI6MTU5Mjg0NTIwMzEzNCwiaXNzIjoic3RyeWQifQ.kODgqSaIZkTYAGzAjslEol3VSP-V7pIps47oNkbNNiU';
  $.ajax({
      type: 'GET',
      url: CORSURL + 'https://www.stryd.com/b/api/v1/activities/' + id,
      //url: 'https://www.stryd.com/b/api/v1/activities/' + id,
      headers: {
        'Authorization' : 'Bearer ' + strydBearer,
        'Accept' : 'application/json'
      }
  })
  .done(function(data, status){
      console.log("data: ", data,  "\nStatus: " + status);
      console.log(data.speed_list);
  })
  .fail(function(error) {
    window.alert("Stryd Activity not accessible.");
    //stravaReady = false;
  });
}

function stravaGetData(id){
  // test function -
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

          // // FPE only - comment out for now
          // gpxRouteName = data.name.replace(/[^\x20-\x7E]/g, '').trim(); //get rid of non-printing characters
          // gpxRouteName = 'Strava: ' + gpxRouteName + ' (' + stravaActivityID +')';
          // // get gpx data
          // $.get('https://www.strava.com/api/v3/activities/' + stravaActivityID + '/streams?keys=latlng&key_by_type=true&access_token='
          //   + stravaAccessToken, function(data, status){
          //     //console.log(data);
          //     //console.log(data.latlng.data);
          //     var stravaGPX = L.Polyline.PolylineEditor(data.latlng.data, {color: 'blue', maxMarkers: 500}).addTo(gpxdata);
          //     // updated line gpxdata.getLayers()[0].toGeoJSON()
          //     //  sizeof  gpxdata.getLayers().length  last = length-1
          //     //L.Polyline.PolylineEditor
          //     //stravaGPX = L.polyline(data.latlng.data, {color: 'blue'}).addTo(gpxdata);
          //     stravaGPX.bindTooltip(gpxRouteName, {sticky: true});
          //     //gpxPoints = stravaGPX.toGeoJSON();  // this is now done at conversion
          //     mymap.fitBounds(stravaGPX.getBounds());
          //     gpxLoaded = true;
          //     gpxCalcButton.enable();
          // })
          // .fail(function(response) {
          //   window.alert("Strava Activity GPX data not accessible.");
          //   //stravaReady = false;
          // });
      })
      .fail(function(error) {
        window.alert("Strava Activity not accessible.");
        //stravaReady = false;
      });
  })
}
