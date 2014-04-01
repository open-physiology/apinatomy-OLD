'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module', 'lodash', 'defaults/service'], function (ApiNATOMY, _) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	ApiNATOMY.factory('ResourceService', ['$http', '$q', function ($http, $q) {

		var iface = {};

		//////////////////// Entities //////////////////////////////////////////////////////////////////////////////////

		var entityCache = {};
		var entityDeferredCache = {};

		function registerPossibleEntity(id) {
			if (!_(entityCache).has(id)) {
				entityDeferredCache[id] = $q.defer();
				entityCache[id] = { _id: id, _promise: entityDeferredCache[id].promise };
			}
		}

		iface.entities = function (ids) {
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
					//// for each newly received entity:

					_(data.data).forEach(function (newEntity) {
						//// assign its data to the entity cache

						_(entityCache[newEntity._id]).assign(newEntity);

						//// remove dangling sub.entity references; TODO: fix in database

						_(newEntity.sub).remove(function (sub) { return _(sub.entity).isNull(); });

						//// link any sub.entity references to their counterparts in the cache

						_(newEntity.sub).forOwn(function (sub) {
							registerPossibleEntity(sub.entity._id);
							sub.entity = entityCache[sub.entity._id];
						});

						//// resolve this entity's promise

						entityDeferredCache[newEntity._id].resolve(entityCache[newEntity._id]);
					});
				}, function (err) {
					//// in the case of error, reject all promises related to this request

					_(ids).forEach(function (id) {
						entityDeferredCache[id].reject(err);
					});
				});
			}

			return result;
		};

		//////////////////// Connections ///////////////////////////////////////////////////////////////////////////////

		iface.connections = function (ids) {
			return $http.get('/resources/connections/' + ids.join(','))
					.then(function (data) { return data.data; });
		};

		//////////////////// Paths /////////////////////////////////////////////////////////////////////////////////////

		iface.paths = function (ids) {
			if (_(ids).isEmpty()) { return $q.when([]); }
			return $http.get('/resources/paths/' + ids.join(','))
					.then(function (data) { return data.data; });
		};

		return iface;

	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
