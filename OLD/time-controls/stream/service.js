'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['lodash', 'angular', 'app/module'], function (_, ng, app) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	app.factory('StreamService', ['$q', function ($q) {
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

						//// differential equations need a 0th element from the beginning
						if (_(obj[field]).isEmpty()) {  obj[field].push({ time: 0, value: 0 });  }

						//// add the requested new elements
						for (var j = 0; j < nr; ++j) {
							obj[field].push({
								time: nextTime,
								value: _(obj[field]).last().value + Math.round(Math.random() * 6 - 3)
							});
							nextTime += timeInterval;
						}
					}
				};
			}
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
