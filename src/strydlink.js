var strydReady = false;			// are Stryd Tokens etc set up?
var strydActivityID = 0;			// current activityID
var strydBearer = '';
var strydUID = '';
var strydActivity = '';

function strydGetData(aid = strydActivityID){
  //test
  $.ajax({
      type: 'GET',
      url: CORSURL + 'https://www.stryd.com/b/api/v1/activities/' + aid,
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

function strydGetUserData(uid = strydUID){
  // test
  $.ajax({
      type: 'GET',
      url: CORSURL + 'https://www.stryd.com/b/api/v1/users/' + uid,
      //url: 'https://www.stryd.com/b/api/v1/activities/' + id,
      headers: {
        'Authorization' : 'Bearer ' + strydBearer,
        'Accept' : 'application/json'
      }
  })
  .done(function(data, status){
      console.log("data: ", data,  "\nStatus: " + status);
      //console.log(data.speed_list);
  })
  .fail(function(error) {
    window.alert("Stryd User Data not accessible.");
    //stravaReady = false;
  });
}

//PUT  https://www.stryd.com/b/api/v1/activities/5862599790985216
// request  name	"new name"

function updateStrydData(aid = strydActivityID){
    $.ajax({
        type: 'PUT',
        url: CORSURL + 'https://www.stryd.com/b/api/v1/activities/' + aid,
        data:  JSON.stringify({
            'name' : document.getElementById("STname").value,
            'description' : document.getElementById("STnotes").value}),
        dataType: "json",
        headers: {
          'Authorization' : 'Bearer ' + strydBearer,
          'Content-Type' : "application/json; charset=utf-8",
          'Accept' : 'application/json'
        }
    })
    .done(function(response){
        //console.log("response: ", response);
        //window.alert("Upload successful.");
        strydActivity = response;
        $( "#updateStrydData" ).button()[0].title = "Name: " + "'" + strydActivity.name + "'";
    })
    .fail(function(response) {
        //console.log("response: ", response);
        window.alert("Stryd send request failed.");
        //$( "#progressSTact" ).hide();
        //stReady = false;
    });
}

function strydLogin(email, pwd){
  //test
  $.ajax({
      type: 'POST',
      url: CORSURL + 'https://www.stryd.com/b/email/signin',
      headers: {
      //   'Authorization' : 'Bearer ' + strydBearer,
         'Accept' : 'application/json',
         'Content-Type' : 'application/json'  // fix for stryd issue
      },
      data: JSON.stringify({
        'email' : email,
        'password' : pwd})
  })
  .done(function(data, status){
      //console.log("data: ", data,  "\nStatus: " + status);
      strydBearer = data.token;
      strydUID = data.id;
      strydLocalStore();
      strydReady = true;
      document.getElementById("getStrydInfo").value = 'Get Stryd';
      getStrydLink(stActivityInit);
  })
  .fail(function(error) {
    window.alert("Stryd Login not accessible.");
    //stravaReady = false;
  });
}

function strydLocalStore() {
  if (useLocalStorage) {
    //localStorage.setItem("stravaAccessToken", stravaAccessToken);  // stored value not used at moment
    localStorage.setItem("strydUID", strydUID);
    localStorage.setItem("strydToken", strydBearer);
    //localStorage.setItem("stravaExpiresAt", stravaExpiresAt);
  } else {  // delete local store items
    localStorage.removeItem("strydUID");
    localStorage.removeItem("strydToken");
  }
}

function strydGetCalendar(calFrom, calTo){
  // test function
  $.ajax({
      type: 'GET',
      url: CORSURL + 'https://www.stryd.com/b/api/v1/users/calendar?from=' + calFrom + '&to=' + calTo,
      //url: 'https://www.stryd.com/b/api/v1/activities/' + id,
      headers: {
        'Authorization' : 'Bearer ' + strydBearer,
        'Accept' : 'application/json'
      }
  })
  .done(function(data, status){
      console.log("data: ", data,  "\nStatus: " + status);
      //console.log(data.speed_list);
  })
  .fail(function(error) {
    window.alert("Stryd User Data not accessible.");
    //stravaReady = false;
  });
}

function getStrydLink(stActivity) {
  if (strydReady == true) {
    var calFrom = Math.floor(new Date(stActivity.start_time)/1000); // start time
    var calTo = Math.floor(calFrom + stActivity.clock_duration/2); // go to mid point of activity
    calFrom -= 60*60; //go back one hour in case rounding issues - always look for last run
    // look for first activity before midpoint
    $.ajax({
        type: 'GET',
        url: CORSURL + 'https://www.stryd.com/b/api/v1/users/calendar?from=' + calFrom + '&to=' + calTo,
        headers: {
          'Authorization' : 'Bearer ' + strydBearer,
          'Accept' : 'application/json'
        }
    })
    .done(function(data, status){
        //console.log("data: ", data,  "\nStatus: " + status);
        // check finish time is after STmodi midpoint i.e. activities overlap
        if ( data.activities != null && data.activities[0].start_time + data.activities[0].elapsed_time - calTo > 0 ) {
          //console.log(data.activities[0]);
          strydActivity = data.activities[0];
          setStrydLink(strydActivity.id);
        } else {
          //window.alert("No Strava Activity at same time found.");
          //setStrydLink(0);
        }
        // set link
    })
    .fail(function(error) {
      //setStrydLink(0);
    });
  } else {
    //setStrydLink(0);
  }
}

function setStrydLink(id) {
  strydActivityID = id;
  $( "#getStrydInfo" ).css("background","");  // background color default
  $( "#getStrydInfo" ).button()[0].title = "Get run data from Stryd";
  if (id > 0) {
    document.getElementById("linkStrydURL").innerHTML = 'Stryd: link';
    document.getElementById("linkStrydURL").href = STRYDURL + 'runs/' + id;
    $( "#getStrydInfo" ).button( "option", "disabled", false ); // button enabled     strydActivity
    $( "#updateStrydData" ).button( "option", "disabled", false ); // button enabled
    $( "#updateStrydData" ).button()[0].title = "Name: " + "'" + strydActivity.name + "'";
  } else {
    document.getElementById("linkStrydURL").innerHTML = 'Stryd: default';
    document.getElementById("linkStrydURL").href = STRYDURL;
    $( "#getStrydInfo" ).button( "option", "disabled", strydReady ); // button enabled if login still needed
    $( "#updateStrydData" ).button( "option", "disabled", true ); // button disables
    $( "#updateStrydData" ).button()[0].title = "Name: N/A";
  }
}

function getStrydInfo() {
  if (strydReady == false) {
    $("#strydLogin").dialog("open");
  } else {
    if (strydActivityID > 0) {
      //console.log('get stryd', strydActivityID);
      $( "#getStrydInfo" ).button( "option", "disabled", true ); // button disabled
      $.ajax({
          type: 'GET',
          url: CORSURL + 'https://www.stryd.com/b/api/v1/activities/' + strydActivityID,
          headers: {
            'Authorization' : 'Bearer ' + strydBearer,
            'Accept' : 'application/json'
          }
      })
      .done(function(data, status){
          //console.log("data: ", data);
          //console.log(data.speed_list);
          // distance_list (matches fitfile), speed_list, timestamp_list,
          // cadence_list (spm - different but similar to watch, matches second 'Cadence' in fitFile)
          // matches ST: heart_rate_list, total_power_list, ground_time_list
          // from stryd [0]distance_from_watch, [1] delta_dist, [2]distance_from_speed, [3]speed, [4]total_power, [5]GCT, [6]cadence
          strydData.length = 0;

          // if no array of distance then set to zero   -    distance list is time then distance
          var strydOffset = (new Date(stActivityUpdate.start_time)/1000) - strydActivity.start_time - 2; // offset by extra 2s
          //console.log("stryd delay: ", strydOffset);
          // if negative then add blank data to the start

          var iEnd = data.timestamp_list[data.timestamp_list.length -1] - data.start_time + 1;

          var it = -1; // index of times, assume same for all data types, just skip watch stops
          var distS = 0; // distance from speed (assume all data 1s apart - fix later if not)
          var strydInt = 1; // count number of steps between data points
          for (i = 0; i < iEnd ; i++ ) {
            if (data.timestamp_list[it+1] - data.start_time == i) {
              it++;
              var deltaS = data.speed_list[it];  //  don't assume 1 sec per data point (actually 2s seen in Jan 2023)
              distS += strydInt*deltaS;
              var distW = data.distance_list[it];
              var deltaW = i > 0 ? (distW - strydData[i-strydInt][0])/strydInt : distW;
              // // avoid annoyingly large number of digits
              strydData[i] = [+distW.toFixed(2), +deltaW.toFixed(2), +distS.toFixed(2), +deltaS.toFixed(2),
                  data.total_power_list[it], data.ground_time_list[it], data.cadence_list[it]];
              if (strydInt > 1) {
                for (j = 1; j <= strydInt-1 ; j++ ) {
                  strydData[i-j] = [+(strydData[i-strydInt][0]+deltaW*j).toFixed(2), +deltaW.toFixed(2),
                      +(strydData[i-strydInt][2]+deltaS*j).toFixed(2), +deltaS.toFixed(2),
                      data.total_power_list[it], data.ground_time_list[it],
                      data.cadence_list[it]];
                }
                strydInt = 1;
              }
            } else {
              strydInt++;
              //strydData[i] = [+distW.toFixed(2), 0, +distS.toFixed(2), 0, 0, 2000, 0];
            }
          }

          // data has distance at time zero - zero out deltas for [0] and add to [1]
          strydData[1][1] = +(strydData[0][1] + strydData[1][1]).toFixed(2);
          strydData[0][1] = 0;
          strydData[1][3] = +(strydData[0][3] + strydData[1][3]).toFixed(2);
          strydData[0][3] = 0;

          //now shift data by strydOffset
          if (strydOffset>=0) {
            for (i=0; i<strydData.length-strydOffset; i++)
              {strydData[i] = strydData[i+strydOffset]}
          } else {
            for (i=0; i<-strydOffset; i++)
              {strydData[i] = strydData[0]}
            for (i= strydData.length-1; i>-strydOffset; i--)
              {strydData[i] = strydData[i+strydOffset]}
          }

          // display data as needed
          refreshData();

          var dist_mi = distMiles(sumStryd[0][0][1]);  // so same as stored value for pace calcs
          $( "#getStrydInfo" ).button( "option", "disabled", false ); // button enabled
          $( "#getStrydInfo" ).button()[0].title = "Stryd dist: " + dist_mi + " mi";
          $( "#getStrydInfo" ).css("background","LightGreen");
          if ( dist_mi >= document.getElementById("STdistance").value ) { // only update if >= to distance
            document.getElementById("STdistance").value = dist_mi;
            document.getElementById("STactiveP").value = calcUIPace();
          }
          displaySummary();
      })
      .fail(function(error) {
        window.alert("Stryd Activity not accessible.");
        $( "#getStrydInfo" ).button( "option", "disabled", false ); // button enabled
        //stravaReady = false;
      });
    }
  }
}
