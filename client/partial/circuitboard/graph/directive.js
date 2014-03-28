'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['lodash', 'angular', 'app/module', 'd3', 'resource/service'], function (_, ng, ApiNATOMY, D3) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	ApiNATOMY.directive('amyGraph', ['$window', '$bind', 'ResourceService', function ($window, $bind, Resources) {
		return {

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			restrict: 'E',
			template: '<svg></svg>',
			replace:  false,
			scope:    {
				activeTileJunctions: '=amyActiveTileJunctions'
			},

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			compile: function () {
				return {

					pre: function preLink($scope, iElement/*, iAttrs, controller*/) {

						//////////////////// creating the graph ////////////////////////////////////////////////////////

						//// initialize the data

						var connections = [];
						var junctions = [];

						//// create the force layout

						var force = D3.layout.force()
								.nodes(junctions)
								.links(connections)
								.size([iElement.width(), iElement.height()])
								.gravity(0)
								.charge(-500)
								.linkDistance(10)
								.on("tick", tick);


						//// create corresponding svg elements

						var svg = D3.select(iElement.find('svg')[0]);
						var connectionLines = svg.selectAll('line');
						var junctionPoints = svg.selectAll('circle');


						//////////////////// updating the graph ////////////////////////////////////////////////////////

						function updateGraph() {
							// using the D3 general update pattern:
							// http://bl.ocks.org/mbostock/3808218


							//// restart the force

							force.nodes(junctions).links(connections).start();


							//// connectionLines

							connectionLines = svg.selectAll('line').data(connections,
									function (d) { return d.source.id + ' - ' + d.target.id; });
							connectionLines.enter().append("line").attr('class', 'vesselLine');
							connectionLines
									.attr("x1", function (d) { return d.source.x; })
									.attr("y1", function (d) { return d.source.y; })
									.attr("x2", function (d) { return d.target.x; })
									.attr("y2", function (d) { return d.target.y; });
							connectionLines.exit().remove();


							//// junctionPoints

							junctionPoints = svg.selectAll('circle').data(junctions,
									function (d) { return d.id; });
							junctionPoints.enter().append("circle")
									.attr('class', function (d) { return (d.fixed ? 'tilePoint' : 'junctionPoint'); })
									.attr("r", function (d) { return (d.fixed ? 3 : 2); });
							junctionPoints
									.attr("cx", function (junction) { return junction.x; })
									.attr("cy", function (junction) { return junction.y; });
							junctionPoints.exit().remove();
						}

						//////////////////// reacting to changes ///////////////////////////////////////////////////////

						function tick() {



							connectionLines
									.attr("x1", function (d) { return d.source.x; })
									.attr("y1", function (d) { return d.source.y; })
									.attr("x2", function (d) { return d.target.x; })
									.attr("y2", function (d) { return d.target.y; });

							junctionPoints
									.attr("cx", function (junction) { return junction.x; })
									.attr("cy", function (junction) { return junction.y; });
						}

						$scope.$on('treemap-redraw', function () {

							//// resize canvas

							force.size([iElement.width(), iElement.height()]);

							//// OK; update the graph

							updateGraph();
						});

						$scope.$watch('activeTileJunctions', function (activeTileJunctions) {
							Resources.paths(_(activeTileJunctions).pluck('id').value()).then(function (paths) {

								// find the connections of all inner junctions (so we can eliminate linear ones)

								var junctionDirectConnections = {};

								_(paths).forEach(function (path) {
									var pathArray = path.path;
									for (var i = 1; i < pathArray.length - 1; ++i) {
										if (!_(junctionDirectConnections[pathArray[i]]).isObject()) {
											junctionDirectConnections[pathArray[i]] = {};
										}
										junctionDirectConnections[pathArray[i]][pathArray[i-1]] = true;
										junctionDirectConnections[pathArray[i]][pathArray[i+1]] = true;
									}
								});

								//// reset connections and junctions

								_(connections).remove();
								_(junctions).remove();

								//// recording relevant tile junctions

								var tileJunctionMap = {};

								function addTileJunction(id) {
									if (_(tileJunctionMap[id]).isUndefined()) {
										tileJunctionMap[id] = _(activeTileJunctions[id]).cloneDeep();
										junctions.push(tileJunctionMap[id]);
									}
								}
								_(paths).forEach(function (path) {
									addTileJunction(path.from);
									addTileJunction(path.to);
								});

								//// recording inner junctions and connections

								var innerJunctionMap = {};

								_(paths).forEach(function (path) {
									var pathArray = path.path;

									var tile1 = tileJunctionMap[path.from];
									var tile2 = tileJunctionMap[path.to];

									var sourceJunction = tileJunctionMap[path.from];
									for (var i = 1; i < pathArray.length - 1; ++i) {
										if (_(junctionDirectConnections[pathArray[i]]).size() > 2) {

											if (_(innerJunctionMap[pathArray[i]]).isUndefined()) {
												innerJunctionMap[pathArray[i]] = {
													id: pathArray[i],
													x: (tile1.x + tile2.x) / 2, // right in between; good enough
													y: (tile1.y + tile2.y) / 2
												};
												junctions.push(innerJunctionMap[pathArray[i]]);
											}

											connections.push({
												source: sourceJunction,
												target: innerJunctionMap[pathArray[i]]
											});
											sourceJunction = innerJunctionMap[pathArray[i]];
										}
									}
									connections.push({
										source: sourceJunction,
										target: tileJunctionMap[path.to]
									});
								});

								//// OK; update the graph

								updateGraph();
							});
						}, true);

					},

					post: function postLink(/*$scope, iElement, iAttrs, controller*/) {}

				};
			}

			////////////////////////////////////////////////////////////////////////////////////////////////////////////
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
