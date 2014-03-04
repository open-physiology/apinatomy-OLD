'use strict';

///////////////////////// Includes /////////////////////////

var vars = require('./vars');
var express = require('express');
var app = express();

///////////////////////// General Middleware /////////////////////////

//app.use(express.logger());
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());

///////////////////////// API /////////////////////////

app.use(app.router);

var api = require('./api');

app.get('/resources/ExampleData', api.getExampleData);


//// testing the MongoDB-connected API

app.get('/resources/structures/:uris', api.getStructure);

// TODO: API

///////////////////////// Special Exceptions /////////////////////////

//// The bootstrap glyphicons need special treatment:

app.get('/bootstrap/glyphicons-halflings-regular.*', function (req, res) {
	res.redirect('/lib/bootstrap-sass-official/vendor/assets/fonts/' + req.path);
});

app.get('/require.js', function (req, res) {
	res.redirect('/lib/requirejs/require.js');
});

///////////////////////// Client-side Routes /////////////////////////

// TODO: Specify 'get' directives to route each to index.html

//function serveIndex(req, res, next) {
//	req.url = '/';
//	next();
//}

///////////////////////// Client-side Static Files /////////////////////////

app.use(express.static(vars.clientDir));

///////////////////////// Listen on the port /////////////////////////

app.listen(process.argv[2] || vars.port);
