// find latlng from GPX - otherwise values of lat lng reversed!
// assumes that gpdindex is valid
function getGPXlatlng(gpxJSON, gpxindex) {
  var gpxLat = gpxJSON.geometry.coordinates[gpxindex][1];
  var gpxLng = gpxJSON.geometry.coordinates[gpxindex][0];
  var gpxlatlng = [ gpxLat, gpxLng ];
  return gpxlatlng;
};

function getptname(ptindex) {
  // find name of end point
  //geojsondata has all points whether or not displayed
  var ptname = '';
  geojsondata.eachLayer(function (layer) {
    // Check if layer is a marker
    if (layer instanceof L.Marker && layer.hasOwnProperty('feature') ) {
      // set name of end point
      if (layer.feature.properties.index == ptindex) {
        ptname = layer.feature.properties.label;
      }
    }
  });
  //window.prompt('ptname ' + ptname);
  return ptname;
};

function getptlatlng(ptindex) {
  //geojsondata has all points whether or not displayed
  var ptlatlng = L.latLng();  // define type - returns lat lng alt
  geojsondata.eachLayer(function (layer) {
    // Check if layer is a marker
    if (layer instanceof L.Marker && layer.hasOwnProperty('feature') ) {
      // set name of end point
      if (layer.feature.properties.index == ptindex) {
        ptlatlng = layer.getLatLng();
      }
    }
  });
  return ptlatlng;
};

function gettraillatlng(trailindex, traillabel, dirSF) {
  // Iterate the layers of the map - only lines - uses "trails"
  // check both index and name (in case of trails sharing same nodes)
  var trailline = ([]);
   trails.eachLayer(function (layer) {
     // find correct line (check for index and name)
     if (layer instanceof L.Polyline && layer.feature.properties.index == trailindex && layer.feature.properties.label == traillabel) {
       trailline = layer.feature.geometry.coordinates;
       console.log(layer.feature.geometry.coordinates);
     }
   });
  //console.log(trailindex, traillabel, trailline);
  return trailline;
  //return 1;
};

function getRouteData(rindex, rlabel) {
  var rLayer;
  trails.eachLayer(function (layer) {
    // Check if layer is line with correct index and label
    if (layer instanceof L.Polyline && layer.feature.properties.label == rlabel && layer.feature.properties.index == rindex) {
      rLayer = layer;
    }
  });
  return rLayer;
};

function distP2P(pt1, pt2) { // return value in meters - add generic gpx
  var ptA = L.latLng();  // initialize returns lat lng alt
  var ptB = L.latLng();  // initialize returns lat lng alt
  var distm = -1.0; //set default - indicates error
  if (pt2 > pt1) {
    distm = 0;
    ptA = getGPXlatlng(gpxPoints, pt1);
    for (var i = pt1 + 1; i <=pt2; i++) {
      ptB = getGPXlatlng(gpxPoints, i);
      distm += mymap.distance(ptA, ptB);
      ptA = ptB;
    }
  }
  return distm; // return value in meters
};

function ptAtDist(pt1, dist) { //- add generic gpx
  // find pt that is dist meters further on (or back if distance negative)
  // unless reach start or end - return at least one pt further on
  var maxPt = gpxPoints.geometry.coordinates.length - 1;
  var ptA = getGPXlatlng(gpxPoints, pt1);
  var ptB = L.latLng();  // initialize returns lat lng alt
  var pt = pt1;
  // if (pt >= maxPt) { // make sure not too large
  // 	pt = maxPt-1;
  // }
  //console.log(pt);
  var distm = 0.0; // starting point
  if (dist > 0){
    do {
      pt++;
      ptB = getGPXlatlng(gpxPoints, pt);
      distm += mymap.distance(ptA, ptB);
      ptA = ptB;
    } while (distm < dist && pt < maxPt);
  }	else { // search backwards
    do {
      pt--;
      ptB = getGPXlatlng(gpxPoints, pt);
      distm += mymap.distance(ptA, ptB);
      ptA = ptB;
    } while (distm < (-dist) && pt > 0);
  }
  return pt;
};
