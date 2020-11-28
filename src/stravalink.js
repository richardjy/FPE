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
var stravaRequest = 'auto&scope=read,activity:read,activity:read_all,activity:write'; // request string

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
  if (typeof authArray.code !== 'undefined' && typeof authArray.scope !== 'undefined') {
    var stravaCode = authArray.code;
    stravaScope = authArray.scope;
    stravaReady = true;
    stravaGetToken(stravaCode, true);
  } else {
    stravaReady = false;
  }
  return;
}

function stravaGetToken(stravaCode, reTry){
  // now get Tokens
  //console.log(stravaCode);
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
      if (useLocalStorage) {
        localStorage.setItem("stravaAccessToken", stravaAccessToken);  // stored value not used at moment
        localStorage.setItem("stravaRefreshToken", stravaRefreshToken);
        localStorage.setItem("stravaExpiresAt", stravaExpiresAt);
      }

    })
    .fail(function(response) {
      //console.log(response);
      //var locHostPath = location.protocol + '//' + location.host + location.pathname;
      if (reTry) {
        var locHref = 'https://www.strava.com/oauth/authorize?client_id=' + stravaClientID +
          '&response_type=code&redirect_uri=' +
          location.protocol + '//' + location.host + location.pathname +
          '&approval_prompt=' + stravaRequest;
        //window.alert("Strava token exchange failed. URL = " + locHref);
        // how to prevent a loop?
        location.href = locHref;
      }
      stravaReady = false;
    });
  //console.log(jqPost);
}

function stravaRefresh() { // refresh Strava token, assumes stravaReady is true
  var jqPost = $.post('https://www.strava.com/api/v3/oauth/token?client_id=' + stravaClientID + '&client_secret=' +
        stravaAppCode + '&grant_type=refresh_token&refresh_token=' + stravaRefreshToken,
    function(data, status){
      //console.log("Status: " + status);
      //console.log(data);
      stravaExpiresAt = data.expires_at; 			// expiry time for token (epoch time)
      stravaAccessToken = data.access_token;
      stravaRefreshToken = data.refresh_token;	// used to get new AccessToken if expired
      if (useLocalStorage) {
        localStorage.setItem("stravaAccessToken", stravaAccessToken);  // stored value not used at moment
        localStorage.setItem("stravaRefreshToken", stravaRefreshToken);
        localStorage.setItem("stravaExpiresAt", stravaExpiresAt);
      }
      stravaReady = true;
    })
    .fail(function(response) {
      window.alert("Strava token exchange failed (during refresh).");
      stravaReady = false;
    });
  return;
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
