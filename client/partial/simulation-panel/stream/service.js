'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['lodash', 'angular', 'app/module'], function (_, ng, app) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	app.factory('StreamService', ['$q', 'CellMLService', function ($q, CellMLService) {
		return {
			newRandomDataStream: function (obj, field, timeInterval) {
				var nextTime = timeInterval;

				return {
					loadMoreEntries: function (nr, timeBeginning) {
						//// if a new timeBeginning is given, remove all subsequent elements
						if (!_(timeBeginning).isUndefined() && timeBeginning + timeInterval < nextTime) {
							for (var i = obj[field].length - 1; 0 < i; --i) {
								if (obj[field][i].time <= timeBeginning) { break; }
								obj[field].pop();
							}
							nextTime = timeBeginning + timeInterval;
						}

						//// a 0th element
						if (_(obj[field]).isEmpty()) { obj[field].push({ time: 0, value: 0 }); }

						//// add the requested new elements
						for (var j = 0; j < nr; ++j) {
							obj[field].push({
								time : nextTime,
								value: _(obj[field]).last().value + Math.round(Math.random() * 6 - 3)
							});
							nextTime += timeInterval;
						}

						return $q.when(); // immediately resolved
					}
				};
			},
			newCellMLDataStream: function (obj, field, timeInterval) {
				var nextTime = timeInterval;

				var modelPromise = CellMLService.loadModel();

				return {
					loadMoreEntries: function (nr, timeBeginning) {
						//// if a new timeBeginning is given, remove all subsequent elements
						if (!_(timeBeginning).isUndefined() && timeBeginning + timeInterval < nextTime) {
							for (var i = obj[field].length - 1; 0 < i; --i) {
								if (obj[field][i].time <= timeBeginning) { break; }
								obj[field].pop();
							}
							nextTime = timeBeginning + timeInterval;
						}

						return modelPromise.then(function () {

							return CellMLService.executeModel(
									(timeBeginning / 1000),
									((timeBeginning + nr * timeInterval) / 1000),
									(timeInterval / 1000)
							).then
							(function () {
								// TODO: Continue here
							});
						});
					}
				};
			}
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
