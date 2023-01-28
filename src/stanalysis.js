
// global variables for now
var rawData = ([],[]);      //  includes gaps [0]distance_from_ST, [1]elevation, [2]power, [3]GCT, [4]heartrate, [5]cadence
var runData = ([],[]);      //  fills gaps    [0]distance_from_ST, [1]elevation, [2]power, [3]GCT, [4]heartrate, [5]cadence
var strydData = ([],[]);    //  from stryd    [0]distance_from_watch, [1] delta_dist, [2]distance_from_speed, [3]speed, [4]total_power, [5]GCT, [6]cadence
    // distance_list (matches fitfile), speed_list, timestamp_list,
    // cadence_list (spm - different but similar to watch, matches second 'Cadence' in fitFile)
    // matches ST: heart_rate_list, total_power_list, ground_time_list, elevation_list
var calcData = ([],[]);     //  [0]watchstop1/paused2/walking3/running4, [1]delta dist,
                            //   [2]filtered elev, [3]delta elev, [4]grade, [5]down 1, level 2, up 3
var sumData = ([],[],[]);   // see below for details
var sumStryd = ([],[],[]);  // see below for details
var gpsData = [];
var csv ="\t";
var lf = "\n";
var maxGraphPts = 2400;  // 4x number of points in the graph - minimize missed info
var ddPause = 0.1; // m/s when considered 'paused' 0.5m/s = 1.1 mph - look at average velocity over say 10s?
var stGPX = '';

function maxData() {
  $( "#timeRange" ).slider( "option", "min", 0);
  $( "#timeRange" ).slider( "option", "max", calcData.length - 1);
  $( "#timeRange" ).slider( "option", "values", [ 0, calcData.length - 1 ] );
  $( "#minTime" ).val( timeHMS( $( "#timeRange" ).slider( "values", 0)) );
  $( "#maxTime" ).val( timeHMS( $( "#timeRange" ).slider( "values", 1)) );
  calcMetrics();
  displayMetrics(true);
}

function showMap(zoomOut = false) {
  mapST.eachLayer(function (layer) {
    if (layer instanceof L.Polyline) mapST.removeLayer(layer);
    stGPX = '';
  });
  if (gpsData.length > 0) {
      var iStart = $( "#timeRange" ).slider( "values", 0);
      var iEnd = $( "#timeRange" ).slider( "values", 1);
      L.polyline(gpsData, {color: 'blue'}).addTo(mapST);
      stGPX = L.polyline(gpsData.slice(iStart, iEnd), {color: 'red'}).addTo(mapST);
      if (mapST.hasLayer(showArrows)) drawArrows(true);
      if (zoomOut || mapST.hasLayer(autoZoom)) mapST.fitBounds(stGPX.getBounds());
  }
}

function drawArrows(showA = false) {
  if (stGPX != '') {
    if (showA) {
      stGPX.setText('     ➜     ', {
        repeat: true,
        attributes: {
          fill: stGPX.options.color,
          dy: '5px',
          'font-size': '14px',  // after gpxstudio
          style: 'text-shadow: 1px 1px 0 white, -1px 1px 0 white, 1px -1px 0 white, -1px -1px 0 white, 0px 1px 0 white, 0px -1px 0 white, -1px 0px 0 white, 1px 0px 0 white, 2px 2px 0 white, -2px 2px 0 white, 2px -2px 0 white, -2px -2px 0 white, 0px 2px 0 white, 0px -2px 0 white, -2px 0px 0 white, 2px 0px 0 white, 1px 2px 0 white, -1px 2px 0 white, 1px -2px 0 white, -1px -2px 0 white, 2px 1px 0 white, -2px 1px 0 white, 2px -1px 0 white, -2px -1px 0 white; -webkit-touch-callout: none; -webkit-user-select: none; -khtml-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none;'
        }
      });
    } else {
        stGPX.setText(null);
    }
  }
}

function refreshData() {
  processData(stActivityInit);
  calcMetrics();
  displayMetrics();
}

function processData(stActivity) {
  // boolean - save data?
  var bd = true; //distance (m)
  var bh = true; // heart rate (bpm)
  var be = true; // elevation (m)
  var bp = true; // power (W)
  var bg = true; // ground contact time (ms)
  var bc = true; // cadence (full cycles per min)
  var bt = true; // time stops
  var bm = true; // map data (gps)

  var id = 0, ih = 0, ie = 0, ip = 0, ig = 0, ic = 0, im = 0; // index for data

  bd = typeof stActivity.distance === 'undefined' ? false : bd;
  bh = typeof stActivity.heartrate === 'undefined' ? false : bh;
  be = typeof stActivity.elevation === 'undefined' ? false : be;
  bp = typeof stActivity.power === 'undefined' ? false : bp;
  bg = typeof stActivity.ground_contact_time === 'undefined' ? false : bg;
  bc = typeof stActivity.cadence === 'undefined' ? false : bc;
  bt = typeof stActivity.timer_stops === 'undefined' ? false : bt;
  bm = typeof stActivity.location === 'undefined' ? false : bm;

  // max index of each data type
  var md = typeof stActivity.distance === 'undefined' ? 0 : stActivity.distance.length;
  var mh = typeof stActivity.heartrate === 'undefined' ? 0 : stActivity.heartrate.length;
  var me = typeof stActivity.elevation === 'undefined' ? 0 : stActivity.elevation.length;
  var mp = typeof stActivity.power === 'undefined' ? 0 : stActivity.power.length;
  var mg = typeof stActivity.ground_contact_time === 'undefined' ? 0 : stActivity.ground_contact_time.length;
  var mc = typeof stActivity.cadence === 'undefined' ? 0 : stActivity.cadence.length;
  var mm = typeof stActivity.location === 'undefined' ? 0 : stActivity.location.length;

  var ld = -1, lh = -1, le = -1, lp = -1, lg = -1, lc = -1;  // last values (when data blank)
  var dd = 0; // delta distance
  var itIndex = 0, it0 = 0, it1 = 0, mt = 0; // stopped index values
  var pauseCount = 0; // remove isolated pauses

  // get defaults from UI
  // value is in meters of travel - average over at least this amount
  var elevFilter = parseInt(document.getElementById("elevFilter").value);
  if (isNaN(elevFilter)) elevFilter = 80;
  document.getElementById("elevFilter").value = elevFilter;
  // threshold for level grade - default 1.5%
  var levelGrade = parseFloat(document.getElementById("levelGrade").value);
  if (isNaN(levelGrade)) levelGrade = 1.5;
  document.getElementById("levelGrade").value = levelGrade;
  // GCT threshold >= this value => walking
  var walkGCT = parseInt(document.getElementById("walkGCT").value);
  if (isNaN(walkGCT)) walkGCT = 500;
  document.getElementById("walkGCT").value = walkGCT;
  // Cadence threshold <= this value => walking
  var walkCad = parseInt(document.getElementById("walkCad").value);
  if (isNaN(walkCad)) walkCad = 125;
  document.getElementById("walkCad").value = walkCad;

  // timer stops
  if (bt == true) {
      mt = stActivity.timer_stops.length;
      itIndex = 0;
      it0 = (new Date (stActivity.timer_stops[itIndex][0]) - new Date (stActivity.start_time))/1000;
      it1 = (new Date (stActivity.timer_stops[itIndex][1]) - new Date (stActivity.start_time))/1000+1;
      //console.log(it0, it1);
  }

  // reset arrays
  rawData.length = 0;
  runData.length = 0;
  calcData.length = 0;
  gpsData.length = 0;

  // if no array of distance then set to zero   -              distance list is time then distance
  var iEnd = typeof stActivity.distance === 'undefined' ? 0 : stActivity.distance[stActivity.distance.length-2] + 1;
  for (i = 0; i < iEnd ; i++ ) {
    var sSWR = 4; // set to running by default
    var rd = "", rh = "", re = "", rp = "", rg = "", rc = "";  // raw values from ST object - set to blank each time
    if (bt == true) {
      if (i > it0) {
        if (i < it1) {
          sSWR = 1;  // watch stop
        } else {
          if (itIndex < mt-1) {
            itIndex++;
            it0 = (new Date (stActivity.timer_stops[itIndex][0]) - new Date (stActivity.start_time))/1000;
            it1 = (new Date (stActivity.timer_stops[itIndex][1]) - new Date (stActivity.start_time))/1000+1;
          }
        }
      }
    }

    if (bd == true) {  // distance calc ld and dd
      if (stActivity.distance[id] == i && id < md) {
        ld = stActivity.distance[id+1];
        rd = ld;
        id += 2; // increment by 2
      } else {  // interpolate
        // id = index of next time
        ld = parseFloat(interpolateData(stActivity.distance, id, i).toFixed(2));
      }
      dd = i>0 ? parseFloat((ld - runData[i-1][0]).toFixed(2)) : 0.00;
      if (sSWR == 1) {
        dd = 0;  // if stopped from watch then delta distance = 0
      } else if (dd <= ddPause) {
        sSWR = 2;  // paused - later test for walking?
        // check for a single isolated pause
        pauseCount++;
      } else {
          if (pauseCount == 1) {
            //console.log("singlepause: " + i);
            // remove pause from previous line - make it the same as one two back
            if (i > 1) {
              calcData[i-1][0] = calcData[i-2][0];
            }
          }
          pauseCount = 0;
      }
    }

    if (be == true) { // elevation
      if (stActivity.elevation[ie] == i && ie < me) {
        le = stActivity.elevation[ie+1];
        re = le;
        ie += 2; // increment by 2
      } else {  // interpolate
        le = parseFloat(interpolateData(stActivity.elevation, ie, i).toFixed(2));
      }
    }

    if (bp == true) { // power
      if (stActivity.power[ip] == i && ip < mp) {
        lp = stActivity.power[ip+1];
        rp = lp;
        ip += 2; // increment by 2
      } else {  // interpolate
        lp = parseFloat(interpolateData(stActivity.power, ip, i).toFixed(0));
      }
      if (sSWR == 1) {
        lp = 0;  // if stopped from watch then power = 0
      } else if (lp == 0) {
         //sSWR = 2;   // if power= 0 then 'paused' (add distance criteria?)
      }
    }

    if (bg == true) {  // GCT
      if (stActivity.ground_contact_time[ig] == i && ig < mg) {
        lg = stActivity.ground_contact_time[ig+1];
        rg = lg;
        ig += 2; // increment by 2
      } else {  // interpolate - but do an extra check first in case stopped
        if (lp == 0) {
          lg = 0;
        } else {
          lg = parseFloat(interpolateData(stActivity.ground_contact_time, ig, i).toFixed(0));
        }
      }
      if (sSWR == 1) {
        lg = 2000;  // if stopped from watch then GCT = 2000
      // may need to also check for GCT = 0 for some monitors? (or perhaps cadence is better check)
      } else if (parseInt(lg) >= walkGCT && sSWR == 4) {
         sSWR = 3;   // if GCT>= threshold then walking (don't change if viewed as paused)
      }
    }

    if (bc == true) {  // cadence
      if (stActivity.cadence[ic] == i && ic < mc) {
        lc = stActivity.cadence[ic+1];
        rc = lc;
        ic += 2; // increment by 2
      } else {  // interpolate
        lc = parseFloat(interpolateData(stActivity.cadence, ic, i).toFixed(0));
      }
      if (sSWR == 1) {
        lc = 0;  // if stopped from watch then cadence = 0
      //} else if (lc == 0) {
      //  sSWR = 2;  // if cadence = 0 then pause (alternative to P=0) - don't change other value
      } else if ( (parseInt(lc)*2 <= walkCad) && sSWR == 4) {
         sSWR = 3;   // if below cadence threshold then walking (don't change if viewed as paused or already stopped)
      }
    }

    if (bh == true) {  // HR
      if (stActivity.heartrate[ih] == i && ih < mh) {
        lh = stActivity.heartrate[ih+1];
        rh = lh;
        ih += 2; // increment by 2
      } else {  // interpolate
        lh = parseFloat(interpolateData(stActivity.heartrate, ih, i).toFixed(0));
      }
    }

    if (bm == true) {  // gps data for Map
      if (stActivity.location[im] == i && im < mm) {
        gpsData[i] = stActivity.location[im+1];
        im += 2; // increment by 2
      } else {  // use last point
          gpsData[i] = i>0 ? gpsData[i-1] : stActivity.location[1];  // use last point, or it i=0 then use first location
      }
    }

    //  [0]distance, [1]elevation, [2]power, [3]GCT, [4]heartrate, [5]cadence
    rawData[i] = [rd, re, rp, rg, rh, rc];
    runData[i] = [ld, le, lp, lg, lh, lc];
    //  [0]watchstop0/pause1/walk2/run3, [1]delta dist, [2]filtered elev, [3]delta elev, [4]grade, [5]down1, level2, up3
    calcData[i] = [sSWR, dd, 0, 0, 0, 0];
  }

  // add filtered elevation  elevFilter
  var eDist = elevFilter / 2;
  var iMax = runData.length;
  for (i = 0; i < iMax ; i++ ) {
    var minD = runData[i][0] - eDist;
    var maxD = runData[i][0] + eDist;
    var eTot = runData[i][1], eNumB = 1, eNumF = 0;

    if (elevFilter > 0) {
      for (j = i - 1; j > -1; j--) { // look backwards
        eTot += runData[j][1];
        eNumB++
        if (runData[j][0] < minD || eNumB > eDist) break; // only include maximum of eDist points (for when speed < 1m/s)
      }
      //console.log(eTot, eNum)
      for (j = i + 1; j < iMax; j++) { // look forwards
        eTot += runData[j][1];
        eNumF++
        if (runData[j][0] > maxD || eNumF > eDist) break; // only include maximum of eDist points (for when speed < 1m/s)
      }
    }
    var filElev = parseFloat((eTot / (eNumF + eNumB)).toFixed(2));
    var deltaElev = i > 0 ? filElev - calcData[i-1][2] : 0;
    var grade = calcData[i][1] > ddPause ? parseFloat((100*(calcData[i][1] > 0 ? deltaElev / calcData[i][1] : 0)).toFixed(2)) : 0;
    //if (Math.abs(grade) > 30 ) console.log(i, deltaElev, calcData[i][1], grade, eTot, eNumB, eNumF);
    //console.log(eTot, eNum, filElev)
    calcData[i][2] = filElev;
    calcData[i][3] = parseFloat((deltaElev.toFixed(2)));
    calcData[i][4] = grade;
    calcData[i][5] = grade > levelGrade ? 3 : grade < -levelGrade ? 1 : 2;
  }
}

function calcMetrics() {
  // make calculations - initialize data

  // runData   [0]distance, [1]elevation, [2]power, [3]GCT, [4]heartrate, [5]cadence
  // calcData  watchstop1/pause2/walk3/run4, [1]delta dist, [2]filtered elev, [3]delta elev, [4]grade, [5]down 1, level 2, up 3
  // sumData    first (j)     total0/watchstop1/pause2/walk3/run4/moving5/watch6    [watch=total-watchstop]
  //            second (k)    elev all0/down1/level2/up3
  //            third         time0/dist1/elev2/avPow3/avHR4/avCadence5/avSpeed6/avGrade7
  // strydData [0]distance_from_watch, [1] delta_dist, [2]distance_from_speed, [3]speed, [4]total_power, [5]GCT, [6]cadence
  // sumStryd   first and second as above
  //            third         distwatch0/distspeed1/avSpeed2/avPow3/avCadence4

  var jNum = 7, kNum = 4;
  // initialize or zero out array
  for (j=0; j < jNum ; j++ ) {
    sumData[j] = [];
    sumStryd[j] = [];
    for (k=0; k < kNum; k++ ) {
      sumData[j][k] = [0, 0, 0, 0, 0, 0, 0, 0];
      sumStryd[j][k] = [0, 0, 0, 0, 0];
    }
  }

  if (calcData.length > 0) {
    var iStart = $( "#timeRange" ).slider( "values", 0) + 1;  // skip first point
    var iEnd = $( "#timeRange" ).slider( "values", 1) + 1;

    for (i = iStart; i < iEnd ; i++ ) {
      for (j=0; j < jNum ; j++ ) {
        for (k=0; k < kNum; k++ ) {
          //     all   stop/pause/walk/run     All       down/level/up
          if (( j==0 || calcData[i][0]==j )*( k==0 || calcData[i][5]==k )) {
            sumData[j][k][0] += 1;  //time
            sumData[j][k][1] += calcData[i][1];  //distance
            sumData[j][k][2] += k==1 ? calcData[i][3] : calcData[i][3]>0 ? calcData[i][3] : 0 ;  // up elev total = only down for negative
            sumData[j][k][3] += runData[i][2];  //power
            sumData[j][k][4] += runData[i][4];  //hr
            sumData[j][k][5] += runData[i][5];  //cadence
            if (strydData.length > 0 && i < strydData.length) {  // check array exists and that same number of indexes
                sumStryd[j][k][0] += strydData[i][1];  //distance from watch
                sumStryd[j][k][1] += strydData[i][3];  //distance from speed (assume 1/sec)
                sumStryd[j][k][3] += strydData[i][4];  //power
                sumStryd[j][k][4] += strydData[i][6];  //cadence
            }
          }
        }
      }
    }
    // calculate moving and watch data (simpler than summing above)
    for (k=0; k < kNum; k++ ) {
      for (l=0; l < 6; l++) {
          sumData[5][k][l] = sumData[3][k][l] + sumData[4][k][l];
          sumData[6][k][l] = sumData[0][k][l] - sumData[1][k][l];
          if (strydData.length > 0 ) {  // check array exists
              sumStryd[5][k][l] = sumStryd[3][k][l] + sumStryd[4][k][l];
              sumStryd[6][k][l] = sumStryd[0][k][l] - sumStryd[1][k][l];
          }
      }
    }

    // calculate average and tidy up arrays with rounding
    for (j=0; j < jNum ; j++) {
      for (k=0; k < kNum; k++ ) {
        sumData[j][k][1] = parseFloat(sumData[j][k][1].toFixed(2));
        sumData[j][k][2] = parseFloat(sumData[j][k][2].toFixed(2));
        sumData[j][k][3] = Math.round(sumData[j][k][0] != 0 ? sumData[j][k][3]/sumData[j][k][0] : -1);  // ave power
        sumData[j][k][4] = Math.round(sumData[j][k][0] != 0 ? sumData[j][k][4]/sumData[j][k][0] : -1);  // ave hr
        sumData[j][k][5] = Math.round(sumData[j][k][0] != 0 ? sumData[j][k][5]/sumData[j][k][0] : -1);  // ave cadence
        sumData[j][k][6] = parseFloat((sumData[j][k][0] != 0 ? sumData[j][k][1]/sumData[j][k][0] : 0).toFixed(3));  // ave speed
        sumData[j][k][7] = parseFloat((sumData[j][k][1] != 0 ? 100*sumData[j][k][2]/sumData[j][k][1] : 0).toFixed(2));  // ave gradient
        if (strydData.length > 0 ) {  // check array exists
            sumStryd[j][k][0] = parseFloat(sumStryd[j][k][0].toFixed(2));
            sumStryd[j][k][1] = parseFloat(sumStryd[j][k][1].toFixed(2));
            sumStryd[j][k][2] = parseFloat((sumData[j][k][0] != 0 ? sumStryd[j][k][1]/sumData[j][k][0] : 0).toFixed(3));  // ave stryd speed
            sumStryd[j][k][3] = Math.round(sumData[j][k][0] != 0 ? sumStryd[j][k][3]/sumData[j][k][0] : -1);  // ave power
            sumStryd[j][k][4] = Math.round(sumData[j][k][0] != 0 ? sumStryd[j][k][4]/sumData[j][k][0] : -1);  // ave cadence
        }
      }
    }
    //console.log( sumData);
    //console.log( sumStryd);
  }
}

function displayMetrics(zoomOut = false) {
  var dataCSV ="";
  dataCSV += "Elevation filter = " + parseInt(document.getElementById("elevFilter").value) + " m; Level threshold = " +
      parseFloat(document.getElementById("levelGrade").value) + " %; Walk thresholds: GCT = " +
      parseInt(document.getElementById("walkGCT").value) + " ms; Cadence  = " +
      parseInt(document.getElementById("walkCad").value) + " spm" + lf;
  dataCSV += "  Time range: " + $( "#minTime" )[0].value + " to " + $( "#maxTime" )[0].value + lf + lf;

  // display metrics data

  //display sparkline
  showSparkLine();
  var bStryd = strydData.length > 0 ? true : false;
  var iStart = $( "#timeRange" ).slider( "values", 0);
  var iEnd = $( "#timeRange" ).slider( "values", 1) + 1;
  if (sumData.length > 0 && runData.length > 0) {
    if ($( "#cbMetrics" )[0].checked) {
      dataCSV += "type" + csv + "time" + csv + "distance" + csv + "pace" + csv + "elev gain" + csv + "grade" + csv + "HR" + csv +
          "power" + csv + "cadence" + csv + (bStryd ? "dist watch" + csv + "dist stryd" + csv + "pace stryd" + csv + "power" + csv + "cadence" + csv : '') + lf;
      if ($( "#cbSIunits" )[0].checked) {
        dataCSV += ""     + csv + "(h:m:s)" + csv + "(km)" + csv + "(min/km)" + csv + " (m)" + csv + " (%)" + csv + "(bpm)" + csv +
          "(W)" + csv + "(spm)" + csv + (bStryd ? "(km)" + csv + "(km)" + csv + "(min/km)" + csv + "(W)" + csv + "(spm)" + csv : '') + lf;
      } else {
          dataCSV += ""     + csv + "(h:m:s)" + csv + "(mi)" + csv + "(min/mi)" + csv + " (ft)" + csv + "(ft/mile)" + csv + "(bpm)" + csv +
           "(W)" + csv + "(spm)" + csv + (bStryd ? "(mi)" + csv + "(mi)" + csv + "(min/mi)" + csv + "(W)" + csv + "(spm)" + csv : '') + lf;
      }
      // ALL data
      dataCSV += "Moving" + csv + metricData(sumData[5][0]) + (bStryd ? metricStrydData(sumStryd[5][0]) : '') + lf;
      dataCSV += "Running" + csv + metricData(sumData[4][0]) + (bStryd ? metricStrydData(sumStryd[4][0]) : '') + lf;
      dataCSV += "Walking" + csv + metricData(sumData[3][0]) + (bStryd ? metricStrydData(sumStryd[3][0]) : '') + lf;
      dataCSV += "Paused" + csv + metricData(sumData[2][0]) + (bStryd ? metricStrydData(sumStryd[2][0]) : '') + lf;
      dataCSV += "Stopped" + csv + metricData(sumData[1][0]) + (bStryd ? metricStrydData(sumStryd[1][0]) : '') + lf;
      dataCSV += "Watch" + csv + metricData(sumData[6][0]) + (bStryd ? metricStrydData(sumStryd[6][0]) : '') + lf;
      dataCSV += "Elapsed" + csv + metricData(sumData[0][0]) + (bStryd ? metricStrydData(sumStryd[0][0]) : '') + lf;
      // dataCSV += lf + "ALL" + lf;
      // dataCSV += "Down" + csv + metricData(sumData[0][1]) + lf;
      // dataCSV += "Level" + csv + metricData(sumData[0][2]) + lf;
      // dataCSV += "Up" + csv + metricData(sumData[0][3]) + lf;
      dataCSV += lf + "Moving" + lf;
      dataCSV += "Down" + csv + metricData(sumData[5][1]) + (bStryd ? metricStrydData(sumStryd[5][1]) : '') + lf;
      dataCSV += "Level" + csv + metricData(sumData[5][2]) + (bStryd ? metricStrydData(sumStryd[5][2]) : '') + lf;
      dataCSV += "Up" + csv + metricData(sumData[5][3]) + (bStryd ? metricStrydData(sumStryd[5][3]) : '') + lf;
      dataCSV += lf + "Running" + lf;
      dataCSV += "Down" + csv + metricData(sumData[4][1]) + (bStryd ? metricStrydData(sumStryd[4][1]) : '') + lf;
      dataCSV += "Level" + csv + metricData(sumData[4][2]) + (bStryd ? metricStrydData(sumStryd[4][2]) : '') + lf;
      dataCSV += "Up" + csv + metricData(sumData[4][3]) + (bStryd ? metricStrydData(sumStryd[4][3]) : '') + lf;
      dataCSV += lf + "Walking" + lf;
      dataCSV += "Down" + csv + metricData(sumData[3][1]) + (bStryd ? metricStrydData(sumStryd[3][1]) : '') + lf;
      dataCSV += "Level" + csv + metricData(sumData[3][2]) + (bStryd ? metricStrydData(sumStryd[3][2]) : '') + lf;
      dataCSV += "Up" + csv + metricData(sumData[3][3]) + (bStryd ? metricStrydData(sumStryd[3][3]) : '') + lf;
      dataCSV += lf;
      //dataCSV += "type" + csv + "time" + csv + "distance" + csv + "pace" + csv + "elevation" + csv + "HR" + csv + "power" + csv + "cadence" + csv + lf;
    }

    // display activity data
    if ($( "#cbData" )[0].checked && runData.length > 0) {
      dataCSV += "time" + csv + "distance" + csv + "elevation" + csv + "power" + csv + "GCT" + csv + "heartrate" + csv + "cadence" + csv +
            "SPW-Run" + csv + "delta dist" + csv + "filter elev" + csv + "grade" + csv + "d-level-u" + csv;
      if (bStryd) {
        dataCSV += "Stryd:" + csv +"dist watch" + csv + "delta dist" + csv + "dist stryd" + csv + "speed" + csv + "power" +  csv + "GCT" + csv + "cadence" + csv;
      }
      dataCSV += "ST Raw:" + csv +"distance" + csv + "elevation" + csv + "power" + csv + "GCT" + csv + "heartrate" + csv + "cadence" + csv + lf;
      dataCSV += "(s)" + csv + "(m)" + csv + "(m)" + csv + "(W)" + csv + "(ms)" + csv + "(bpm)" + csv + "(cpm)" +
            csv + "(1/2/3/4)" + csv + "(m)" + csv + "(m)" + csv + "(%)" + csv + "(1/2/3)" + csv;
      if (bStryd) {
        dataCSV += "" + csv +"(m)" + csv + "(m)" + csv + "(m)" + csv + "(m/s)" + csv + "(W)" +  csv + "(ms)" + csv + "(spm)" + csv;
      }
      dataCSV += "" + csv + "(m)" + csv + "(m)" + csv + "(W)" + csv + "(ms)" + csv + "(bpm)" + csv + "(cpm)" + lf;

      for (i = iStart; i < iEnd ; i++ ) {
        dataCSV += i + csv + runData[i][0] + csv + runData[i][1] + csv + runData[i][2] + csv + runData[i][3] + csv + runData[i][4] + csv + runData[i][5] + csv;
        dataCSV += calcData[i][0] + csv + calcData[i][1] + csv + calcData[i][2] + csv + calcData[i][4] + csv + calcData[i][5] + csv;
        if (bStryd) {
          if (i<strydData.length) {
            dataCSV += "" + csv + strydData[i][0] + csv + strydData[i][1] + csv + strydData[i][2] + csv + strydData[i][3] + csv + strydData[i][4] +  csv + strydData[i][5] + csv + strydData[i][6] + csv;
          } else  {
            dataCSV += "" + csv + csv +  csv + csv  + csv +  csv + csv + csv;
          }
        }
        dataCSV += "" + csv + rawData[i][0] + csv + rawData[i][1] + csv + rawData[i][2] + csv + rawData[i][3] + csv + rawData[i][4] + csv + rawData[i][5] + csv;
        dataCSV += lf;
      }
    }
  }
  document.getElementById("showData").value = dataCSV;
  showMap(zoomOut);
}

function showSparkLine() {
  var sparkArray = [[0,0],[0,0],[0,0],[0,0],[0,0]];  // add extra for Power2
  //sparkArray[0] = [0,0], sparkArray[1] = [0,0], sparkArray[2] = [0,0], sparkArray[3] = [0,0];
  var bShowHR = false;
  var bShowPower = false;
  var bShowPower2 = false; maxP = 0; minP = 1000;

  if (calcData.length > 0) {
    sparkI=0;
    var i0 = $( "#timeRange" ).slider( "values", 0);
    var i1 = $( "#timeRange" ).slider( "values", 1);
    var iStep = Math.floor((i1-i0)/maxGraphPts);
    if (iStep<1) iStep =1;
    //console.log(iStep, Math.floor((i1-i0)/iStep));

    for (i = i0; i < i1 + 1 ; i+=iStep ) {
      sparkArray[0][sparkI] = [i, calcData[i][2]];
      sparkArray[1][sparkI] = [i, calcData[i][0]];
      if (runData[i][4] >= 0) {
          sparkArray[2][sparkI] = [i, runData[i][4]];
          bShowHR = true;
      } else {
          sparkArray[2][sparkI] = [i, null];
      }
      if (runData[i][2] >= 0) {
          sparkArray[3][sparkI] = [i, runData[i][2]];
          if (runData[i][2]>maxP) { maxP=runData[i][2]};
          if (runData[i][2]<minP) { minP=runData[i][2]};
          bShowPower = true;
      } else {
          sparkArray[3][sparkI] = [i, null];
      }
      if (i<strydData.length) {
          sparkArray[4][sparkI] = [i, strydData[i][4]];
          if (strydData[i][4]>maxP) { maxP=strydData[i][4]};
          if (strydData[i][4]<minP) { minP=strydData[i][4]};
          bShowPower2 = true;
      } else {
          sparkArray[4][sparkI] = [i, null];
      }

      sparkI++;
    }
  } else {
    sparkArray[0] = [[$( "#timeRange" ).slider( "values", 0), 0] , [$( "#timeRange" ).slider( "values", 1) ,0]];
    sparkArray[1] = [[$( "#timeRange" ).slider( "values", 0), 0] , [$( "#timeRange" ).slider( "values", 1) ,0]];
  }

  var graphHeight = $( "#cbGraphBig" )[0].checked ? '150px' : '60px';
  $('.elevSparkline').sparkline(sparkArray[0], { width: '600px', height: graphHeight, lineWidth: 2, spotColor: false,
    tooltipFormatter: function (sparkline, options, fields) {
        var elev = $( "#cbSIunits" )[0].checked ? (fields.y).toFixed(1) + "m  " : elevFeet(fields.y) + "ft  ";
        var dist = typeof runData[fields.x] === 'undefined' ? "N/A" :
            $( "#cbSIunits" )[0].checked ?   distKM(runData[fields.x][0]) + "km" : distMiles(runData[fields.x][0]) + "mi";
        return "" + elev + timeHMS(fields.x) + " (" + dist + ")";
      }
  });
  $('.elevSparkline').sparkline(sparkArray[1], { composite: true, lineWidth: 1,
    spotColor: false, minSpotColor: false, maxSpotColor: false,
    fillColor: false, lineColor: 'green', chartRangeMin: 1, chartRangeMax: 4,
    tooltipFormat: '{{y:levels}}',
    tooltipValueLookups: {
      levels: $.range_map({ '1': 'Stopped', '2': 'Paused', '3': 'Walking', '4' : 'Running' })
    }
  });
  if ($( "#cbGraphHR" )[0].checked && bShowHR) {
    $('.elevSparkline').sparkline(sparkArray[2], { composite: true, lineWidth: 1,
      spotColor: false,
      fillColor: false, lineColor: 'red',
      tooltipFormat: 'HR {{y}} bpm'
    });
  }
  if ($( "#cbGraphP" )[0].checked && bShowPower) {
    $('.elevSparkline').sparkline(sparkArray[3], { composite: true, lineWidth: 1,
      spotColor: false,
      fillColor: false, lineColor: 'orange',
      chartRangeMin: minP, chartRangeMax: maxP,
      tooltipFormat: 'Power1 {{y}} W'
    });
  }
  if ($( "#cbGraphP" )[0].checked && bShowPower2) {
    $('.elevSparkline').sparkline(sparkArray[4], { composite: true, lineWidth: 1,
      spotColor: false,
      fillColor: false, lineColor: 'yellow',
      chartRangeMin: minP, chartRangeMax: maxP,
      tooltipFormat: 'Power2 {{y}} W'
    });
  }
}

function interpolateData(stActData, idV, iV) {
  // idV = index of next time-data pair, iV is time for data
  var interP = 0;
  if (stActData.length > idV+1) {
    if (idV > 1) {
      interP = stActData[idV-1] + (iV - stActData[idV-2])*(stActData[idV+1] - stActData[idV-1])/(stActData[idV] - stActData[idV-2]);
    } else {
      interP = stActData[1]; // use first data value (index [0] = time )
    }
  } else {
    interP = stActData[idV-1];
  }
  return interP;
}


function metricData(sD) {
  var outStr = "";
  if ($( "#cbSIunits" )[0].checked) {
    outStr = timeHMS(sD[0]) + csv + distKM(sD[1]).toString().padStart(5," ") + csv + paceMinKm(sD[6]) + csv +
    Math.round(sD[2]).toString().padStart(4, ' ' ) + csv + sD[7].toString().padStart(5, " ") + csv +
    (sD[4]<0 ? '' : sD[4].toString().padStart(3," ")) + csv +
    (sD[3]<0 ? '' : sD[3].toString().padStart(3," ")) + csv +
    (sD[5]<0 ? '' : cadSPM(sD[5]).toString().padStart(3," ")) + csv;
  } else {
    outStr = timeHMS(sD[0]) + csv + distMiles(sD[1]).toString().padStart(5," ") + csv + paceMinMile(sD[6]) + csv +
    elevFeet(sD[2]).toString().padStart(4, ' ' ) + csv + ftPerMile(sD[7]).toString().padStart(5, " ") + csv +
    (sD[4]<0 ? '' : sD[4].toString().padStart(3," ")) + csv +
    (sD[3]<0 ? '' : sD[3].toString().padStart(3," ")) + csv +
    (sD[5]<0 ? '' : cadSPM(sD[5]).toString().padStart(3," ")) + csv;
  }
  return outStr;
}

function metricStrydData(sD) {
  var outStr = "";
  if ($( "#cbSIunits" )[0].checked) {
    outStr = distKM(sD[0]).toString().padStart(5," ") + csv + distKM(sD[1]).toString().padStart(5," ") + csv + paceMinKm(sD[2]) + csv +
    (sD[3]<0 ? '' : sD[3].toString().padStart(3," ")) + csv +
    (sD[4]<0 ? '' : sD[4].toString().padStart(3," ")) + csv;
  } else {
    outStr = distMiles(sD[0]).toString().padStart(5," ") + csv + distMiles(sD[1]).toString().padStart(5," ") + csv  + paceMinMile(sD[2]) + csv +
    (sD[3]<0 ? '' : sD[3].toString().padStart(3," ")) + csv +
    (sD[4]<0 ? '' : sD[4].toString().padStart(3," ")) + csv;
  }
  return outStr;
}

function timeS(timeHMS) {
  //check for valid "hh:mm:ss" and return seconds or -1 if not valid
  var hms = timeHMS.split(':');
  var sec = -1;
  if (hms.length == 3) {
    sec = parseInt(hms[0], 10)*60*60 + parseInt(hms[1], 10)*60 + parseInt(hms[2], 10)
    if (isNaN(sec)) sec = -1
  }
  return sec;
}

function timeHMS(timeS) {
  return new Date(timeS * 1000  + 500).toISOString().substr(11, 8);
}

function distMiles(distM) {
  return (distM/MI2M).toFixed(2);  // convert to miles, show 2 dp
}

function distKM(distM) {
  return (distM/1000).toFixed(3);  // convert to KM, show 3 dp
}

function paceMinMile(paceMperS) {
  return paceMperS == '0' ? '00:00' : new Date(MI2M / paceMperS * 1000 + 500).toISOString().substr(14, 5);  //extra 500 ms for correct rounding
}

function paceMinKm(paceMperS) {
  return paceMperS == '0' ? '00:00' : new Date(1000 / paceMperS * 1000 + 500).toISOString().substr(14, 5);  //extra 500 ms for correct rounding
}

function elevFeet(elevM) {
  return (elevM * M2FT).toFixed(0);
}

function ftPerMile(grade) {
  return (grade * GRADE2FTPMI).toFixed(0);
}

function cadSPM(cadRPM) {
  return (cadRPM * 2).toFixed(0);
}
