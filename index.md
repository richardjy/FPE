---
layout: default
---
<head>
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.6.1/css/font-awesome.min.css">
  <link rel="shortcut icon" type="image/png" href="{{ site.baseurl }}/favicon.png">
</head>

## Welcome to Forest Park Explorer

- Click here for [Forest Park Explorer without Strava link](main.html)

- Click below for FPE with Strava link:  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[![Connect with Strava](/images/btn_strava_connectwith_orange.png)](https://www.strava.com/oauth/authorize?client_id=31392&response_type=code&redirect_uri=https://richardjy.github.io/FPE/main.html&approval_prompt=auto&scope=read,activity:read,activity:read_all,activity:write)

- Your activities: [View on Strava](https://www.strava.com/athlete/training){:target="_blank"} (opens a new Tab)

<br>

### Strava Authorization Options

- activity:read: needed by FPE to read activities (and load GPX from your activity)
- activity:read_all: allows FPE to also read your private activites
- activity:write: allows FPE to update activity description (you control updated text)

### Motivation and History (Draft text below)
Forest Park Explorer was inspired by a network map of the Forest Park trails created in Visio™ by Rick Kneedler. A large measure of thanks is due to Pete Carleson, who was a passionate advocate for making an electronic version and has made many useful suggestions and identified various bugs and issues during Alpha testing. 

A big reason to use FPE is to overcome the 'tree tax' imposed when using a GPS in the park, reducing the actual distance covered by often 10% or more. Distances along the trails within the park come from the Forest Park Conservancy map (2016 version) and FPC 'All Trails Challenge' spreadsheet (2018 version). Roads and missing trails were calculated using [www.mappedometer.com](https://www.mappedometer.com/). Some fixes to obvious errors were also made (e.g. extensions to FL13 are too short as listed on the FPC  map, causing GPX to routing failures). 

Elevation gain/loss is handled in a simplistic way. The elevation change between the end points of each trail leg is tallied up and displayed. While this misses additional ups and downs within each leg it does give a good impression of the profile for the planned run/walk. Elevation is from USGS [National Map](https://www.usgs.gov/core-science-systems/national-geospatial-program/national-map).

The network of 'nodes' and 'legs' is stored in a ['geojson' file](https://gist.github.com/richardjy/9524f0810c1bda554c69f36501cbd92a). The network is a balance between keeping the network very simple (and being inaccurate when trails 'jog' to the side when they cross another trail) and having too many nodes (which would mean more clicks to create a route).

### Getting started: Create a Route
-Click first leg near starting point. Then add legs by clicking on connected trails
-It is posisble to Autoroute on same trail by clicking further along the trail
-To remove the last leg use Ctrl-click or the button, see below

### Button bar

#### <i class='fa fa-map-o'></i>  Import GPX track or Strava Activity
#### <i class='fa fa-map-signs fa-lg'></i>  Create route from GPX track
#### <i class='fa fa-download fa-lg'></i>  Export GPX of current route (max ~75-80 legs)
#### <i class='fa fa-refresh fa-lg'></i>  Reset to default
#### <i class='fa fa-undo fa-lg'></i>  Remove last leg (Ctrl-click on line)


<br>
© Richard Young 2020.

<br>
<img src="images/api_logo_cptblWith_strava_stack_light.png" alt="Compatible with Strava" width="120">
