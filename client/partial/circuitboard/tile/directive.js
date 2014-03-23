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


	ApiNATOMY.directive('amyCircuitboardTile', ['$bind', 'ResourceService', 'RecursionHelper', 'defaults', function ($bind, Resources, RecursionHelper, defaults) {

		var generateStylingDefaults = defaults({
			normal: {
				css:     {
					'&':           {
						backgroundColor: " bgColor                                                                           ",
						borderColor:     " color(`.normal.css['&'].backgroundColor`).brighten(20).css()                      ",
						color:           " color(`.normal.css['&'].backgroundColor`).luminance() > 0.5 && 'black' || 'white' ",
						borderWidth:     " '1px' "
					},
					'& > header':  {
						borderColor: " `.normal.css['&'].borderColor` ",
						borderWidth: " `.normal.css['&'].borderWidth` "
					},
					'& > section': " {} "
				},
				layout:  " 'rowsOfTiles' ",
				spacing: " '2' "
			},
			focus:  {
				css:     {
					'&':           {
						backgroundColor: " color(`.normal.css['&'].backgroundColor`).brighten(40).css()                      ",
						borderColor:     " color(`.normal.css['&'].borderColor`).darken(40).css()                            ",
						color:           " color(`.focus .css['&'].backgroundColor`).luminance() > 0.5 && 'black' || 'white' ",
						borderWidth:     " `.normal.css['&'].borderWidth` "
					},
					'& > header':  {
						borderColor: " `.focus.css['&'].borderColor` ",
						borderWidth: " `.focus.css['&'].borderWidth` "
					},
					'& > section': " `.normal.css['& > section']` "
				},
				layout:  "`.normal.layout`",
				spacing: "`.normal.spacing`"
			}
		});


		return {
			restrict:    'E',
			replace:     false,
			templateUrl: 'partial/circuitboard/tile/view.html',
			scope:       {
				entity: '=amyEntity'
			},

			////////////////////////////////////////////////////////////////////////////////////////////////////////////
			////////////////////////////////////////////////////////////////////////////////////////////////////////////
			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			controller: ['$scope', function ($scope) {

				//// basic initialization

				$scope._ = _; // TODO: find a way to do this once for all $scope's


				//////////////////// Tile Hierarchy ////////////////////////////////////////////////////////////////////

				//// The treemap of the tiles is reflected by linking their $scope's as follows:

				$scope.thisTile = $scope;
				$scope.parentTile = $scope.$parent.thisTile;
				$scope.rootTile = $scope.parentTile.rootTile;
				$scope.childTiles = [];
				$scope.parentTile.childTiles.push($scope);


				//////////////////// Tile Condition ////////////////////////////////////////////////////////////////////

				//// The condition of a tile can be 'hidden', 'closed', 'open' or 'maximized'. It starts 'closed'.

				$scope.condition = 'closed';


				//////////////////// Tile Weight ///////////////////////////////////////////////////////////////////////

				_($scope).derivedProperty('weight', function () {
					if ($scope.condition === 'hidden') { return 0; }
					if ($scope.condition === 'closed') { return 1; }
					if ($scope.condition === 'open') { return 8; }
					if ($scope.condition === 'maximized') { return Infinity; }
					console.error("An unknown condition was set: $scope.condition =", $scope.condition);
				});


				//////////////////// Focused Tiles /////////////////////////////////////////////////////////////////////

				$scope.mouseOver = false;


				//// The 'focus chain' is the root tile up to the deepest tile with focus.
				//// A tile has focus if the mouse is hovering over it (perhaps indirectly),
				//// or if it is maximized and its parent has focus.

				$scope.recursivelyBuiltFocusChain = function () {
					if ($scope.mouseOver || $scope.condition === 'maximized') {

						var bundle = {
							entity:  $scope.entity,
							styling: $scope.styling
						};

						if ($scope.open) {
							var subChain = [];
							_($scope.childTiles).forEach(function (childTile) {
								subChain = childTile.recursivelyBuiltFocusChain();
								if (!_(subChain).isEmpty()) { return false; }
							});
							return [bundle].concat(subChain);
						} else {
							// this case is not functionally
							// required but it helps for speed
							return [bundle];
						}
					} else {
						return [];
					}
				};

				//// Whenever the mouseOver status changes, recalculate
				//// the focus chain of the entire circuitboard.

				$scope.$watch('mouseOver', function () {
					$scope.rootTile.buildFocusChain();
				});

				//// The state of a tile can be 'normal' or 'focus'. It starts 'normal'.
				//// This determines the style / color.

				$scope.state = 'normal';

				//// When this tile gets a signal about a new focus chain,
				//// adjust its styling to whether it is the main tile in focus.

				$scope.$on('entity-focus', function localFocus(event, focusChain) {
					$scope.state = (!_(focusChain).isEmpty() && $scope.condition !== 'maximized' && $scope.entity === focusChain[focusChain.length - 1].entity)
							? 'focus'
							: 'normal';
				});


				//////////////////// Opening / Closing Tiles ///////////////////////////////////////////////////////////

				//// deriving $scope.open

				_($scope).derivedProperty('open', function () {
					return $scope.condition === 'open' || $scope.condition === 'maximized';
				}, function (shouldBeOpen) {
					if (shouldBeOpen && !$scope.open) {
						$scope.condition = 'open';
					} else if (!shouldBeOpen && $scope.open) {
						$scope.condition = 'closed';
					}
				});


				//// when a tile is closed, close all sub-tiles

				$scope.recursivelyCloseTile = function () {
					$scope.open = false;
					_($scope.childTiles).forEach(function (childTile) {
						childTile.recursivelyCloseTile();
					});
				};
				$scope.$watch('open', function (isOpen, wasOpen) {
					if (wasOpen && !isOpen) {
						$scope.recursivelyCloseTile();
					}
				});


				//// open a tile when clicked

				$scope.onClick = function ($event) {
					$event.stopPropagation();
					$scope.entity._promise.then(function () {
						Resources.bundles(_.map($scope.entity.sub, function (sub) { return sub.entity._id; }));
					});
					$scope.open = !$scope.open;
				};


				//////////////////// Active Tiles //////////////////////////////////////////////////////////////////////

				//// If there are any tiles present representing an entity, exactly one of them is 'active'.
				//// To keep track of this, we register all activatable to the root tile by their entity id.

				if (!_($scope.rootTile.activeQueueByEntity[$scope.entity._id]).isArray()) {
					$scope.rootTile.activeQueueByEntity[$scope.entity._id] = [];
				}

				_($scope).derivedProperty('activatable', function () {
					return _($scope.rootTile.activeQueueByEntity[$scope.entity._id]).contains($scope);
				}, function (activatable) {
					if (activatable) {
						$scope.rootTile.activeQueueByEntity[$scope.entity._id].push($scope);
					} else {
						_($scope.rootTile.activeQueueByEntity[$scope.entity._id]).pull($scope);
					}
				});

				_($scope).derivedProperty('active', function () {
					return $scope.rootTile.activeQueueByEntity[$scope.entity._id][0] === $scope;
				}, function (active) {
					if (active) {
						$scope.rootTile.activeQueueByEntity[$scope.entity._id].unshift($scope);
					} else {
						console.error('$scope.active should not be explicitly set to false.');
					}
				});

				//// A tile can only be explicitly activated by being opened.

				$scope.$watch('open', function (isOpen, wasOpen) {
					if (!wasOpen && isOpen) { $scope.active = true; }
				});

				//// When a tile is deactivated, it is closed.

				$scope.$watch('active', function (active) {
					if (!active) { $scope.open = false; }
				});

				//// A tile is activatable when its parent is open.

				if ($scope.parentTile !== $scope.rootTile) {
					$scope.$watch('parentTile.open', function (parentIsOpen) {
						$scope.activatable = parentIsOpen;
					});
				} else { // upper level tiles are always visible, thus always activatable
					$scope.activatable = true;
				}


				_($scope).derivedProperty('visible', function () {
					return $scope.parentTile.open;
				});

				//


				//// gathering all entities that have actively open, visible tiles
				// TODO
//				$scope.findVisibleEntities = function () {
//					var result = {};
//					_($scope.childTiles).forEach(function (childTile) {
//						result.assign(childTile.findVisibleEntities());
//					});
//					return result;
//				};


			}],

			////////////////////////////////////////////////////////////////////////////////////////////////////////////
			////////////////////////////////////////////////////////////////////////////////////////////////////////////
			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			compile: function (dElement) {
				return RecursionHelper.compile(dElement, {
					pre: function preLink($scope, iElement/*, iAttrs, controller*/) {

						$scope.onTileReady = function () {

							//// identify the element of the tile itself

							var tile = iElement.find('amy-tile');

							$scope.entity._promise.then(function () {

								$scope.styling = generateStylingDefaults($scope.entity.tile, {
									bgColor: ($scope.parentTile.entity) ?
									         (color($scope.parentTile.styling.normal.css['&'].backgroundColor).luminance() < .5 ?
									          color($scope.parentTile.styling.normal.css['&'].backgroundColor).brighten(30).css() :
									          color($scope.parentTile.styling.normal.css['&'].backgroundColor).darken(30).css() ) :
									         ('#eeeeee')
								});

								//// put the 'normal' style on the tile now

								tile.putCSS($scope.styling.normal.css);


								//// dynamically applying the right CSS to the tile

								$scope.$watch('state', function (state) {
									tile.putCSS($scope.styling[state].css);
								});

							});
						};

					},

					post: function postLink($scope, iElement, iAttrs, controller) {}
				});
			}
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
