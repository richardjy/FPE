
// variables for Strava authorization codes
var stravaClientID = 31392;		// ID for Strava App
var stravaAppCode = '62b8199e3a3b620dd6e76e790d3476fb3932edd5'; // only works with specific website
var stravaExpiresAt = 0; 			// expiry time for token (epoch time)
var stravaAccessToken = '';		// used to get data
var stravaRefreshToken = '';	// used to get new AccessToken if expired
var stravaCode = ''; 					// returned by redirect
var stravaScope = '';					// returned by redirect
var stravaReady = false;			// are Strava Tokens etc set up?
var stravaActivityID = 0;			// current activityID
var stravaRequest = 'auto&scope=read,activity:read,activity:read_all,activity:write'; // request string

function stravaTokens() { // handle Strava token, do this early to avoid any asynchronicity issue
  // get 'redirect' access code from browser window (if that fails then force reconnect to Strava - how to avoid cycle?)
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
    stravaCode = authArray.code;
    stravaScope = authArray.scope;
    //localStorage.setItem("FPEstrava", stravaCode); // don't use local storage anymore
    //localStorage.setItem("FPEscope", stravaScope);
    stravaReady = true;
  } else { // no Strava auth data in browser try to get from storage
    // if (localStorage.FPEstrava) {
    //   stravaCode = localStorage.FPEstrava;
    //   stravaReady = true;
    // }
    // if (localStorage.FPEscope) {
    //   stravaScope = localStorage.FPEscope;
    // }
    stravaReady = false;
  }

  if (stravaReady == true) {
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
        })
        .fail(function(response) {
          //console.log(response);
          //var locHostPath = location.protocol + '//' + location.host + location.pathname;
          var locHref = 'https://www.strava.com/oauth/authorize?client_id=' + stravaClientID +
            '&response_type=code&redirect_uri=' +
            location.protocol + '//' + location.host + location.pathname +
            '&approval_prompt=' + stravaRequest;
          //window.alert("Strava token exchange failed. URL = " + locHref);
          stravaReady = false;
          // how to prevent a loop?
          location.href = locHref;
        });
      //console.log(jqPost);
    }
  return;
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
    })
    .fail(function(response) {
      window.alert("Strava token exchange failed (during refresh).");
      stravaReady = false;
    });
  return;
}

// buttons - all code for buttons
//'fa fa-file fa-lg'
// http://fontawesome.io/icon/file/
// https://fontawesome.com/v4.7.0/icons/

var gpxToggleButton = L.easyButton({ states: [{
  stateName: 'gpx',
  icon: 'fa fa-map-o',
  title: 'Import GPX track or Strava Activity',
  onClick: function(btn, map){

    // remove existing layers if checkbox unchecked
    if ( mymap.hasLayer(gpxKeep) == false) {
      gpxdata.clearLayers();
      gpxLoaded = false;
    }

    // check for expired token (6 hours)
    if (stravaReady == true) {
      var timeLeft = stravaExpiresAt - Date.now()/1000;
      if (timeLeft < 1800) { // expires in less than 30 mins
        stravaRefresh();
      }
    }
    // Strava Activity ID or Index (or Paste GPX data) [33min left]
    // Paste GPX data (Strava link not available)
    var promptText =  (stravaReady == true) ? 'Strava Activity ID or Index (or Paste GPX data) [Test: ' + Math.round(timeLeft/60) +
      ' min left]' : 'Paste GPX data (Strava link not available)';
    var gpxPrompt = window.prompt(promptText);
    if (gpxPrompt == '' || gpxPrompt == null) {
      // do nothing if press cancel
    } else if ($.isNumeric(gpxPrompt)) {
      // Example run - Strava 2933015864
      if (gpxPrompt == 0) gpxPrompt = 2933015864; // if set to zero then grab default run for Richard
      stravaActivityID = Number(gpxPrompt); // if set to < 1000 then look at last 'n' runs
      // check scope is OK
      if (stravaReady == true && stravaScope.includes("activity:read")) {
        // get list of activities - use per_page=1 to get Nth activity (up to N=999), if actual stravaID then just get most recent activity
        var stravaSearch = (stravaActivityID > 999) ? 1 : stravaActivityID;

        $.get('https://www.strava.com/api/v3/athlete/activities?page=' + stravaSearch + '&per_page=1&access_token='
          + stravaAccessToken, function(data, status){
            //console.log(data);
            // do things with activities
            if (stravaActivityID < 1000) {
              stravaActivityID = data[0].id;
            }
            // get activity name
            $.get('https://www.strava.com/api/v3/activities/' + stravaActivityID + '?include_all_efforts=false&access_token='
              + stravaAccessToken, function(data, status){
                //console.log(data);
                gpxRouteName = data.name.replace(/[^\x20-\x7E]/g, '').trim(); //get rid of non-printing characters
                gpxRouteName = 'Strava: ' + gpxRouteName + ' (' + stravaActivityID +')';
                // get gpx data
                $.get('https://www.strava.com/api/v3/activities/' + stravaActivityID + '/streams?keys=latlng&key_by_type=true&access_token='
                  + stravaAccessToken, function(data, status){
                    //console.log(data);
                    //console.log(data.latlng.data);
                    var stravaGPX = L.Polyline.PolylineEditor(data.latlng.data, {color: 'blue', maxMarkers: 500}).addTo(gpxdata);
                    // updated line gpxdata.getLayers()[0].toGeoJSON()
                    //  sizeof  gpxdata.getLayers().length  last = length-1
                    //L.Polyline.PolylineEditor
                    //stravaGPX = L.polyline(data.latlng.data, {color: 'blue'}).addTo(gpxdata);
                    stravaGPX.bindTooltip(gpxRouteName, {sticky: true});
                    //gpxPoints = stravaGPX.toGeoJSON();  // this is now done at conversion
                    mymap.fitBounds(stravaGPX.getBounds());
                    gpxLoaded = true;
                    gpxCalcButton.enable();
                })
                .fail(function(response) {
                  window.alert("Strava Activity GPX data not accessible.");
                  //stravaReady = false;
                });
            })
            .fail(function(error) {
              window.alert("Strava Activity not accessible.");
              //stravaReady = false;
            });
        })
        .fail(function(response) {
          window.alert("Strava Activities not accessible.");
          //stravaReady = false;
        });
      } else {
        window.alert("Strava not authorized with enough access.");
      }
    } else { // gpx data pasted in by user
      // load the data - URL to your GPX file (or the GPX itself)
      // Default data for testing:
      //gpxPrompt = 'https://gist.githubusercontent.com/richardjy/fe9e3a189e47e4c75aa5e083a00f4740/raw';
      new L.GPX(gpxPrompt, {
        async: true,
        marker_options: {
          startIconUrl: '', //'http://github.com/mpetazzoni/leaflet-gpx/raw/master/pin-icon-start.png',
          endIconUrl:   '', //'http://github.com/mpetazzoni/leaflet-gpx/raw/master/pin-icon-end.png',
          shadowUrl:    '', //'http://github.com/mpetazzoni/leaflet-gpx/raw/master/pin-shadow.png',
        },
      }).on('loaded', function(e) {
        gpxRouteName = 'GPX: ' + e.target.get_name().replace(/[^\x20-\x7E]/g, ''); //get rid of non-printing characters;
        var gpxLoad = L.Polyline.PolylineEditor(e.target.getLayers()[0].getLatLngs(), {color: 'blue', maxMarkers: 500}).addTo(gpxdata);
        //L.Polyline(e.target.getLayers()[0], {color: 'blue', maxMarkers: 500}).addTo(gpxdata);
        gpxLoad.bindTooltip(gpxRouteName, {sticky: true});
        mymap.fitBounds(gpxLoad.getBounds());
        gpxLoaded = true;
        // need to wait for data to load!
        //window.alert("Loaded");
        gpxCalcButton.enable();
      });
    }
  }
}]  })

var gpxCalcButton = L.easyButton({ states: [{
  stateName: 'gpx calc',
  icon: 'fa fa-map-signs fa-lg',
  title: 'Create route from GPX track',
  onClick: function(btn, map){
    // toggle GPX
    if (gpxLoaded == false) {
      window.alert("No GPX yet!");
    } else {
      // get latest GPX Data
      // updated line gpxdata.getLayers()[0].toGeoJSON()
      //  sizeof  gpxdata.getLayers().length  last = length-1
      gpxcircles.clearLayers();  // remove any circles (later could include optionally)
      gpxPoints = gpxdata.getLayers()[gpxdata.getLayers().length -1].toGeoJSON();
      var startGPXlatlng =  getGPXlatlng(gpxPoints, 0);
      var startPtGPXindex = 0;
      var startPtGPXoffset = 999999.9;
      //var startPtGPXdistance = 0;
      var gpxImax = gpxPoints.geometry.coordinates.length;
      var finishGPXlatlng = getGPXlatlng(gpxPoints, gpxImax-1);
      var finishPtGPXindex = 0;
      var finishPtGPXoffset = 999999.9;
      var dialogtext = '';
      var offset = 0.0;
      // array for route data from gpx - 0 is start position [2,3,7] and overall route data [6]
      var gpxRoute = ([],[]);  //  [0]route index, [1]route name, [2]end pt, [3]end name, [4]dist, [5]gpxindex, [6]gpxdist, [7]offset
      var gpxLegs = 0;
      var gpxIndex = 0;
      var minPtGPXoffset = 999999.9;
      var minPtGPXindex = 0;
      var minPtGPXdist = 0;
      var curIndex = 0;
      var endIndex = 0;
      var endLatLng = finishGPXlatlng; // placeholder in correct format
      var nearPt = 75; 	// criteria for being near enough to a node
      var atPt = 20; 		// criteria for being at a node
      routelegs = 0; // restart route display and reset all trails
      trails.eachLayer(function (layer) {
        // Check if layer is a marker or a line - also make sure not gpx trace
        if (layer instanceof L.Polyline) {
          if (layer.feature && layer.feature.properties.index) {
            if (layer.feature.properties.label == "Extra") {
              // remove extra - otherwise get new ones each time
              layer.removeFrom(trails);
            } else {
              //set line back to default
              layer.setStyle(setLineStyle(layer.feature.properties.label));
              layer.feature.properties.trail = 0;
              layer.bindTooltip(layer.feature.properties.label + ': ' + layer.feature.properties.distance + ' mi<br> Route count: 0', {sticky: true});
            }
          }
        }
      });
      // start and finish positions - look for closest point
      // use geojsondata so no worry about extra layers on the map for gpx, end point etc
      geojsondata.eachLayer(function (layer) {
        // Check if layer is a marker
        if (layer instanceof L.Marker && layer.hasOwnProperty('feature') ) {
          // find distance
          offset = layer.getLatLng().distanceTo(startGPXlatlng);
          if (offset < startPtGPXoffset) {
            startPtGPXoffset = offset;
            startPtGPXindex = layer.feature.properties.index;
          }
          offset = layer.getLatLng().distanceTo(finishGPXlatlng);
          if (offset < finishPtGPXoffset) {
            finishPtGPXoffset = offset;
            finishPtGPXindex = layer.feature.properties.index;
          }
        }
      });

      dialogtext = "  Start: " + getptname(startPtGPXindex) + " (" + startPtGPXoffset.toFixed(1) + " m)" +
          "    Finish: " + getptname(finishPtGPXindex) + " (" + finishPtGPXoffset.toFixed(1) + " m)";
      gpxRoute[0] = [0, '', startPtGPXindex, getptname(startPtGPXindex), 0, 0, 0, startPtGPXoffset];

      // look to see if get closer to node further along
      var rangePt = ptAtDist(0, 0.15*1609); // go 0.15 mile further - search additional times?
      var nodeLL = getptlatlng(startPtGPXindex);
      for (var i = 1; i < rangePt; i++) {
        offset = nodeLL.distanceTo(getGPXlatlng(gpxPoints, i));
        if (offset < startPtGPXoffset) {
          startPtGPXoffset = offset;
          gpxIndex = i;
          console.log('start281', gpxIndex);
        }
      }
      if (gpxIndex > 0) { // moved point - get distance
        var distGPX = distP2P(0, gpxIndex)
        gpxLegs++;
        //[0]route index, [1]route name, [2]end pt, [3]end name, [4]dist, [5]gpxindex, [6]gpxdist, [7]offset
        gpxRoute[gpxLegs] = [0, "Extra", startPtGPXindex, getptname(startPtGPXindex), distGPX/1609.0,
            gpxIndex, distGPX/1609.0, startPtGPXoffset];
        gpxRoute[0][4] += gpxRoute[gpxLegs][4]; //keep track of route distance
        gpxRoute[0][6] += gpxRoute[gpxLegs][6]; //keep track of gpx distance
        dialogtext += '\n' + gpxRoute[gpxLegs][4].toFixed(2) + " mi\t GPX: " + gpxRoute[gpxLegs][5].toFixed(0).padStart(5, " ") + " (" + gpxRoute[gpxLegs][6].toFixed(2) +
            " mi)\t(" + gpxRoute[gpxLegs][7].toFixed(1).padStart(4, " ") + " m)  " + gpxRoute[gpxLegs][1] + " to " + gpxRoute[gpxLegs][3];
      }

      L.circle(getptlatlng(startPtGPXindex), {radius: startPtGPXoffset, color: 'green'}).addTo(gpxcircles);
      L.circle(getGPXlatlng(gpxPoints, 0), {radius: 1, color: 'green'}).addTo(gpxcircles);	// 1m circles
      var currentPtGPXindex = startPtGPXindex;
      gpxIndex++; //move to next point in gpx
      // find each route
      do {
        gpxLegs++;

        // temp data for each possible track - same format as gpxRoute
        var gpxFindLeg = ([],[]); //[0]route index, [1]route name, [2]end pt, [3]end name, [4]dist, [5]gpxindex, [6]gpxdist, [7]offset
        var gpxFindCount = 0;

        // find tracks that are possible routes from current location
        geojsondata.eachLayer(function (layer) {
          // Check if layer is a line with start or end point that matches current position
          if (layer instanceof L.Polyline && (layer.feature.properties.start == currentPtGPXindex
              || layer.feature.properties.finish == currentPtGPXindex )) {
            // look for closest point
            endIndex = ((layer.feature.properties.start == currentPtGPXindex) ? layer.feature.properties.finish : layer.feature.properties.start);
            endLatLng = getptlatlng(endIndex);
            //console.log(endLatLng);  //testing
            //var curRouteName = layer.feature.properties.label;
            //var curEndName = getptname(endIndex);
            //var curIndex = gpxIndex;
            minPtGPXoffset = 999999.9;
            minPtGPXindex = 0;
            minPtGPXdist = 0;

            // convert to meters, search 1.25x route (gps normally short) add 0.1 in case of short inaccurate trails
            // adjust to 1.1x, was 1.25x
            var distMax = (1.2 * layer.feature.properties.distance + 0.0) * 1609;
            var distMin = layer.feature.properties.distance * 1609 * 0.5;
            // need to check if gpx is > dist then see if a better choice - might mean missed small trail
            // perhaps if only one close then use it, if more than one become more selective
            curIndex = ptAtDist(gpxIndex, distMin)
            var prevGPXLatLng = getGPXlatlng(gpxPoints, curIndex);
            var distGPX = distMin;
            // find closest offset of GPX to endLatLng
            do {
              var curGPXLatLng = getGPXlatlng(gpxPoints, curIndex);
              var offset = mymap.distance(endLatLng,curGPXLatLng);

              distGPX += mymap.distance(prevGPXLatLng,curGPXLatLng);
              //console.log(curGPXLatLng, offset, distGPX);     //testing
              prevGPXLatLng = curGPXLatLng;
              if (offset < minPtGPXoffset) {
                minPtGPXoffset = offset;
                minPtGPXindex = curIndex;
                minPtGPXdist = distGPX;
                if (offset < nearPt) {  //  if valid node - now seach only another 6x offset past closest
                  distMax = distGPX + offset * 6;
                }
              }
              curIndex++;
            }
            while ((distGPX < distMax) && (curIndex < gpxImax)); // keep going until have gone past expected position
            //[0]route index, [1]route name, [2]end pt, [3]end name, [4]dist, [5]gpxindex, [6]gpxdist, [7]offset
            // remove unused local variables later
            gpxFindLeg[gpxFindCount] = [layer.feature.properties.index, layer.feature.properties.label, endIndex, getptname(endIndex),
                layer.feature.properties.distance, minPtGPXindex, minPtGPXdist/1609.0, minPtGPXoffset];
            gpxFindCount++;
          }
        });
        // look for best route
        var minCount = 0;
        var minOffset = gpxFindLeg[0][7];
        var minLegDist = gpxFindLeg[0][4];
        var minAtPt = false;
        if (minOffset <= atPt) {minAtPt = true;}
        for (var i = 1; i < gpxFindCount; i++) {
          if (gpxFindLeg[i][7] <= nearPt) {  // check if point close enough
            if (gpxFindLeg[i][2] == gpxFindLeg[minCount][2]) {
              // same end point - check gpx dist v. target, choose smallest error
              var ratioI = Math.abs((gpxFindLeg[i][4] - gpxFindLeg[i][6])/gpxFindLeg[i][4]);
              var ratioM = Math.abs((gpxFindLeg[minCount][4] - gpxFindLeg[minCount][6])/gpxFindLeg[minCount][4]);
              if (ratioI < ratioM) {
                minOffset = gpxFindLeg[i][7];
                minLegDist = gpxFindLeg[i][4];
                minCount = i;
              }
            } else if (gpxFindLeg[i][7] <= atPt) { // if very close then go with shorter leg
              if (gpxFindLeg[i][4] < minLegDist || minAtPt == false) { // choose shorter leg in case found later point
                minOffset = gpxFindLeg[i][7];
                minLegDist = gpxFindLeg[i][4];
                minCount = i;
                minAtPt = true;
              }
            } else if (gpxFindLeg[i][7] < minOffset && minAtPt == false) { // go for closest if no atPt already
              minOffset = gpxFindLeg[i][7];
              minLegDist = gpxFindLeg[i][4];
              minCount = i;
            }
          }
        }
        // check if near enough, or was there a skip to another node
        if (minOffset > nearPt) { // was 50 change to 75m as some multipath junctions cause offsets
          curIndex = ptAtDist(gpxIndex, 100); // move 100m to avoid finding same point too close
          //console.log(gpxIndex);  //testing
          minPtGPXoffset = 999999.0;
          //console.log('minPtGPXindex, curIndex', minPtGPXindex, curIndex);
          minPtGPXindex = curIndex;  //currindex?
          //console.log('minPtGPXindex, curIndex', minPtGPXindex, curIndex);
          do {
            curIndex = ptAtDist(curIndex, 50); // move 50m
            curGPXLatLng = getGPXlatlng(gpxPoints, curIndex);  // later do averaging over 50m of trace?
            geojsondata.eachLayer(function (layer) {
              // Check if layer is a marker
              if (layer instanceof L.Marker && layer.hasOwnProperty('feature') ) {
                // find distance
                offset = layer.getLatLng().distanceTo(curGPXLatLng);
                if (offset < minPtGPXoffset) {
                  minPtGPXoffset = offset;
                  endIndex = layer.feature.properties.index;
                  //console.log(minPtGPXoffset, endIndex);  //testing
                }
              }
            });
          }	while (minPtGPXoffset > nearPt); // find first place less than 75m from trail
          // now within 75m look for closest place - back up 100m and search 300m
          minPtGPXindex = curIndex;
          curIndex = ptAtDist(curIndex, -100.0);
          endLatLng = getptlatlng(endIndex);
          for (var i = curIndex; i < ptAtDist(curIndex, 400.0); i++) {
            offset = mymap.distance(endLatLng, getGPXlatlng(gpxPoints, i));
            if (offset < minPtGPXoffset) {
              minPtGPXoffset = offset;
              minPtGPXindex = i;
            }
          }
          minPtGPXdist = distP2P(gpxIndex-1, minPtGPXindex);
          gpxRoute[gpxLegs] = [-1, "Extra-Skip", endIndex, getptname(endIndex),
              minPtGPXdist/1609.0, minPtGPXindex, minPtGPXdist/1609.0, minPtGPXoffset];
          if (gpxRoute[gpxLegs-1][2] == endIndex) { // out and back rather than skip
            gpxRoute[gpxLegs][0] = -2;
            gpxRoute[gpxLegs][1] = "Extra-O&B";
          }
          // find point approx half way in extra line
          var halfpt = ptAtDist(minPtGPXindex, -minPtGPXdist/2);
          //console.log(halfpt);


          // add line to display - get dummy data
          //[0]route index, [1]route name, [2]end pt, [3]end name, [4]dist, [5]gpxindex, [6]gpxdist, [7]offset
          var lcoords = "[[" + getptlatlng(gpxRoute[gpxLegs-1][2]).lng + ", ";
          lcoords += getptlatlng(gpxRoute[gpxLegs-1][2]).lat + "],[";
          lcoords += getGPXlatlng(gpxPoints, halfpt)[1] + ", ";
          lcoords += getGPXlatlng(gpxPoints, halfpt)[0] + "],[";
          lcoords += getptlatlng(endIndex).lng + ", ";
          lcoords += getptlatlng(endIndex).lat + "]]";

          var des = 0;
          var asc = ((getptlatlng(endIndex).alt - getptlatlng(gpxRoute[gpxLegs-1][2]).alt)/0.3048).toFixed(0); // in feet
          if (asc < 0) {
            des = asc;
            asc = 0;
          }

          var gIndex = 1000*gpxRoute[gpxLegs-1][2] + gpxRoute[gpxLegs][2]
          var gline = { "type": "Feature", "geometry": {"type": "LineString",
              "coordinates": eval(lcoords) },
              "properties": {"index": gIndex,"start": gpxRoute[gpxLegs-1][2],"finish": gpxRoute[gpxLegs][2],
              "label": "Extra",
              "distance": eval(gpxRoute[gpxLegs][4].toFixed(2)),
              "ascent": eval(asc),"descent": eval(des),"trail": "", "color": ""}};
          //console.log(lcoords);
          //console.log(gline);
          var geoline = L.geoJSON(gline,
            {
              onEachFeature: onEachFeature
            }).addTo(trails);

          // add to route
          var rline = getRouteData(gIndex, "Extra");
          var routecount = Number(rline.feature.properties.trail) + 1;
          var findex = rline.feature.properties.finish;
          var rend = gpxRoute[gpxLegs][2];
          if (rend == findex) { // should always be this one
            addleg(rline, 1);
          } else {
            addleg(rline, -1);
          }
          //console.log('addx', gpxIndex, gpxRoute);
          updatecolor(rline, routecount);
        } else {
          gpxRoute[gpxLegs] = gpxFindLeg[minCount];
          // add to route
          var rline = getRouteData(gpxRoute[gpxLegs][0], gpxRoute[gpxLegs][1]);
          var routecount = Number(rline.feature.properties.trail) + 1;
          var findex = rline.feature.properties.finish;
          var rend = gpxRoute[gpxLegs][2];
          if (rend == findex) {
            addleg(rline, 1);
          } else {
            addleg(rline, -1);
          }
          //console.log('add', gpxIndex);
          updatecolor(rline, routecount);
        }
        gpxRoute[0][4] += gpxRoute[gpxLegs][4]; //keep track of route distance
        gpxRoute[0][6] += gpxRoute[gpxLegs][6]; //keep track of gpx distance
        gpxIndex = gpxRoute[gpxLegs][5] + 1;	// move onto next point in gpx trace
        //console.log('move493', gpxIndex);
        currentPtGPXindex = gpxRoute[gpxLegs][2];
        dialogtext += '\n' + gpxRoute[gpxLegs][4].toFixed(2) + " mi\t GPX: " + gpxRoute[gpxLegs][5].toFixed(0).padStart(5, " ") + " (" + gpxRoute[gpxLegs][6].toFixed(2) +
            " mi)\t(" + gpxRoute[gpxLegs][7].toFixed(1).padStart(4, " ") + " m)  " + gpxRoute[gpxLegs][1] + " to " + gpxRoute[gpxLegs][3];

        // check if at end
        if (currentPtGPXindex == finishPtGPXindex) {
          if (gpxIndex == gpxImax) {
            L.circle(getptlatlng(currentPtGPXindex), {radius: gpxRoute[gpxLegs][7], color: 'red'}).addTo(gpxcircles);
            L.circle(getGPXlatlng(gpxPoints, gpxImax - 1), {radius: 1, color: 'red'}).addTo(gpxcircles);	// 1m circles
          } else {  // see if very close to the end - measure distance left in route
            var distGPX = distP2P(gpxIndex - 1, gpxImax - 1);
            if (distGPX < 0.15*1609) {// if less than 0.15 mi to go then assume at and
              gpxLegs++;
              gpxIndex = gpxImax; // at end of gpx
              //[0]route index, [1]route name, [2]end pt, [3]end name, [4]dist, [5]gpxindex, [6]gpxdist, [7]offset
              gpxRoute[gpxLegs] = [0, "Extra", 0, "Finish", distGPX/1609.0, gpxImax - 1, distGPX/1609.0, 0];
              gpxRoute[0][4] += gpxRoute[gpxLegs][4]; //keep track of route distance
              gpxRoute[0][6] += gpxRoute[gpxLegs][6]; //keep track of gpx distance
              dialogtext += '\n' + gpxRoute[gpxLegs][4].toFixed(2) + " mi\t GPX: " + gpxRoute[gpxLegs][5].toFixed(0).padStart(5, " ") + " (" + gpxRoute[gpxLegs][6].toFixed(2) +
                  " mi)\t(" + gpxRoute[gpxLegs][7].toFixed(1).padStart(4, " ") + " m)  " + gpxRoute[gpxLegs][1] + " to " + gpxRoute[gpxLegs][3];
              L.circle(getptlatlng(currentPtGPXindex), {radius: gpxRoute[gpxLegs-1][7], color: 'red'}).addTo(gpxcircles);
              L.circle(getGPXlatlng(gpxPoints, gpxImax - 1), {radius: 1, color: 'red'}).addTo(gpxcircles);	// 1m circles
            }
          }
        }
        // show circle if not last point (already drawn)
        if (gpxIndex < gpxImax) {
          L.circle(getptlatlng(currentPtGPXindex), {radius: gpxRoute[gpxLegs][7]}).addTo(gpxcircles);
        }
      } while (gpxIndex < gpxImax);
      // finish off data dialog
      updateleg(); //update route info
      dialogtext += '\n  Total distance ' + gpxRoute[0][4].toFixed(2) + " mi    (GPX: " + gpxRoute[0][6].toFixed(2) + " mi)";
      $("#gpxresultText").html($('<pre>').text(dialogtext));
      $("#gpxresult").dialog({title: gpxRouteName}).dialog("open");
      $("#gpxresult").dialog({my: "center-100 top",});

      // post to Strava if allowed
      // gpxRouteName if Strava = 'Strava: name (StravaID)'
      if (gpxRouteName.startsWith("Strava") && stravaReady == true  && stravaScope.includes("activity:write")) {
        // check if need to refresh (may need to repeat calc as asynchronous)
        if ((stravaExpiresAt - Date.now()/1000) < 1800) { // expires in less than 30min
          stravaRefresh();
        }

        // get activity data
        $.get('https://www.strava.com/api/v3/activities/' + stravaActivityID + '?include_all_efforts=false&access_token='
          + stravaAccessToken, function(data, status){
            //console.log(data);
            var stravaDescription = data.description;
            // 🌲📏 were Pete's idea
            stravaDescription += '\n🌲📏 FPE:  Total distance ' + gpxRoute[0][4].toFixed(2) + " mi    (GPX: " + gpxRoute[0][6].toFixed(2) + " mi)\n";
            //window.prompt("Updated Activity Description:", stravaDescription);
            //console.log(stravaDescription);
            $("#stravadescripTextArea").val(stravaDescription);
            $("#stravadescrip").dialog({title: 'Update Strava Activity Description:'}).dialog("open");
            $("#stravadescrip").dialog({my: "center-100 top",});
        })
        .fail(function(error) {
          window.alert("Strava Activity not accessible.");
          //stravaReady = false;
        });
      }
    }
  }
}]  })

function updateStrava() {
  var stravaDescription = $("#stravadescripTextArea").val();
  $.ajax({
    url: 'https://www.strava.com/api/v3/activities/' + stravaActivityID + '?access_token=' + stravaAccessToken,
    method: 'PUT',
    data: 'description=' + stravaDescription,
    success: function(data) {
      window.alert('Upload successful.');
    }
  })
  .fail(function(error) {
    window.alert("Strava write access problem.");
  });
  $("#stravadescrip").dialog("close");
}

var exportGPXButton = L.easyButton({ states: [{
  stateName: 'makegpx',
  icon: 'fa fa-download fa-lg',
  title: 'Export GPX of current route (max up to 96 legs)',
  onClick: function(btn, map){
    // build route string
    // max number is up to 92 (depends on extra mid points)
    if (routelegs == 0) {
      window.alert("No route to export...");   // later disable button in this case
    } else {
      // start fresh if box unchecked
      if ( mymap.hasLayer(gpxKeep) == false) {
        gpxdata.clearLayers();
        gpxLoaded = false;
      }
      //  routedata[0] is summary: 0 start pt, 1 start name, 2 end pt, 3 end name, 4 dist, 5 ascent, 6 descent, 7 start elevation
      var curPt = routedata[0][0];
      var routeStr = ([]);
      var routeStrNo = 0;
      routeStr[routeStrNo] = getptlatlng(curPt).lng + "," + getptlatlng(curPt).lat;
      var reqPt = 1;  // 25 is max number in request - go to 24 in case next is two points
      var legCount = 0;
      for (i=1; i<=routelegs; i++){
        // routedata[n]: 0 route index, 1 route name, 2 end pt, 3 end name, 4 dist, 5 ascent, 6 descent, 7 direction bearing
        var trailcoords = gettraillatlng(routedata[i][0], routedata[i][1], routedata[i][7]);
        for (var j = 1; j<trailcoords.length; j++) { // skip first point and add one or two (assume 2 is max)
          routeStr[routeStrNo] += ";" + trailcoords[j]; // includes both lng and lat
          reqPt++;
        }
        legCount++;
        // allow to get to 24 or 25 points and 4 sets [index 0 - 3]
        if (reqPt > 23) {
          if (routeStrNo < 3){
            routeStrNo++;
            // start new string with last coords
            routeStr[routeStrNo] = trailcoords.slice(-1);  // includes both lng and lat
            reqPt=1;
          } else {
            i = routelegs + 1; //finish loop
          }
        }
      }
      //console.log(routeStr);

      // use overview=full to get full gps route - check other options
      var url = ([]);
      var numLoop = routeStr.length;
      for (var i = 0; i<numLoop; i++) {
        url[i] ='https://api.mapbox.com/directions/v5/mapbox/walking/' + routeStr[i] +
             '?geometries=geojson&overview=full&access_token=' + config.mapBoxKey;
        //console.log(routeStr[i]);
      }

      // avoid recursive call - allow 4 nests approx 96 legs
      $.get(url[0], function(data, status){
          //console.log('data = ', data);
          var distance = data.routes[0].distance;
          var coord = L.GeoJSON.coordsToLatLngs(data.routes[0].geometry.coordinates,0);
          var polyLine = L.polyline(coord);
          //console.log(coord.length, distance, polyLine);

          if (numLoop > 1) {
            $.get(url[1], function(data, status){
              distance += data.routes[0].distance;
              coord = data.routes[0].geometry.coordinates;
              for(i=1; i<coord.length;i++) {  // skip first point as already in previous line
                polyLine.addLatLng([coord[i][1],coord[i][0]]); // flip lat and lng
              }
              if (numLoop > 2) {
                $.get(url[2], function(data, status){
                  distance += data.routes[0].distance;
                  coord = data.routes[0].geometry.coordinates;
                  for(i=1; i<coord.length;i++) {  // skip first point as already in previous line
                    polyLine.addLatLng([coord[i][1],coord[i][0]]);
                  }
                  if (numLoop > 3) {
                    $.get(url[3], function(data, status){
                      distance += data.routes[0].distance;
                      coord = data.routes[0].geometry.coordinates;
                      for(i=1; i<coord.length;i++) {  // skip first point as already in previous line
                        polyLine.addLatLng([coord[i][1],coord[i][0]]);
                      }
                      displayExportRoute(polyLine, distance, legCount);
                    })
                  } else {
                    displayExportRoute(polyLine, distance, legCount);
                  }
                })
              } else {
                displayExportRoute(polyLine, distance, legCount);
              }
            })
          } else {
            displayExportRoute(polyLine, distance, legCount);
          }
      })
      // only put error trap on first level for clarity
      .fail(function(response) {
        window.alert("Mapbox gpx request failed.");
      });
    }
  }
}]  })

function getMapBoxRoute() {

  return true;
};

function displayExportRoute(polyLine, distance, legCount) {
  // display response
  polyLine.bindTooltip('Route to GPX: ' +
      (distance/1609).toFixed(2) + ' mi (' + legCount + ' legs)', {sticky: true}).addTo(gpxdata);
  mymap.fitBounds(polyLine.getBounds());
  gpxLoaded = true;
  gpxCalcButton.enable();

  // export gpx
  var gpxData = togpx(polyLine.toGeoJSON(), {creator: "Forest Park Explorer", metadata: {name:"FPE-export"}});
  var element = document.createElement('a');
  element.href = 'data:application/gpx+xml;charset=utf-8,' + encodeURIComponent(gpxData);
  element.download = 'export.gpx';
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  return true;
};

var resetButton = L.easyButton({ states: [{
  stateName: 'reset',
  icon: 'fa fa-refresh fa-lg',
  title: 'Reset to default',
  onClick: function(btn, map){
    // reset all paths
    routestring = '';
    routelegs = 0;
    routedata[0] = [0, '', 0, '', 0, 0, 0, -1];
    endmarker.removeFrom(trails);
    info.update();
    // Iterate the layers of the map - only lines - reset color, count, tooltip
    trails.eachLayer(function (layer) {
      // Check if layer is a marker or a line - also make sure not gpx trace
      if (layer instanceof L.Polyline) {
        if (layer.feature && layer.feature.properties.index) {
          if (layer.feature.properties.label == "Extra") {
            // remove extra - otherwise get new ones each time
            layer.removeFrom(trails);
          } else {
            //set line back to default
            layer.setStyle(setLineStyle(layer.feature.properties.label));
            layer.feature.properties.trail = 0;
            layer.bindTooltip(layer.feature.properties.label + ': ' + layer.feature.properties.distance + ' mi<br> Route count: 0', {sticky: true});
          }
        }
      }
    });
    //deal with gpx layers
    gpxdata.clearLayers();
    gpxcircles.clearLayers();
    gpxLoaded = false;
    gpxCalcButton.disable();
    mymap.fitBounds(geojsondata.getBounds());
  }
}]  })

var undoButton = L.easyButton({ states: [{
  stateName: 'undo',
  icon: 'fa fa-undo fa-lg',
  title: 'Remove last leg [Ctrl-click on line]',
  onClick: function(btn, map){
    // look for last leg
    if (routelegs > 0) {
      var undoroutelegs = routelegs  // routelegs changes in loop, make sure just use initial value
      trails.eachLayer(function (layer) {
        // Check if layer is a marker or a line
        if (layer instanceof L.Polyline) {  // check right index and name
          if (layer.feature.properties.index == routedata[undoroutelegs][0] && layer.feature.properties.label == routedata[undoroutelegs][1]) {
            // do undo
            var routecount = Number(layer.feature.properties.trail);
            // remove line
            routecount -= 1;
            routelegs -= 1;
            routedata[0][3] = routedata[routelegs][3];  // last pt
            routedata[0][2] = routedata[routelegs][2];  // last pt
            updatecolor(layer, routecount);
            updateleg();
          }
        }
      });
    }
    info.update();
  }
}]  })
