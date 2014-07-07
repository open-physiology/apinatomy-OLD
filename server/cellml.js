'use strict';

////////////////////////////////////////////////////////////////////////////////
///////////////////////// Includes /////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var http = require('http');
var _ = require('lodash');
var Q = require('q');
var request = require('request');

var vars = require('./vars');


////////////////////////////////////////////////////////////////////////////////
///////////////////////// URLs /////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var baseURL = { host: vars.cellmlServer, port: vars.cellmlPort };

exports.loadURL = function loadURL(filename) {
	return _.extend({ path: "/biomaps/load" +
	                        "/" + filename }, baseURL);
};
exports.flagOutputURL = function flagOutputURL(modelID, component, variable, column) {
	return _.extend({ path: "/biomaps/flag-output" +
	                        "/" + modelID +
	                        "/" + component +
	                        "/" + variable +
	                        "?column=" + column }, baseURL);
};
exports.setValueURL = function setValueURL(modelID, component, variable, value) {
	return _.extend({ path: "/biomaps/set-value" +
	                        "/" + modelID +
	                        "/" + component +
	                        "/" + variable +
	                        "?value=" + value }, baseURL);
};
exports.setValueRangeURL = function setValueRangeURL(modelID, component, variable, dataSetId) {
	return _.extend({ path: "/biomaps/set-value" +
	                        "/" + modelID +
	                        "/" + component +
	                        "/" + variable +
	                        "?dataset=" + dataSetId }, baseURL);
};
exports.setDataSetURL = function setDataSetURL() {
	return _.extend({ path: "/biomaps", method: 'POST' }, baseURL);
};
exports.executeURL = function executeURL(modelID, start, end, interval) {
	return _.extend({ path: "/biomaps/execute" +
	                        "/" + modelID +
	                        "?start=" + start +
	                        "&end=" + end +
	                        "&interval=" + interval }, baseURL);
};


////////////////////////////////////////////////////////////////////////////////
///////////////////////// CellML ///////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

exports.cellmlGet = function cellmlGet(url, fn) {
	var result = Q.defer();
	var req = http.get(url, function (res, err) {
		if (res.statusCode === 200) {
			var endData = "";
			res.on('data', function (data) {
				endData += data.toString();
			}).on('end', function () {
				endData = JSON.parse(endData);
				if (_(fn).isFunction()) { fn(endData); }
				result.resolve(endData);
			});
		} else {
			console.error('CellML Network Error: ' + res.statusCode);
			console.error(url);
			console.error(err);
			result.reject(err);
		}
	});
	return result.promise;
};

exports.cellmlPost = function cellmlPost(url, data, fn) {
	var result = Q.defer();

	request.post({
		url: url,
		body: data,
		json: true
	}, function (err, data, body) {
		if (err) {
			console.error(err);
			result.reject(err);
		} else {
			if (_(fn).isFunction()) { fn(endData); }
			result.resolve(body);
		}
	});

	return result.promise;
};


//////////////////////////////////////////////////////////////////////////////////
/////////////////////////// Test... //////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
//
//exports.cellmlGet(exports.loadURL('beeler_reuter_1977')).then(function (data) {
//	return exports.cellmlGet(exports.flagOutputURL(data.id, 'membrane', 'V', 2)).then(console.log).thenResolve(data.id);
//}).then(function (id) {
//	return exports.cellmlGet(exports.flagOutputURL(id, 'membrane', 'C', 3)).then(console.log).thenResolve(id);
//}).then (function (id) {
//	return exports.cellmlGet(exports.setValueURL(id, 'membrane', 'i_Na', 300)).then(console.log).thenResolve(id);
//}).then (function (id) {
//	return exports.cellmlGet(exports.executeURL(id, 0, 5, 0.5));
//}).then(function (data) {
//	console.log(data);
//});
