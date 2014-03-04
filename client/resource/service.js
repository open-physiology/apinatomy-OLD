'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module', 'lodash'], function (ApiNATOMY, _) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	ApiNATOMY.factory('ResourceService', ['$resource', '$q', function ($resource, $q) {

		var Structures = $resource('/resources/structures/:uris', undefined, {
			'get': { method: 'GET', isArray: true }
		});

		var structureCache = {};

		return {
//			exampleData: $resource('/resources/ExampleData').get().$promise,

			structures: function (uris) {
				var dResult = $q.defer();

				if (!_(uris).isArray() || _(uris).isEmpty()) {
					dResult.resolve([]);
				} else {
					var result = _(structureCache).at(uris).compact().values().value();
					var request = _(uris).difference(_(structureCache).keys().value()).value();

//																						debugger;

					if (_(request).isEmpty()) {
						dResult.resolve(result);
					} else {
						Structures.get({ uris: request.join(',') },
								function getSuccess(value, responseHeaders) {
//																						debugger;
									_(structureCache).assign(_(value).pluck('uri').zipObject(value).value());
//																						debugger;
									result.push.apply(result, _(value).toArray().value());
//																						debugger;
									dResult.resolve(result);
								}, function getError(httpResponse) {
									dResult.reject(httpResponse);
								});
					}
				}

				return dResult.promise;
			}
		};

	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
