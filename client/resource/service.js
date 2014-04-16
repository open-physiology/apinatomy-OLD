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

		//////////////////// 3D Models /////////////////////////////////////////////////////////////////////////////////

		var URI_TO_MODEL = {
			'fma:7148' : ['3d-models/FMA7148_Stomach.obj'],
			'fma:7197' : ['3d-models/FMA7197_Liver.obj'],
			'fma:7204' : ['3d-models/FMA7204_Right_Kidney.obj'],
			'fma:7205' : ['3d-models/FMA7205_Left_Kidney.obj'],
			'fma:7394' : ['3d-models/FMA7394_Trachea.obj'],
			'fma:12513': ['3d-models/FMA12513_Eyeball.obj'],
			'fma:13076': ['3d-models/FMA13076_Fifth_Lumbar_Vertebra.obj'],
			'fma:24498': ['3d-models/FMA24498_Left_Calcaneus.obj'],
			'fma:52735': ['3d-models/FMA52735_Occipital_Bone.obj'],
			'fma:52748': ['3d-models/FMA52748_Mandible.obj'],
			'fma:62004': ['3d-models/FMA62004_Medulla_Oblongata.obj'],
			'fma:58301': ['3d-models/FMA58301_Retina_cell-147-trace.CNG.swc',
			              '3d-models/FMA58301_Retina_cell-167-trace.CNG.swc'],
			'fma:62429': ['3d-models/FMA62429_Neocortex_07b_pyramidal14aACC.CNG.swc'],
			'fma:84013': ['3d-models/FMA84013_Basal_ganglia_D2OE-AAV-GFP-14.CNG.swc']
		};

		iface.threeDModels = function (ids) {
			var result = _.at(URI_TO_MODEL, ids);

			return $q.when(_(URI_TO_MODEL).pick(_.intersection(ids, _.keys(URI_TO_MODEL))).value());
		};

		return iface;
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
