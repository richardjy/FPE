// javascript code for SportTracks

// fixed values
var CORSURL     =   'https://cors-anywhere.herokuapp.com/';
var OAUTHURL    =   'https://api.sporttracks.mobi/oauth2/authorize?client_id=';
var VALIDURL    =   'https://api.sporttracks.mobi/oauth2/token';
var STATE       =   'test';
var CLIENTID    =   'forest-park-explorer'; // ID for SportTracks App
var CLIENTSEC   =   'ZVA6CTBL68FL6NSK'; // only works with specific website
var FITNESSURL  =   'https://api.sporttracks.mobi/api/v2/fitnessActivities';
//var REDIRECT    =   'https://richardjy.github.io/';
//

if (location.host == 'localhost') {
  var REDIRECT    =   'http://localhost/';
} else {
  var REDIRECT    =   'https://richardjy.github.io/FPE/main.html';
}



// different method
// variables for SportTracks authorization codes

var stExpiresAt = 0; 			// expiry time for token Epoch time
var stAccessToken = '';		// used to get data
var stRefreshToken = '';	// used to get new AccessToken if expired
var stReady = false;			// are SportTracks Tokens etc set up?
var loggedIn    =   false;  //not used yet
var stTest = false;
var stIndex = 1;


//login(1);

function sportTracksInfo(stDoIt) {
  if (stDoIt < 0) {  // negative means show it here
    stTest = true;
    stIndex = -stDoIt;
  } else {
    stIndex = stDoIt;
  }
  login();
  // if (stReady == true) {
  //   getFitnessActivities();
  // }
}

function login() {
    var winurl  =  OAUTHURL + CLIENTID + '&redirect_uri=' + REDIRECT + '&state=' + STATE + '&response_type=code';
    var win     =  window.open(winurl, "windowname1", 'width=400, height=300');
    var pollTimer   =   window.setInterval(function() {
        try {
            //console.log(win.document.URL);
            if (win.document.URL.indexOf(REDIRECT) != -1) {
                window.clearInterval(pollTimer);
                var url =   win.document.URL;
                var stCode = gup(url, 'code');  // could also do same way as Strava link
                var stState = gup(url, 'state');  // could also do same way as Strava link
                //console.log(stCode);
                win.close();
                //console.log('ValidateToken: ', stCode);
                validateToken(stCode);
            }
        } catch(e) {
        }
    }, 500);
}

function validateToken(token) {
    $.ajax({
        type: 'POST',
        url: CORSURL + VALIDURL,
        //headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        //contentType: 'application/x-www-form-urlencoded; charset=utf-8',
        data: {
          'client_id' : CLIENTID,
          'client_secret' : CLIENTSEC,
          'code' : token,
          'grant_type' : 'authorization_code',
          'redirect_uri' : REDIRECT}
    })
    .done(function(data, status){
        stExpiresAt = Math.round(Date.now()/1000 + data.expires_in); 			// expiry time for token in seconds
        stAccessToken = data.access_token;
        stRefreshToken = data.refresh_token;	// used to get new AccessToken if expired
        console.log("data: " , data, "\nExpires at: " + stExpiresAt);
        var stReady = true;
        if (stTest == true) {
          getFitnessActivityIndex(stIndex);
        }
    })
    .fail(function(response) {
        window.alert("SportTracks token exchange failed.");
        stReady = false;
    });
}

function getFitnessActivityIndex(stIndexNo){   // index is which one to get 1 = last, 2 = second, if large number then try actual
    // to do - check stIndex to see if should try to grab directlty

    if (stIndexNo > 9999) { // index was SportTracks ID
      //var lastActuri = FITNESSURL + '/' + stIndexNo
      getFitnessActivity(FITNESSURL + '/' + stIndexNo);
    } else { // input was sequence index, 1 = last etc
      $.ajax({
          type: 'GET',
          url: CORSURL + FITNESSURL,
          headers: {
            'Authorization' : 'Bearer ' + stAccessToken,
            'Accept' : 'application/json'
          },
          data: {
            'pageSize' : 1,
            'page' : (stIndexNo - 1)
          }
      })
      .done(function(data, status){
          console.log("data: ", data,  "\nStatus: " + status);
          //var lastActuri = data.items[0].uri
          getFitnessActivity(data.items[0].uri);
      })
      .fail(function(response) {
          window.alert("SportTracks data request failed.");
          //stReady = false;
      });
    }
}

function getFitnessActivity(stActURI){
    $.ajax({
        type: 'GET',
        url: CORSURL + stActURI,
        headers: {
          'Authorization' : 'Bearer ' + stAccessToken,
          'Accept' : 'application/json'
        }
    })
    .done(function(data, status){
        console.log("data: ", data,  "\nStatus: " + status);
        if (stTest == true) {
          stDate = new Date (data.start_time);
          window.alert("SportTracks - index " + stIndex + ": \n  " + data.name + " (" + stDate.toLocaleString() + ")\n  " + data.uri);
        }
        console.log("SportTracks - index " + stIndex + ": \n  " + data.name + " (" + stDate.toLocaleString() + ")\n  " + data.uri);
    })
    .fail(function(response) {
        window.alert("SportTracks data request failed.");
        //stReady = false;
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
