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
var STMOBIURL   =   'https://sporttracks.mobi/activity/';
var STRAVAURL   =   'https://www.strava.com/activities/';
var STRYDURL    =   'https://www.stryd.com/powercenter/';
var KG2LB       =   2.20462; //kg to lb conversion (ST uses kg in data)
var MI2M        =   1609.344; //miles to meters
var M2FT        =   3.28084; //meters to feet
var GRADE2FTPMI =   52.80;   // 1% grade in ft/mile

if (location.host == 'localhost') {
  var REDIRECT    = 'http://localhost/';
  var CORSURL     = 'http://localhost:5000/';  // assumes cors server ('heroku local' is running (8080 if node server.js)
  var FPEURL      = 'http://localhost/main?strava=';
} else {
  var REDIRECT    = 'https://richardjy.github.io/FPE/main.html';
  var CORSURL     = 'https://fpe-cors.herokuapp.com/'; // whitelist set for 'https://richardjy.github.io' only
  var FPEURL      = 'https://richardjy.github.io/FPE/main?strava=';
}

// variables for SportTracks authorization codes
var stExpiresAt = 0; 			// expiry time for token Epoch time
var stAccessToken = '';		// used to get data
var stRefreshToken = '';	// used to get new AccessToken if expired
var stReady = false;			// are SportTracks Tokens etc set up?
var loggedIn    =   false;  //not used yet
var stIndex = 1;
var formSTdataOriginal;  // to check if data has changed
var healthOriginal;      // ditto for health
var stActivityInit;      // initial data - used to revert
var stActivityUpdate;    // updated data (initially same as Init)
var stGearInit = ([]);   // init list of gear
var stGearUpdate = ([]); // updated list of gear
var stHealthInit;        // health data - need to understand format
var indexSpin = false;   // was the index change from the arrows?
var getGear = false;     // get Gear is ongoing
var getActivity = false; // get Activity is ongoing
var postActGear = false; // POST Activity and gear is ongoing
var gearIndexPage = 0;   // page being displayed
var numGearPage = 10;     // number of gear per page
var stActivityID = 0;     // ID for ST activity
var progGearCount = 0;
// preferences
var confirmUpload = false;
var useLocalStorage = true;  // whether to store/read access tokens  - separate variable in FPE - need to rationalize
var linkStrava = true;  // whether to link to Strava too

function sportTracksInfo() {
  if (useLocalStorage) {
    if (localStorage.getItem('useLocalStorage') === null) {
      // show dialog if choice not already stored (use options button to change)
      if (window.confirm('Store access credentials locally? (Use "Options" to change later)') == true) {
        localStorage.setItem("useLocalStorage", 'true');
      } else { // wipe out local values, other than flag
        useLocalStorage = false;
        localStorage.setItem("useLocalStorage", 'false');
        stLocalStore();
        stravaLocalStore();
      }
    } else if (localStorage.useLocalStorage != 'true')  {
      useLocalStorage = false;
    }
  }

  if (linkStrava && useLocalStorage && localStorage.getItem('stravaRefreshToken') !== null) {
      stravaRefreshToken = localStorage.stravaRefreshToken;
      stravaScope = localStorage.stravaScope;
      stravaRefresh();
  }

  if (useLocalStorage && localStorage.getItem('stravaRefreshToken') !== null) {
      stRefreshToken = localStorage.STlinkRefreshToken;
      refreshToken(stRefreshToken);
      if (linkStrava && stravaRefreshToken == '') {
        document.getElementById("infoText").innerHTML = "Strava authorization dialog should appear. If not check Browser Pop-up settings.";
        loginStrava();
      }
  } else {
      loginST();  // loginStrava() within this routine to decouple login dialogs
  }

  if (useLocalStorage && localStorage.getItem('strydToken') !== null) {
      strydUID = localStorage.strydUID;
      strydBearer = localStorage.strydToken;
      strydReady = true;
  }

}

function loginST() {
    document.getElementById("infoText").innerHTML = "SportTrack authorization dialog should appear. If not check Browser Pop-up settings.";
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
    document.getElementById("infoText").innerHTML = "Validate: Please wait while Server wakes up...";
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
        if (linkStrava && stravaRefreshToken == '') {
          document.getElementById("infoText").innerHTML = "Strava authorization dialog should appear. If not check Browser Pop-up settings.";
          loginStrava();
        }
        tokenDone(data);
    })
    .fail(function(response) {
        window.alert("SportTracks token exchange failed.");
        stReady = false;
    });
}

function refreshToken(token) {
    document.getElementById("infoText").innerHTML = "Refresh: Please wait while Server wakes up...";
    $.ajax({
        type: 'POST',
        url: CORSURL + VALIDURL,
        //headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        //contentType: 'application/x-www-form-urlencoded; charset=utf-8',
        data: {
          'client_id' : CLIENTID,
          'client_secret' : CLIENTSEC,
          'refresh_token' : token,
          'grant_type' : 'refresh_token',
          'redirect_uri' : REDIRECT}
    })
    .done(function(data, status){
        tokenDone(data);  // ignore test loop
    })
    .fail(function(response) {
        window.alert("SportTracks token refresh failed. Authorization will be attempted.");
        stReady = false;
        loginST();
    });
}

function tokenDone(data){  // common to validate and refresh
  stExpiresAt = Math.round(Date.now()/1000 + data.expires_in/1000); // expiry time for token in seconds - calc seems incorrect (value invalid?)
  stAccessToken = data.access_token;
  if (typeof data.refresh_token !== 'undefined') stRefreshToken = data.refresh_token;	// used to get new AccessToken if expired
  //console.log("data: " , data, "\nExpires at: " + stExpiresAt);
  stLocalStore();
  stReady = true;
  enableForm();
}

function stLocalStore() {
  if (useLocalStorage) {
    //localStorage.setItem("STlinkAccessToken", stAccessToken);  // stored value not used at moment
    localStorage.setItem("STlinkRefreshToken", stRefreshToken);
    //localStorage.setItem("STlinkExpiresAt", stExpiresAt);
  } else {  // delete local store items
    localStorage.removeItem("STlinkAccessToken");
    localStorage.removeItem("STlinkRefreshToken");
    localStorage.removeItem("STlinkExpiresAt");
  }
}


function getFitnessActivityIndex(stIndexNo){   // index is which one to get 1 = last, 2 = second, if large number then try actual
    // to do - check stIndex to see if should try to grab directlty
    getActivity = true;
    if (stIndexNo > 9999) { // index was SportTracks ID
      //var lastActuri = FITNESSURL + '/' + stIndexNo
      getFitnessActivity(FITNESSURL + '/' + stIndexNo);
    } else { // input was sequence index, 1 = last etc
      var startDate = new Date($( "#idDate" ).datepicker('getDate'));
      startDate.setDate(startDate.getDate() + 1); // go to next day so we include selected date in search
      $.ajax({
          type: 'GET',
          url: CORSURL + FITNESSURL,
          headers: {
            'Authorization' : 'Bearer ' + stAccessToken,
            'Accept' : 'application/json'
          },
          data: {
            'pageSize' : 1,
            'page' : (stIndexNo - 1),
            'noLaterThan' : startDate.toISOString()
          }
      })
      .done(function(data, status){
          //console.log("data: ", data,  "\nStatus: " + status);
          //var lastActuri = data.items[0].uri
          if (typeof data.items[0] !== 'undefined') {
            getFitnessActivity(data.items[0].uri);
          } else {
            window.alert("SportTracks ID not valid.");
            //stReady = false;
            getActivity = false;
            $( "#progressSTact" ).hide();
          }
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
        $( "#progressSTact" ).hide();
        //stReady = false;
    });
}

function getSTgearList(){
    if ( getGear == false ) {
      $( "#progressSTgear" ).progressbar("value", false);
      $( "#progressSTgear" ).show();
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
          $( "#progressSTgear" ).progressbar("option", "max", data.items.length);
          $( "#progressSTgear" ).progressbar("value", progGearCount);
          $( "#progressSTgear" ).show();
          for (i = 0; i < data.items.length; i++) {
            getSTgearItem(data.items[i].uri, i);
          }
      })
      .fail(function(response) {
          window.alert("SportTracks gear data request failed.");
          $( "#progressSTgear" ).hide();
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

function getSThealth(metric){
    // note vo2max/2 = running
    $( "#progressHealth" ).show();
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
        stHealthInit = data;
        var options = [];
        $("#healthSel option").each(function(index, option) {
            $(option).remove();
        });

        options.push("<option value='weight'>Weight (lb)</option>");
        options.push("<option value='bodyFat'>Body Fat %</option>");
        options.push("<option value='restingHeartrate'>Resting HR</option>");
        //options.push("<option value='" + "sleep_time" + "'>" + "Sleep time (hrs)" + "</option>");

        //append after populating all options
        $('#healthSel')
          .append(options.join(""))
          .selectmenu();
        $('#healthSel').selectmenu('enable');
        if (typeof metric === 'undefined') metric = 'weight';
        $('#healthSel').val(metric);
        $('#healthSel').selectmenu('refresh');
        displayHealth();
        $( "#fieldSThealth" ).show();
        $( "#progressHealth" ).hide();
    })
    .fail(function(response) {
      $( "#progressHealth" ).hide();
        window.alert("SportTracks health metrics request failed.");
    });
}

function postSThealth(stHealth){
  // upsert - to remove data POST null
  $( "#progressHealth" ).show();
  $.ajax({
      type: 'POST',
      url: CORSURL + HEALTHURL,
      data:  JSON.stringify(stHealth),
      dataType: "json",
      headers: {
        'Authorization' : 'Bearer ' + stAccessToken,
        'Content-Type' : "application/json; charset=utf-8",
        'Accept' : 'application/json'
      }
  })
  .done(function(response){
      //console.log("response: ", response);
      // sort out array - simply get data from ST again to check (less effort)
      getSThealth($("#healthSel").val());
  })
  .fail(function(response) {
      //console.log("response: ", response);
      window.alert("SportTracks send request failed.");
      $( "#progressHealth" ).hide();
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

function getActivities( numAct = 15 ) {
    // later add filters and limit - initially get 15 Activities
    var startDate = new Date($( "#idDate" ).datepicker('getDate'));
    startDate.setDate(startDate.getDate() + 1); // go to next day so we include selected date in search
    $( "#progressActivities" ).progressbar("value", false);
    $( "#progressActivities" ).show();
    $.ajax({
        type: 'GET',
        url: CORSURL + FITNESSURL,
        headers: {
          'Authorization' : 'Bearer ' + stAccessToken,
          'Accept' : 'application/json'
        },
        data: {
          'pageSize' : numAct,
          'page' : 0,
          'noLaterThan' : startDate.toISOString()
        }
    })
    .done(function(data, status){
        //console.log("data: ", data,  "\nStatus: " + status);
        $( "#tableActivities" ).html("");
        var table = document.querySelector("#tableActivities");
        var filterObj = document.getElementById("filter");
        var filterVal = filterObj.value;
        var i=1;
        for (var element of data.items) {
          var actType = element.type;
          var exists = false;
          $('#filter option').each(function(){
              if (this.value == actType) {
                exists = true;
                return false;
              }
          });


          if (exists == false ) {
            var option = document.createElement("option");
            option.text = actType;
            filterObj.add(option);
          }

          if ( filterVal == "All" || actType.startsWith(filterVal) ) {
            var row = table.insertRow();
            var startT = new Date (element.start_time);
            //var startDayT = startT.toDateString().substr(0,4) + startT.toLocaleString();

            var button = document.createElement("button");
            button.setAttribute("class","tableID");
            button.innerHTML = i;
            row.insertCell().appendChild(button);
            row.insertCell().appendChild(document.createTextNode(startT.toDateString()));
            row.insertCell().appendChild(document.createTextNode(startT.toLocaleTimeString()));
            row.insertCell().appendChild(document.createTextNode(element.type));
            row.insertCell().appendChild(document.createTextNode(element.name));
            row.insertCell().appendChild(document.createTextNode(timeHMS(element.duration)));
            row.insertCell().appendChild(document.createTextNode(distMiles(element.total_distance)));

            var gearNum = -1;
            if (stGearUpdate.length > 0) {
              gearNum=0;
              var actID = element.uri.substring(element.uri.lastIndexOf('/')+1);
              for (j=0; j < stGearUpdate.length; j++ ) {
                if ( stGearUpdate[j].activities.indexOf(parseInt(actID)) > -1 ) {
                  gearNum++;
                }
              }
            }
            row.insertCell().appendChild(document.createTextNode( gearNum == -1 ? "-" : gearNum));
          }
          i++;
        }

        // header
        var thead = table.createTHead();
        //var row = thead.insertRow();
        table.appendChild(thead);
        thead.appendChild(document.createElement("th")).appendChild(document.createTextNode("#"));
        thead.appendChild(document.createElement("th")).appendChild(document.createTextNode("Date"));
        thead.appendChild(document.createElement("th")).appendChild(document.createTextNode("Time"));
        thead.appendChild(document.createElement("th")).appendChild(document.createTextNode("Type"));
        thead.appendChild(document.createElement("th")).appendChild(document.createTextNode("Name"));
        thead.appendChild(document.createElement("th")).appendChild(document.createTextNode("Duration"));
        thead.appendChild(document.createElement("th")).appendChild(document.createTextNode("Dist (mi)"));
        thead.appendChild(document.createElement("th")).appendChild(document.createTextNode("Gear"));
        $( "#progressActivities" ).hide();
        // }
    })
    .fail(function(response) {
        $( "#progressActivities" ).hide();
        window.alert("SportTracks data request failed.");
    });
}
