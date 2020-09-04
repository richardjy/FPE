
// global variables for now
var runData = ([],[]);       //  [0]distance, [1]elevation, [2]power, [3]GCT, [4]heartrate
var calcData = ([],[]);     //  [0]stopped/walking/running, [1]delta dist, [2]filtered elev, [3]delta elev, [4]grade, [5]down -1, level 0, up 1
var sumData = ([],[],[]);   //  first index total0/stopped1/walking2/running3/total3; second elev all0/down1/level2/up3; time0/dist1/elev2/avPow3/avHR4



function exportData(stActivity) {
  var csv ="\t";
  var lf = "\n";
  // boolean - save data?
  var bd = true; //distance
  var bh = true; // heart rate
  var be = true; // elevation
  var bp = true; // power
  var bg = true; // ground contact time
  var bt = true; // time stops

  var id = 0, ih = 0, ie = 0, ip = 0, ig = 0; // index for data

  bd = typeof stActivity.distance === 'undefined' ? false : bd;
  bh = typeof stActivity.heartrate === 'undefined' ? false : bh;
  be = typeof stActivity.elevation === 'undefined' ? false : be;
  bp = typeof stActivity.power === 'undefined' ? false : bp;
  bg = typeof stActivity.ground_contact_time === 'undefined' ? false : bg;
  bt = typeof stActivity.timer_stops === 'undefined' ? false : bt;

  // max index of each data type
  var md = typeof stActivity.distance === 'undefined' ? 0 : stActivity.distance.length;
  var mh = typeof stActivity.heartrate === 'undefined' ? 0 : stActivity.heartrate.length;
  var me = typeof stActivity.elevation === 'undefined' ? 0 : stActivity.elevation.length;
  var mp = typeof stActivity.power === 'undefined' ? 0 : stActivity.power.length;
  var mg = typeof stActivity.ground_contact_time === 'undefined' ? 0 : stActivity.ground_contact_time.length;

  var ld = -1, lh = -1, le = -1, lp = -1, lg = -1;  // last values (when data blank)
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

  //var sSWR = 1;
  for (i = 0; i < stActivity.clock_duration + 1 ; i++ ) {
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

    if (bh == true) {
      if (stActivity.heartrate[ih] == i && ih < mh) {
        lh = stActivity.heartrate[ih+1];
        ih += 2; // increment by 2
      }
      // adjust HR if stopped
    }

    //  [0]distance, [1]elevation, [2]power, [3]GCT, [4]heartrate
    runData[i] = [ld, le, lp, lg, lh];
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

  // make calculations
  // sumData first index total0/stopped1/walking2/running3; second elev all0/down1/level2/up3; third time0/dist1/elev2/avPow3/avHR4
  // runData   [0]distance, [1]elevation, [2]power, [3]GCT, [4]heartrate
  // calcData  [0]stopped1/walking2/running3, [1]delta dist, [2]filtered elev, [3]delta elev, [4]grade, [5]down 1, level 2, up 3
  sumData[0] = [[0, 0, 0, 0, 0],[0, 0, 0, 0, 0],[0, 0, 0, 0, 0],[0, 0, 0, 0, 0]];
  sumData[1] = [[0, 0, 0, 0, 0],[0, 0, 0, 0, 0],[0, 0, 0, 0, 0],[0, 0, 0, 0, 0]];
  sumData[2] = [[0, 0, 0, 0, 0],[0, 0, 0, 0, 0],[0, 0, 0, 0, 0],[0, 0, 0, 0, 0]];
  sumData[3] = [[0, 0, 0, 0, 0],[0, 0, 0, 0, 0],[0, 0, 0, 0, 0],[0, 0, 0, 0, 0]];
  for (i = 0; i < iMax ; i++ ) {
    for (j=0; j < 4 ; j++ ) {
      for (k=0; k < 4; k++ ) {
        if ((j==0 || calcData[i][0]==j)*(k==0 || calcData[i][5]==k)) {
          sumData[j][k][0] += 1;  //time
          sumData[j][k][1] += calcData[i][1];  //distance
          sumData[j][k][2] += calcData[i][3];  //elev
          sumData[j][k][3] += runData[i][2];  //power
          sumData[j][k][4] += runData[i][4];  //hr
        }
      }
    }
  }

  for (j=0; j < 4 ; j++) {
    for (k=0; k < 4; k++ ) {
      sumData[j][k][1] = parseFloat(sumData[j][k][1].toFixed(2));
      sumData[j][k][2] = parseFloat(sumData[j][k][2].toFixed(2));
      sumData[j][k][3] = parseInt(sumData[j][k][0] != 0 ? sumData[j][k][3]/sumData[j][k][0] : 0);  // ave power
      sumData[j][k][4] = parseInt(sumData[j][k][0] != 0 ? sumData[j][k][4]/sumData[j][k][0] : 0);  // ave hr
    }
  }
  // tidy up arrays with rounding

  // prepare for export (make function)
  var dataCSV = "GCT walk threshold = " + walkGCT + " ms; Elevation filter = " + elevFilter + " m" + lf;
  dataCSV += "time" + csv + "distance" + csv + "elevation" + csv + "power" + csv + "GCT" + csv + "heartrate" + csv + "StopWalkRun" +
        csv + "delta distance" + csv + "filtered elevation" + csv + "grade" + csv + "down-level-up" + csv + lf;
  dataCSV += "(s)" + csv + "(m)" + csv + "(m)" + csv + "(W)" + csv + "(ms)" + csv + "(bpm)" + csv + "(1/2/3)" +
        csv + "(m)" + csv + "(m)" + csv + "(%)" + csv + "(1/2/3)" + csv + lf;
  for (i = 0; i < iMax ; i++ ) {
    dataCSV += i + csv + runData[i][0] + csv + runData[i][1] + csv + runData[i][2] + csv + runData[i][3] + csv + runData[i][4] + csv;
    dataCSV += calcData[i][0] + csv + calcData[i][1] + csv + calcData[i][2] + csv + calcData[i][4] + csv + calcData[i][5] + csv;
    dataCSV += lf;
  }

  document.getElementById("showData").value = dataCSV;
  console.log( sumData);
}
