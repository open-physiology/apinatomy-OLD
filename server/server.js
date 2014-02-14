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

// TODO: API


///////////////////////// Static /////////////////////////

// require.js gets special treatment, so we don't need to
// specify the full paths in the main html file

app.get('/require.js', function (req, res) {
	res.redirect('/lib/requirejs/require.js');
});

// the bootstrap glyphicons need special treatment too

app.get('/bootstrap/glyphicons-halflings-regular.*', function (req, res) {
	res.redirect('/lib/bootstrap-sass-official/vendor/assets/fonts/' + req.path);
});

app.get('/require.js', function (req, res) {
	res.redirect('/lib/requirejs/require.js');
});

// Just serve '/' if any client-side route is requested

function serveIndex(req, res, next) {
	req.url = '/';
	next();
}
// TODO: 'get' directives to route client-side routes to index.html


// Serve static content from the client directory

app.use(express.static(vars.clientDir));



///////////////////////// Listen on the port /////////////////////////

app.listen(vars.port);
