'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['angular',
	'app/module',
	'chroma',
	'lodash',
	'partial/icon-btn/directive',
	'partial/font-fit/directive',
	'resource/service',
	'$bind/service'], function (ng, app, color, _) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	app.directive('amyTile', ['$bind', 'ResourceService', 'RecursionHelper', 'defaults', function ($bind, Resources, RecursionHelper, defaults) {

		////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		var generateTileDefaults = defaults({
			normal: {
				css: {
					'&'           : {
						backgroundColor: " bgColor                                                                           ",
						borderColor    : " color(`.normal.css['&'].backgroundColor`).brighten(20).css()                      ",
						color          : " color(`.normal.css['&'].backgroundColor`).luminance() > 0.5 && 'black' || 'white' "
					},
					'& > icon-btn': {
						backgroundColor: " `.normal.css['&'].backgroundColor` "
					},
					'& > header'  : {
						borderColor: " `.normal.css['&'].borderColor` "
					}
				}
			},
			focus : {
				css: {
					'&'           : {
						backgroundColor: " color(`.normal.css['&'].backgroundColor`).brighten(40).css()                      ",
						borderColor    : " color(`.normal.css['&'].borderColor`).darken(40).css()                            ",
						color          : " color(`.focus .css['&'].backgroundColor`).luminance() > 0.5 && 'black' || 'white' "
					},
					'& > icon-btn': {
						backgroundColor: " `.focus.css['&'].backgroundColor` "
					},
					'& > header'  : {
						borderColor: " `.focus.css['&'].borderColor` "
					}
				}
			}
		});

		////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		return {
			restrict   : 'E',
			replace    : true,
			templateUrl: 'partial/amy-tile-map/tile/view.html',
			require    : 'ngModel',
			scope      : true,

			////////////////////////////////////////////////////////////////////////////////////////////////////////////
			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			compile: function (dElement) {
				return RecursionHelper.compile(dElement, {

					pre: function preLink($scope, iElement, iAttrs, ngModel) {
						iElement.attr('amy-tile', '');

						//////////////////// Getting the model value ///////////////////////////////////////////////////

						ngModel.$render = function () {
							$scope.subEntity = ngModel.$modelValue;
							$scope.entity = $scope.subEntity.entity;

							//////////////////// Tile / Artefact Interface /////////////////////////////////////////////

							$scope.tile =
							$scope.artefact = {
								id            : $scope.$id,
								type          : 'tile',
								show          : true,

								//// artefact hierarchy:
								parent        : $scope.$parent.artefact,
								relationType  : $scope.subEntity.type,
								children      : [],
								root          : $scope.$parent.artefact.root,

								//// entity:
								entity        : $scope.entity,
								active        : true,
								focus         : false,

								//// properties:
								open          : false,
								maximized     : false,
								hidden        : false,
								maximizedChild: null,

								//// 3D-model related properties:
								has3DModel    : false,
								show3DModel   : false
							};


							//////////////////// Maintaining the Hierarchy /////////////////////////////////////////////

							//// Announce this tile to the parent artefact
							//
							$scope.artefact.parent.children.push($scope.artefact);

							//// Find the parent tile (if any)
							//
							$scope.tile.parentTile = $scope.tile.parent;
							while ($scope.tile.parentTile && $scope.tile.parentTile.type !== 'tile') {
								$scope.tile.parentTile = $scope.tile.parentTile.parent;
							}

							//// Remove references to this tile when it is destroyed
							//
							$scope.$on('$destroy', function () {
								_($scope.tile.parent).pull($scope.tile);
								if ($scope.tile.parentTile && $scope.tile.parentTile.maximizedChild === $scope.tile) {
									$scope.tile.parentTile.maximizedChild = null;
								}
							});


							//////////////////// Managing Active / Inactive Tiles //////////////////////////////////////

							//// Given an entity, if there are tiles present that represent it, exactly one of them is
							//// active. To keep track of this, we communicate with the root tile, which gives it the
							//// 'active' and 'activatable' properties.

							if (_($scope.entity._activeTile).isUndefined()) {
								$scope.entity._activeTile = [$scope.tile];
							} else {
								$scope.entity._activeTile.push($scope.tile);
							}

							//// When a tile is destroyed, remove it as a candidate for activation
							//
							$scope.$on('$destroy', function () {
								_($scope.entity._activeTile).pull($scope.tile);
							});

							_($scope.tile).derivedProperty('active', function () {
								return $scope.entity._activeTile[0] === $scope.tile;
							}, function (shouldBeActive) {
								if (shouldBeActive) {
									_($scope.entity._activeTile).pull($scope.tile);
									$scope.entity._activeTile.unshift($scope.tile);
								} else {
									console.error('$scope.tile.active should not be explicitly set to false.');
								}
							});

							if ($scope.tile.parentTile) {
								$scope.$watch('tile.parentTile.maximized', function (parentIsMaximized, parentWasMaximized) {
									if (!parentWasMaximized && parentIsMaximized) {

									}
								});
							}

							//// When a tile is opened, activate it
							//
							$scope.$watch('tile.open', function (isOpen, wasOpen) {
								if (!wasOpen && isOpen) { $scope.tile.active = true; }
							});

							//// When a tile is deactivated, close it
							//
							$scope.$watch('tile.active', function (isActive, wasActive) {
								if (wasActive && !isActive) { $scope.tile.open = false; }
							});


							//////////////////// Reacting to Maximization //////////////////////////////////////////////

							//// A parent tile should know which (if any) of its children are maximized
							//
							if ($scope.tile.parentTile) {
								$scope.$watch('tile.maximized', function (isMaximized, wasMaximized) {
									if (isMaximized !== wasMaximized) {
										if (isMaximized) {
											$scope.tile.parentTile.maximizedChild = $scope.tile;
										} else if ($scope.tile.parent.maximizedChild === $scope.tile) {
											$scope.tile.parentTile.maximizedChild = null;
										}
									}
								});
							}

							//// When a tile is closed, it should unmaximize (demaximize?)
							//
							$scope.$watch('tile.open', function (isOpen, wasOpen) {
								if (wasOpen && !isOpen) { $scope.tile.maximized = false; }
							});


							//////////////////// Deriving Tile Weight //////////////////////////////////////////////////

							_($scope.tile).derivedProperty('weight', function () {
								if ($scope.tile.maximized) { return Infinity; }
								else if ($scope.tile.open) { return 8; }
								else if ($scope.tile.hidden) { return 0; }
								else { return 1; }
							});


							//////////////////// Reacting to Mouse-over ////////////////////////////////////////////////

							$scope.onMouseOver = function (/*$event*/) {
								var deepestFocusedTile = $scope.tile;
								while (deepestFocusedTile.maximizedChild) {
									deepestFocusedTile = deepestFocusedTile.maximizedChild;
								}
								if (deepestFocusedTile.entity._resolved) {
									$scope.$root.$broadcast('artefact-focus', deepestFocusedTile);
								}
							};

							$scope.onMouseOut = function (/*$event*/) {
								var deepestFocusedTile = $scope.tile;
								while (deepestFocusedTile.maximizedChild) {
									deepestFocusedTile = deepestFocusedTile.maximizedChild;
								}
								if (deepestFocusedTile.entity._resolved) {
									$scope.$root.$broadcast('artefact-unfocus', deepestFocusedTile);
								}
							};

							$scope.onHeaderClick = function (/*$event*/) {
								$scope.tile.open = !$scope.tile.open;
							};


							//////////////////// Reacting to Artefact Focus ////////////////////////////////////////////

							$scope.$on('artefact-focus', function (event, artefact) {
								$scope.tile.focus = (artefact.entity && artefact.entity === $scope.entity);
							});

							$scope.$on('artefact-unfocus', function (event, artefact) {
								if (artefact.entity && artefact.entity === $scope.entity) {
									$scope.tile.focus = false;
								}
							});


							//////////////////// Tile Styling //////////////////////////////////////////////////////////

							$scope.entity._promise.then(function () {

								//// calculate styling, possibly based on parent tile background
								//
								if (($scope.tile.parent.parent.type === 'tile')) {
									var parentBgColor = $scope.tile.parent.parent.styling.normal.css['&'].backgroundColor;
									$scope.tile.styling = generateTileDefaults($scope.entity.tile, {
										bgColor: (color(parentBgColor).luminance() < .5 ?
												color(parentBgColor).brighten(30).css() :
												color(parentBgColor).darken(30).css() )
									});
								} else {
									$scope.tile.styling = generateTileDefaults($scope.entity.tile, {
										bgColor: '#eeeeee'
									});
								}

								//// applying styling to the tile
								//
								function applyTileStyling() {
									iElement.putCSS($scope.tile.styling[$scope.tile.focus ? 'focus' : 'normal'].css);
								}

								//// do it now
								//
								applyTileStyling();

								//// dynamically applying the right CSS to the tile
								//
								$scope.$watch("tile.open", function (isOpen, wasOpen) {
									if (isOpen !== wasOpen) { applyTileStyling(); }
								});
								$scope.$watch('tile.focus', function (hasFocus, hadFocus) {
									if (hasFocus !== hadFocus) { applyTileStyling(); }
								});

							}); // $scope.entity._promise.then
						}
					}
				});
			}

			////////////////////////////////////////////////////////////////////////////////////////////////////////////
			////////////////////////////////////////////////////////////////////////////////////////////////////////////

		};
	}])
	;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
