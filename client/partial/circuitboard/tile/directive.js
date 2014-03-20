'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['angular',
        'app/module',
        'chroma',
        'lodash',
        'partial/treemap/layout/manager',
        'resource/service',
        '$bind/service'], function (ng, ApiNATOMY, color, _) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	ApiNATOMY.directive('amyCircuitboardTile', ['$bind', 'ResourceService', 'RecursionHelper', function ($bind, Resources, RecursionHelper) {

		return {
			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			restrict:    'E',
			replace:     false,
			templateUrl: 'partial/circuitboard/tile/view.html',
			scope:       {
				entity: '=amyEntity'
			},

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			controller: ['$scope', '$rootScope', function ($scope, $rootScope) {

				$scope._ = _;


				//// the tile hierarchy

				$scope.rootTile = $scope.$parent.rootTile;
				$scope.childTiles = [];
				$scope.parentTile = $scope.$parent;
				$scope.parentTile.childTiles.push($scope);


				//// initialization

				$scope.state = 'normal';
				$scope.condition = 'closed';
				$scope.mouseOver = false;


				//// deriving $scope.open from $scope.condition

				$scope.$watch("condition === 'open' || condition === 'maximized'", function deriveOpenFromCondition(open) {
					$scope.open = open;
				});


				//// when a tile is closed, close all sub-tiles

				$scope.recursivelyCloseTile = function () {
					if ($scope.open) {
						$scope.condition = 'closed';
					}
					_($scope.childTiles).forEach(function (childTile) {
						childTile.recursivelyCloseTile();
					});
				};

				$scope.$watch('open', function (isOpen, wasOpen) {
					if (wasOpen && !isOpen) {
						$scope.recursivelyCloseTile();
					}
				});


				//// deriving $scope.weight

				$scope.$watch('condition', function deriveWeight(condition) {
					if (condition === 'hidden') { $scope.weight = 0; }
					else if (condition === 'closed') { $scope.weight = 1; }
					else if (condition === 'open') { $scope.weight = 8; }
					else if (condition === 'maximized') { $scope.weight = Infinity; }
				});


				//// managing focus

				$scope.recursivelyBuiltFocusChain = function () {
					if ($scope.mouseOver || $scope.condition === 'maximized') {
						var focusSubChain = [];
						if ($scope.open) { // this test is not functionally required but helps for speed
							_($scope.childTiles).forEach(function (childTile) {
								focusSubChain = childTile.recursivelyBuiltFocusChain();
								if (!_(focusSubChain).isEmpty()) { return false; }
							});
							return [$scope.entity].concat(focusSubChain);
						} else {
							return [$scope.entity];
						}
					} else {
						return [];
					}
				};

				$scope.$watch('mouseOver', function () {
					$scope.rootTile.buildFocusChain();
				});


				$scope.$on('entity-focus', function localFocus(event, entities) {
					$scope.state = ($scope.entity === entities[entities.length - 1]) ? 'focus' : 'normal';
				});


				//// responding to clicks

				$scope.onClick = function ($event) {
					$event.stopPropagation();
					$scope.entity._promise.then(function () {
						Resources.entities(_.map($scope.entity.sub, function (sub) { return sub.entity._id; }));
					});
					$scope.condition = ($scope.condition === 'closed' ? 'open' : 'closed');
				};


			}],

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			compile: function (dElement) {
				return RecursionHelper.compile(dElement, {
					pre: function preLink($scope, iElement/*, iAttrs, controller*/) {

						//// Dynamically applying the right CSS to the tile

						$scope.onTileReady = function () {
							$scope.entity._promise.then(function () {

								var elements = {};

								_($scope.entity.tile).pick('normal', 'focus').forOwn(function (stateTile) {
									_(stateTile.css).forOwn(function (css, selector) {
										elements[selector] = iElement.find(selector.replace('&', 'amy-tile'));
									});
								});

								_($scope.entity.tile.normal.css).forOwn(function (css, selector) {
									elements[selector].css(css);
								});

								$scope.$watch('state', function (state) {
									_($scope.entity.tile[state].css).forOwn(function (css, selector) {
										elements[selector].css(css);
									});
								});

							});
						};

					},

					post: function postLink($scope, iElement, iAttrs, controller) {}
				});
			}

			////////////////////////////////////////////////////////////////////////////////////////////////////////////
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
