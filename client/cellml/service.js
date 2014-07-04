'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module', 'lodash', 'defaults/service'], function (app, _) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	app.factory('CellMLService', ['$http', function ($http) {
		function CellMLService(modelOptions) {

			var options = modelOptions;
			var instanceId = null;

			var latestPromise = $http.post('/resources/cellml/load', options)
					.then(function (data) { return data.data; })
					.then(function (data) { instanceId = data.id; });

			this.setValues = function setValues(values) {
				latestPromise = latestPromise.then(function () {
					return $http.post('/resources/cellml/set-values/' + instanceId, { values: values });
				});
				return latestPromise;
			};

			this.executeModel = function (start, end, interval) { // times in ms
				return latestPromise.then(function () {
					return $http.post('/resources/cellml/execute/' + instanceId, {
						start:    (start / 1000),
						end:      (end / 1000),
						interval: (interval / 1000)
					}).then
					(function (data) { return data.data }).then
					(function (data) {
						// data ~= [
						//    [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6],  // time
						//    [1, 9  , 8  , 7  , 65 , 34 , 5  ],  // var 1
						//    [1, 9  , 8  , 7  , 65 , 34 , 5  ]   // var 2...
						// ]
						var result = {};
						_(options.outputVariables).values().forEach(function (variable, i) {
							_(data[0]).forEach(function (time, ti) {
								if (_(result[variable.uri]).isUndefined()) {
									result[variable.uri] = [];
								}
								result[variable.uri].push([ // TODO: use proper URI for variables; not just their name
									Math.round(time * 1000), /* time in ms */
									data[i + 1][ti]          /* data */
								]);
							});
						});
						return result;
					});
				});
			};

		}

		return CellMLService;
	}]);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
