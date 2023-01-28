// add header (c) Richard Young 2021

// three kinds of map see https://leaflet-extras.github.io/leaflet-providers/preview/
var MapboxMap = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
  maxZoom: 18,
  attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> ' +
    ' <strong><a href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a></strong>',
  id: 'outdoors-v11',
  accessToken: config.mapBoxKey
});
var MapboxSat = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
  maxZoom: 18,
  attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> ' +
    ' <strong><a href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a></strong>',
  id: 'satellite-streets-v11',
  accessToken: config.mapBoxKey
});
// old ID: id: 'streets-v11',
// satellite-streets-v11
// attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
// 	'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
// 	'Imagery &copy; <a href="http://mapbox.com">Mapbox</a>',

var OpenTopoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  maxZoom: 17,
  attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

var OpenStreetMap_Mapnik = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

var CartoDB_PositronNoLabels = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
	subdomains: 'abcd',
	maxZoom: 19
});

var CartoDB_DarkMatterNoLabels = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
	subdomains: 'abcd',
	maxZoom: 19
});

var USGS_USTopo = L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}', {
	maxZoom: 20,
	attribution: 'Tiles courtesy of the <a href="https://usgs.gov/">U.S. Geological Survey</a>'
});

// var Thunderforest_Outdoors = L.tileLayer('https://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey={apikey}', {
// 	attribution: '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
// 	apikey: '<your apikey>',
// 	maxZoom: 22
// });
//
// var Thunderforest_Landscape = L.tileLayer('https://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey={apikey}', {
// 	attribution: '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
// 	apikey: '<your apikey>',
// 	maxZoom: 22
// });
//
// var HikeBike_HikeBike = L.tileLayer('https://tiles.wmflabs.org/hikebike/{z}/{x}/{y}.png', {
// 	maxZoom: 19,
// 	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
// });

//var = googleSat = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{
//	maxZoom: 20,
//	subdomains:['mt0','mt1','mt2','mt3']
//});

// maxZoom 19 is standard - set to 22 to allow editing of GPX at high zoom
var BlankMap = L.tileLayer('', {
  maxZoom: 22
});

// Overlays

// STRAVA: colors: hot, blue, redblue, purple,
// https://heatmap-external-{switch:a,b,c}.strava.com/tiles-auth/ride/hot/{zoom}/{x}/{y}.png?px=256
// old https://heatmap-external-{switch:a,b,c}.strava.com/tiles-auth/run/purple/{z}/{x}/{y}.png
var stravaHeatmap = L.tileLayer('https://heatmap-external-c.strava.com/tiles-auth/run/purple/{zoom}/{x}/{y}.png?px=256', {
  maxZoom: 20,
  maxNativeZoom: 15,
  attribution: '&copy; <a href="https://www.strava.com" target="_blank">Strava</a>'
});

// switch off error tracking for now - issues in some areas, such as hamilton mtn
// stravaHeatmap.on('tileerror', function(error, tile) {
//   //console.log(error);
//   //stravaHeatmap.remove();
//   if (window.confirm("Error loading Heatmap - likely need to login to Strata Heatmap from your account." +
//           "\nClick 'OK' to open 'https://www.strava.com/heatmap'.\nThen login.\nMay also need to change Browser cookie flag.")) {
//     window.open("https://www.strava.com/heatmap");
//   }
//   //may need to change browser settings: edge://flags/ #same-site-by-default-cookies
// });


var WaymarkedTrails_hiking = L.tileLayer('https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png', {
	maxZoom: 18,
	attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Map style: &copy; <a href="https://waymarkedtrails.org">waymarkedtrails.org</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

var baseLayers = {
  "Mapbox": MapboxMap,
  "Mapbox Sat": MapboxSat,
  "Mapnik": OpenStreetMap_Mapnik,
  "Topo": OpenTopoMap,
  "USGS US Topo" : USGS_USTopo,
  //"Positron": CartoDB_PositronNoLabels,
  "Dark Matter": CartoDB_DarkMatterNoLabels,
  "Blank": BlankMap
};
