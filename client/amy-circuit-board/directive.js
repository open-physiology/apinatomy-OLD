'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module', 'lodash', 'amy-circuit-board/CircuitBoardArtefact',
        'css!amy-circuit-board/style',
        '$bind/service',
        'amy-circuit-board/amy-tile-map/directive',
        'amy-circuit-board/amy-tile/directive',
        'amy-circuit-board/amy-graph-layer/directive',
        'amy-circuit-board/amy-connections/directive',
        'amy-circuit-board/amy-3d-layer/directive'], function (app, _, CircuitBoardArtefact) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	app.directive('amyCircuitBoard', ['$q', '$window', '$bind', function ($q, $window, $bind) {
		return {
			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			restrict:    'E',
			replace:     true,
			templateUrl: 'amy-circuit-board/view.html',
			require:     'ngModel',
			scope:       true,

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			compile: function () {
				return {
					pre: function preLink($scope, iElement, iAttrs, ngModel) {
						iElement.attr('amy-circuit-board', '');

						//////////////////// Artefact Hierarchy ////////////////////////////////////////////////////

						$scope.circuitBoard =
						$scope.artefact = new CircuitBoardArtefact({
							id:       $scope.$id,
							entity:   null, // to be set
							$scope:   $scope,
							position: {
								top:    0,
								left:   0,
								height: null, // to be set
								width:  null  // to be set
							}
						});


						//////////////////// Keeping Track of Circuit-board Position and Size //////////////////////////

						//// The circuitboard position is the main reference position for all its tiles

						$($window).on('resize', $bind(function onWindowResize() {
							_($scope.circuitBoard.position).assign({
								height: iElement.height(),
								width:  iElement.width()
							});
						}, { checkPhase: true })); // because window resize can be triggered synchronously


						//////////////////// Getting the model value ///////////////////////////////////////////////////

						ngModel.$render = function () {
							$scope.entity = $scope.circuitBoard.entity = ngModel.$modelValue;
						};


						//////////////////// Inter-module communication ////////////////////////////////////////////////

						$scope.flatCircuitBoardElement = iElement.children('.flat-circuit-board');

						$scope.graphLayerDeferred = $q.defer();
						$scope.circuitBoard.graphLayer = $scope.graphLayerDeferred.promise;

						$scope.connectionsDeferred = $q.defer();
						$scope.circuitBoard.connections = $scope.connectionsDeferred.promise;

						$scope.threeDLayer = null;

					}
				};
			}

			////////////////////////////////////////////////////////////////////////////////////////////////////////////
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
