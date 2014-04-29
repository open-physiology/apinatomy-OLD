'use strict';

////////////////////////////////////////////////////////////////////////////////
///////////////////////// Includes /////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var _ = require('lodash');
var vars = require('./vars');
var db = require('./db');
var express = require('express');

var app = express();


////////////////////////////////////////////////////////////////////////////////
///////////////////////// HTTP Status Codes ////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var HTTP_OK = 200;
var HTTP_CREATED = 201;
var HTTP_NO_CONTENT = 204;
var HTTP_BAD_REQUEST = 400;
var HTTP_NOT_FOUND = 404;
var HTTP_INTERNAL_SERVER_ERROR = 500;


////////////////////////////////////////////////////////////////////////////////
///////////////////////// General Middleware ///////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

app.use(express.logger());
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);


////////////////////////////////////////////////////////////////////////////////
///////////////////////// API //////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

////////////////////  //  //  /  /  /
///// Entities ////  //  //  /  /  /
//////////////////  //  //  /  /  /


//// GET count of entities

app.get('/resources/entities/count', function (req, res) {
	db.Entity.count({}, function (err, count) {
		if (err) {
			console.log(err);
			res.status(HTTP_INTERNAL_SERVER_ERROR).json(err);
			return;
		}
		res.status(HTTP_OK).json({ count: count });
	});
});


//// GET specific set of entities

app.get('/resources/entities/:ids', function (req, res) {
	var ids = req.params.ids.split(',');
	var skip = req.query.skip || 0;
	var limit = req.query.limit || Infinity;
	db.Entity.find()
			.where('_id').in(ids)
			.sort({ '_id': 1 })
			.skip(skip)
			.limit(limit)
			.populate('proteins')
			.populate('sub.entity', '_id')
			.exec(function (err, ents) {
				if (err) {
					console.log(err);
					res.status(HTTP_INTERNAL_SERVER_ERROR).send(null);
					return;
				}

				console.log(ents);

				res.status(HTTP_OK).json(ents);
			});
});


//// GET all entities

app.get('/resources/entities', function (req, res) {
	var skip = req.query.skip || 0;
	var limit = req.query.limit || Infinity;
	db.Entity.find()
			.sort({ '_id': 1 })
			.skip(skip)
			.limit(limit)
			.populate('proteins')
			.populate('sub.entity', '_id')
			.exec(function (err, ents) {
				if (err) {
					console.log(err);
					res.status(HTTP_INTERNAL_SERVER_ERROR).send(null);
				}
				res.status(HTTP_OK).json(ents);
			});
});


//// POST new entity

app.post('/resources/entities', function (req, res) {
	if (_(req.body._id).isUndefined()) {
		res.status(HTTP_BAD_REQUEST).send(null);
		return;
	}

	var newEntity = new db.Entity(_.pick(req.body, ['name', 'description']));

	newEntity.save(function (err, entity) {
		if (err) {
			console.log(err);
			res.status(HTTP_INTERNAL_SERVER_ERROR).json(err);
			return;
		}
		res.status(HTTP_CREATED).json(entity);
	});
});


//// PUT edit of existing entity

app.put('/resources/entities/:id', function (req, res) {
	db.Entity.findById(req.params.id, function (err, entity) {
		if (err) {
			res.status(HTTP_NOT_FOUND).json(err);
			return;
		}

		_.assign(entity, _.pick(req.body, ['name', 'description']));

		entity.save(function (err) {
			if (err) {
				console.log(err);
				res.status(HTTP_INTERNAL_SERVER_ERROR).json(err);
				return;
			}
			res.status(HTTP_OK).json(entity);
		});

	});
});


///////////////////////  //  //  /  /  /
///// Connections ////  //  //  /  /  /
/////////////////////  //  //  /  /  /


//// GET count of connections

app.get('/resources/connections/count', function (req, res) {
	db.Connection.count({}, function (err, count) {
		if (err) {
			console.log(err);
			res.status(HTTP_INTERNAL_SERVER_ERROR).json(err);
			return;
		}
		res.status(HTTP_OK).send(count);
	});
});


//// GET specific set of connections

// TODO: inner vs outer set (this is inner)
app.get('/resources/connections/:ids', function (req, res) {
	var ids = req.params.ids.split(',');
	var skip = req.query.skip || 0;
	var limit = req.query.limit || Infinity;
	db.Connection.find()
			.where('from').in(ids)
			.where('to').in(ids)
			.skip(skip)
			.limit(limit)
			.exec(function (err, conns) {
				if (err) {
					console.log(err);
					res.status(HTTP_INTERNAL_SERVER_ERROR).send(null);
					return;
				}
				res.status(HTTP_OK).json(conns);
			});
});


//// GET all connections

app.get('/resources/connections', function (req, res) {
	var skip = req.query.skip || 0;
	var limit = req.query.limit || Infinity;
	db.Connection.find()
			.skip(skip)
			.limit(limit)
			.exec(function (err, conns) {
				if (err) {
					console.log(err);
					res.status(HTTP_INTERNAL_SERVER_ERROR).send(null);
					return;
				}
				res.status(HTTP_OK).json(conns);
			});
});


/////////////////  //  //  /  /  /
///// Paths ////  //  //  /  /  /
///////////////  //  //  /  /  /

// paths are sequences of connections that start and end at fma entities

//// GET all paths

app.get('/resources/paths', function (req, res) {
	var skip = req.query.skip || 0;
	var limit = req.query.limit || Infinity;
	db.Path.find()
			.skip(skip)
			.limit(limit)
			.exec(function (err, paths) {
				if (err) {
					console.log(err);
					res.status(HTTP_INTERNAL_SERVER_ERROR).send(null);
					return;
				}
				res.status(HTTP_OK).json(paths);
			});
});

//// GET specific set of paths

// TODO: inner vs outer set (this is inner)
app.get('/resources/paths/:ids', function (req, res) {
	var ids = req.params.ids.split(',');
	var skip = req.query.skip || 0;
	var limit = req.query.limit || Infinity;
	db.Path.find()
			.where('from').in(ids)
			.where('to').in(ids)
			.skip(skip)
			.limit(limit)
			.exec(function (err, paths) {
				if (err) {
					console.log(err);
					res.status(HTTP_INTERNAL_SERVER_ERROR).send(null);
					return;
				}
				res.status(HTTP_OK).json(paths);
			});
});


////////////////////////////////////////////////////////////////////////////////
///////////////////////// Special Exceptions ///////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

//// The bootstrap glyphicons need special treatment:

app.get('/bootstrap/glyphicons-halflings-regular.*', function (req, res) {
	res.redirect('/lib/bootstrap-sass-official/vendor/assets/fonts/' + req.path);
});

app.get('/require.js', function (req, res) {
	res.redirect('/lib/requirejs/require.js');
});


////////////////////////////////////////////////////////////////////////////////
///////////////////////// Client-side Routes ///////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// TODO: Specify 'get' directives to route each to index.html

//function serveIndex(req, res, next) {
//	req.url = '/';
//	next();
//}


////////////////////////////////////////////////////////////////////////////////
///////////////////////// Client-side Static Files /////////////////////////////
////////////////////////////////////////////////////////////////////////////////

app.use(express.static(vars.clientDir));


////////////////////////////////////////////////////////////////////////////////
///////////////////////// Listen on the port ///////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

app.listen(process.argv[2] || vars.port);
