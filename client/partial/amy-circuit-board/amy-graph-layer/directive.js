'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['lodash', 'jquery', 'angular', 'app/module', 'd3', '$bind/service'], function (_, $, ng, app, d3) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	app.directive('amyGraphLayer', ['$bind', function ($bind) {
		return {

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			restrict: 'E',
			template: '<svg amy-graph-layer ng-class="{ dragging: circuitBoard.draggingVertex }"></svg>',
			replace:  true,
			scope:    true,

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			compile: function () {
				return {
					pre: function preLink($scope, iElement/*, iAttrs, controller*/) {

						//////////////////// creating the graph ////////////////////////////////////////////////////////

						//// initialize the data
						//
						$scope.vertexArtefacts = {};
						$scope.edgeArtefacts = {};

						//// create the force layout
						//
						var force = d3.layout.force()
								.nodes(_.values($scope.vertexArtefacts))
								.links(_.values($scope.edgeArtefacts))
								.size([iElement.width(), iElement.height()])
								.gravity(0)
								.charge(function (d) {
									return -0.00025 * d.group.region.width * d.group.region.height;
								})
								.linkDistance(function (d) {
									return 0.0001 * d.group.region.width * d.group.region.height * (d.linkDistanceFactor || 1);
								})
								.linkStrength(0.8);

						//// create corresponding svg elements
						//
						var svg = d3.select(iElement[0]);
						var edges = svg.selectAll('.edge');
						var vertices = svg.selectAll('.vertex');

						//// visible vertices and edges
						//
						var visibleVertices, visibleEdges;


						//////////////////// updating the graph ////////////////////////////////////////////////////////

						$scope.updateGraph = _.debounce($bind(function updateGraph() {

							// using the d3 general update pattern:
							// http://bl.ocks.org/mbostock/3808218

							visibleVertices = _($scope.vertexArtefacts)
									.values().filter(function (artefact) { return artefact.showVertex; }).value();
							visibleEdges = _.values($scope.edgeArtefacts);

							//// restart the force
							//
							force.nodes(visibleVertices).links(visibleEdges).start();

							//// vertices
							//
							vertices = svg.selectAll('.vertex').data(visibleVertices, _.property('graphId'));
							vertices.enter().append(function (d) { return d.element; })
									.classed('vertex', true).classed('edge', false)
									.call(force.drag); // all vertices can be dragged around
							vertices.exit().remove();

							//// edges
							//
							edges = svg.selectAll('.edge').data(visibleEdges, _.property('graphId'));
							edges.enter().append(function (d) { return d.element; })
									.classed('edge', true).classed('vertex', false);
							edges.exit().remove();

							//// define a nice visual z-order for the svg elements
							//
							svg.selectAll('.vertex, .edge').sort(function (a, b) {
								return (a.graphZIndex < b.graphZIndex) ? -1 : ((a.graphZIndex === b.graphZIndex) ? 0 : 1);
							});

						}), 200); // TODO: when set too low, x="NaN"-like errors occur (though they don't break anything)


						//////////////////// animation tick ////////////////////////////////////////////////////////////

						force.on("tick", function tick(e) {
							var k = .1 * e.alpha;

							_(visibleVertices).forEach(function (d) {
								//// gravitate towards the center of the region
								d.x += d.group.gravityFactor * (d.group.region.left + .5 * d.group.region.width - d.x) * k;
								d.y += d.group.gravityFactor * (d.group.region.top + .5 * d.group.region.height - d.y) * k;

								//// and always stay within the region
								d.x = Math.max(d.x, d.group.region.left);
								d.x = Math.min(d.x, d.group.region.left + d.group.region.width);
								d.y = Math.max(d.y, d.group.region.top);
								d.y = Math.min(d.y, d.group.region.top + d.group.region.height);
							});

							vertices.attr('x', function (d) { return d.x; })
									.attr('y', function (d) { return d.y; });
							edges   .attr("x1", function (d) { return d.source.x; })
									.attr("y1", function (d) { return d.source.y; })
									.attr("x2", function (d) { return d.target.x; })
									.attr("y2", function (d) { return d.target.y; });
						});


						//////////////////// interfaces to add vertices and edges //////////////////////////////////////

						//// Give the circuitboard a function for creating new interfaces,
						//// used to create vertices and edges and such:
						//
						$scope.graphLayerDeferred.resolve({
							newGraphGroup: function newGraphGroup() {
								var group = {
									id: _.uniqueId('group'),
									vertices: [],
									edges: [],
									gravityFactor: 1,
									region: { // by default, the whole canvas with a small padding
										top: 10,
										left: 10,
										get width() { return iElement.width() - 20 },
										get height() { return iElement.height() - 20 }
									}
								};
								return {
									remove: function remove() {
										// called when a graph group is discarded;
										// may do stuff in the future
									},
									setGravityFactor: function (factor) {
										group.gravityFactor = factor;
									},
									setRegion: function setRegion(region) {
										group.region = region;
										$scope.updateGraph();
									},
									addVertex: function addVertex(vertex) {
										vertex.group = group;
										group.vertices.push(vertex);
										vertex.graphId = group.id + ':' + vertex.id;
										$scope.vertexArtefacts[vertex.graphId] = vertex;
										$scope.updateGraph();
									},
									removeVertex: function removeVertex(vertex) {
										if (vertex) {
											delete $scope.vertexArtefacts[vertex.graphId];
											_(group.vertices).pull(vertex);
											$scope.updateGraph();
										}
									},
									addEdge: function addEdge(edge) {
										edge.group = group;
										group.edges.push(edge);
										edge.graphId = group.id + ':' + edge.id;
										$scope.edgeArtefacts[edge.graphId] = edge;
										$scope.updateGraph();
									},
									removeEdge: function removeEdge(edge) {
										if (edge) {
											delete $scope.edgeArtefacts[edge.graphId];
											_(group.edges).pull(edge);
											$scope.updateGraph();
										}
									},
									removeAllEdgesAndVertices: function removeAllEdgesAndVertices() {
										_(group.edges).forEach(function (edge) {
											if (edge) { delete $scope.edgeArtefacts[edge.graphId]; }
										});
										_(group.vertices).forEach(function (vertex) {
											if (vertex) { delete $scope.vertexArtefacts[vertex.graphId]; }
										});
										_(group.edges).remove();
										_(group.vertices).remove();
										$scope.updateGraph();
									},
									vertices: function vertices() { return _(group.vertices).clone(); },
									edges: function edges() { return _(group.edges).clone(); }
								};
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
