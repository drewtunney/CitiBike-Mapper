var currentLocation;

App.directionsDisplay1 = new google.maps.DirectionsRenderer({
  preserveViewport: true,
  suppressMarkers : true,
  polylineOptions : {strokeColor:'yellow', strokeWeight: 5, strokeOpacity: 1},
});

App.directionsDisplay2 = new google.maps.DirectionsRenderer({
  preserveViewport: true,
  suppressMarkers : false,
  suppressBicyclingLayer: true,
  polylineOptions : {strokeColor:'blue', strokeWeight: 5, strokeOpacity: 0.5},
});

App.directionsDisplay3 = new google.maps.DirectionsRenderer({
  preserveViewport: true,
  suppressMarkers : true,
  polylineOptions : {strokeColor:'yellow', strokeWeight: 5, strokeOpacity: 1},
});


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
  var autocompleteBounds = new google.maps.LatLngBounds(
    new google.maps.LatLng(40.7733, -73.9818),
    new google.maps.LatLng(40.6833, -73.9411));

  var autocompleteOptions = {
    bounds: autocompleteBounds
  };

  var startInput = document.getElementById('start');
  var autocompleteStart = new google.maps.places.Autocomplete(startInput, autocompleteOptions);
  var endInput = document.getElementById('end');
  var autocompleteEnd = new google.maps.places.Autocomplete(endInput, autocompleteOptions);

  autocompleteStart.bindTo('bounds', map);
  autocompleteEnd.bindTo('bounds', map);
  
  
  // add event listener to form submission
  $('#get-directions-form').on('submit', function(e){
    $('.adp').remove();
    e.preventDefault();
    App.getDirections();


  // scroll to top of map on submit 
    $('html, body').animate({
        scrollTop: $("#map-canvas").offset().top
      }, 500);
  });

  // set start value to current location
  $('.input-group-addon').on('click', function(){
    $('#start').val("Current Location") 
  })

});

// set bounds on new directions

google.maps.event.addListener(App.directionsDisplay1, 'directions_changed', function() {
  map.setCenter(App.bounds.getCenter(), map.fitBounds(App.bounds));
});

google.maps.event.addListener(App.directionsDisplay2, 'directions_changed', function() {
  map.setCenter(App.bounds.getCenter(), map.fitBounds(App.bounds));
});

google.maps.event.addListener(App.directionsDisplay3, 'directions_changed', function() {
  map.setCenter(App.bounds.getCenter(), map.fitBounds(App.bounds));
});

