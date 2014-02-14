'use strict';

var vars = require('./vars');


///////////////////////// HTTP Status Codes /////////////////////////

var HTTP_OK = 200;
var HTTP_CREATED = 201;
var HTTP_NOT_FOUND = 404;


///////////////////////// REST Verbs /////////////////////////

// GET the anatomy list for the 24 tile example

exports.getExampleData = function (req, res) {
	res.status(HTTP_OK).sendfile(vars.serverDir + '/example-data.json');
};
