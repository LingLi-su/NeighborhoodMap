var map;
//Foursquare ID
var clientID;
var clientSecret;
clientID = "JKUQEIW15EO0FBNNT0CSIQAIQGVEQ3QHHGIPFDKJJ5HS0JFT";
clientSecret = "UQJGGIZ51VGNNPPSJEDPY5BMLJXHGPCH1YH5AP41BN5ECXJ3";
// Locations
var countryLocations = [{
	country: 'Osaka, Japan',
	lat: 34.693738,
	lng: 135.502165
}, {
	country: 'Seoul, Korea',
	lat: 37.566535,
	lng: 126.977969
}, {
	country: 'Beijing, China',
	lat: 39.987265,
	lng: 116.305776
}, {
	country: 'Bangkok, Thailand',
	lat: 13.715539,
	lng: 100.513144
}, {
	country: 'Taipei, Taiwan',
	lat: 25.0329694,
	lng: 121.565417
}];

function viewModel() {
	var self = this;
	this.list = ko.observableArray([]);
	this.keyWord = ko.observable("");
	map = new google.maps.Map(document.getElementById('map'), {
		center: {
			lat: 35.86166,
			lng: 104.195397
		},
		zoom: 4
	});
	// filter the locations
	this.filterCountry = ko.computed(function() {
		var filter = self.keyWord().toLowerCase();
		if (!filter) {
			self.list().forEach(function(countryList) {
				countryList.visible(true);
			});
			return self.list();
		} else {
			return ko.utils.arrayFilter(self.list(), function(countryList) {
				var input = countryList.country.toLowerCase();
				var output = (input.indexOf(filter) >= 0);
				countryList.visible(output);
				return output;
			});
		}
	}, self);
	countryLocations.forEach(function(countryList) {
		self.list.push(new Location(countryList));
	});
}
var Location = function(data) {
	var self = this;
	var defaultIcon = makeMarkerIcon('ff0000');
	var highlightedIcon = makeMarkerIcon('3333ff');
	this.country = data.country;
	this.lat = data.lat;
	this.lng = data.lng;
	this.visible = ko.observable(true);
	// foursquare api request for address
	var fourSquareURL = 'https://api.foursquare.com/v2/venues/search?ll=' + this.lat + ',' + this.lng + '&client_id=' + clientID + '&client_secret=' + clientSecret + '&v=20161016' + '&query=' + this.country;
	$.getJSON(fourSquareURL).done(function(data) {
		var output = data.response.venues[0];
		self.street = output.location.formattedAddress[0];
		if (typeof self.street === 'undefined') {
			self.street = "";
		}
		self.city = output.location.formattedAddress[1];
		if (typeof self.city === 'undefined') {
			self.city = "";
		}
		// foursquare api request for photos
		self.id = output.id;
		var fourSquarePic = 'https://api.foursquare.com/v2/venues/' + self.id + '/photos' + '?client_id=' + clientID + '&client_secret=' + clientSecret + '&v=20161016';
		$.getJSON(fourSquarePic).done(function(data) {
			var output = data.response.photos.items[0];
			self.img = output.prefix + '100x100' + output.suffix;
		});
	}).fail(function() {
		alert("Foursquare API call error. Come back Later!");
	});
	// resize map
	google.maps.event.addDomListener(window, "resize", function() {
		var center = map.getCenter();
		google.maps.event.trigger(map, "resize");
		map.setCenter(center);
	});
	// markers location
	this.marker = new google.maps.Marker({
		position: new google.maps.LatLng(data.lat, data.lng),
		map: map,
		animation: google.maps.Animation.DROP,
		title: data.country,
		icon: defaultIcon
	});
	this.selectMarker = ko.computed(function() {
		if (this.visible() === true) {
			this.marker.setMap(map);
		} else {
			this.marker.setMap(null);
		}
		return true;
	}, this);
	// infowindow opens when click
	this.marker.addListener('click', function() {
		self.countryName = '<div class="content"><div class="title"><b>' + data.country + "</b></div>" + '<div class="content">' + self.street + "</div>" + '<div class="content">' + self.city + "</div>" + '<div class="content">' + '<img src="' + self.img + '">' + "</div>";
		self.infoWindow = new google.maps.InfoWindow({
			content: self.countryName
		});
		map.setZoom(5);
		map.panTo(self.marker.getPosition());
		self.infoWindow.open(map, this);
		self.marker.setAnimation(google.maps.Animation.BOUNCE);
		setTimeout(function() {
			self.marker.setAnimation(null);
		}, 2150);
	});
	// marker icon change when mouse over/mouse out
	this.marker.addListener('mouseover', function() {
		this.setIcon(highlightedIcon);
	});
	this.marker.addListener('mouseout', function() {
		this.setIcon(defaultIcon);
	});
	// marker bounce when click
	this.bounce = function(place) {
		google.maps.event.trigger(self.marker, 'click');
	};
};

function makeMarkerIcon(markerColor) {
	var markerImage = new google.maps.MarkerImage('http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor + '|40|_|%E2%80%A2', new google.maps.Size(21, 34), new google.maps.Point(0, 0), new google.maps.Point(10, 34), new google.maps.Size(21, 34));
	return markerImage;
}

function viewStart() {
	ko.applyBindings(new viewModel());
}

function error() {
	alert("Oops, Come Back Later!");
}

