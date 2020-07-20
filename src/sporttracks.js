// javascript code for SportTracks

// fixed values
//var CORSURL     =   'https://cors-anywhere.herokuapp.com/'; // backup CORS server
var OAUTHURL    =   'https://api.sporttracks.mobi/oauth2/authorize?client_id=';
var VALIDURL    =   'https://api.sporttracks.mobi/oauth2/token';
var STATE       =   'test';
var CLIENTID    =   'forest-park-explorer'; // ID for SportTracks App
var CLIENTSEC   =   'ZVA6CTBL68FL6NSK'; // only works with specific website
var FITNESSURL  =   'https://api.sporttracks.mobi/api/v2/fitnessActivities';
var GEARURL     =   'https://api.sporttracks.mobi/api/v2/gear';
var HEALTHURL   =   'https://api.sporttracks.mobi/api/v2/metrics';

if (location.host == 'localhost') {
  var REDIRECT    = 'http://localhost/';
  var CORSURL     = 'http://localhost:5000/';  // assumes cors server ('heroku local' is running (8080 if node server.js)
} else {
  var REDIRECT    = 'https://richardjy.github.io/FPE/main.html';
  var CORSURL     = 'https://fpe-cors.herokuapp.com/'; // whitelist set for 'https://richardjy.github.io' only
}


// variables for SportTracks authorization codes
var stExpiresAt = 0; 			// expiry time for token Epoch time
var stAccessToken = '';		// used to get data
var stRefreshToken = '';	// used to get new AccessToken if expired
var stReady = false;			// are SportTracks Tokens etc set up?
var loggedIn    =   false;  //not used yet
var stTest = false;
var stIndex = 1;
var formSTdataOriginal;  // to check if data has changed
var stActivityInit;      // initial data - used to revert
var stActivityUpdate;    // updated data (initially same as Init)
var stGearInit = ([]);   // init list of gear
var stGearUpdate = ([]); // updated list of gear
var stHealthInit;        // health data - need to understand format
var stHealthUpdate;       // uses 'upsert' so only need changed data
var indexSpin = false;   // was the index change from the arrows?
var getGear = false;     // get Gear is ongoing
var getActivity = false; // get Activity is ongoing
var postActGear = false; // POST Activity and gear is ongoing
var gearIndexPage = 0;   // page being displayed
var numGearPage = 10;     // number of gear per page
var stActivityID = 0;     // ID for ST activity
var progGearCount = 0;

//login(1);

function sportTracksInfo(stDoIt) {
  if (stDoIt < 0) {  // negative means show it here
    stTest = true;
    stIndex = -stDoIt;
  } else {
    stIndex = stDoIt;
  }
  formSTdataOriginal = $("#formSTdata").serialize();  // to check if data has changed - where is best place?
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
    document.getElementById("infoText").innerHTML = "Please wait while Server wakes up...";
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
        //console.log("data: " , data, "\nExpires at: " + stExpiresAt);
        stReady = true;
        enableForm();
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

    getActivity = true;
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
          //console.log("data: ", data,  "\nStatus: " + status);
          //var lastActuri = data.items[0].uri
          getFitnessActivity(data.items[0].uri);
      })
      .fail(function(response) {
          window.alert("SportTracks data request failed.");
          //stReady = false;
          getActivity = false;
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
        //console.log("data: ", data,  "\nStatus: " + status);
        populateSTform (data);
        stActivityInit = data;
        stActivityUpdate = JSON.parse(JSON.stringify(data));  // make a cloned copy
        var url = data.uri;
        stActivityID = url.substring(url.lastIndexOf("/") + 1, url.length);
        getActivity = false;
        stGearUpdate = JSON.parse(JSON.stringify(stGearInit));  // revert to old list in case of changes
        prepGearList();
    })
    .fail(function(response) {
        window.alert("SportTracks data request failed.");
        getActivity = false;
    });
}

function postFitnessActivity(stActivity){
    $.ajax({
        type: 'PUT',
        url: CORSURL + stActivity.uri,
        data:  JSON.stringify(stActivity),
        dataType: "json",
        headers: {
          'Authorization' : 'Bearer ' + stAccessToken,
          'Content-Type' : "application/json; charset=utf-8",
          'Accept' : 'application/json'
        }
    })
    .done(function(response){
        //console.log("response: ", response);
        //window.alert("Upload successful.");
    })
    .fail(function(response) {
        //console.log("response: ", response);
        window.alert("SportTracks send request failed.");
        //stReady = false;
    });
}

function getSTgearList(){
    if ( getGear == false ) {
      document.getElementById("infoTextGear").innerHTML = "Getting gear...";
      $.ajax({
          type: 'GET',
          url: CORSURL + GEARURL,
          headers: {
            'Authorization' : 'Bearer ' + stAccessToken,
            'Accept' : 'application/json'
          },
          data: {
            'pageSize' : 1000  // assume fewer than that!
            //'page' : (stIndexNo - 1)
          }
      })
      .done(function(data, status){
          //console.log("data: ", data,  "\nStatus: " + status);
          // get all gear
          gearIndexPage = 0;
          getGear = true;
          progGearCount = 0;
          $( "#progressSTgear" ).progressbar("value", progGearCount);
          $( "#progressSTgear" ).progressbar("option", "max", data.items.length);
          $( "#progressSTgear" ).show();
          for (i = 0; i < data.items.length; i++) {
            getSTgearItem(data.items[i].uri, i);
          }
      })
      .fail(function(response) {
          window.alert("SportTracks gear data request failed.");
      });
  }
}

function getSTgearItem(gearURI, gearInd){
    $.ajax({
        type: 'GET',
        url: CORSURL + gearURI,
        headers: {
          'Authorization' : 'Bearer ' + stAccessToken,
          'Accept' : 'application/json'
        }
    })
    .done(function(data, status){
        //console.log("data: ", data,  "\nStatus: " + status);
        stGearInit[gearInd] = data;
        progGearCount++;
        $( "#progressSTgear" ).progressbar("value", progGearCount);
    })
    .fail(function(response) {
        window.alert("SportTracks gear data request failed.");
    });
}

function postSTgearItem(stGear){
    $.ajax({
        type: 'PUT',
        url: CORSURL + stGear.uri,
        data:  JSON.stringify(stGear),
        dataType: "json",
        headers: {
          'Authorization' : 'Bearer ' + stAccessToken,
          'Content-Type' : "application/json; charset=utf-8",
          'Accept' : 'application/json'
        }
    })
    .done(function(response){
        //console.log("response: ", response);
        //window.alert("Upload successful.");
        // do combo alert when all done
    })
    .fail(function(response) {
        //console.log("response: ", response);
        window.alert("SportTracks send request failed.");
        //stReady = false;
    });
}

function getSThealth(){
    //document.getElementById("infoTextGear").innerHTML = "Getting health...";
    $.ajax({
        type: 'GET',
        url: CORSURL + HEALTHURL,
        headers: {
          'Authorization' : 'Bearer ' + stAccessToken,
          'Accept' : 'application/json'
        }
    })
    .done(function(data, status){
        console.log("data: ", data,  "\nStatus: " + status);
        // get all health
        // store it somewhere and then display
    })
    .fail(function(response) {
        window.alert("SportTracks health metrics request failed.");
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
