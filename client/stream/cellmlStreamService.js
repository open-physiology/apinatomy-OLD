'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['lodash', 'app/module', 'cellml/service'], function (_, app) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	var BEELER_REUTER_1977 = {
		filename       : 'beeler_reuter_1977.cellml',
		outputVariables: [
			{ component: 'membrane', name: 'i_Na' },
			{ component: 'membrane', name: 'i_S' },
			{ component: 'membrane', name: 'i_x1' },
			{ component: 'membrane', name: 'i_K1' },
			{ component: 'membrane', name: 'Istim' },
			{ component: 'membrane', name: 'V' }
		],
		values         : [
			{ component: 'membrane', name: 'C', value: 0.01 }
		]
	};


	app.factory('CellmlStreamService', ['CellMLService', function (CellMLService) {

		var model = new CellMLService(BEELER_REUTER_1977); // TODO: conditional on which model needs to be loaded and when

		var dataCache = {}; // varID -> (0-based index for time) -> time+data

		function CellmlStreamSource() {

			this.getData = function getDataRange(uri, time) {
				var result = [];
				for (var time = beginTime; time <= endTime; time += timeInterval) {
					// TODO: continue
				}

				// TODO: continue


				model.executeModel(beginTime, endTime, timeInterval).then(function (newData) {
					_(newData).forEach(function (varData, varName) {
						if (_(dataCache[varName]).isUndefined()) {
							dataCache[varName] = [];
						}
						_(varData).forEach(function (varTimeData) {
							dataCache[varName].push(varTimeData);
						});

					});
				});
			};

			this.invalidate = function invalidate() {
				dataCache = {};
			}

		}

		return CellmlStreamSource;

	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
