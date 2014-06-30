'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['angular', 'app/module', 'amy-circuit-board/artefacts',
        'css!amy-circuit-board/amy-connections/style', 'resource/service'], function (ng, app, artefacts) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	// TODO: lots of stuff can still be refactored in this file; there is code-duplication


	app.directive('amyConnections', ['$bind', 'ResourceService', function ($bind, ResourceService) {
		return {
			restrict:   'A',
			scope:      true,
			controller: ['$scope', function ($scope) {
				$scope.circuitBoard.graphLayer.then(function (graphLayer) {

					var graphGroup = graphLayer.newGraphGroup();
					graphGroup.setGravityFactor(0);
					graphGroup.setChargeFactor(0.003);
					graphGroup.setLinkDistanceFactor(0.001);

					var registeredTileJunctions = { vascular: {}, neural: {} };
					var visibleTileJunctions = { vascular: {}, neural: {} };

					var updateGraph = _.debounce(function updateGraph() {
						//// Remove connections and inner junctions (to start again); TODO: keep what can be kept?
						graphGroup.removeAllEdgesAndVertices();

						ResourceService.paths(_(registeredTileJunctions).values().map(Object.keys).concatenated().uniq().value()).then(function (retrievedPaths) {

							//// disregard paths that start and end in the same tile
							_(retrievedPaths).remove(function (path) { return path.from === path.to; });

							//// now draw the relevant graphs for all connection types (vascular, neural, ...)
							//
							_(iface.types).forEach(function (type, typeName) {

								//// Select paths of the right type
								var paths = _.filter(retrievedPaths, function (path) { return path.type === typeName; });

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

								//// Select the tile junctions that are involved
								//
								_(visibleTileJunctions[typeName]).forEach(function (tileJunction) {
									tileJunction.showVertex = false;
								});
								visibleTileJunctions[typeName] = {};
								_(paths).forEach(function (path) {
									addTileJunction(path.from);
									addTileJunction(path.to);
								});
								function addTileJunction(entityId) {
									if (_(visibleTileJunctions[typeName][entityId]).isUndefined()) {
										visibleTileJunctions[typeName][entityId] = registeredTileJunctions[typeName][entityId];
										visibleTileJunctions[typeName][entityId].showVertex = true;
									}
								}

								//// Find the branching junctions and connections and add them to the graph
								//
								var branchingJunctionMap = {};
								_(paths).forEach(function (path) {
									var pathArray = path.path;

									var tileJunction1 = registeredTileJunctions[typeName][path.from];
									var tileJunction2 = registeredTileJunctions[typeName][path.to];

									//// how to add a branching junction, if it's not already there
									//
									function ensureJunction(junctionId) {
										if (_(branchingJunctionMap[junctionId]).isUndefined()) {
											var branchingJunction = branchingJunctionMap[junctionId]
													= new artefacts[iface.types[path.type].branchingJunctionType]({
												id:                junctionId,
												parent:            $scope.circuitBoard,
												showVertex:        true,
												x: (tileJunction1.x + tileJunction2.x) / 2, // initially right in between;
												y: (tileJunction1.y + tileJunction2.y) / 2, // good enough
												subtype:           path.subtype,
												graphZIndex:       400,
												detailTemplateUrl: type.junctionDetailTemplateUrl,
												ResourceService:   ResourceService,
												$bind:             $bind,
												$scope:            $scope
											});
											graphGroup.addVertex(branchingJunction);
										}
									}

									//// how to add a new connection
									//
									function addConnection(sourceJunction, targetJunction, hiddenJunctions) {
										var edgeArtefact = new artefacts[type.connectionType]({
											id: path.type + 'Connection:(' + sourceJunction.id + ',' + targetJunction.id + ')',
											parent:            $scope.circuitBoard,
											source:            sourceJunction,
											target:            targetJunction,
											subtype:           path.subtype,
											hiddenJunctions:   _.clone(hiddenJunctions),
											linkDistanceFactor: (hiddenJunctions.length + 1) / 10,
											graphZIndex:       ((sourceJunction.type === path.type + 'TileJunction' ||
											                     targetJunction.type === path.type + 'TileJunction') ?
											                    100 : 300),
											detailTemplateUrl: type.connectionDetailTemplateUrl,
											ResourceService:   ResourceService,
											$bind:             $bind,
											$scope:            $scope
										});
										graphGroup.addEdge(edgeArtefact);
									}

									var hiddenJunctions = [];
									var sourceJunction = registeredTileJunctions[typeName][path.from];
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
									addConnection(sourceJunction, registeredTileJunctions[typeName][path.to], hiddenJunctions);
								});

							});

						});
					}, 200);

					var iface = {
						registerTileJunction:   function registerTileJunction(tileJunction) {
							registeredTileJunctions[tileJunction.connectionType][tileJunction.entity._id] = tileJunction;
							updateGraph();
						},
						deregisterTileJunction: function registerTileJunction(tileJunction) {
							delete registeredTileJunctions[tileJunction.connectionType][tileJunction.entity._id];
							updateGraph();
						},
						types:                  {
							vascular: {
								tileJunctionType:            'VascularTileJunction',
								branchingJunctionType:       'VascularBranchingJunction',
								connectionType:              'VascularConnection',
								connectionDetailTemplateUrl: 'amy-circuit-board/amy-connections/vascular-connection-details.html',
								junctionDetailTemplateUrl:   'amy-circuit-board/amy-connections/vascular-junction-details.html'
							},
							neural:   {
								tileJunctionType:            'NeuralTileJunction',
								branchingJunctionType:       'NeuralBranchingJunction',
								connectionType:              'NeuralConnection',
								connectionDetailTemplateUrl: 'amy-circuit-board/amy-connections/neural-connection-details.html',
								junctionDetailTemplateUrl:   'amy-circuit-board/amy-connections/neural-junction-details.html'
							}
						}
					};

					$scope.connectionsDeferred.resolve(iface);

				});
			}]
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
