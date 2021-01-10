var strydReady = true;			// are Stryd Tokens etc set up?
var strydActivityID = 0;			// current activityID
var strydBearer = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJFbWFpbCI6InJpY2hhcmRqeTQ0QGdtYWlsLmNvbSIsIlVzZXJOYW1lIjoicmljaGFyZGp5IiwiRmlyc3ROYW1lIjoiUmljaGFyZCAiLCJMYXN0TmFtZSI6IllvdW5nIiwiSUQiOiI0MWYwMDg4MS1kYzk2LTVlMWMtNzgzOS0xNTRkZWI0YWMyZGQiLCJJbWFnZSI6Imh0dHBzJTNBJTJGJTJGc3RvcmFnZS5nb29nbGVhcGlzLmNvbSUyRnN0cnlkX3N0YXRpY19hc3NldHMlMkZwcm9maWxlX2ltYWdlJTJGcHJvZmlsZV9zdHJ5ZF9kZWZhdWx0LnBuZyUzRkV4cGlyZXMlM0Q0MTg5MjQ0NDAwJTI2R29vZ2xlQWNjZXNzSWQlM0Rnb29nbGUtY2xvdWQtc3RvcmFnZSUyNTQwc3RyeWR3ZWIuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20lMjZTaWduYXR1cmUlM0RweTBNdFFIRlNWa1k2ZHA3MnE2N0pnJTI1MkJhejhBMGxGTzdRbnFwSW44R1NlVTVMbVYzJTI1MkJJWFhDenRTcW9nRWJDZTBkRFZRTllFcGh3VUlaaVQlMjUyQjl1aVZuempKMFhxYkhyeWhqaXdGZjglMjUyQjdTNHFvUVRZc085Y2RBdEhscDQlMjUyQkVJUENVcklnYVJMJTI1MkJrUWN0QWNiTk9GMTJhcUhKMFZobEIzMnlVa3ZNZFFqNDhuOEZDR2hBMUNBc1JSSXRmbWJyVnFFMldtdEQ1V24wJTI1MkI2anYlMjUyQmlzUWE1YVNhVjR0SzBmd3dJNFc4Y2dEVmhhRURtVEs4azh3cnA4QjhUTmZMRlRRb2hWR0tlOFBIaDdQc0ZSM3RmUVclMjUyRiUyNTJCWW56Vml4TnVDUXRvJTI1MkZsciUyNTJGQUo4JTI1MkJuSjllcCUyNTJGNzFERndBdVU1cWlkOE4yRWN3d0swd1QxVmslMjUyRlAxZHlWVkJnYndsS1hUMmclMjUzRCUyNTNEIiwiQWNjZXNzVHlwZXMiOm51bGwsImV4cCI6MTU5Mjg0NTIwMzEzNCwiaXNzIjoic3RyeWQifQ.kODgqSaIZkTYAGzAjslEol3VSP-V7pIps47oNkbNNiU';
var strydUID = '41f00881-dc96-5e1c-7839-154deb4ac2dd';

function strydGetData(aid){
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

function strydGetUserData(uid){
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

function strydLogin(email, pwd){
  //test
  $.ajax({
      type: 'POST',
      url: CORSURL + 'https://www.stryd.com/b/email/signin',
      headers: {
      //   'Authorization' : 'Bearer ' + strydBearer,
         'Accept' : 'application/json'
      },
      data: JSON.stringify({
        'email' : email,
        'password' : pwd})
  })
  .done(function(data, status){
      console.log("data: ", data,  "\nStatus: " + status);
      //console.log(data.speed_list);
  })
  .fail(function(error) {
    window.alert("Stryd Login not accessible.");
    //stravaReady = false;
  });
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
          //console.log(data.activities[0].id);
          setStrydLink(data.activities[0].id);
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
  if (id > 0) {
    document.getElementById("linkStrydURL").innerHTML = 'Stryd: link';
    document.getElementById("linkStrydURL").href = STRYDURL + 'runs/' + id;
    $( "#getStrydInfo" ).button( "option", "disabled", false ); // button enabled
  } else {
    document.getElementById("linkStrydURL").innerHTML = 'Stryd: default';
    document.getElementById("linkStrydURL").href = STRYDURL;
    $( "#getStrydInfo" ).button( "option", "disabled", true ); // button disabled
  }
}

function getStrydInfo() {
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
        // strydData = [0]distance_from_watch, [1]distance_from_speed, [2]total_power, [3]GCT, [4]speed, [5]cadence
        strydData.length = 0;

        // if no array of distance then set to zero   -    distance list is time then distance
        var iEnd = data.timestamp_list[data.timestamp_list.length -1] - data.start_time + 1;
        var it = -1; // index of times, assume same for all data types, just skip watch stops
        var distS = 0; // distance from speed (assume all data 1s apart - fix later if not)
        for (i = 0; i < iEnd ; i++ ) {
          if (data.timestamp_list[it+1] - data.start_time == i) {
            it++;
            distS += +data.speed_list[it];  // avoid annoyingly long
            strydData[i] = [+data.distance_list[it].toFixed(2), +distS.toFixed(2), data.total_power_list[it],
                data.ground_time_list[it], +data.speed_list[it].toFixed(2), data.cadence_list[it]];
          } else {
            strydData[i] = [data.distance_list[it], distS, 0, 0, 2000, 0];
          }
        }
        console.log(strydData);
        iEnd--;
        console.log('distance:watch / stryd', strydData[iEnd][0], strydData[iEnd][1], (strydData[iEnd][0]/strydData[iEnd][1]).toFixed(3));
        $( "#getStrydInfo" ).button( "option", "disabled", false ); // button enabled
    })
    .fail(function(error) {
      window.alert("Stryd Activity not accessible.");
      $( "#getStrydInfo" ).button( "option", "disabled", false ); // button enabled
      //stravaReady = false;
    });
  }
}
