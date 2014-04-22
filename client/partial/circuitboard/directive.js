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
	'partial/circuitboard/graph/directive',
	'partial/circuitboard/variable-glyphs/directive',
	'partial/circuitboard/threed/directive'
], function (_, ng, ApiNATOMY) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	ApiNATOMY.directive('amyCircuitboard', ['ResourceService', function (ResourceService) {
		return {

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			restrict   : 'E',
			replace    : false,
			templateUrl: 'partial/circuitboard/view.html',

			controller: ['$scope', '$rootScope', function ($scope, $rootScope) {

				$scope._ = _;

				//////////////////// Tile hierarchy ////////////////////////////////////////////////////////////////////

				$scope.thisTile = $scope;
				$scope.rootTile = $scope;
				$scope.childTiles = [];


				//////////////////// Tile focus ////////////////////////////////////////////////////////////////////////

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


				//////////////////// Tile activation ///////////////////////////////////////////////////////////////////

				$scope.activeQueueByEntity = {};
				$scope.activeTileJunctions = {};
				$scope.activeTile3Ds = {};

				$scope.registerTile = function (tile) {
					if (!_($scope.activeQueueByEntity[tile.entity._id]).isArray()) {
						$scope.activeQueueByEntity[tile.entity._id] = [];
					}

					_(tile).derivedProperty('activatable', function () {
						return _($scope.activeQueueByEntity[tile.entity._id]).contains(tile);
					}, function (activatable) {
						if (!!tile.activatable !== !!activatable) {
							if (activatable) {
								$scope.activeQueueByEntity[tile.entity._id].push(tile);
								if (tile.active) {
									$scope.activeTileJunctions[tile.entity._id] = tile.junction;
									$scope.activeTile3Ds[tile.entity._id] = tile.tile3D;
								}
							} else {
								var wasActive = tile.active;
								_($scope.activeQueueByEntity[tile.entity._id]).pull(tile);
								if (wasActive) {
									delete $scope.activeTileJunctions[tile.entity._id];
									delete $scope.activeTile3Ds[tile.entity._id];
								}
							}
						}
					});

					_(tile).derivedProperty('active', function () {
						return $scope.activeQueueByEntity[tile.entity._id][0] === tile;
					}, function (active) {
						if (active) {
							if (!tile.active) {
								var previouslyActiveTile = $scope.activeQueueByEntity[tile.entity._id][0];
								$scope.activeQueueByEntity[tile.entity._id].unshift(tile);
								$scope.activeTileJunctions[tile.entity._id] = tile.junction;
								$scope.activeTile3Ds[tile.entity._id] = tile.tile3D;
								if (previouslyActiveTile) {
									delete $scope.activeTileJunctions[previouslyActiveTile.entity._id];
									delete $scope.activeTile3Ds[previouslyActiveTile.entity._id];
								}
							}
						} else {
							console.error('$scope.active should not be explicitly set to false.');
						}
					});
				};


				//////////////////// Initialization ////////////////////////////////////////////////////////////////////

				$scope.open = true;

				$scope.children = ResourceService.entities(
						_.chain(_.range(60000001, 60000024 + 1)).map(function (nr) {
							return '24tile:' + nr
						}).value()
				);


				//////////////////// Broadcasting a redraw event ///////////////////////////////////////////////////////

				$scope.onTreemapRedraw = function () {
					$scope.$broadcast('treemap-redraw');
				};

			}],

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			compile: function () {
				return {

					pre: function preLink(/*$scope, iElement, iAttrs, controller*/) {
					},

					post: function postLink($scope, iElement/*, iAttrs, controller*/) {
						$scope.cbElement = iElement.find('.amy-flat-circuitboard');

						$scope.$root.$watch('threeDEnabled', function (isEnabled, wasEnabled) {
							if (wasEnabled && !isEnabled) {
								$scope.cbElement.prependTo(iElement);
							}
						});
					}

				};
			}

			////////////////////////////////////////////////////////////////////////////////////////////////////////////
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
