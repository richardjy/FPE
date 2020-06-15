// javascript code for SportTracks

// variables for SportTracks authorization codes
var stClientID = 'forest-park-explorer';		// ID for SportTracks App
var stAppCode = 'ZVA6CTBL68FL6NSK'; // only works with specific website
var stExpiresIn = 0; 			// expiry time for token in seconds
var stAccessToken = '';		// used to get data
var stRefreshToken = '';	// used to get new AccessToken if expired
var stCode = ''; 					// returned by redirect
var stState = '';					// returned by redirect
var stReady = false;			// are SportTracks Tokens etc set up?
var stActivityID = 0;			// current activityID
var stRedirectURI = 'https://richardjy.github.io/FPE/main.html'; //needs redirect URI each time!
//var stRequest = 'authorization_code'; // request string

// setup SportTracksLink (if appropriate)
stTokens(); // setup tokens at startup - may need to refresh later

function stTokens() { // handle SportTracks token, do this early to avoid any asynchronicity issue
  // get 'redirect' access code from browser window (if that fails then force reconnect to SportTracks - how to avoid cycle?)
  var authString = window.location.search;
  //var stURI = window.location.href;
  var authArray = {};
  var pairs = (authString[0] === '?' ? authString.substr(1) : authString).split('&');

  // $.ajaxSetup({
  //   accepts: "application/json",
  //   contentType: "application/json; charset=utf-8",
  //   xhrFields: {
  //     withCredentials: true
  //   }
  // });


  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split('=');
    authArray[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
  }
  //console.log(authArray);
  // expect - .state: 'what was sent'
  // 					.code = access token
  if (typeof authArray.code !== 'undefined' && typeof authArray.state !== 'undefined') {
    stCode = authArray.code;
    stState = authArray.state;
    stReady = true;
  } else {
    stReady = false;
  }

  if (stReady == true) {
      // now get Tokens
      console.log(stCode);
      var postURL = 'https://api.sporttracks.mobi/oauth2/token?client_id=' + stClientID + '&client_secret=' +
      stAppCode + '&code=' + stCode + '&grant_type=authorization_code&redirect_uri=' + stRedirectURI;
      console.log(postURL);
      var jqPost = $.post(postURL,
        function(data, status){
          //console.log("data: " + data + "\nStatus: " + status);
          console.log(data);
          stExpiresIn = data.expires_in; 			// expiry time for token in seconds
          stAccessToken = data.access_token;
          stRefreshToken = data.refresh_token;	// used to get new AccessToken if expired
        })
        .fail(function(response) {
          console.log(response);
          var locHostPath = location.protocol + '//' + location.host + location.pathname;
          //https://api.sporttracks.mobi/oauth2/authorize?client_id="forest-park-explorer"&redirect_uri=http://localhost:4000/SportTracks.html&state="Test"&response_type=code"
          var locHref = 'https://api.sporttracks.mobi/oauth2/authorize?client_id=' + stClientID +
            '&response_type=code&redirect_uri=' +
            location.protocol + '//' + location.host + location.pathname + '&state=Test';
          window.alert("SportTracks token exchange failed. URL = " + locHref);
          stReady = false;
          // how to prevent a loop?
          //location.href = locHref;
        });
      console.log(jqPost);
    }
  return;
}
