'use strict';

var vars = require('./vars');
var _ = require('lodash');

///////////////////////// HTTP Status Codes /////////////////////////

var HTTP_OK = 200;
var HTTP_CREATED = 201;
var HTTP_NOT_FOUND = 404;


///////////////////////// REST Verbs /////////////////////////

//// GET the anatomy list for the 24 tile example

exports.getExampleData = function (req, res) {
	res.status(HTTP_OK).sendfile(vars.serverDir + '/example-data.json');
};


///////////////////////// MongoDB-connected API /////////////////////////

var db = require("mongojs").connect('apinatomy', ['structures', 'relationships']);

exports.getStructure = function (req, res) {
	db.structures.find({ uri: { $in: req.params.uris.split(',') } }, function (err, structures) {
		if (err) { throw err; }


		db.relationships.find({ 1: { $in: _(structures).pluck('uri').value() } }, function (err, relationships) {
			if (err) { throw err; }


			//// add the uris of the children

			_(structures).each(function (structure) {
				structure.children = _(relationships)
						.where({ 1: structure.uri })
						.map(function (rel) { return { uri: rel[2] }; })
						.value();
			});


			//// send the structures with the response

			console.log(req.params.uris + "  -  " + _(structures).size());

			res.status(HTTP_OK).json(structures);
		});
	});
};
