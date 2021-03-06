'use strict';

// Here is an overview of the sizing and
// positioning of a tile and its children:
//
//
//                                    width
//                 ╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄╮
//                 ┆                                         ┆
//
//               ┌─────────────────────────────────────────────┐  ┄┄┄┄╮ border
//         ╭┄┄┄  │ ╔═════════════════════════════════════════╗ │  ┄┄┄┄╯ width
//  header ┊     │ ║ header                                  ║ │
//  height ┊     │ ║                                         ║ │
//         ┊     │ ╟─────────────────────────────────────────╢ │  ┄┄┄┄╮ border
//         ├┄┄┄  │ ╠═════════════════════════════════════════╣ │  ┄┄┄┄╯ width
//         ┊     │ ║ section                                 ║ │
//         ┊     │ ║                                         ║ │
//         ┊     │ ║     ┌─────────────┐     ┌─────────┐     ║ │  ┄┄┄┄╮
//         ┊     │ ║     │ child       │     │ child   │     ║ │      ┊
//         ┊     │ ║     │             │     │         │     ║ │      ┊ child
//         ┊     │ ║     │             │     │         │     ║ │      ┊ height
//         ┊     │ ║     │             │     │         │     ║ │      ┊
//         ┊     │ ║     └─────────────┘     └─────────┘     ║ │  ┄┄┄┄╯
//  height ┊     │ ║                                         ║ │
//         ┊     │ ║                                         ║ │
//         ┊     │ ║     ┌───────┐     ┌───────────────┐     ║ │
//         ┊     │ ║     │ child │     │ child         │     ║ │
//         ┊     │ ║     │       │     │               │     ║ │
//         ┊     │ ║     │       │     │               │     ║ │
//         ┊     │ ║     │       │     │               │     ║ │
//         ┊     │ ║     └───────┘     └───────────────┘     ║ │  ┄┄┄┄╮
//         ┊     │ ║                                         ║ │      ┊ tile
//         ┊     │ ║                                         ║ │      ┊ spacing
//         ╰┄┄┄  │ ╚═════════════════════════════════════════╝ │  ┄┄┄┄╯
//               └─────────────────────────────────────────────┘
//
//                 ┆     ┆             ┆               ┆     ┆ ┆
//                 ╰┄┄┄┄┄╯             ╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄╯     ╰┄╯
//                  tile                  child width       border
//                 spacing                                  width
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['angular',
        'app/module',
        'chroma',
        'lodash',
        'threejs',
        'amy-circuit-board/artefacts',
        'amy-circuit-board/CircuitBoardArtefact',
        'css!amy-circuit-board/amy-tile/style',
        'icon-btn/directive',
        'font-fit/directive',
        'resource/service',
        '$bind/service',
        'resource/service',
        'jqueryui/dialog' // for VariableGlyph artefact (trace popup)
], function (ng, app, color, _, THREE, artefacts, CircuitBoardArtefact) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	var TILE_HEADER_HEIGHT = 26;

	app.directive('amyTile', ['$bind', '$q', 'RecursionHelper', 'defaults', 'ResourceService', '$compile', 'TimerService', function ($bind, $q, RecursionHelper, defaults, ResourceService, $compile, TimerService) {

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
			templateUrl: 'amy-circuit-board/amy-tile/view.html',
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

						ngModel.$render = function onNgModelRender() {
							$scope.subEntity = ngModel.$modelValue;
							$scope.entity = $scope.subEntity.entity;

							//////////////////// Tile / Artefact Interface /////////////////////////////////////////////

							$scope.tile =
							$scope.artefact = new CircuitBoardArtefact.TileArtefact({
								id:                $scope.$id,
								$scope:            $scope,
								relationType:      $scope.subEntity.type,
								detailTemplateUrl: 'amy-circuit-board/amy-tile/detail-view.html',
								entity:            $scope.entity
							});


							//////////////////// Keeping Track of Tile Position and Size ///////////////////////////////

							iAttrs.$observe('position', function (newPosition) {
								$scope.tile.position = $scope.$eval(newPosition);
							});


							//////////////////// Showing or hiding the header //////////////////////////////////////////

							_($scope.tile).derivedProperty('hiddenHeader', function () {
								return $scope.tile.maximized && $scope.tile.open;
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
							function broadcastFocusEvent(flag) {
								var deepestFocusedTile = $scope.tile;
								while (deepestFocusedTile.children[0] && deepestFocusedTile.children[0].maximizedChild) {
									deepestFocusedTile = deepestFocusedTile.children[0].maximizedChild;
								}
								if (deepestFocusedTile.entity._resolved) {
									deepestFocusedTile.focus = flag;
								}
							}

							$scope.onTileMouseOver = function ($event) {
								$event.stopPropagation();
								broadcastFocusEvent(true); // TODO: prevent highlighting of this tile
							};

							$scope.onTileMouseOut = function ($event) {
								$event.stopPropagation();
								broadcastFocusEvent(false); // TODO: re-enable possible highlighting of this tile
							};

							$scope.onHeaderMouseOver = function ($event) {
								$event.stopPropagation();
								broadcastFocusEvent(true, {});
							};

							$scope.onHeaderMouseOut = function ($event) {
								$event.stopPropagation();
								broadcastFocusEvent(false, {});
							};


							//////////////////// CSS Classes ///////////////////////////////////////////////////////////

							// Using ng-class doesn't seem to always work, so we're setting classes manually.
							// (Report Angular bug?)

							function tilePropertyToClass(prop, cls) {
								cls = cls || prop;
								$scope.$watch('tile.' + prop, function (v) { iElement.toggleClass(cls, !!v); });
							}

							tilePropertyToClass('open');
							tilePropertyToClass('maximized');
							tilePropertyToClass('highlighted');
							tilePropertyToClass('active');
							tilePropertyToClass('entity._searchResult', 'searchResult');
							tilePropertyToClass('hiddenHeader', 'hidden-header');


							//////////////////// Tile Styling //////////////////////////////////////////////////////////

							$scope.entity._promise.then(function () {

								//// calculate styling, possibly based on parent tile background
								//
								if ($scope.tile.ancestor(CircuitBoardArtefact.TileArtefact)) {
									var parentBgColor = $scope.tile.ancestor(CircuitBoardArtefact.TileArtefact).styling.normal.css['&'].backgroundColor;
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


							//////////////////// Graph Elements ////////////////////////////////////////////////////////

							$scope.circuitBoard.graphLayer.then(function (graphLayer) {

								//////////////////// Get group interface from the graph layer //////////////////////////

								var graphGroup = graphLayer.newGraphGroup();
								$scope.$on('$destroy', function () { graphGroup.remove() });


								//////////////////// Keep region up to date ////////////////////////////////////////////

								function setRegion() {
									var widthPadding = Math.min(TILE_HEADER_HEIGHT, $scope.tile.position.width) / 2;
									var heightPadding = Math.min(TILE_HEADER_HEIGHT, $scope.tile.position.height) / 2;
									if ($scope.tile.hiddenHeader) {
										// FIXME: this was requested by Bernard, and includes changes in several places in the code
										graphGroup.setRegion({
											top:    $scope.tile.position.top,
											left: $scope.tile.position.left + widthPadding,
											height: 1,
											width: $scope.tile.position.width - 2 * widthPadding
										});
									} else {
										var height = ($scope.tile.open ? TILE_HEADER_HEIGHT : $scope.tile.position.height);
										graphGroup.setRegion({
											top: $scope.tile.position.top + heightPadding,
											left: $scope.tile.position.left + widthPadding,
											height: height - 2 * heightPadding,
											width: $scope.tile.position.width - 2 * widthPadding
										});
									}
								}

								$scope.$watchGroup(['tile.position', 'tile.open'], setRegion);


								//////////////////// Vascular Junctions ////////////////////////////////////////////////

								$scope.entity._promise.then(function () {
									$scope.circuitBoard.connections.then(function (connections) {
										_(connections.types).forEach(function (type, typeName) {

											var junctionArtefact;

											function addJunction() {
												junctionArtefact = new artefacts[type.tileJunctionType]({
													id: $scope.tile.id + ':' + typeName + 'Junction',
													parent:            $scope.tile,
													entity:            $scope.tile.entity,
													showVertex:        false,
													graphZIndex:       200,
													detailTemplateUrl: type.junctionDetailTemplateUrl,

													ResourceService: ResourceService,
													$bind:           $bind,
													$scope:          $scope
												});
												graphGroup.addVertex(junctionArtefact); // TODO: move responsibility to connections module
												connections.registerTileJunction(junctionArtefact);
												junctionArtefact.onDestruct(function () {
													graphGroup.removeVertex(junctionArtefact);
													connections.deregisterTileJunction(junctionArtefact);
												})
											}

											$scope.$watch('tile.active && $root.connectionsEnabled', function (showJunction) {
												if (showJunction) { addJunction(); }
												else if (junctionArtefact) { junctionArtefact.destructor(); }
											});

										});
									});
								});


								//////////////////// Proteins //////////////////////////////////////////////////////////

								$scope.entity._promise.then(function () {
									if (!_($scope.entity.proteins).isEmpty()) {

										var onProteinToggle = (function () {
											var proteinToggleD = $q.defer();
											$scope.$watch('tile.active && $root.proteinsEnabled && !tile.open', function (showProteins) {
												proteinToggleD.notify(showProteins);
											});
											return function onProteinToggle(fn) {
												proteinToggleD.promise.then(null, null, fn);
											}
										}());

										var proteinArtefactMap = {};

										_($scope.entity.proteins).forEach(function (protein) {
											var proteinArtefact;

											function addProtein() {
												proteinArtefact = new artefacts.Protein({
													id: $scope.tile.id + ':' + protein._id,
													$scope:            $scope,
													parent:            $scope.tile,
													protein:           protein,
													detailTemplateUrl: 'amy-circuit-board/amy-tile/protein-detail-view.html',
													showVertex:        true,
													graphZIndex:       200,
													ResourceService:   ResourceService,
													$bind:             $bind,
													THREE:             THREE
												});
												proteinArtefactMap[protein._id] = proteinArtefact;
												graphGroup.addVertex(proteinArtefact);
												proteinArtefact.onDestruct(function () {
													delete proteinArtefactMap[protein._id];
													graphGroup.removeVertex(proteinArtefact);
												});
											}

											onProteinToggle(function (showProteins) {
												if (showProteins) { addProtein(); }
												else if (proteinArtefact) {
													proteinArtefact.destructor();
													proteinArtefact = null;
												}
											});
										});

										_($scope.entity.proteinInteractions).forEach(function (interaction) {
											var proteinInteractionArtefact;

											function addProteinInteraction() {
												proteinInteractionArtefact = new artefacts.ProteinInteraction({
													id: 'ppi:(' + interaction.interaction[0] + ',' + interaction.interaction[1] + ')',
													$scope:            $scope,
													parent:            $scope.tile,
													source:            proteinArtefactMap[interaction.interaction[0]],
													target:            proteinArtefactMap[interaction.interaction[1]],
													graphZIndex:       100,
													detailTemplateUrl: 'amy-circuit-board/amy-tile/protein-interaction-details.html',
													ResourceService:   ResourceService,
													$bind:             $bind
												});
												graphGroup.addEdge(proteinInteractionArtefact);
												proteinInteractionArtefact.onDestruct(function () {
													graphGroup.removeEdge(proteinInteractionArtefact);
												});
											}

											onProteinToggle(function (showProteins) {
												if (showProteins) { addProteinInteraction(); }
												else if (proteinInteractionArtefact) {
													proteinInteractionArtefact.destructor();
													proteinInteractionArtefact = null;
												}
											});
										});

									}
								});


								//////////////////// Variable Glyphs ///////////////////////////////////////////////////

								$scope.entity._promise.then(function () {

									var onVariablesToggle = (function () {
										var variablesToggleD = $q.defer();
										$scope.$watch('tile.active && $root.simulation', function (simulation) {
											variablesToggleD.notify(simulation);
										});
										function onVariablesToggle(fn) { variablesToggleD.promise.then(null, null, fn); }
										onVariablesToggle.reset = function variableReset() { variablesToggleD.notify(null); };
										return onVariablesToggle;
									}());

									ResourceService.fmaIdToVariables($scope.entity._id).then(function (variables) {
										onVariablesToggle.reset();

										_(variables).forEach(function (variableUri) {
											var variableArtefact;

											function addVariableGlyph(variable) {
												variableArtefact = new artefacts.VariableGlyph({
													id:          ($scope.tile.id + ':' + variable.uri),
													$scope:      $scope,
													parent:      $scope.tile,
													variable:    variable,
													showVertex:  true,
													graphZIndex: 200,

													ResourceService:  ResourceService,
													TimerService:     TimerService,
													$bind:            $bind,
													$compile:         $compile
												});
												graphGroup.addVertex(variableArtefact);
												variableArtefact.onDestruct(function () {
													graphGroup.removeVertex(variableArtefact);
												});
											}

											onVariablesToggle(function (simulation) {
												if (!variableArtefact && simulation && simulation.model.outputVariables[variableUri]) {
													addVariableGlyph(simulation.variable(variableUri));
												} else if (variableArtefact) {
													variableArtefact.destructor();
													variableArtefact = null;
												}
											});
										});
									});

								});

							});


							//////////////////// 3D models /////////////////////////////////////////////////////////////

							ResourceService.threeDModels($scope.tile.entity._id).then(function (models) {
								if (!_(models).isEmpty()) {

									//// control the appearance of the 3D-model button
									//
									$scope.$watch('$root.threeDEnabled', function (threeDEnabled) {
										$scope.tile.has3DModel = threeDEnabled;
										if (!threeDEnabled) { $scope.tile.show3DModel = false; }
									});

									//// to register handlers for the construction and destruction of 3d models
									// TODO: create a nicer idiom for this kind of situation;
									//     : both the 3d layer and the 3d object may be on or off
									//
									var threeDLayer;
									var on3d = (function () {
										var threeDD = $q.defer();
										var threeDQ = threeDD.promise;
										$scope.$watch('tile.active && $root.threeDEnabled && tile.show3DModel', function (show3d) {
											threeDLayer = $scope.circuitBoard.threeDLayer;
											threeDD.notify(show3d ? 'construct' : 'destruct');
										});
										$scope.$on('$destroy', function () { threeDD.notify('destruct'); });
										return function on3d(requiredSignal, fn) {
											//// assuming all destruct callbacks are added from a construct callback
											if (requiredSignal === 'destruct') { fn = _.once(fn); }
											threeDQ.then(null, null, function (receivedSignal) {
												if (requiredSignal === receivedSignal) { fn(); }
											});
										}
									}());

									//// adding the model; takes care of its own cleanup
									//
									on3d('construct', function on3dConstruct() {

										//// get an interface to the 3d layer
										//
										var threeDGroup = threeDLayer.new3dGroup();
										on3d('destruct', function () { threeDGroup.remove(); });

										//// create the artefact
										//
										var modelSource = models[0]; // TODO: options to switch; now getting only the first model
										var static3DModel = new artefacts[_(modelSource).isArray() ? 'StaticCompound3DModel' : 'Static3DModel']({
											$scope:         $scope,
											entity:         $scope.tile.entity,
											parent:         $scope.tile,
											filename:       modelSource,
											parent3DObject: threeDGroup.object,

											threeDGroup: threeDGroup,

											THREE:        THREE,
											$q:           $q,
											TimerService: TimerService
										});
										on3d('destruct', function () { static3DModel.destructor() });

										//// adjust to new tile positions
										//
										on3d('destruct', $scope.$watch('tile.position', function (newPosition) {
											if (newPosition) {
												threeDGroup.setRegion($scope.tile.position);
												static3DModel.adjustToSize($scope.tile.position);
											}
										}));

									});
								}
							});// ResourceService.threeDModels().then()

						};//function onNgModelRender
					},//function preLink

					post: function () { dAtPostLink.resolve(); }
				});
			}

			////////////////////////////////////////////////////////////////////////////////////////////////////////////
			////////////////////////////////////////////////////////////////////////////////////////////////////////////

		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
