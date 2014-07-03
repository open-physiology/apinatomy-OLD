'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module', 'lodash', 'defaults/service'], function (app, _) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	app.factory('ResourceService', ['$http', '$q', function ($http, $q) {

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
			if (_(ids).isEmpty() || _(ids[0]).isUndefined()) { return []; }

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
						entityCache[newEntity._id]._resolved = true;
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


		//////////////////// Small Molecules ///////////////////////////////////////////////////////////////////////////

		iface.smallMolecules = function (ids) {
			if (_(ids).isEmpty()) { return $q.when([]); }
			return $http.get('/resources/small-molecules/' + ids.join(','))
					.then(function (data) { return data.data; });
		};


		//////////////////// Ancestors /////////////////////////////////////////////////////////////////////////////////

		iface.ancestors = function (id) {
			return $http.get('/resources/ancestors/' + id)
					.then(function (data) { return data.data; });
		};


		//////////////////// Text Search ///////////////////////////////////////////////////////////////////////////////

		iface.search = function (query) {
			return $http.get('/resources/search/' + query)
					.then(function (data) { return data.data; });
		};


		//////////////////// 3D Models /////////////////////////////////////////////////////////////////////////////////

		var FMA_ID_TO_3D_MODEL = {
			'fma:7088':  ['3d-models/contracting-heart-2.json'],
			'fma:7148':  ['3d-models/FMA7148_Stomach.obj'],
			'fma:7197':  ['3d-models/FMA7197_Liver.obj'],
			'fma:7201':  [
				[
					{ file: '3d-models/cap_03/cap_03.obj', color: '#F37CFD' },
					{ file: '3d-models/cap_03/cap_03_conn.obj', color: '#FFF53E' },
					{ file: '3d-models/cap_03/cap_03_endo.obj', color: '#E10016' },
					{ file: '3d-models/cap_03/cap_03_epi.obj', color: '#6DFF66' },
					{ file: '3d-models/cap_03/cap_03_field.obj', color: '#FFFFFF', opacity: 0.25 }
				]
			],
			'fma:7204':  ['3d-models/FMA7204_Right_Kidney.obj'],
			'fma:7205':  ['3d-models/FMA7205_Left_Kidney.obj'],
			'fma:7394':  ['3d-models/FMA7394_Trachea.obj'],
			'fma:12513': ['3d-models/FMA12513_Eyeball.obj'],
			'fma:13076': ['3d-models/FMA13076_Fifth_Lumbar_Vertebra.obj'],
			'fma:24498': ['3d-models/FMA24498_Left_Calcaneus.obj'],
			'fma:52735': ['3d-models/FMA52735_Occipital_Bone.obj'],
			'fma:52748': ['3d-models/FMA52748_Mandible.obj'],
			'fma:62004': ['3d-models/FMA62004_Medulla_Oblongata.obj'],
			'fma:67943': ['3d-models/FMA67943_Pons.obj'],
			'fma:67944': ['3d-models/FMA67944_Cerebellum.obj'],
			'fma:72717': ['3d-models/FMA72717_Right_cingulate_gyrus.obj'],
			'fma:72826': ['3d-models/FMA72826_Right_caudate_nucleus.obj'],
			'fma:72827': ['3d-models/FMA72827_Left_caudate_nucleus.obj'],
			'fma:72828': ['3d-models/FMA72828_Right_putamen.obj'],
			'fma:72829': ['3d-models/FMA72829_Left_putamen.obj'],
			'fma:86464': ['3d-models/FMA86464_Corpus_callosum.obj'],
			'fma:58301': ['3d-models/FMA58301_Retina_cell-147-trace.CNG.swc',
			              '3d-models/FMA58301_Retina_cell-167-trace.CNG.swc'],
			'fma:62429': ['3d-models/FMA62429_Neocortex_07b_pyramidal14aACC.CNG.swc'],
			'fma:84013': ['3d-models/FMA84013_Basal_ganglia_D2OE-AAV-GFP-14.CNG.swc']
		};

		iface.threeDModels = function (id) {
			return $q.when(FMA_ID_TO_3D_MODEL[id]);
		};


		//////////////////// Simulations ///////////////////////////////////////////////////////////////////////////////

		var SIMULATION_MODELS = [
			{
				uri: 'beeler_reuter_1977',
				name:            'Beeler & Reuter, 1977',
				type:            'CellMLSimulation',
				filename:        'beeler_reuter_1977.cellml',
				outputVariables: {
					'membrane/i_Na':  { uri: 'membrane/i_Na',  component: 'membrane', name: 'i_Na'  },
					'membrane/i_S':   { uri: 'membrane/i_S',   component: 'membrane', name: 'i_S'   },
					'membrane/i_x1':  { uri: 'membrane/i_x1',  component: 'membrane', name: 'i_x1'  },
					'membrane/i_K1':  { uri: 'membrane/i_K1',  component: 'membrane', name: 'i_K1'  },
					'membrane/Istim': { uri: 'membrane/Istim', component: 'membrane', name: 'Istim' },
					'membrane/V':     { uri: 'membrane/V',     component: 'membrane', name: 'V'     }
				},
				values: {
					'membrane/C': { uri: 'membrane/C', component: 'membrane', name: 'C', value: 0.01 }
				}
			},
			{ // https://models.physiomeproject.org/e/1af/Linear2ndOrderODE.cellml/view
				uri: 'navier_stokes_soroush_2014',
				name:            'Navier Stokes Simulation, Soroush, 2014',
				type:            'NavierStokesSimulation',
				outputVariables: {
//					'2400/flow': { uri: '2400/flow', name: 'flow (segment 2400)' },
//					'2401/flow': { uri: '2401/flow', name: 'flow (segment 2401)' },
//					'2567/flow': { uri: '2567/flow', name: 'flow (segment 2567)' },
//					'2651/flow': { uri: '2651/flow', name: 'flow (segment 2651)' },
//					'3774/flow': { uri: '3774/flow', name: 'flow (segment 3774)' },
//					'4282/flow': { uri: '4282/flow', name: 'flow (segment 4282)' },
//					'4701/flow': { uri: '4701/flow', name: 'flow (segment 4701)' },
//					'4703/flow': { uri: '4703/flow', name: 'flow (segment 4703)' },
//					'4705/flow': { uri: '4705/flow', name: 'flow (segment 4705)' },
//					'4707/flow': { uri: '4707/flow', name: 'flow (segment 4707)' },
//					'4709/flow': { uri: '4709/flow', name: 'flow (segment 4709)' },
//					'3179/flow': { uri: '3179/flow', name: 'flow (segment 3179)' },
//					'4712/flow': { uri: '4712/flow', name: 'flow (segment 4712)' },
//					'4713/flow': { uri: '4713/flow', name: 'flow (segment 4713)' },
//					'4764/flow': { uri: '4764/flow', name: 'flow (segment 4764)' },
//					'4813/flow': { uri: '4813/flow', name: 'flow (segment 4813)' },
//					'4862/flow': { uri: '4862/flow', name: 'flow (segment 4862)' },
//					'4911/flow': { uri: '4911/flow', name: 'flow (segment 4911)' },
//					'4958/flow': { uri: '4958/flow', name: 'flow (segment 4958)' },
//					'5005/flow': { uri: '5005/flow', name: 'flow (segment 5005)' },
//					'5052/flow': { uri: '5052/flow', name: 'flow (segment 5052)' },
//					'5099/flow': { uri: '5099/flow', name: 'flow (segment 5099)' },
//					'5146/flow': { uri: '5146/flow', name: 'flow (segment 5146)' },
//					'5193/flow': { uri: '5193/flow', name: 'flow (segment 5193)' },
//					'5240/flow': { uri: '5240/flow', name: 'flow (segment 5240)' },
//					'5287/flow': { uri: '5287/flow', name: 'flow (segment 5287)' },
//					'5289/flow': { uri: '5289/flow', name: 'flow (segment 5289)' },
//					'5291/flow': { uri: '5291/flow', name: 'flow (segment 5291)' },
//					'5338/flow': { uri: '5338/flow', name: 'flow (segment 5338)' },
//					'5385/flow': { uri: '5385/flow', name: 'flow (segment 5385)' },
//					'5432/flow': { uri: '5432/flow', name: 'flow (segment 5432)' },
//					'5479/flow': { uri: '5479/flow', name: 'flow (segment 5479)' },
//					'5526/flow': { uri: '5526/flow', name: 'flow (segment 5526)' },
//					'5573/flow': { uri: '5573/flow', name: 'flow (segment 5573)' },
//					'5612/flow': { uri: '5612/flow', name: 'flow (segment 5612)' },
//					'5651/flow': { uri: '5651/flow', name: 'flow (segment 5651)' },
//					'5653/flow': { uri: '5653/flow', name: 'flow (segment 5653)' },
//					'5655/flow': { uri: '5655/flow', name: 'flow (segment 5655)' },
//					'5667/flow': { uri: '5667/flow', name: 'flow (segment 5667)' },
//					'5679/flow': { uri: '5679/flow', name: 'flow (segment 5679)' },
//					'5806/flow': { uri: '5806/flow', name: 'flow (segment 5806)' },
//					'5858/flow': { uri: '5858/flow', name: 'flow (segment 5858)' },
//					'5860/flow': { uri: '5860/flow', name: 'flow (segment 5860)' },
//					'5862/flow': { uri: '5862/flow', name: 'flow (segment 5862)' },
//					'5864/flow': { uri: '5864/flow', name: 'flow (segment 5864)' },
//					'5866/flow': { uri: '5866/flow', name: 'flow (segment 5866)' },
//					'6030/flow': { uri: '6030/flow', name: 'flow (segment 6030)' },
//					'6036/flow': { uri: '6036/flow', name: 'flow (segment 6036)' },
//					'6042/flow': { uri: '6042/flow', name: 'flow (segment 6042)' },
//					'6048/flow': { uri: '6048/flow', name: 'flow (segment 6048)' },
//					'6054/flow': { uri: '6054/flow', name: 'flow (segment 6054)' },
//					'6084/flow': { uri: '6084/flow', name: 'flow (segment 6084)' },
//					'6114/flow': { uri: '6114/flow', name: 'flow (segment 6114)' },
//					'6144/flow': { uri: '6144/flow', name: 'flow (segment 6144)' },
//					'6174/flow': { uri: '6174/flow', name: 'flow (segment 6174)' },
//					'6204/flow': { uri: '6204/flow', name: 'flow (segment 6204)' },
//					'6234/flow': { uri: '6234/flow', name: 'flow (segment 6234)' },
//					'6250/flow': { uri: '6250/flow', name: 'flow (segment 6250)' },
//					'6280/flow': { uri: '6280/flow', name: 'flow (segment 6280)' },
//					'6310/flow': { uri: '6310/flow', name: 'flow (segment 6310)' },
//					'6329/flow': { uri: '6329/flow', name: 'flow (segment 6329)' },
//					'6888/flow': { uri: '6888/flow', name: 'flow (segment 6888)' },
//					'2400/pressure': { uri: '2400/pressure', name: 'pressure (segment 2400)' },
//					'2401/pressure': { uri: '2401/pressure', name: 'pressure (segment 2401)' },
//					'2567/pressure': { uri: '2567/pressure', name: 'pressure (segment 2567)' },
//					'2651/pressure': { uri: '2651/pressure', name: 'pressure (segment 2651)' },
//					'3774/pressure': { uri: '3774/pressure', name: 'pressure (segment 3774)' },
//					'4282/pressure': { uri: '4282/pressure', name: 'pressure (segment 4282)' },
//					'4701/pressure': { uri: '4701/pressure', name: 'pressure (segment 4701)' },
//					'4703/pressure': { uri: '4703/pressure', name: 'pressure (segment 4703)' },
//					'4705/pressure': { uri: '4705/pressure', name: 'pressure (segment 4705)' },
//					'4707/pressure': { uri: '4707/pressure', name: 'pressure (segment 4707)' },
//					'4709/pressure': { uri: '4709/pressure', name: 'pressure (segment 4709)' },
//					'3179/pressure': { uri: '3179/pressure', name: 'pressure (segment 3179)' },
//					'4712/pressure': { uri: '4712/pressure', name: 'pressure (segment 4712)' },
//					'4713/pressure': { uri: '4713/pressure', name: 'pressure (segment 4713)' },
//					'4764/pressure': { uri: '4764/pressure', name: 'pressure (segment 4764)' },
//					'4813/pressure': { uri: '4813/pressure', name: 'pressure (segment 4813)' },
//					'4862/pressure': { uri: '4862/pressure', name: 'pressure (segment 4862)' },
//					'4911/pressure': { uri: '4911/pressure', name: 'pressure (segment 4911)' },
//					'4958/pressure': { uri: '4958/pressure', name: 'pressure (segment 4958)' },
//					'5005/pressure': { uri: '5005/pressure', name: 'pressure (segment 5005)' },
//					'5052/pressure': { uri: '5052/pressure', name: 'pressure (segment 5052)' },
//					'5099/pressure': { uri: '5099/pressure', name: 'pressure (segment 5099)' },
//					'5146/pressure': { uri: '5146/pressure', name: 'pressure (segment 5146)' },
//					'5193/pressure': { uri: '5193/pressure', name: 'pressure (segment 5193)' },
//					'5240/pressure': { uri: '5240/pressure', name: 'pressure (segment 5240)' },
//					'5287/pressure': { uri: '5287/pressure', name: 'pressure (segment 5287)' },
//					'5289/pressure': { uri: '5289/pressure', name: 'pressure (segment 5289)' },
//					'5291/pressure': { uri: '5291/pressure', name: 'pressure (segment 5291)' },
//					'5338/pressure': { uri: '5338/pressure', name: 'pressure (segment 5338)' },
//					'5385/pressure': { uri: '5385/pressure', name: 'pressure (segment 5385)' },
//					'5432/pressure': { uri: '5432/pressure', name: 'pressure (segment 5432)' },
//					'5479/pressure': { uri: '5479/pressure', name: 'pressure (segment 5479)' },
//					'5526/pressure': { uri: '5526/pressure', name: 'pressure (segment 5526)' },
//					'5573/pressure': { uri: '5573/pressure', name: 'pressure (segment 5573)' },
//					'5612/pressure': { uri: '5612/pressure', name: 'pressure (segment 5612)' },
//					'5651/pressure': { uri: '5651/pressure', name: 'pressure (segment 5651)' },
//					'5653/pressure': { uri: '5653/pressure', name: 'pressure (segment 5653)' },
//					'5655/pressure': { uri: '5655/pressure', name: 'pressure (segment 5655)' },
//					'5667/pressure': { uri: '5667/pressure', name: 'pressure (segment 5667)' },
//					'5679/pressure': { uri: '5679/pressure', name: 'pressure (segment 5679)' },
//					'5806/pressure': { uri: '5806/pressure', name: 'pressure (segment 5806)' },
//					'5858/pressure': { uri: '5858/pressure', name: 'pressure (segment 5858)' },
//					'5860/pressure': { uri: '5860/pressure', name: 'pressure (segment 5860)' },
//					'5862/pressure': { uri: '5862/pressure', name: 'pressure (segment 5862)' },
//					'5864/pressure': { uri: '5864/pressure', name: 'pressure (segment 5864)' },
//					'5866/pressure': { uri: '5866/pressure', name: 'pressure (segment 5866)' },
//					'6030/pressure': { uri: '6030/pressure', name: 'pressure (segment 6030)' },
//					'6036/pressure': { uri: '6036/pressure', name: 'pressure (segment 6036)' },
//					'6042/pressure': { uri: '6042/pressure', name: 'pressure (segment 6042)' },
//					'6048/pressure': { uri: '6048/pressure', name: 'pressure (segment 6048)' },
//					'6054/pressure': { uri: '6054/pressure', name: 'pressure (segment 6054)' },
//					'6084/pressure': { uri: '6084/pressure', name: 'pressure (segment 6084)' },
//					'6114/pressure': { uri: '6114/pressure', name: 'pressure (segment 6114)' },
//					'6144/pressure': { uri: '6144/pressure', name: 'pressure (segment 6144)' },
//					'6174/pressure': { uri: '6174/pressure', name: 'pressure (segment 6174)' },
//					'6204/pressure': { uri: '6204/pressure', name: 'pressure (segment 6204)' },
//					'6234/pressure': { uri: '6234/pressure', name: 'pressure (segment 6234)' },
//					'6250/pressure': { uri: '6250/pressure', name: 'pressure (segment 6250)' },
//					'6280/pressure': { uri: '6280/pressure', name: 'pressure (segment 6280)' },
//					'6310/pressure': { uri: '6310/pressure', name: 'pressure (segment 6310)' },
//					'6329/pressure': { uri: '6329/pressure', name: 'pressure (segment 6329)' },
//					'6888/pressure': { uri: '6888/pressure', name: 'pressure (segment 6888)' },
					'2400/concentration': { uri: '2400/concentration', name: 'concentration (segment 2400)' },
					'2401/concentration': { uri: '2401/concentration', name: 'concentration (segment 2401)' },
					'2567/concentration': { uri: '2567/concentration', name: 'concentration (segment 2567)' },
					'2651/concentration': { uri: '2651/concentration', name: 'concentration (segment 2651)' },
					'3774/concentration': { uri: '3774/concentration', name: 'concentration (segment 3774)' },
					'4282/concentration': { uri: '4282/concentration', name: 'concentration (segment 4282)' },
					'4701/concentration': { uri: '4701/concentration', name: 'concentration (segment 4701)' },
					'4703/concentration': { uri: '4703/concentration', name: 'concentration (segment 4703)' },
					'4705/concentration': { uri: '4705/concentration', name: 'concentration (segment 4705)' },
					'4707/concentration': { uri: '4707/concentration', name: 'concentration (segment 4707)' },
					'4709/concentration': { uri: '4709/concentration', name: 'concentration (segment 4709)' },
					'3179/concentration': { uri: '3179/concentration', name: 'concentration (segment 3179)' },
					'4712/concentration': { uri: '4712/concentration', name: 'concentration (segment 4712)' },
					'4713/concentration': { uri: '4713/concentration', name: 'concentration (segment 4713)' },
					'4764/concentration': { uri: '4764/concentration', name: 'concentration (segment 4764)' },
					'4813/concentration': { uri: '4813/concentration', name: 'concentration (segment 4813)' },
					'4862/concentration': { uri: '4862/concentration', name: 'concentration (segment 4862)' },
					'4911/concentration': { uri: '4911/concentration', name: 'concentration (segment 4911)' },
					'4958/concentration': { uri: '4958/concentration', name: 'concentration (segment 4958)' },
					'5005/concentration': { uri: '5005/concentration', name: 'concentration (segment 5005)' },
					'5052/concentration': { uri: '5052/concentration', name: 'concentration (segment 5052)' },
					'5099/concentration': { uri: '5099/concentration', name: 'concentration (segment 5099)' },
					'5146/concentration': { uri: '5146/concentration', name: 'concentration (segment 5146)' },
					'5193/concentration': { uri: '5193/concentration', name: 'concentration (segment 5193)' },
					'5240/concentration': { uri: '5240/concentration', name: 'concentration (segment 5240)' },
					'5287/concentration': { uri: '5287/concentration', name: 'concentration (segment 5287)' },
					'5289/concentration': { uri: '5289/concentration', name: 'concentration (segment 5289)' },
					'5291/concentration': { uri: '5291/concentration', name: 'concentration (segment 5291)' },
					'5338/concentration': { uri: '5338/concentration', name: 'concentration (segment 5338)' },
					'5385/concentration': { uri: '5385/concentration', name: 'concentration (segment 5385)' },
					'5432/concentration': { uri: '5432/concentration', name: 'concentration (segment 5432)' },
					'5479/concentration': { uri: '5479/concentration', name: 'concentration (segment 5479)' },
					'5526/concentration': { uri: '5526/concentration', name: 'concentration (segment 5526)' },
					'5573/concentration': { uri: '5573/concentration', name: 'concentration (segment 5573)' },
					'5612/concentration': { uri: '5612/concentration', name: 'concentration (segment 5612)' },
					'5651/concentration': { uri: '5651/concentration', name: 'concentration (segment 5651)' },
					'5653/concentration': { uri: '5653/concentration', name: 'concentration (segment 5653)' },
					'5655/concentration': { uri: '5655/concentration', name: 'concentration (segment 5655)' },
					'5667/concentration': { uri: '5667/concentration', name: 'concentration (segment 5667)' },
					'5679/concentration': { uri: '5679/concentration', name: 'concentration (segment 5679)' },
					'5806/concentration': { uri: '5806/concentration', name: 'concentration (segment 5806)' },
					'5858/concentration': { uri: '5858/concentration', name: 'concentration (segment 5858)' },
					'5860/concentration': { uri: '5860/concentration', name: 'concentration (segment 5860)' },
					'5862/concentration': { uri: '5862/concentration', name: 'concentration (segment 5862)' },
					'5864/concentration': { uri: '5864/concentration', name: 'concentration (segment 5864)' },
					'5866/concentration': { uri: '5866/concentration', name: 'concentration (segment 5866)' },
					'6030/concentration': { uri: '6030/concentration', name: 'concentration (segment 6030)' },
					'6036/concentration': { uri: '6036/concentration', name: 'concentration (segment 6036)' },
					'6042/concentration': { uri: '6042/concentration', name: 'concentration (segment 6042)' },
					'6048/concentration': { uri: '6048/concentration', name: 'concentration (segment 6048)' },
					'6054/concentration': { uri: '6054/concentration', name: 'concentration (segment 6054)' },
					'6084/concentration': { uri: '6084/concentration', name: 'concentration (segment 6084)' },
					'6114/concentration': { uri: '6114/concentration', name: 'concentration (segment 6114)' },
					'6144/concentration': { uri: '6144/concentration', name: 'concentration (segment 6144)' },
					'6174/concentration': { uri: '6174/concentration', name: 'concentration (segment 6174)' },
					'6204/concentration': { uri: '6204/concentration', name: 'concentration (segment 6204)' },
					'6234/concentration': { uri: '6234/concentration', name: 'concentration (segment 6234)' },
					'6250/concentration': { uri: '6250/concentration', name: 'concentration (segment 6250)' },
					'6280/concentration': { uri: '6280/concentration', name: 'concentration (segment 6280)' },
					'6310/concentration': { uri: '6310/concentration', name: 'concentration (segment 6310)' },
					'6329/concentration': { uri: '6329/concentration', name: 'concentration (segment 6329)' },
					'6888/concentration': { uri: '6888/concentration', name: 'concentration (segment 6888)' }
				},
				values: {}
			}
		];


		iface.simulationModels = function () {
			return $q.when(SIMULATION_MODELS);
		};


		//////////////////// Variables /////////////////////////////////////////////////////////////////////////////////

		var FMA_ID_TO_VARIABLES = {
			'24tile:60000010': [ 'membrane/i_Na', 'membrane/i_S', 'membrane/i_x1',
			                     'membrane/i_K1', 'membrane/Istim', 'membrane/V' ],
			'2400': [/*'2400/flow', '2400/pressure',*/ '2400/concentration'],
			'2401': [/*'2401/flow', '2401/pressure',*/ '2401/concentration'],
			'2567': [/*'2567/flow', '2567/pressure',*/ '2567/concentration'],
			'2651': [/*'2651/flow', '2651/pressure',*/ '2651/concentration'],
			'3774': [/*'3774/flow', '3774/pressure',*/ '3774/concentration'],
			'4282': [/*'4282/flow', '4282/pressure',*/ '4282/concentration'],
			'4701': [/*'4701/flow', '4701/pressure',*/ '4701/concentration'],
			'4703': [/*'4703/flow', '4703/pressure',*/ '4703/concentration'],
			'4705': [/*'4705/flow', '4705/pressure',*/ '4705/concentration'],
			'4707': [/*'4707/flow', '4707/pressure',*/ '4707/concentration'],
			'4709': [/*'4709/flow', '4709/pressure',*/ '4709/concentration'],
			'3179': [/*'3179/flow', '3179/pressure',*/ '3179/concentration'],
			'4712': [/*'4712/flow', '4712/pressure',*/ '4712/concentration'],
			'4713': [/*'4713/flow', '4713/pressure',*/ '4713/concentration'],
			'4764': [/*'4764/flow', '4764/pressure',*/ '4764/concentration'],
			'4813': [/*'4813/flow', '4813/pressure',*/ '4813/concentration'],
			'4862': [/*'4862/flow', '4862/pressure',*/ '4862/concentration'],
			'4911': [/*'4911/flow', '4911/pressure',*/ '4911/concentration'],
			'4958': [/*'4958/flow', '4958/pressure',*/ '4958/concentration'],
			'5005': [/*'5005/flow', '5005/pressure',*/ '5005/concentration'],
			'5052': [/*'5052/flow', '5052/pressure',*/ '5052/concentration'],
			'5099': [/*'5099/flow', '5099/pressure',*/ '5099/concentration'],
			'5146': [/*'5146/flow', '5146/pressure',*/ '5146/concentration'],
			'5193': [/*'5193/flow', '5193/pressure',*/ '5193/concentration'],
			'5240': [/*'5240/flow', '5240/pressure',*/ '5240/concentration'],
			'5287': [/*'5287/flow', '5287/pressure',*/ '5287/concentration'],
			'5289': [/*'5289/flow', '5289/pressure',*/ '5289/concentration'],
			'5291': [/*'5291/flow', '5291/pressure',*/ '5291/concentration'],
			'5338': [/*'5338/flow', '5338/pressure',*/ '5338/concentration'],
			'5385': [/*'5385/flow', '5385/pressure',*/ '5385/concentration'],
			'5432': [/*'5432/flow', '5432/pressure',*/ '5432/concentration'],
			'5479': [/*'5479/flow', '5479/pressure',*/ '5479/concentration'],
			'5526': [/*'5526/flow', '5526/pressure',*/ '5526/concentration'],
			'5573': [/*'5573/flow', '5573/pressure',*/ '5573/concentration'],
			'5612': [/*'5612/flow', '5612/pressure',*/ '5612/concentration'],
			'5651': [/*'5651/flow', '5651/pressure',*/ '5651/concentration'],
			'5653': [/*'5653/flow', '5653/pressure',*/ '5653/concentration'],
			'5655': [/*'5655/flow', '5655/pressure',*/ '5655/concentration'],
			'5667': [/*'5667/flow', '5667/pressure',*/ '5667/concentration'],
			'5679': [/*'5679/flow', '5679/pressure',*/ '5679/concentration'],
			'5806': [/*'5806/flow', '5806/pressure',*/ '5806/concentration'],
			'5858': [/*'5858/flow', '5858/pressure',*/ '5858/concentration'],
			'5860': [/*'5860/flow', '5860/pressure',*/ '5860/concentration'],
			'5862': [/*'5862/flow', '5862/pressure',*/ '5862/concentration'],
			'5864': [/*'5864/flow', '5864/pressure',*/ '5864/concentration'],
			'5866': [/*'5866/flow', '5866/pressure',*/ '5866/concentration'],
			'6030': [/*'6030/flow', '6030/pressure',*/ '6030/concentration'],
			'6036': [/*'6036/flow', '6036/pressure',*/ '6036/concentration'],
			'6042': [/*'6042/flow', '6042/pressure',*/ '6042/concentration'],
			'6048': [/*'6048/flow', '6048/pressure',*/ '6048/concentration'],
			'6054': [/*'6054/flow', '6054/pressure',*/ '6054/concentration'],
			'6084': [/*'6084/flow', '6084/pressure',*/ '6084/concentration'],
			'6114': [/*'6114/flow', '6114/pressure',*/ '6114/concentration'],
			'6144': [/*'6144/flow', '6144/pressure',*/ '6144/concentration'],
			'6174': [/*'6174/flow', '6174/pressure',*/ '6174/concentration'],
			'6204': [/*'6204/flow', '6204/pressure',*/ '6204/concentration'],
			'6234': [/*'6234/flow', '6234/pressure',*/ '6234/concentration'],
			'6250': [/*'6250/flow', '6250/pressure',*/ '6250/concentration'],
			'6280': [/*'6280/flow', '6280/pressure',*/ '6280/concentration'],
			'6310': [/*'6310/flow', '6310/pressure',*/ '6310/concentration'],
			'6329': [/*'6329/flow', '6329/pressure',*/ '6329/concentration'],
			'6888': [/*'6888/flow', '6888/pressure',*/ '6888/concentration']
		};



		iface.fmaIdToVariables = function (id) {
			if (_(id).isUndefined()) {
				return $q.when(FMA_ID_TO_VARIABLES);
			}
			return $q.when(FMA_ID_TO_VARIABLES[id] || []);
		};


		////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		return iface;
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
