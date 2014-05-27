'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['angular', 'app/module', 'partial/amy-circuit-board/artefacts', 'resource/service'], function (ng, app, artefacts) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	app.directive('amyConnections', ['$bind', 'ResourceService', function ($bind, ResourceService) {
		return {
			restrict  : 'A',
			scope     : true,
			controller: ['$scope', function ($scope) {
				$scope.circuitBoard.graphLayer.then(function (graphLayer) {
					var graphGroup = graphLayer.newGraphGroup();
					var registeredTileJunctions = {};
					var visibleTileJunctions = {};

					var updateGraph = _.debounce(function updateGraph() {
						ResourceService.paths(_.map(registeredTileJunctions, function (junction) {
							return junction.entity._id;
						})).then(function (paths) {

							//// Remove the paths that are not vascular
							//
							_(paths).remove(function (path) { return path.type !== 'vascular' });

							//// Count the connections of all inner junctions (so we can hide linear ones)
							//
							var junctionDirectConnections = {};
							_(paths).forEach(function (path) {
								var pathArray = path.path;
								for (var i = 1; i < pathArray.length - 1; ++i) {
									if (!_(junctionDirectConnections[pathArray[i]]).isObject()) {
										junctionDirectConnections[pathArray[i]] = {};
									}
									junctionDirectConnections[pathArray[i]][pathArray[i - 1]] = true;
									junctionDirectConnections[pathArray[i]][pathArray[i + 1]] = true;
								}
							});

							//// Remove connections and inner junctions (to start again); TODO: keep what can be kept?
							//
							graphGroup.removeAllEdgesAndVertices();

							//// Select the tile junctions that are involved
							//
							_(visibleTileJunctions).forEach(function (tileJunction) {
								tileJunction.showVertex = false;
							});
							visibleTileJunctions = {};
							function addTileJunction(entityId) {
								if (_(visibleTileJunctions[entityId]).isUndefined()) {
									visibleTileJunctions[entityId] = registeredTileJunctions[entityId];
									registeredTileJunctions[entityId].showVertex = true;
								}
							}

							_(paths).forEach(function (path) {
								addTileJunction(path.from);
								addTileJunction(path.to);
							});

							//// Find the branching junctions and connections and add them to the graph
							//
							var branchingJunctionMap = {};
							_(paths).forEach(function (path) {
								var pathArray = path.path;

								var tile1 = registeredTileJunctions[path.from];
								var tile2 = registeredTileJunctions[path.to];

								//// how to add a branching junction, if it's not already there
								//
								function ensureJunction(junctionId) {
									if (_(branchingJunctionMap[junctionId]).isUndefined()) {
										var element = $('<svg class="vascular-branching-junction ' + path.subtype + ' vertex-wrapper">' +
										                '<circle class="core" r="2"></circle></svg>');
										var branchingJunction = branchingJunctionMap[junctionId] = new artefacts.VascularBranchingJunction({
											id         : junctionId,
											parent     : $scope.circuitBoard,
											element    : function () { return element[0] },
											showVertex : true,
											x          : (tile1.x + tile2.x) / 2, // initially right in between;
											y          : (tile1.y + tile2.y) / 2, // good enough
											subtype    : path.subtype,
											graphZIndex: 400
										});
										graphGroup.addVertex(branchingJunction);

										//// react to clicks by fixing focus
										//
										element.clickNotDrop($bind(function () {
											$scope.$root.$broadcast('artefact-focus-fix',
													branchingJunction.focusFixed ? null : branchingJunction);
										}));

										//// react to dragging by temporarily fixing focus (if not already fixed)
										//
										var removeFocusFixOnDrop;
										element.mouseDragDrop($bind(function () {
											element.addSvgClass('dragging');
											$scope.circuitBoard.draggingVertex = true;
											if (branchingJunction.focusFixed) {
												removeFocusFixOnDrop = false;
											} else {
												removeFocusFixOnDrop = true;
												$scope.$root.$broadcast('artefact-focus-fix', branchingJunction);
											}
										}), $bind(function () {
											element.removeSvgClass('dragging');
											$scope.circuitBoard.draggingVertex = false;
											$('svg[amy-graph-layer]').removeSvgClass('dragging');
											if (removeFocusFixOnDrop) {
												$scope.$root.$broadcast('artefact-focus-fix', null);
											}
										}));

										//// how to react when focus is fixed:
										//
										$scope.$on('artefact-focus-fix', function (e, artefact) {
											branchingJunction.focusFixed = (artefact === branchingJunction);
											element.setSvgClass('focus-fixed', branchingJunction.focusFixed);
										});
									}
								}

								//// how to add a new connection
								//
								function addConnection(sourceJunction, targetJunction, hiddenJunctions) {
									var element = $('<svg><line class="vascular ' + path.subtype + '"></line></svg>').children();
									graphGroup.addEdge({ // TODO: make this an artefact, with extra data in the sidebar
										id                : 'vascularConnection:(' + sourceJunction.id + ',' + targetJunction.id + ')',
										source            : sourceJunction,
										target            : targetJunction,
										subtype           : path.subtype,
										hiddenJunctions   : hiddenJunctions,
										element           : function () { return element[0] },
										linkDistanceFactor: (hiddenJunctions.length + 1) / 10,
										graphZIndex       : ((sourceJunction.type === 'vascularTileJunction' ||
										                      targetJunction.type === 'vascularTileJunction') ?
										                     100 : 300)
									});
								}

								var hiddenJunctions = [];
								var sourceJunction = registeredTileJunctions[path.from];
								for (var i = 1; i < pathArray.length - 1; ++i) {
									if (_(junctionDirectConnections[pathArray[i]]).size() === 2) {
										hiddenJunctions.push(pathArray[i]);
									} else {
										ensureJunction(pathArray[i]);
										addConnection(sourceJunction, branchingJunctionMap[pathArray[i]], hiddenJunctions);
										sourceJunction = branchingJunctionMap[pathArray[i]];
										hiddenJunctions = [];
									}
								}
								addConnection(sourceJunction, registeredTileJunctions[path.to], hiddenJunctions);
							});

						});
					}, 200);

					$scope.vascularConnectionsDeferred.resolve({
						registerTileJunction: function registerTileJunction(tileJunction) {
							registeredTileJunctions[tileJunction.entity._id] = tileJunction;
							updateGraph();
						},
						deregisterTileJunction: function registerTileJunction(tileJunction) {
							delete registeredTileJunctions[tileJunction.entity._id];
							updateGraph();
						}
					});

				});
			}]
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
