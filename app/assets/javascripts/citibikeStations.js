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
        else if ($('#start').val() == '') {
          alert("Enter a starting point!");
        }
        else {
          alert("Enter a destination");
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

function getDistance(lat1,lng1,lat2,lng2) {
  var i = lat1 - lat2;
  var j = lng1 - lng2;
    return i*i + j*j;
};

function findPickUpStation(lat,lng) {
  var min_distance = 99999;
  var closest_station_id;
  $.each(App.stations.stationBeanList, function(i, station) {
    var distance = getDistance(lat,lng, station.latitude, station.longitude);
    // set bike count to be greater than 2, can change / maybe user chooses
    if (distance < min_distance && station.availableBikes > 2 && station.statusValue == "In Service") {
      min_distance = distance;
      closest_station_id = i;
    }
  });
  return App.stations.stationBeanList[closest_station_id];
}

function findDropOffStation(lat,lng) {
  var min_distance = 99999;
  var closest_station_id;
  $.each(App.stations.stationBeanList, function(i, station) {
    var distance = getDistance(lat,lng, station.latitude, station.longitude);
    if (distance < min_distance && station.availableDocks > 2 && station.statusValue == "In Service") {
      min_distance = distance;
      closest_station_id = i;
    }
  });
  return App.stations.stationBeanList[closest_station_id];
}

App.setStation = function(station, waypoint, currentLocation) {
  App[waypoint + "Station"] = station;
  App.buildDirections(currentLocation);

}

// set directions Service and Bounds
App.directionsService  = new google.maps.DirectionsService();

App.buildDirections = function(){
  if (App.startStation && App.endStation) {

    var startStatLatLng = new google.maps.LatLng(App.startStation.latitude, App.startStation.longitude);
    var endStatLatLng   = new google.maps.LatLng(App.endStation.latitude,   App.endStation.longitude);

    App.bounds = new google.maps.LatLngBounds();

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

