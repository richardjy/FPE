---
layout: default
---
<head>
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.6.1/css/font-awesome.min.css">
</head>

## Welcome to Forest Park Explorer

- Click here for [Forest Park Explorer without Strava link](main.html)

- Click below for FPE with Strava link:  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[![Connect with Strava](/images/btn_strava_connectwith_orange.png)](https://www.strava.com/oauth/authorize?client_id=31392&response_type=code&redirect_uri=https://richardjy.github.io/FPE/main.html&approval_prompt=auto&scope=read,activity:read,activity:read_all,activity:write)

- Your activities: [View on Strava](https://www.strava.com/athlete/training){:target="_blank"} (opens a new Tab)


### Strava authorization options

- activity:read: needed by FPE to read activities (and load GPX from your activity)
- activity:read_all: allows FPE to also read your private activities
- activity:write: allows FPE to update activity description (you control updated text)

<br>

## Motivation and History
Forest Park Explorer was inspired by a network map of the Portland, Oregon's [Forest Park trails](https://forestparkconservancy.org/forest-park/) created in Visio® by Rick Kneedler. A large measure of thanks is due to Pete Carleson, who was a passionate advocate for making an electronic version and has made many useful suggestions and identified various bugs and issues during Alpha testing.

A big reason to use FPE is to overcome the 'tree tax' imposed when using a GPS in the park, where the reported GPS distance is too short, often by 10% or more. Distances along the trails in FPE come from the Forest Park Conservancy [Trail Map](https://forestparkconservancy.org/product/trail-map-visitors-guide/) (2016 version) and 'All Trails Challenge' spreadsheet (2018 version). Roads and missing trails were calculated using [www.mappedometer.com](https://www.mappedometer.com/). Some fixes to obvious errors were also made (e.g. the extensions to FL13 are too short as listed on the FPC map, causing GPX-to-routing failures). While not claiming to be perfect, the values should be a better estimate of the actual distance traveled. 

Elevation gain/loss is handled in a simplistic way. The elevation change between the end points of each trail leg is tallied up and displayed. While this misses additional ups and downs within each leg it does give a good impression of the profile for the planned run/walk. Elevation is from USGS [National Map](https://www.usgs.gov/core-science-systems/national-geospatial-program/national-map).

The network of 'nodes' and 'legs' is stored in a ['geoJSON' file](https://gist.github.com/richardjy/9524f0810c1bda554c69f36501cbd92a). The network is a balance between keeping things too simple - and being inaccurate when a trail 'jogs' to the side where it crosses another trail - and having too many nodes - which would mean more clicks to create a route.

### Getting started: Create a route
- Click on the first leg near the starting point. Then add legs by clicking on connected trails. The <i class='fa fa-flag-checkered'></i> shows the end of the trail. Clicking on the trails can be challenging on a tablet/phone depending on the device. 
- Autoroute on same trail by clicking further along the trail (if going in the same direction).
- To remove the last leg use Ctrl-click or the button, see below. Fancier editing is currently not supported.

### Button bar

#### <i class='fa fa-map-o'></i>  Import GPX track or Strava activity
- Strava: Enter Strava activity ID (typically 10 digit number). Alternatively, entering 1 will return your last activity, 2 your second last, etc (up to 999).
- GPX: Open the GPX file in Notepad or similar, then select and copy the text (e.g. on Windows Ctrl-A, Ctrl-C) and paste into the dialog (Ctrl-V). If the file is too large for the field it will be truncated. 

#### <i class='fa fa-map-signs fa-lg'></i>  Create route from GPX track
- Translates the imported GPX activity/trail into a route. As the GPX track will likely not pass exactly through the nodes, the algorithm will therefore look for nodes that are 'close enough' and build the route from these. The summary dialog shows how close the track was to the various nodes, also indicated visually by a blue circle. The dialog shows all the legs that were found - this is in contrast to the summary of the route in the upper right, which combines legs on the same trail into a single entry. Testing has been carried out using GPX tracks from several different GPS watch makes, including Garmin, but feedback will be appreciated on nodes or tracks that are not reliably matching.
- Includes option to update the Strava activity description with FPE calculated distance. Thanks to Pete for the FPE emoji combo: 🌲📏.
- If the route does not match the network then additional 'Extra' legs will be added. This might be due to Extra distance at the start or end of the section in Forest Park. Extra-O&B is an out-and-back on a trail, whilst Extra-Skip means that the route seems to have gone to an unexpected node - perhaps due to a shortcut or different routing on roads or other trails.
- If your activity is outside FP then it will of course fail, perhaps ungracefully.

#### <i class='fa fa-download fa-lg'></i>  Export GPX of current route
- Converts the current route into a GPX file. This uses the Mapbox [Directions API](https://docs.mapbox.com/help/glossary/directions-api/). At the moment, routes of up to 75-80 legs are possible. To force proper routing extra mid-points have been added to some trails, especially for Wildwood where shortcuts via other trails are possible on many of the legs. If you find any routes where an incorrect shortcut is taken, please send a message or submit an issue on GitHub. Note - FPE only gets so many free Direction API calls per month so don't go too crazy with the routing feature and spoil it for other users...
- Exported tracks are shown in a lighter blue than imported tracks.

#### <i class='fa fa-refresh fa-lg'></i>  Reset to default
- Removes the current route and tidies up. Does not change any of the map or layer options - to reset those refresh the web page.

#### <i class='fa fa-undo fa-lg'></i>  Remove last leg
- Removes last leg from route (same as Ctrl-click).

### Layer control
- Select between different background maps.
- Select which overlays to show - most are self-explanatory. 'Keep GPX' determines whether to clear (default) or keep any existing GPX tracks when a new GPX is either imported or exported.

### Technology
FPE is based on [Leaflet](https://leafletjs.com/), an open-source library for interactive maps. Various additional Leaflet plugins and javascript libraries are used, details of which can be seen in the source code. Many thanks for those who contribute and make their work available for others to build upon. Project and web pages hosted on GitHub ([issues list](https://github.com/richardjy/FPE/issues)).

<br>
© Richard Young 2020.

<br>
<img src="images/api_logo_cptblWith_strava_stack_light.png" alt="Compatible with Strava" width="120">
