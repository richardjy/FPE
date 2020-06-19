// javascript code for SportTracks



var OAUTHURL    =   'https://api.sporttracks.mobi/oauth2/authorize?client_id=';
var VALIDURL    =   'https://api.sporttracks.mobi/oauth2/token?client_id=';
var VALIDURL2    =   'https://api.sporttracks.mobi/oauth2/token';
var STATE       =   'test';
var CLIENTID    =   'forest-park-explorer';
var CLIENTSEC   =   'ZVA6CTBL68FL6NSK';
//var REDIRECT    =   'https://richardjy.github.io/';
var REDIRECT    =   'https://richardjy.github.io/FPE/main.html';
//var REDIRECT    =   'http://localhost/sporttracks';
//var LOGOUT      =   'http://accounts.google.com/Logout';
var TYPE        =   'code';
var _url        =   OAUTHURL + CLIENTID + '&redirect_uri=' + REDIRECT + '&state=' + STATE + '&response_type=' + TYPE;
var acCode
var acToken;
var reToken;
var expiresIn;
var user;
var loggedIn    =   false;

// $.ajaxSetup({
//   accepts: "application/json",
//   contentType: "application/json",
//   //contentType: "application/x-www-form-urlencoded",
//   xhrFields: {
//     withCredentials: true
//   }
// });

login(1);

function login(tryCode) {
    var win         =   window.open(_url, "windowname1", 'width=400, height=300');

    var pollTimer   =   window.setInterval(function() {
        try {
            console.log(win.document.URL);
            if (win.document.URL.indexOf(REDIRECT) != -1) {
                window.clearInterval(pollTimer);
                var url =   win.document.URL;
                acCode =   gup(url, 'code');
                //console.log(acCode);
                //reToken = gup(url, 'refresh_token');
                //expiresIn = gup(url, 'expires_in');
                win.close();

                if (tryCode == 1) {
                  console.log('ValidateToken2: ', acCode);
                  validateToken2(acCode);
                } else {
                  console.log('stTokens: ', acCode);
                  stTokens(acCode);
                }
            }
        } catch(e) {
        }
    }, 500);
}

function validateToken(token) {
    $.ajax({
        type: 'POST',
        url: VALIDURL + CLIENTID + '&client_secret=' + CLIENTSEC + '&code=' + token +
          '&grant_type=authorization_code&redirect_uri=' + REDIRECT,
        data: null,
        success: function(responseText){
            //getUserInfo();
            //loggedIn = true;
            console.log(responseText)
            $('#loginText').hide();
            $('#logoutText').show();
        },
    });
}

function validateToken2(token) {
    $.ajax({
        type: 'POST',
        url: VALIDURL, 
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        contentType: 'application/x-www-form-urlencoded; charset=utf-8',
        data: { 
            'client_id': CLIENTID,
            'client_secret': CLIENTSEC,
            'code' : token,
            'grant_type' : 'authorization_code',
            'redirect_uri' : encodeURIComponent(REDIRECT)
        },
        success: function(responseText){
            //getUserInfo();
            //loggedIn = true;
            console.log(responseText)
            $('#loginText').hide();
            $('#logoutText').show();
        },
    });
}

function getUserInfo() {
    $.ajax({
        url: 'https://www.googleapis.com/oauth2/v1/userinfo?access_token=' + acToken,
        data: null,
        success: function(resp) {
            user    =   resp;
            console.log(user);
            $('#uName').text('Welcome ' + user.name);
            $('#imgHolder').attr('src', user.picture);
        },
        dataType: "jsonp"
    });
}

//credits: http://www.netlobo.com/url_query_string_javascript.html
function gup(url, name) {
    name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
    var regexS = "[\\#&?]"+name+"=([^&#]*)";
    var regex = new RegExp( regexS );
    //console.log(regexS, regex, url);
    var results = regex.exec( url );
    if( results == null )
        return "";
    else
        return results[1];
}

function startLogoutPolling() {
    $('#loginText').show();
    $('#logoutText').hide();
    loggedIn = false;
    $('#uName').text('Welcome ');
    $('#imgHolder').attr('src', 'none.jpg');
}







// different method
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
var stRedirectURI = REDIRECT;
//var stRedirectURI = 'https://richardjy.github.io/FPE/main.html'; //needs redirect URI each time!
//var stRequest = 'authorization_code'; // request string

// setup SportTracksLink (if appropriate)
// stTokens(); // setup tokens at startup - may need to refresh later

function stTokens(token) { // handle SportTracks token, do this early to avoid any asynchronicity issue
  // get 'redirect' access code from browser window (if that fails then force reconnect to SportTracks - how to avoid cycle?)
  //var authString = window.location.search;
  //var stURI = window.location.href;
  //var authArray = {};
  //  var pairs = (authString[0] === '?' ? authString.substr(1) : authString).split('&');

   $.ajaxSetup({
     //accepts: "application/json",
     contentType: "application/json",
     //contentType: "application/x-www-form-urlencoded",
     xhrFields: {
       withCredentials: true
     }
   });


  // for (var i = 0; i < pairs.length; i++) {
  //   var pair = pairs[i].split('=');
  //   authArray[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
  // }
  //console.log(authArray);
  // expect - .state: 'what was sent'
  // 					.code = access token
  // if (typeof authArray.code !== 'undefined' && typeof authArray.state !== 'undefined') {
  //   stCode = authArray.code;
  //   stState = authArray.state;
  stReady = true;
  stCode = token;
  // } else {
  //   stReady = false;
  // }

  if (stReady == true) {
      // now get Tokens
      //console.log('token = ' + stCode);
      var postURL = 'https://api.sporttracks.mobi/oauth2/token?client_id=' + stClientID + '&client_secret=' +
      stAppCode + '&code=' + stCode + '&grant_type=authorization_code&redirect_uri=' + stRedirectURI;
      console.log(postURL);
      var jqPost = $.post(postURL,
        function(data, status){
          console.log("data: " + data + "\nStatus: " + status);
          stExpiresIn = data.expires_in; 			// expiry time for token in seconds
          stAccessToken = data.access_token;
          stRefreshToken = data.refresh_token;	// used to get new AccessToken if expired
        })
        .fail(function(response) {
          //console.log('response =', response);
          // var locHostPath = location.protocol + '//' + location.host + location.pathname;
          // //https://api.sporttracks.mobi/oauth2/authorize?client_id="forest-park-explorer"&redirect_uri=http://localhost:4000/SportTracks.html&state="Test"&response_type=code"
          // var locHref = 'https://api.sporttracks.mobi/oauth2/authorize?client_id=' + stClientID +
          //   '&response_type=code&redirect_uri=' +
          //   location.protocol + '//' + location.host + location.pathname + '&state=Test';
          // window.alert("SportTracks token exchange failed. URL = " + locHref);
          // stReady = false;
          // // how to prevent a loop?
          // //location.href = locHref;
        });
      //console.log(jqPost);
    }
  return;
}
