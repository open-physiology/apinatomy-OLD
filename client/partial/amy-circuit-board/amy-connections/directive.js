'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['angular', 'app/module', 'resource/service'], function (ng, app) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	app.directive('amyConnections', ['$bind', 'ResourceService', function ($bind, ResourceService) {
		return {
			restrict:    'A',
			scope:       true,
			controller: ['$scope', function ($scope) {
				$scope.circuitBoard.graphLayer.then.graphLayer.then(function (graphLayer) {
					var graphGroup = graphLayer.newGraphGroup();

					var registeredTileJunctions = [];

					var vascularConnections = {
						registerTileJunction: function registerTileJunction(tileJunction) {

							registeredTileJunctions.push(tileJunction);



						}
					};


					function updateGraph() {
						ResourceService.paths(_.map(registeredTileJunctions, function (junction) {
							return junction.entity._id;
						})).then(function (paths) {





						});
					}


					$scope.circuitBoard.vascularConnectionsDeferred.resolve(vascularConnections);

				});
			}]
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
