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

// load stations object into window
App.updateStationsInfo = function(){
  $.getJSON('/stations', function(data){ 
    App.stations = data; 
    console.log(App.stations);
  });
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
          }
          else {
            var station = findDropOffStation(latitude, longitude);
            App.setStation(station, waypoint);
          }
        } 
        else {
          alert("Enter a destination!");
        }
    });
  } 
}

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

App.setStation = function(station, waypoint, currentLocation) {
  App[waypoint + "Station"] = station;
  App.buildDirections(currentLocation);

}

App.buildDirections = function(){
  if (App.startStation && App.endStation) {
    // console.log("current location in build direction ---> " + currentLocation);
    var startStatLatLng = new google.maps.LatLng(App.startStation.latitude, App.startStation.longitude);
    var endStatLatLng   = new google.maps.LatLng(App.endStation.latitude,   App.endStation.longitude);

    App.bounds.extend(startStatLatLng);
    App.bounds.extend(endStatLatLng);

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

    App.directionsService.route(middleLeg, function(result, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        $('#directions-info1').text("Walk to " + App.startStation.stationName);
        $('#station-status1').text(App.startStation.availableBikes + " available bikes");
        App.directionsDisplay2.setDirections(result);
      }
    });

    App.directionsService.route(startLeg, function(result, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        $('#directions-info2').text("Bike to " + App.endStation.stationName);
        App.directionsDisplay1.setDirections(result);
      }
    });

    App.directionsService.route(endLeg, function(result, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        $('#directions-info3').text("Walk to " + App.endPoint);
        $('#station-status3').text(App.endStation.availableDocks + " available docks");
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

  var newYork = new google.maps.LatLng(40.7284186, -73.98713956);
  var styles = [{"featureType":"road","elementType":"geometry","stylers":[{"lightness":100},{"visibility":"simplified"}]},{"featureType":"water","elementType":"geometry","stylers":[{"visibility":"on"},{"color":"#C6E2FF"}]},{"featureType":"poi","elementType":"geometry.fill","stylers":[{"color":"#C5E3BF"}]},{"featureType":"road","elementType":"geometry.fill","stylers":[{"color":"#D1D1B8"}]}];
  var mapOptions = {
    zoom: 13,
    center: newYork,
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

  // autocomplete defined and instantiated
  var lincolnSquareNYC = new google.maps.LatLng(40.7733, -73.9818);
  var bedStuyBrooklyn = new google.maps.LatLng(40.6833, -73.9411);
  var citiBikeStationBounds = new google.maps.LatLngBounds(lincolnSquareNYC, bedStuyBrooklyn);

  var autocompleteOptions = {
    bounds: citiBikeStationBounds,
    componentRestrictions: {country: 'us'}
  };

  var startInput = document.getElementById('start');
  var autocompleteStart = new google.maps.places.Autocomplete(startInput, autocompleteOptions);
  var endInput = document.getElementById('end');
  var autocompleteEnd = new google.maps.places.Autocomplete(endInput, autocompleteOptions);
  
  // add event listener to form submission
  $('#get-directions-form').on('submit', function(e){
    $('.adp').remove();
    e.preventDefault();
    App.getDirections();

    $('html, body').animate({
        scrollTop: $("#map-canvas").offset().top
      }, 500);

    // $('#map-container').css({'display':'inline'});
  });

  $('.input-group-addon').on('click', function(){
    console.log("clicked")
    $('#start').val("Current Location") 
  })

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

