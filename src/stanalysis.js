
// global variables for now
var runData = ([],[]);       //  [0]distance, [1]elevation, [2]power, [3]GCT, [4]heartrate, [5]cadence
var calcData = ([],[]);     //  [0]stopped/walking/running, [1]delta dist, [2]filtered elev, [3]delta elev, [4]grade, [5]down -1, level 0, up 1
var sumData = ([],[],[]);   //  first index total0/stopped1/walking2/running3/total3; second elev all0/down1/level2/up3; time0/dist1/elev2/avPow3/avHR4/avCadence5/avSpeed6
var csv ="\t";
var lf = "\n";

function maxData() {
  $( "#timeRange" ).slider( "option", "min", 0);
  $( "#timeRange" ).slider( "option", "max", calcData.length - 1);
  $( "#timeRange" ).slider( "option", "values", [ 0, calcData.length - 1 ] );
  $( "#minTime" ).val( timeHMS( $( "#timeRange" ).slider( "values", 0)) );
  $( "#maxTime" ).val( timeHMS( $( "#timeRange" ).slider( "values", 1)) );
  calcMetrics();
  displayMetrics();
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

  var id = 0, ih = 0, ie = 0, ip = 0, ig = 0, ic = 0;// index for data

  bd = typeof stActivity.distance === 'undefined' ? false : bd;
  bh = typeof stActivity.heartrate === 'undefined' ? false : bh;
  be = typeof stActivity.elevation === 'undefined' ? false : be;
  bp = typeof stActivity.power === 'undefined' ? false : bp;
  bg = typeof stActivity.ground_contact_time === 'undefined' ? false : bg;
  bc = typeof stActivity.ground_contact_time === 'undefined' ? false : bc;
  bt = typeof stActivity.timer_stops === 'undefined' ? false : bt;

  // max index of each data type
  var md = typeof stActivity.distance === 'undefined' ? 0 : stActivity.distance.length;
  var mh = typeof stActivity.heartrate === 'undefined' ? 0 : stActivity.heartrate.length;
  var me = typeof stActivity.elevation === 'undefined' ? 0 : stActivity.elevation.length;
  var mp = typeof stActivity.power === 'undefined' ? 0 : stActivity.power.length;
  var mg = typeof stActivity.ground_contact_time === 'undefined' ? 0 : stActivity.ground_contact_time.length;
  var mc = typeof stActivity.cadence === 'undefined' ? 0 : stActivity.cadence.length;

  var ld = -1, lh = -1, le = -1, lp = -1, lg = -1, lc = -1;  // last values (when data blank)
  var dd = 0; // delta distance
  var itIndex = 0, it0 = 0, it1 = 0, mt = 0; // stopped index values

  // get defaults from UI
  var walkGCT = parseInt(document.getElementById("walkGCT").value);
  if (isNaN(walkGCT)) walkGCT = 500;
  document.getElementById("walkGCT").value = walkGCT;
  // value is in meters of travel - average over at least this amount
  var elevFilter = parseInt(document.getElementById("elevFilter").value);
  if (isNaN(elevFilter)) elevFilter = 20;
  document.getElementById("elevFilter").value = elevFilter;
  // threshold for level grade - default 1.5%
  var levelGrade = parseFloat(document.getElementById("levelGrade").value);
  if (isNaN(levelGrade)) levelGrade = 1.5;
  document.getElementById("levelGrade").value = levelGrade;

  // timer stops
  if (bt == true) {
      mt = stActivity.timer_stops.length;
      itIndex = 0;
      it0 = (new Date (stActivity.timer_stops[itIndex][0]) - new Date (stActivity.start_time))/1000;
      it1 = (new Date (stActivity.timer_stops[itIndex][1]) - new Date (stActivity.start_time))/1000+1;
      //console.log(it0, it1);
  }

  // reset arrays
  runData.length = 0;
  calcData.length = 0;

  // if no array of distance then set to zero   -              distance list is time then distance
  var iEnd = typeof stActivity.distance === 'undefined' ? 0 : stActivity.distance[stActivity.distance.length-2] + 1;
  for (i = 0; i < iEnd ; i++ ) {
    var sSWR = 3;
    if (bt == true) {
      if (i > it0) {
        if (i < it1) {
          sSWR = 1;
        } else {
          if (itIndex < mt-1) {
            itIndex++;
            it0 = (new Date (stActivity.timer_stops[itIndex][0]) - new Date (stActivity.start_time))/1000;
            it1 = (new Date (stActivity.timer_stops[itIndex][1]) - new Date (stActivity.start_time))/1000+1;
          }
        }
      }
    }

    if (bd == true) {
      if (stActivity.distance[id] == i && id < md) {
        dd = (stActivity.distance[id+1] - ld);
        dd = parseFloat((stActivity.distance[id+1] - ld).toFixed(2));
        ld = stActivity.distance[id+1];
        id += 2; // increment by 2
      }
      if (sSWR == 1) dd = 0;  // if stopped from watch then delta distance = 0
    }

    if (be == true) {
      if (stActivity.elevation[ie] == i && ie < me) {
        le = stActivity.elevation[ie+1];
        ie += 2; // increment by 2
      }
    }

    if (bp == true) {
      if (stActivity.power[ip] == i && ip < mp) {
        lp = stActivity.power[ip+1];
        ip += 2; // increment by 2
      }
      if (sSWR == 1) lp = 0;  // if stopped then power = 0
      if (lp == 0) sSWR = 1;   // and vice versa
    }

    if (bg == true) {
      if (stActivity.ground_contact_time[ig] == i && ig < mg) {
        lg = stActivity.ground_contact_time[ig+1];
        ig += 2; // increment by 2
      }
      if (lp == 0) lg = 2000;  // stopped
      if ((parseInt(lg) >= walkGCT) && (sSWR != 1)) sSWR = 2;  //walking
    }

    if (bc == true) {
      if (stActivity.cadence[ic] == i && ic < mc) {
        lc = stActivity.cadence[ic+1];
        ic += 2; // increment by 2
      }
      if (lp == 0) lc = 0;  // stopped - could test cadence for walking - needs more experience
    }

    if (bh == true) {
      if (stActivity.heartrate[ih] == i && ih < mh) {
        lh = stActivity.heartrate[ih+1];
        ih += 2; // increment by 2
      }
      // adjust HR if stopped
    }

    //  [0]distance, [1]elevation, [2]power, [3]GCT, [4]heartrate, [5]cadence
    runData[i] = [ld, le, lp, lg, lh, lc];
    //  [0]stopped/walking/running, [1]delta dist, [2]filtered elev, [3]delta elev, [4]grade, [5]down -1, level 0, up 1
    calcData[i] = [sSWR, dd, 0, 0, 0, 0];
  }

  // add filtered elevation  elevFilter
  var eDist = elevFilter / 2;
  var iMax = runData.length;
  for (i = 0; i < iMax ; i++ ) {
    var minD = runData[i][0] - eDist;
    var maxD = runData[i][0] + eDist;
    var eTot = runData[i][1], eNum = 1;

    if (elevFilter > 0) {
      for (j = i - 1; j > -1; j--) { // look backwards
        eTot += runData[j][1];
        eNum++
        if (runData[j][0] < minD) break;
      }
      //console.log(eTot, eNum)
      for (j = i + 1; j < iMax; j++) { // look forwards
        eTot += runData[j][1];
        eNum++
        if (runData[j][0] > maxD) break;
      }
    }
    var filElev = parseFloat((eTot / eNum).toFixed(2));
    var deltaElev = i > 0 ? filElev - calcData[i-1][2] : 0;
    var grade = parseFloat((100*(calcData[i][1] > 0 ? deltaElev / calcData[i][1] : 0)).toFixed(2));
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
  // calcData  [0]stopped1/walking2/running3, [1]delta dist, [2]filtered elev, [3]delta elev, [4]grade, [5]down 1, level 2, up 3
  // sumData    first (j)     total0/stopped1/walking2/running3/moving4
  //            second (k)    elev all0/down1/level2/up3
  //            third         time0/dist1/elev2/avPow3/avHR4/avCadence5/avSpeed6/avGrade7

  var jNum = 5, kNum = 4;
  // initialize or zero out array
  for (j=0; j < jNum ; j++ ) {
    sumData[j] = [];
    for (k=0; k < kNum; k++ ) {
      sumData[j][k] = [0, 0, 0, 0, 0, 0, 0, 0];
    }
  }

  if (calcData.length > 0) {
    var iStart = $( "#timeRange" ).slider( "values", 0) + 1;  // skip first point
    var iEnd = $( "#timeRange" ).slider( "values", 1) + 1;

    for (i = iStart; i < iEnd ; i++ ) {
      for (j=0; j < jNum ; j++ ) {
        for (k=0; k < kNum; k++ ) {
          //   all      stop/walk/run                 moving = walk/run                         All       down/level/up
          if ((j==0 || calcData[i][0]==j || ((j==4)*(calcData[i][0]==2 || calcData[i][0]==3)))*(k==0 || calcData[i][5]==k)) {
            sumData[j][k][0] += 1;  //time
            sumData[j][k][1] += calcData[i][1];  //distance
            sumData[j][k][2] += k==1 ? calcData[i][3] : calcData[i][3]>0 ? calcData[i][3] : 0 ;  // up elev total = only down for negative
            sumData[j][k][3] += runData[i][2];  //power
            sumData[j][k][4] += runData[i][4];  //hr
            sumData[j][k][5] += runData[i][5];  //cadence
          }
        }
      }
    }
    // calculate average and tidy up arrays with rounding
    for (j=0; j < jNum ; j++) {
      for (k=0; k < kNum; k++ ) {
        sumData[j][k][1] = parseFloat(sumData[j][k][1].toFixed(2));
        sumData[j][k][2] = parseFloat(sumData[j][k][2].toFixed(2));
        sumData[j][k][3] = Math.round(sumData[j][k][0] != 0 ? sumData[j][k][3]/sumData[j][k][0] : 0);  // ave power
        sumData[j][k][4] = Math.round(sumData[j][k][0] != 0 ? sumData[j][k][4]/sumData[j][k][0] : 0);  // ave hr
        sumData[j][k][5] = Math.round(sumData[j][k][0] != 0 ? sumData[j][k][5]/sumData[j][k][0] : 0);  // ave cadence
        sumData[j][k][6] = parseFloat((sumData[j][k][0] != 0 ? sumData[j][k][1]/sumData[j][k][0] : 0).toFixed(3));  // ave speed
        sumData[j][k][7] = parseFloat((sumData[j][k][1] != 0 ? 100*sumData[j][k][2]/sumData[j][k][1] : 0).toFixed(2));  // ave gradient
      }
    }
    //console.log( sumData);
  }
}

function displayMetrics() {
  var dataCSV ="";
  dataCSV += "GCT walk threshold = " + parseInt(document.getElementById("walkGCT").value) +
      " ms; Elevation filter = " + parseInt(document.getElementById("elevFilter").value) +
      " m; Level threshold = " + parseFloat(document.getElementById("levelGrade").value) + " %" + lf;
  dataCSV += "  Time range: " + $( "#minTime" )[0].value + " to " + $( "#maxTime" )[0].value + lf + lf;

  // display metrics data

  //display sparkline
  showSparkLine();
  if (sumData.length > 0 && runData.length > 0) {
    if ($( "#cbMetrics" )[0].checked) {
      dataCSV += "type" + csv + "time" + csv + "distance" + csv + "pace" + csv + "elev gain" + csv + "grade" + csv + "HR" + csv + "power" + csv + "cadence" + csv + lf;
      dataCSV += ""     + csv + "(h:m:s)" + csv + "(mi)" + csv + "(min/mi)" + csv + " (ft)" + csv + " (%)" + csv + "(bpm)" + csv + "(W)" + csv + "(spm)" + csv + lf;

      // ALL data
      dataCSV += "ALL" + csv + metricData(sumData[0][0]) + lf;
      dataCSV += "Moving" + csv + metricData(sumData[4][0]) + lf;
      dataCSV += "Running" + csv + metricData(sumData[3][0]) + lf;
      dataCSV += "Walking" + csv + metricData(sumData[2][0]) + lf;
      dataCSV += "Stopped" + csv + metricData(sumData[1][0]) + lf;
      // dataCSV += lf + "ALL" + lf;
      // dataCSV += "Down" + csv + metricData(sumData[0][1]) + lf;
      // dataCSV += "Level" + csv + metricData(sumData[0][2]) + lf;
      // dataCSV += "Up" + csv + metricData(sumData[0][3]) + lf;
      dataCSV += lf + "Moving" + lf;
      dataCSV += "Down" + csv + metricData(sumData[4][1]) + lf;
      dataCSV += "Level" + csv + metricData(sumData[4][2]) + lf;
      dataCSV += "Up" + csv + metricData(sumData[4][3]) + lf;
      dataCSV += lf + "Running" + lf;
      dataCSV += "Down" + csv + metricData(sumData[3][1]) + lf;
      dataCSV += "Level" + csv + metricData(sumData[3][2]) + lf;
      dataCSV += "Up" + csv + metricData(sumData[3][3]) + lf;
      dataCSV += lf + "Walking" + lf;
      dataCSV += "Down" + csv + metricData(sumData[2][1]) + lf;
      dataCSV += "Level" + csv + metricData(sumData[2][2]) + lf;
      dataCSV += "Up" + csv + metricData(sumData[2][3]) + lf;
      dataCSV += lf;
      //dataCSV += "type" + csv + "time" + csv + "distance" + csv + "pace" + csv + "elevation" + csv + "HR" + csv + "power" + csv + "cadence" + csv + lf;
    }

    // display activity data
    if ($( "#cbData" )[0].checked && runData.length > 0) {
      dataCSV += "time" + csv + "distance" + csv + "elevation" + csv + "power" + csv + "GCT" + csv + "heartrate" + csv + "cadence" + csv +
            "StopWalkRun" + csv + "delta distance" + csv + "filtered elevation" + csv + "grade" + csv + "down-level-up" + csv + lf;
      dataCSV += "(s)" + csv + "(m)" + csv + "(m)" + csv + "(W)" + csv + "(ms)" + csv + "(bpm)" + csv + "(cpm)" +
            csv + "(1/2/3)" + csv + "(m)" + csv + "(m)" + csv + "(%)" + csv + "(1/2/3)" + csv + lf;

      var iStart = $( "#timeRange" ).slider( "values", 0);
      var iEnd = $( "#timeRange" ).slider( "values", 1) + 1;
      for (i = iStart; i < iEnd ; i++ ) {
        dataCSV += i + csv + runData[i][0] + csv + runData[i][1] + csv + runData[i][2] + csv + runData[i][3] + csv + runData[i][4] + csv + runData[i][5] + csv;
        dataCSV += calcData[i][0] + csv + calcData[i][1] + csv + calcData[i][2] + csv + calcData[i][4] + csv + calcData[i][5] + csv;
        dataCSV += lf;
      }
    }
  }
  document.getElementById("showData").value = dataCSV;
}

function showSparkLine() {
  var sparkArray = ([]);
  sparkArray[0] = [0,0], sparkArray[1] = [0,0], sparkArray[2] = [0,0], sparkArray[3] = [0,0];
  var bShowHR = false;
  var bShowPower = false;

  if (calcData.length > 0) {
    sparkI=0;
    for (i = $( "#timeRange" ).slider( "values", 0); i < $( "#timeRange" ).slider( "values", 1) + 1 ; i++ ) {
      sparkArray[0][sparkI] = [i, (calcData[i][2]*M2FT).toFixed(1)];
      sparkArray[1][sparkI] = [i, calcData[i][0]];
      if (runData[i][4] >= 0) {
          sparkArray[2][sparkI] = [i, runData[i][4]];
          bShowHR = true;
      } else {
          sparkArray[2][sparkI] = [i, null];
      }
      if (runData[i][2] >= 0) {
          sparkArray[3][sparkI] = [i, runData[i][2]];
          bShowPower = true;
      } else {
          sparkArray[3][sparkI] = [i, null];
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
        return "" + fields.y + "ft " + timeHMS(fields.x) + " (" +
          (typeof runData[fields.x] === 'undefined' ? "N/A" : distMiles(runData[fields.x][0])) + " mi)";
      }
  });
  $('.elevSparkline').sparkline(sparkArray[1], { composite: true, lineWidth: 1,
    spotColor: false, minSpotColor: false, maxSpotColor: false,
    fillColor: false, lineColor: 'green', chartRangeMin: 1, chartRangeMax: 3,
    tooltipFormat: '{{y:levels}}',
    tooltipValueLookups: {
      levels: $.range_map({ '0': 'No data', '1': 'Stopped', '2': 'Walking', '3' : 'Running' })
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
      tooltipFormat: 'Power {{y}} W'
    });
  }
}

function metricData(sD) {
  return timeHMS(sD[0]) + csv + distMiles(sD[1]).toString().padStart(5," ") + csv + paceMilesHr(sD[6]) + csv +
  elevFeet(sD[2]).toString().padStart(4, ' ' ) + csv + sD[7].toString().padStart(5, " ") + csv +
  (sD[4]<0 ? '' : sD[4].toString().padStart(3," ")) + csv +
  (sD[3]<0 ? '' : sD[3].toString().padStart(3," ")) + csv +
  (sD[5]<0 ? '' : cadSPM(sD[5]).toString().padStart(3," ")) + csv;
}

function timeHMS(timeS) {
  return new Date(timeS * 1000  + 500).toISOString().substr(11, 8);
}

function distMiles(distM) {
  return (distM/MI2KM).toFixed(2);  // convert to miles, show 2 dp
}

function paceMilesHr(paceMperS) {
  // var pMPH = '00:00';
  // if (paceMperS != '0') {
  //   pMPH = new Date(MI2KM / paceMperS * 1000 + 500).toISOString().substr(14, 5);  //extra 500 ms for correct rounding
  // }
  return paceMperS == '0' ? '00:00' : new Date(MI2KM / paceMperS * 1000 + 500).toISOString().substr(14, 5);  //extra 500 ms for correct rounding
}

function elevFeet(elevM) {
  return (elevM * M2FT).toFixed(0);
}

function cadSPM(cadRPM) {
  return (cadRPM * 2).toFixed(0);
}
