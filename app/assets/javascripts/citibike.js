var currentLocation;

App.directionsService  = new google.maps.DirectionsService();
App.bounds = new google.maps.LatLngBounds();


App.directionsDisplay1 = new google.maps.DirectionsRenderer({
  preserveViewport: true,
  suppressBicyclingLayer: true,
  suppressMarkers : true,
  polylineOptions : {strokeColor:'yellow', strokeWeight: 5, strokeOpacity: 1},
});

App.directionsDisplay2 = new google.maps.DirectionsRenderer({
  preserveViewport: true,
  suppressMarkers : true,
  polylineOptions : {strokeColor:'blue', strokeWeight: 5, strokeOpacity: 0.5},
});

App.directionsDisplay3 = new google.maps.DirectionsRenderer({
  preserveViewport: true,
  suppressMarkers : true,
  polylineOptions : {strokeColor:'yellow', strokeWeight: 5, strokeOpacity: 1},
});

// var autocomplete_options = {
//     componentRestrictions: {country: 'us'}
//   };

// var autocomplete_start = new google.maps.places.Autocomplete(document.getElementById("start"), autocomplete_options);

// var autocomplete_end = new google.maps.places.Autocomplete(document.getElementById("end"), autocomplete_options);

// load stations object into window
App.updateStationsInfo = function(){
  $.getJSON('/stations', function(data){ 
    App.stations = data; 
    console.log(App.stations);
  });
};

App.getCurrentLocation = function(){
  if(navigator.geolocation) {
    var pos;
    navigator.geolocation.getCurrentPosition(function(position) {
      var pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
      currentLocation = pos;
      console.log(currentLocation);
      // passing pick up station, current location || not sure where to go from here //
      var station = findPickUpStation(currentLocation["k"], currentLocation["A"]);
      App.setStation(station, "start", currentLocation)
    });
  } else {
    handleNoGeolocation(false);
  }
};

App.getStation = function(address, waypoint) {
  var geocoder = new google.maps.Geocoder();

  if (address === "Current Location"){
    App.getCurrentLocation();

  } else {
    geocoder.geocode({
        'address': address
    }, function (results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          var latitude  = results[0].geometry.location.lat();
          var longitude = results[0].geometry.location.lng();
          
          if (waypoint === "start") {
            var station = findPickUpStation(latitude, longitude);
            App.setStation(station, waypoint);
            // console.log("in start")
          }
          else {
            var station = findDropOffStation(latitude, longitude);
            App.setStation(station, waypoint);

            // console.log("in end")
          }
        } 
        else {
          alert("Geocode was not successful for the following reason: " + status);
        }
    });
  } 
}

App.setStation = function(station, waypoint, currentLocation) {
  App[waypoint + "Station"] = station;
  App.buildDirections(currentLocation);

}


App.buildDirections = function(){
  if (App.startStation && App.endStation) {
    // console.log("Got stations, ready to build...");
    // console.log("current location in build direction ---> " + currentLocation);
    var startStatLatLng = new google.maps.LatLng(App.startStation.latitude, App.startStation.longitude);
    var endStatLatLng   = new google.maps.LatLng(App.endStation.latitude,   App.endStation.longitude);

    App.bounds.extend(startStatLatLng);
    App.bounds.extend(endStatLatLng);

    // console.log("start point = " + App.startPoint);
    // console.log("current location in startLeg --> " + currentLocation),

    // TODO: for current location, App.StartPoint needs to be (longitude, lattitude), not "Current Location"
    var transitType = $('#transit-type').val()

    var startLeg = {
      origin: (currentLocation != undefined ? currentLocation : App.startPoint),
      destination: startStatLatLng,
      travelMode: google.maps.TravelMode.WALKING
    };

    // if the user wants to use driving directions instead of bike paths

    if (transitType == "BICYCLING"){
       var middleLeg = {
        origin: startStatLatLng,
        destination: endStatLatLng,
        travelMode: google.maps.TravelMode.BICYCLING
        }
      }
    else{
      var middleLeg = {
        origin: startStatLatLng,
        destination: endStatLatLng,
        travelMode: google.maps.TravelMode.DRIVING
      };
    }

    var endLeg = {
      origin: endStatLatLng,
      destination: App.endPoint,
      travelMode: google.maps.TravelMode.WALKING
    };
    
    // TODO: Directions Rendering to wrong panel -- First and Second Panels mixed up //

    App.directionsService.route(middleLeg, function(result, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        // Middle Leg of Current Location not working 
        // console.log("directionsService result --> " + console.log(result);
        $('#directions-info1').text("Walk From " + App.startPoint + " to the CitiBike Station at " + App.startStation.stationName);
        $('#station-status1').text("There are " + App.startStation.availableBikes + " bikes available");
        App.directionsDisplay2.setDirections(result);
      }
    });

    App.directionsService.route(startLeg, function(result, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        $('#directions-info2').text("Bike From the " + App.startStation.stationName + " Station to the " + App.endStation.stationName + " Station");
        App.directionsDisplay1.setDirections(result);
      }
    });

    App.directionsService.route(endLeg, function(result, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        $('#directions-info3').text("Walk From " + App.endStation.stationName + " Station to " + App.endPoint);
        $('#station-status3').text("There are " + App.endStation.availableDocks + " docks available");
        App.directionsDisplay3.setDirections(result);
      }
    });
  }
}

App.getDirections = function(){
  // get start and end
  App.startPoint = $('#start').val();
  App.endPoint   = $('#end').val();

  // begin the process of choosing a startStation
  App.getStation(App.startPoint, "start");

  // begin the process of choosing an endStation
  App.getStation(App.endPoint, "end");
}

$(function(){
  // initialize map

  var new_york = new google.maps.LatLng(40.7284186, -73.98713956);
  var styles = [{"featureType":"road","elementType":"geometry","stylers":[{"lightness":100},{"visibility":"simplified"}]},{"featureType":"water","elementType":"geometry","stylers":[{"visibility":"on"},{"color":"#C6E2FF"}]},{"featureType":"poi","elementType":"geometry.fill","stylers":[{"color":"#C5E3BF"}]},{"featureType":"road","elementType":"geometry.fill","stylers":[{"color":"#D1D1B8"}]}];
  var mapOptions = {
    zoom: 13,
    center: new_york,
    styles: styles
  };

  map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
  App.directionsDisplay1.setMap(map);
  App.directionsDisplay2.setMap(map);
  App.directionsDisplay3.setMap(map);
  App.directionsDisplay1.setPanel(document.getElementById("directionsPanel1"));
  App.directionsDisplay2.setPanel(document.getElementById("directionsPanel2"));
  App.directionsDisplay3.setPanel(document.getElementById("directionsPanel3"));
  
  // load Stations
  App.updateStationsInfo();
  window.setInterval(App.updateStationsInfo, 60000);

  // add event listener to form submission
  $('#get-directions-form').on('submit', function(e){
    $('.adp').remove();
    e.preventDefault();
    App.getDirections();
  });

});

// set bounds on new directions

google.maps.event.addListener(App.directionsDisplay1, 'directions_changed', function() {
  map.setCenter(App.bounds.getCenter(), map.fitBounds(App.bounds));
});
google.maps.event.addListener(App.directionsDisplay2, 'directions_changed', function() {
  map.setCenter(App.bounds.getCenter(), map.fitBounds(App.bounds));
  console.log("second event listener")
});

google.maps.event.addListener(App.directionsDisplay3, 'directions_changed', function() {
  map.setCenter(App.bounds.getCenter(), map.fitBounds(App.bounds));
  console.log("third event listener")
});

