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


	var WEIGHTS = {
		hidden   : 0,
		closed   : 1,
		open     : 8,
		maximized: Infinity
	};

	ApiNATOMY.directive('amyCircuitboardTile', ['$bind', 'ResourceService', 'RecursionHelper', 'defaults', '$timeout', function ($bind, Resources, RecursionHelper, defaults, $timeout) {

		var generateStylingDefaults = defaults({
			normal: {
				css    : {
					'&'          : {
						backgroundColor: " bgColor                                                                           ",
						borderColor    : " color(`.normal.css['&'].backgroundColor`).brighten(20).css()                      ",
						color          : " color(`.normal.css['&'].backgroundColor`).luminance() > 0.5 && 'black' || 'white' ",
						borderWidth    : " '1px' "
					},
					'& > header' : {
						borderColor: " `.normal.css['&'].borderColor` ",
						borderWidth: " `.normal.css['&'].borderWidth` "
					},
					'& > section': " {} "
				},
				layout : " 'rowsOfTiles' ",
				spacing: " '2' "
			},
			focus : {
				css    : {
					'&'          : {
						backgroundColor: " color(`.normal.css['&'].backgroundColor`).brighten(40).css()                      ",
						borderColor    : " color(`.normal.css['&'].borderColor`).darken(40).css()                            ",
						color          : " color(`.focus .css['&'].backgroundColor`).luminance() > 0.5 && 'black' || 'white' ",
						borderWidth    : " `.normal.css['&'].borderWidth` "
					},
					'& > header' : {
						borderColor: " `.focus.css['&'].borderColor` ",
						borderWidth: " `.focus.css['&'].borderWidth` "
					},
					'& > section': " `.normal.css['& > section']` "
				},
				layout : "`.normal.layout`",
				spacing: "`.normal.spacing`"
			}
		});


		return {
			restrict   : 'E',
			replace    : false,
			templateUrl: 'partial/circuitboard/tile/view.html',
			scope      : {
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
					return WEIGHTS[$scope.condition];
				});


				//////////////////// Focused Tiles /////////////////////////////////////////////////////////////////////

				$scope.mouseOver = false;

				//// The 'focus chain' is the root tile up to the deepest tile with focus.
				//// A tile has focus if the mouse is hovering over it (perhaps indirectly),
				//// or if it is maximized and its parent has focus.

				$scope.recursivelyBuiltFocusChain = function () {
					if ($scope.mouseOver || $scope.condition === 'maximized') {

						var bundle = {
							entity : $scope.entity,
							styling: $scope.styling
						};

						if ($scope.open) {
							var subChain = [];
							_($scope.childTiles).forEach(function (childTile) {
								subChain = childTile.recursivelyBuiltFocusChain();
								if (!_(subChain).isEmpty()) {
									return false;
								}
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
						Resources.entities(_.map($scope.entity.sub, function (sub) {
							return sub.entity._id;
						}));
					});
					$scope.open = !$scope.open;
				};

				//// a tile is visible when its parent is open

				_($scope).derivedProperty('visible', function () {
					return $scope.parentTile.open && $scope.position.height > 0 && $scope.position.width > 0;
				});

				//////////////////// Active Tiles //////////////////////////////////////////////////////////////////////

				//// Given an entity, if there are tiles present that represent it, exactly one of them is active.
				//// To keep track of this, we communicate with the root tile, which gives it the
				//// 'active' and 'activatable' properties.

				$scope.rootTile.registerTile($scope);


				//// A tile can be explicitly activated by being opened:

				$scope.$watch('open', function (isOpen, wasOpen) {
					if (!wasOpen && isOpen) {
						$scope.active = true;
					}
				});

				//// When a tile is deactivated, it is closed.

				$scope.$watch('active', function (active) {
					if (!active) {
						$scope.open = false;
					}
				});

				//// A tile is activatable whenever it is visible.

				$scope.$watch('visible', function (visible) {
					$scope.activatable = visible;
				});


				//////////////////// Tile Position /////////////////////////////////////////////////////////////////////

				//// initialize tile position info

				$scope.position = {
					top: 0,
					left: 0,
					height: 0,
					width: 0
				};

				//// after it redraws, record its coordinates

				$scope.afterTileReposition = function (position) {
					_($scope.position).assign(position);
				};

			}],

			////////////////////////////////////////////////////////////////////////////////////////////////////////////
			////////////////////////////////////////////////////////////////////////////////////////////////////////////
			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			compile: function (dElement) {
				return RecursionHelper.compile(dElement, {
					pre: function preLink($scope, iElement/*, iAttrs, controller*/) {



						$scope.element = function () {
							return iElement.find('> amy-tile');
						};

						$scope.onTileReady = function () {

							//// identify the element of the tile itself

							var tile = $scope.element();

							//// styling

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
	}])
	;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
})
;/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
