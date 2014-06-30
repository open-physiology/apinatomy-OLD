'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module', 'simulation/CellMLSimulation', 'css!top-nav/style'], function (app) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	app.directive('amyTopNav', ['ResourceService', 'CellMLSimulation', function (ResourceService, CellMLSimulation) {
		return {
			restrict   : 'E',
			replace    : true,
			templateUrl: 'top-nav/view.html',
			scope: false,
			controller: function ($scope) {

				//////////////////// Search ////////////////////////////////////////////////////////////////////////////

				$scope.getSearchResults = function getSearchResults($viewValue) {
					return ResourceService.search($viewValue);
				};

				var entitiesUnderAttention = [];

				function clearAttention() {
					_(entitiesUnderAttention).forEach(function (entity) {
						entity._searchResult = false;
					});
					entitiesUnderAttention = [];
				}

				$scope.$watch('entitySearch', function (entity) {
					clearAttention();
					if (entity && entity._id) {
						ResourceService.ancestors(entity._id).then(function (ancestors) {
							ancestors.push(entity._id);
							entitiesUnderAttention = ResourceService.entities(ancestors);
							_(entitiesUnderAttention).forEach(function (e) {
								e._searchResult = true;

								// FIXME: debug output requested by Bernard to find the right paths
								e._promise.then(function (ent) {
									console.log(ent.name + ' (' + ent._id + ')');
								});
							});
						}).catch(function (err) {
							console.error(err);
						});
					}
				});


				//////////////////// Search ////////////////////////////////////////////////////////////////////////////

				ResourceService.simulationModels().then(function (simulationModels) {
					$scope.simulationModels = simulationModels;
				});

				var modelUriToSimulation = {};

				$scope.$watch('$root.simulationModel', function onNewSimulationModel(model) {
					if (model) {
						if (!modelUriToSimulation[model.uri]) {
							modelUriToSimulation[model.uri] = new CellMLSimulation(model, 100, 20);
						}
						$scope.$root.simulation = modelUriToSimulation[model.uri];
					} else {
						$scope.$root.simulation = null;
					}
				});

			}
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
