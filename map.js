const blessed = require('blessed'),
	contrib = require('blessed-contrib'),
	screen = blessed.screen(),
	NginxParser = require('nginxparser'),
	request = require('request'),
	UAparser = require('ua-parser-js');

var limit = 100;
var grid = new contrib.grid({rows: 12, cols: 12, screen: screen})

//grid.set(row, col, rowSpan, colSpan, obj, opts)
var map = grid.set(0, 0, 12, 10, contrib.map, {label: 'Latest ' + limit + ' visitors'})
var countryLog = grid.set(0, 10, 5, 2, contrib.log, { fg: "green", label: 'Country', height: "20%", tags: true, border: { type: "line", fg: "cyan"}});
var browserLog = grid.set(5, 10, 3, 2, contrib.log, { fg: "green", label: 'Browser', height: "20%", tags: true, border: { type: "line", fg: "cyan"}});
var opereatigSystemLog = grid.set(8, 10, 4, 2, contrib.log, { fg: "green", label: 'Operating System', height: "20%", tags: true, border: { type: "line", fg: "cyan"}});
screen.render();


var markers = [];

var createMarker = function(lon, lat) {
	if (markers.length > limit) {
		markers.shift();
	}

	markers.push({"lon" : lon, "lat" : lat, color: "red", char: "." });
}

var parser = new NginxParser('$remote_addr - $remote_user [$time_local] '
+ '"$request" $status $body_bytes_sent "$http_referer" "$http_user_agent"');


parser.tail('/projects/blessed-contrib/examples/nginx.log', function (row) {
	var uaParser = new UAparser(row.http_user_agent);
	var browser = uaParser.getBrowser();
    if (browser.name) {
        if (browser.version) {
            browser.name += ' (' + browser.version + ')';
        }
		browserLog.log(browser.name);
	} else {
		browserLog.log('Unknow Browser');
	}

	var os = uaParser.getOS();
	if (os.name) {
        if (os.version) {
            os.name += ' (' + os.version + ')';
        }

		opereatigSystemLog.log(os.name);
	} else {
		opereatigSystemLog.log('Uknown OS');
	}

	// browserLog.log(ua.getBrowser().name);
	request.get('http://freegeoip.net/json/' + row.ip_str, function(error, response, body) {
		body = JSON.parse(body);
		countryLog.log(body.country_name  + ' (' + (body.region_name ? body.region_name : 'unknown') + ')');
		createMarker(body.longitude, body.latitude);
	});
});

var addMarkers = function() {
	map.clearMarkers();
	screen.render();
	setTimeout(function() {
		for (var i = 0; i < markers.length; i++) {
			var marker = markers[i];
			if (marker) {
				map.addMarker(marker);
			}
		}
		screen.render();
	}, 500);
}


setInterval(function() {
	addMarkers();
}, 3000);
