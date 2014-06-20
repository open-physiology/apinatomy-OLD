'use strict';

////////////////////////////////////////////////////////////////////////////////
///////////////////////// Includes /////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var _ = require('lodash');
var Q = require('q');
var child_process = require('child_process');
var fs = require('fs');
var express = require('express');
var app = express();

var vars = require('./vars');
var db = require('./db');
var cellml = require('./cellml');


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

//////////////////  //  //  /  /  /
///// CellML ////  //  //  /  /  /
////////////////  //  //  /  /  /

////////// start the CellML server //////////

(function () {
	//// prepare streams to log output
	var cellmlOut = fs.openSync(vars.cellmlDir + '/out.log', 'a');
	var cellmlErr = fs.openSync(vars.cellmlDir + '/out.log', 'a');

	//// spawn child process
	var cellmlProcess = child_process.spawn(
			(vars.cellmlDir + '/bin/gms'),
			[vars.cellmlPort, 'GMS', (vars.cellmlDir + '/models')],
			{
				cwd: vars.cellmlDir,
				stdio: [null, cellmlOut, cellmlErr]
			});

	//// don't wait for it to exit
	cellmlProcess.unref();
}());


//// POST: load new model

app.post('/resources/cellml/load', function (req, res) {
	var id;
	var promise = cellml.cellmlGet(cellml.loadURL(req.body.filename)).then(function (data) {
		id = data.id;
	});
	_(req.body.outputVariables).forEach(function (variable, index) {
		promise = promise.then(function () {
			return cellml.cellmlGet(cellml.flagOutputURL(id, variable.component, variable.name, index + 1)).then(function (data) {
				if (data.returnCode !== 0) {
					throw new Error("Something went wrong trying to flag variable '" + variable.name + "' for output.");
				}
			});
		});
	});
	_(req.body.values).forEach(function (variable) {
		promise = promise.then(function () {
			return cellml.cellmlGet(cellml.setValueURL(id, variable.component, variable.name, variable.value)).then(function (data) {
				if (data.returnCode !== 0) {
					throw new Error("Something went wrong trying to set the variable '" + variable.name + "' to value '" + variable.value + "'.");
				}
			});
		});
	});
	promise.then(function () {
		res.status(HTTP_CREATED).json({ id: id });
	}, function (err) {
		res.status(HTTP_INTERNAL_SERVER_ERROR).json(err);
	});
});


//// POST: set values on running model

app.post('/resources/cellml/set-values/:id', function (req, res) {
	var promise = Q(null);
	_(req.body.values).forEach(function (variable) {
		promise = promise.then(function () {
			return cellml.cellmlGet(cellml.setValueURL(
					req.params.id,
					variable.component,
					variable.name,
					variable.value)).then(function (data) {
				if (data.returnCode !== 0) {
					throw new Error("Something went wrong trying to set the variable '" + variable.name + "' to value '" + variable.value + "'.");
				}
			});
		});
	});
	promise.then(function () {
		res.status(HTTP_CREATED).json({ id: req.params.id });
	}, function (err) {
		res.status(HTTP_INTERNAL_SERVER_ERROR).json(err);
	});
});


//// POST: set value on running model

app.post('/resources/cellml/execute/:id', function (req, res) {
	cellml.cellmlGet(cellml.executeURL(req.params.id, req.body.start, req.body.end, req.body.interval)).then(function (data) {
		res.status(HTTP_OK).json(data.data);
	}, function (err) {
		res.status(HTTP_INTERNAL_SERVER_ERROR).json(err);
	});
});


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

				// TODO: we can think of a faster way than populating all of this server-side regardless of the request
				db.GeneTranslation.populate(ents, { path: "proteins.translations" }, function (err, popEnts) {
					if (err) {
						console.error(err);
						res.status(HTTP_INTERNAL_SERVER_ERROR).send(null);
						return;
					}
					res.status(HTTP_OK).json(popEnts);
				});
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
					return;
				}

				res.status(HTTP_OK).json(ents);

				// TODO: we can think of a faster way than populating all of this server-side regardless of the request
				db.GeneTranslation.populate(ents, { path: "proteins.translations" }, function (err, popEnts) {
					if (err) {
						console.error(err);
						res.status(HTTP_INTERNAL_SERVER_ERROR).send(null);
						return;
					}
					res.status(HTTP_OK).json(popEnts);
				});
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
			.populate('entity')
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


///////////////////////////  //  //  /  /  /
///// Small Molecules ////  //  //  /  /  /
/////////////////////////  //  //  /  /  /

//// GET specific set of small molecules

app.get('/resources/small-molecules/:ids', function (req, res) {
	var ids = req.params.ids.split(',');
	var skip = req.query.skip || 0;
	var limit = req.query.limit || Infinity;
	db.SmallMolecule.find()
			.where('_id').in(ids)
			.sort({ '_id': 1 })
			.skip(skip)
			.limit(limit)
			.exec(function (err, smallMolecules) {
				if (err) {
					console.log(err);
					res.status(HTTP_INTERNAL_SERVER_ERROR).send(null);
					return;
				}

				res.status(HTTP_OK).json(smallMolecules);
			});
});


/////////////////////  //  //  /  /  /
///// Ancestors ////  //  //  /  /  /
///////////////////  //  //  /  /  /

app.get('/resources/ancestors/:id', function (req, res) {
	var result = [];

	(function checkParents(id) {
		return Q.ninvoke(db.Entity.findById(id).populate('super', '_id descendantCount'), 'exec')
				.then(function (ent) {
					if (!ent) { return null; }
					return Q.all(_(ent.super).filter(function (sup) {
						return !_(sup.descendantCount).isUndefined() && sup.descendantCount >= 0;
					}).map(function (sup) {
						if (!_(result).contains(sup._id)) {
							result.push(sup._id);
						}
						return checkParents(sup._id);
					}).value());
				});
	}(req.params.id))
			.then(function () {
				res.status(HTTP_OK).json(result);
			}).catch(function (err) {
				console.error(err);
				res.status(HTTP_INTERNAL_SERVER_ERROR).send(err);
			});
});


///////////////////////  //  //  /  /  /
///// Text Search ////  //  //  /  /  /
/////////////////////  //  //  /  /  /


app.get('/resources/search/:query', function (req, res) {

	db.Entity.aggregate([
		{ $match: { $text: { $search: req.params.query }, descendantCount: { $gt: -1 } } },
		{ $project: { _id: 1, name: 1, score: { $meta: 'textScore' } } },
		{ $sort: { score: { $meta: 'textScore' } } },
		{ $limit: 10 }
	]).exec(function (err, result) {
		if (err) {
			console.error(err);
			res.status(HTTP_INTERNAL_SERVER_ERROR).send(err);
		} else {
			res.status(HTTP_OK).json(result);
		}
	});

});


////////////////////////////////////////////////////////////////////////////////
///////////////////////// Special Exceptions ///////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

app.get('**/bootstrap/glyphicons-halflings-regular.*', function (req, res, next) {
	if (req.path.substr(0, 5) === '/lib/') { next(); return; }
	var extension = req.path.substr(req.path.lastIndexOf('.'));
	res.redirect('/lib/bootstrap-sass-official/vendor/assets/fonts/bootstrap/glyphicons-halflings-regular' + extension);
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
