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

		var currentData = {};

		function CellmlStreamSource() {

			this.getDataRange = function getDataRange(uri, beginTime, endTime, timeInterval) {
				var result = [];
				for (var time = beginTime; time <= endTime; time += timeInterval) {
					// TODO: continue
				}

				// TODO: continue


				model.executeModel(beginTime, endTime, timeInterval).then(function (newData) {
					_(newData).forEach(function (varData, varName) {
						if (_(currentData[varName]).isUndefined()) {
							currentData[varName] = [];
						}
						_(varData).forEach(function (varTimeData) {
							currentData[varName].push(varTimeData);
						});

					});
				});
			};

			this.invalidate = function invalidate() {
				currentData = {};
			}

		}

		return CellmlStreamSource;

	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
