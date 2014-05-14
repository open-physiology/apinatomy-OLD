'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module', 'lodash', 'defaults/service'], function (app, _) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	var BEELER_REUTER_1977 = {
		filename       : 'beeler_reuter_1977.cellml',
		outputVariables: [
			{ component: 'membrane', name: 'i_Na' },
			{ component: 'membrane', name: 'i_S' },
			{ component: 'membrane', name: 'i_x1' },
			{ component: 'membrane', name: 'i_K1' },
			{ component: 'membrane', name: 'Istim' },
			{ component: 'membrane', name: 'i_S' },
			{ component: 'membrane', name: 'V' }
		],
		values         : [
			{ component: 'membrane', name: 'C', value: 0.01 }
		]
	};

	var modelState = {
		id  : null,
		time: 0,
		data: []
	};

	app.factory('CellMLService', ['$http', function ($http) {
		var iface = {};

		iface.loadModel = function (modelOptions) {
			modelOptions = BEELER_REUTER_1977; // TODO: actually use parameter input to determine model
			return $http.post('/resources/cellml/load', modelOptions).then(function (data) {
				console.log('Got first data: ', data.data);
				modelState.id = data.data.id;
			});
		};

		iface.setValues = function (values) {
			return $http.post('/resources/cellml/set-values/' + modelState.id, { values: values });
		};

		iface.executeModel = function (start, end, interval) {
			return $http.post('/resources/cellml/execute/' + modelState.id, {
				start   : start / 1000,
				end     : end / 1000,
				interval: interval / 1000
			}).then(function (data) {
				// [
				//    [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6],  // time
				//    [1, 9  , 8  , 7  , 65 , 34 , 5  ],  // var 1
				//    [1, 9  , 8  , 7  , 65 , 34 , 5  ]   // var 2...
				// ]
				var result = {};
																				console.log(start, end, interval);
																								console.log(data.data);
				_(BEELER_REUTER_1977.outputVariables).forEach(function (variable, i) {
					_(data.data[0]).forEach(function (time, ti) {
						result[variable.name] = { // TODO: use proper URI
							time: time,
							value: data.data[i+1][ti]
						};
					});
				});
				return result;
			});
		};

		return iface;
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
