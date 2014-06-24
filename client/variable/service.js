'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module', 'lodash'], function (app, _) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	app.factory('Variable', [function () {

		function Variable(name, uri, streamSource) {

			if (_(streamSource).isUndefined()) {
				streamSource = { // serves random data
					getDataRange: function (uri, beginTime, endTime, timeInterval) {
						for (var i = beginTime; i <= endTime; i += timeInterval) {
							tmpDataCache.push([ i * timeInterval, Math.random() * 11 - 5 ]);
						}
					}
				};
			}

			this.name = function nameFn() { return name };

			this.uri = function uriFn() { return uri };

			var tmpDataCache = [];

			this.getDataUpToTime = function getDataUpToTime(endTime, timeInterval) {
				var newData = streamSource.getDataRange(uri, tmpDataCache.length * timeInterval, endTime, timeInterval);
				_(newData).forEach(function (dataPoint) {
					tmpDataCache.push(dataPoint);
				});
				var timePointCount = endTime / timeInterval + 1;
				for (var j = tmpDataCache.length; timePointCount < j; --j) {
					tmpDataCache.pop();
				}
				return tmpDataCache;
			};

			// TODO: color, range, etc.

		}

		return Variable;

	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
