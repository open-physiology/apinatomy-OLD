'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['lodash', 'angular', 'app/module'], function (_, ng, app) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	app.factory('StreamService', ['$q', 'CellMLService', function ($q, CellMLService) {

		var cellMLModelPromise = CellMLService.loadModel();
		var cellMLData = {};

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
			newCellMLDataStream: function (varName, obj, field, timeInterval) {
				var nextTime = 0;

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

						timeBeginning = _(timeBeginning).or(_(obj[field]).last().time);

						return cellMLModelPromise.then(function () {
							return CellMLService.executeModel(
									timeBeginning,
									(timeBeginning + nr * timeInterval),
									timeInterval
							).then
							(function (data) {
								//// add the requested new elements
//								console.log(data);
								_(obj[field]).concatenate(data[varName]);
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
