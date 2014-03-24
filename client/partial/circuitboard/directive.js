'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['lodash',
	'angular',
	'app/module',
	'partial/treemap/layout/manager',
	'partial/treemap/layout/predefined',
	'$bind/service',
	'defaults/service',
	'partial/treemap/directive',
	'partial/circuitboard/tile/directive',
	'partial/circuitboard/graph/directive'
], function (_, ng, ApiNATOMY) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	ApiNATOMY.directive('amyCircuitboard', ['ResourceService', function (ResourceService) {
		return {

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			restrict   : 'E',
			replace    : false,
			templateUrl: 'partial/circuitboard/view.html',

			controller: ['$scope', '$rootScope', function ($scope, $rootScope) {

				$scope.thisTile = $scope;
				$scope.rootTile = $scope;
				$scope.childTiles = [];
				$scope.activeQueueByEntity = {};

				$scope.open = true;

				$scope.children = ResourceService.entities(
						_.chain(_.range(60000001, 60000024 + 1)).map(function (nr) {
							return '24tile:' + nr
						}).value()
				);

				$scope.buildFocusChain = function () {
					var focusChain = [];
					_($scope.childTiles).forEach(function (childTile) {
						focusChain = childTile.recursivelyBuiltFocusChain();
						if (!_(focusChain).isEmpty()) {
							return false;
						}
					});
					$rootScope.$broadcast('entity-focus', focusChain);
				};

				$scope.$watchCollection(function (scope) {
					return _(scope.activeQueueByEntity).mapValues(function (entityTiles) {
						return entityTiles[0];
					}).filter().value();
				}, function (activeTiles) {
					$scope.activeTiles = activeTiles;
				});

			}],

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			compile: function () {
				return {

					pre: function preLink($scope, iElement/*, iAttrs, controller*/) {
						var circuitBoardPosition = iElement.offset();
						$scope.globalTilePosition = function (tileScope) {
							console.debug(circuitBoardPosition, tileScope.elementOffset());
							return {
								x: tileScope.elementOffset().left - circuitBoardPosition.left,
								y: tileScope.elementOffset().top - circuitBoardPosition.top
							};
						}
					},

					post: function postLink($scope, iElement, iAttrs, controller) {
					}

				};
			}

			////////////////////////////////////////////////////////////////////////////////////////////////////////////
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
