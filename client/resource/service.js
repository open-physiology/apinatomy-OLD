'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module', 'lodash', 'defaults/service'], function (ApiNATOMY, _) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	ApiNATOMY.factory('ResourceService', ['$http', '$q', function ($http, $q) {

		var entityCache = {};
		var entityDeferredCache = {};

		function registerPossibleEntity(id) {
			if (!_(entityCache).has(id)) {
				entityDeferredCache[id] = $q.defer();
				entityCache[id] = { _id: id, _promise: entityDeferredCache[id].promise };
			}
		}

		return {

			entities: function (ids) {

				var request = [];

				_(ids).forEach(function (id) {
					registerPossibleEntity(id);
					if (!entityCache[id]._requested) {
						entityCache[id]._requested = true;
						request.push(id);
					}
				});

				var result = _(entityCache).at(ids).values().value();

				if (!_(request).isEmpty()) {
					$http.get('/resources/entities/' + request.join(',')).then(function (data) {
						_(data.data).forEach(function (newEntity) {
							_(entityCache[newEntity._id]).assign(newEntity);
							entityDeferredCache[newEntity._id].resolve(entityCache[newEntity._id]);

							//// register the possible sub-entities (but don't load yet)

							// TODO: some sub.entity references are dangling in the database; FIX
							_(newEntity.sub).remove(function (sub) { return _(sub.entity).isNull(); });

							_(newEntity.sub).forOwn(function (sub) {
								registerPossibleEntity(sub.entity._id);
								sub.entity = entityCache[sub.entity._id];
							});
						});
					}, function (err) {
						_(ids).forEach(function (id) {
							entityDeferredCache[id].reject(err);
						});
					});
				}

				return result;
			},

			connections: function (ids) {

				// TEST: ids = ['24tile:60000001', '24tile:60000002', '24tile:60000007', '24tile:60000008']
				// TODO: return REAL data

				return [
					{ source: 0, target: 1 },
					{ source: 1, target: 2 },
					{ source: 2, target: 3 },
					{ source: 3, target: 0 }
				];

			}

		};

	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
