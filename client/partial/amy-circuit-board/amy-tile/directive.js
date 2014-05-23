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


	var TILE_HEADER_HEIGHT = 26;


	app.directive('amyTile', ['$bind', '$q', 'ResourceService', 'RecursionHelper', 'defaults', function ($bind, $q, Resources, RecursionHelper, defaults) {

		////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		var generateTileDefaults = defaults({
			normal:      {
				css: {
					'&':            {
						backgroundColor: " bgColor                                                                           ",
						borderColor:     " color(`.normal.css['&'].backgroundColor`).brighten(20).css()                      ",
						color:           " color(`.normal.css['&'].backgroundColor`).luminance() > 0.5 && 'black' || 'white' "
					},
					'& > header':   {
						borderColor: " `.normal.css['&'].borderColor` "
					},
					'& > icon-btn': {
						backgroundColor: " `.normal.css['&'].backgroundColor` "
					}
				}
			},
			focus:       {
				css: {
					'&':            {
						backgroundColor: " color(`.normal.css['&'].backgroundColor`).brighten(40).css()                      ",
						borderColor:     " color(`.normal.css['&'].borderColor`).darken(40).css()                            ",
						color:           " color(`.focus .css['&'].backgroundColor`).luminance() > 0.5 && 'black' || 'white' "
					},
					'& > header':   {
						borderColor: " `.focus.css['&'].borderColor` "
					},
					'& > icon-btn': {
						backgroundColor: " `.focus.css['&'].backgroundColor` "
					}
				}
			},
			highlighted: " `.focus` " // TODO: rename focus to highlighted everywhere, including the database
		});

		////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		return {
			restrict:    'E',
			replace:     true,
			templateUrl: 'partial/amy-circuit-board/amy-tile/view.html',
			require:     'ngModel',
			scope:       true,

			////////////////////////////////////////////////////////////////////////////////////////////////////////////
			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			compile: function (dElement) {

				var dAtPostLink = $q.defer();
				var atPostLink = dAtPostLink.promise;

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
								id:           $scope.$id,
								type:         'tile',
								show:         true,

								//// artefact hierarchy:
								parent:       $scope.$parent.artefact,
								relationType: $scope.subEntity.type,
								children:     [],
								root:         $scope.$parent.artefact.root,

								//// entity:
								entity:       $scope.entity,
								active:       true,
								highlighted:  false,

								//// properties:
								open:         false,
								maximized:    false,
								visible:      true,

								//// 3D-model related properties:
								has3DModel:   false,
								show3DModel:  false,

								//// position:
								position: null // to be set
							};


							//////////////////// Maintaining the Hierarchy /////////////////////////////////////////////

							//// Announce this artefact to its parent.
							//
							$scope.artefact.parent.children.push($scope.artefact);


							//// Remove references to this tile when it is destroyed
							//
							$scope.$on('$destroy', function () {
								_($scope.tile.parent).pull($scope.tile);
								if ($scope.tile.parent.maximizedChild === $scope.tile) {
									$scope.tile.parent.maximizedChild = null;
								}
							});


							//////////////////// Keeping Track of Tile Position and Size ///////////////////////////////

							iAttrs.$observe('position', function (newPosition) {
								if (newPosition) {
									$scope.tile.position = $scope.$eval(newPosition);
								}
							});


							//////////////////// Managing Tile Visibility //////////////////////////////////////////////


							//// A tile is a candidate for activation if and only if it's not hidden (and not destroyed)
							//
							$scope.$watch('tile.parent.maximizedChild', function (newMaximizedChild/*, oldMaximizedChild*/) {
								$scope.tile.visible = !(newMaximizedChild && newMaximizedChild !== $scope.tile);
							});
							$scope.$on('$destroy', function () {
								_($scope.entity._activeTileQueue).pull($scope.tile);
							});
							$scope.$watch('tile.visible', function (isVisible, wasVisible) {
								if (wasVisible && !isVisible) { $scope.tile.open = false; }
							});


							//////////////////// Managing Active / Inactive Tiles //////////////////////////////////////

							//// Given an entity, if there are tiles present that represent it, exactly one of them is
							//// active. To keep track of this, we communicate with the root tile, which gives it the
							//// 'active' and 'activatable' properties.

							if (_($scope.entity._activeTileQueue).isUndefined()) {
								$scope.entity._activeTileQueue = [$scope.tile];
							} else {
								$scope.entity._activeTileQueue.push($scope.tile);
							}

							//// Deriving tile activeness
							//
							_($scope.tile).derivedProperty('active', function () {
								return $scope.entity._activeTileQueue[0] === $scope.tile;
							}, function (shouldBeActive) {
								if (shouldBeActive) {
									_($scope.entity._activeTileQueue).pull($scope.tile);
									$scope.entity._activeTileQueue.unshift($scope.tile);
								} else {
									console.error("You can't directly set tile activeness to false.");
								}
							});

							//// A tile can be activated only if it is visible
							//
							$scope.$watch('tile.visible', function (isVisible, wasVisible) {
								if (wasVisible && !isVisible) {
									_($scope.entity._activeTileQueue).pull($scope.tile);
								} else if (!wasVisible && isVisible) {
									_($scope.entity._activeTileQueue).pull($scope.tile);
									$scope.entity._activeTileQueue.push($scope.tile);
								}
							});

							//// When a tile is opened, activate it
							//
							$scope.$watch('tile.open', function (isOpen, wasOpen) {
								if (!wasOpen && isOpen) {
									$scope.tile.active = true;
								}
							});

							//// When a tile is deactivated, close it
							//
							$scope.$watch('tile.active', function (isActive, wasActive) {
								if (wasActive && !isActive) {
									$scope.tile.open = false;
								}
							});


							//////////////////// Tile Maximization /////////////////////////////////////////////////////

							//// If a tile is the only in its tile-map, auto-maximize it
							//
							atPostLink.then(function () {
								$scope.$watch('tile.parent.children.length === 1', function (isOnlyChild) {
									if (isOnlyChild) { $scope.tile.maximized = true; }
								});
							});

							//// The tile-map should know which (if any) of its children are maximized
							//
							$scope.$watch('tile.maximized', function (isMaximized, wasMaximized) {
								if (isMaximized !== wasMaximized) {
									if (isMaximized) {
										$scope.tile.parent.maximizedChild = $scope.tile;
									} else if ($scope.tile.parent.maximizedChild === $scope.tile) {
										$scope.tile.parent.maximizedChild = null;
									}
								}
							});

							//// When a tile is closed, it should unmaximize (demaximize?)
							//
							$scope.$watch('tile.open', function (isOpen, wasOpen) {
								if (wasOpen && !isOpen && $scope.tile.parent.children.length > 1) { $scope.tile.maximized = false; }
							});


							//////////////////// Deriving Tile Weight //////////////////////////////////////////////////

							_($scope.tile).derivedProperty('weight', function () {
								if ($scope.tile.maximized) { return Infinity; }
								else if ($scope.tile.open) { return 8; }
								else if (!$scope.tile.visible) { return 0; }
								else { return 1; }
							});


							//////////////////// Reacting to Mouse Events //////////////////////////////////////////////

							//// Clicking the header opens / closes the tile
							//
							$scope.onHeaderClick = function (/*$event*/) {
								$scope.tile.open = !$scope.tile.open;
							};

							//// Right-clicking an open or maximized tile closes it
							//
							$scope.onRightClick = function ($event) {
								if ($scope.tile.open || ($scope.tile.maximized && $scope.tile.parent.children.length > 1)) {
									$event.stopPropagation();
									$scope.tile.open = false;
									$scope.tile.maximized = false;
								}
							};

							//// Mouse-over events
							//
							function broadcastFocusEvent(eventName, options) {
								var deepestFocusedTile = $scope.tile;
								while (deepestFocusedTile.children[0] && deepestFocusedTile.children[0].maximizedChild) {
									deepestFocusedTile = deepestFocusedTile.children[0].maximizedChild;
								}
								if (deepestFocusedTile.entity._resolved) {
									$scope.$root.$broadcast(eventName, deepestFocusedTile, options);
								}
							}

							$scope.onTileMouseOver = function ($event) {
								$event.stopPropagation();
								broadcastFocusEvent('artefact-focus', { excludeHighlighting: [$scope.tile] });
							};

							$scope.onTileMouseOut = function ($event) {
								$event.stopPropagation();
								broadcastFocusEvent('artefact-unfocus', { excludeHighlighting: [$scope.tile] });
							};

							$scope.onHeaderMouseOver = function ($event) {
								$event.stopPropagation();
								broadcastFocusEvent('artefact-focus', {});
							};

							$scope.onHeaderMouseOut = function ($event) {
								$event.stopPropagation();
								broadcastFocusEvent('artefact-unfocus', {});
							};


							//////////////////// Reacting to Focus Broadcasts //////////////////////////////////////////

							$scope.$on('artefact-focus', function (event, artefact, options) {
								$scope.tile.highlighted = (artefact.entity && artefact.entity === $scope.entity && !_(options.excludeHighlighting).contains($scope.tile));
							});

							$scope.$on('artefact-unfocus', function (event, artefact/*, options*/) {
								if (artefact.entity && artefact.entity === $scope.entity) {
									$scope.tile.highlighted = false;
								}
							});


							//////////////////// CSS Classes ///////////////////////////////////////////////////////////

							// Using ng-class doesn't seem to always work, so we're setting classes manually.
							// (Report Angular bug?)

							$scope.$watch('tile.open', function (v) { iElement.toggleClass('open', v); });
							$scope.$watch('tile.maximized', function (v) { iElement.toggleClass('maximized', v); });
							$scope.$watch('tile.highlighted', function (v) { iElement.toggleClass('highlighted', v); });
							$scope.$watch('tile.active', function (v) { iElement.toggleClass('active', v); });


							//////////////////// Graph Elements ////////////////////////////////////////////////////////

							(function () {
								var circuitBoard = $scope.tile.parent;
								while (circuitBoard.type !== 'circuitBoard') { circuitBoard = circuitBoard.parent; }
								circuitBoard.graphLayer.then(function (graphLayer) {
									var graphGroup = graphLayer.newGraphGroup();

									function setRegion() {
										var widthPadding = Math.min(TILE_HEADER_HEIGHT, $scope.tile.position.width) / 2;
										var heightPadding = Math.min(TILE_HEADER_HEIGHT, $scope.tile.position.height) / 2;
										var height = ($scope.tile.open ? TILE_HEADER_HEIGHT : $scope.tile.position.height);
										graphGroup.setRegion({
											top: $scope.tile.position.top + heightPadding,
											left: $scope.tile.position.left + widthPadding,
											height: height - 2 * heightPadding,
											width: $scope.tile.position.width - 2 * widthPadding
										});
									}

									function addAllEdgesAndVertices() {
										graphGroup.addVertex({
											id: 'testVertex',
											element: $('<svg style="overflow: visible; pointer-events: auto;">' +
											           '    <circle r="10" stroke="black" fill="white"></circle>' +
											           '</svg>')[0]
										});
									}

									$scope.$watch('tile.position', function (newPosition, oldPosition) {
										if (newPosition !== oldPosition) { setRegion(); }
									});

									$scope.$watch('tile.open', function (isOpen, wasOpen) {
										if (wasOpen !== isOpen) { setRegion(); }
									});

									$scope.$watch('tile.active', function (isActive) {
										if (isActive) {
											addAllEdgesAndVertices();
										} else {
											graphGroup.removeAllEdgesAndVertices();
										}
									});

									$scope.$on('$destroy', function () {
										graphGroup.removeAllEdgesAndVertices();
									});

									// TODO: real stuff

								});
							}());

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
									iElement.putCSS($scope.tile.styling[$scope.tile.highlighted ? 'highlighted' : 'normal'].css);
								}

								//// do it now
								//
								applyTileStyling();

								//// dynamically applying the right CSS to the tile
								//
								$scope.$watch("tile.open", function (isOpen, wasOpen) {
									if (isOpen !== wasOpen) { applyTileStyling(); }
								});
								$scope.$watch('tile.highlighted', function (isHighlighted, wasHighlighted) {
									if (isHighlighted !== wasHighlighted) { applyTileStyling(); }
								});

							}); // $scope.entity._promise.then
						}
					},

					post: function () { dAtPostLink.resolve(); }
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
