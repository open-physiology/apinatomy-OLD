'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['lodash', 'jquery', 'angular', 'app/module', 'd3', 'resource/service'], function (_, $, ng, app, d3) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	app.directive('amyGraph', ['$window', '$bind', 'ResourceService', function ($window, $bind, Resources) {
		return {

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			restrict: 'E',
			template: '<svg></svg>',
			replace : false,
			scope   : {
				activeTileJunctions: '=amyActiveTileJunctions',
				dragging           : '='
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

						var force = d3.layout.force()
								.nodes(junctions)
								.links(connections)
								.size([iElement.width(), iElement.height()])
								.gravity(0)
								.charge(-400)
								.linkDistance(10);

						//// create corresponding svg elements

						var svg = d3.select(iElement.find('svg')[0]);
						var connectionLines = svg.selectAll('line');
						var junctionPoints = svg.selectAll('.tilePoint, .junctionPoint');
						var junctionAreas = svg.selectAll('.junctionArea');

						//////////////////// updating the graph ////////////////////////////////////////////////////////

						var fixedSegment = null;

						function updateGraph() {
							// using the d3 general update pattern:
							// http://bl.ocks.org/mbostock/3808218

							//// restart the force

							force.nodes(junctions).links(connections).start();

							//// junctionPoints

							junctionPoints = svg.selectAll('.tilePoint, .junctionPoint').data(junctions, function (d) { return d.id; });
							junctionPoints.enter().append("circle")
									.attr('class', function (d) { return (d.isTileJunction ? 'tilePoint ' : 'junctionPoint ') + d.type; }) // vascular, neural
									.classed('arterial', function (d) { return d.subtype === 'arterial'; })
									.classed('venous', function (d) { return d.subtype === 'venous'; })
									.attr("r", function (d) { return (d.isTileJunction ? 4 : 2); });
							junctionPoints
									.attr("cx", function (junction) { return junction.x = (junction.bindX ? junction.bindX(junction.x) : junction.x); })
									.attr("cy", function (junction) { return junction.y = (junction.bindY ? junction.bindY(junction.y) : junction.y); });
							junctionPoints.exit().remove();

							//// junctionAreas (a larger area by which to grab / drag junction points)

							junctionAreas = svg.selectAll('.junctionArea').data(junctions, function (d) { return d.id; });
							junctionAreas.enter().append("circle")
									.attr('class', function (d) { return 'junctionArea ' + d.type; }) // vascular, neural
									.attr("r", function (d) { return (d.isTileJunction ? 12 : 10); })
									.call(force.drag);
							junctionAreas
									.attr("cx", function (junction) { return junction.x; })
									.attr("cy", function (junction) { return junction.y; });
							junctionAreas.exit().remove();

							//// connectionLines

							connectionLines = svg.selectAll('line').data(connections,
									function (d) { return d.source.id + ' - ' + d.target.id; });
							connectionLines.enter().append("line").attr('class', function (d) { return d.type; }) // vascular, neural
									.classed('arterial', function (d) { return d.subtype === 'arterial'; })
									.classed('venous', function (d) { return d.subtype === 'venous'; })
									.on('mouseover', $bind(function (d) {
										$scope.$root.$broadcast('vascular-segment-focus', d)
									}))
									.on('mouseout', $bind(function (d) {
										$scope.$root.$broadcast('vascular-segment-focus')
									}))
									.on('click', $bind(function (d) {
										if (d.isFixed) {
											d.isFixed = false;
											fixedSegment = null;
										} else {
											if (fixedSegment) { fixedSegment.isFixed = false; }
											fixedSegment = d;
											d.isFixed = true;
										}
										$scope.$root.$broadcast('vascular-segment-fix', fixedSegment)
									}));
							connectionLines
									.attr("x1", function (d) { return d.source.x; })
									.attr("y1", function (d) { return d.source.y; })
									.attr("x2", function (d) { return d.target.x; })
									.attr("y2", function (d) { return d.target.y; });
							connectionLines.exit().remove();

							//// define a nice visual z-order for the svg elements

							svg.selectAll('*').sort(function (a, b) {
								var aCategory, bCategory; // tileJunctionEdge < tileJunction < otherEdge < otherJunction

								if (!a.id && (a.source.isTileJunction || a.target.isTileJunction)) { aCategory = 0; }
								else if (a.isTileJunction) { aCategory = 1; }
								else if (!a.id) { aCategory = 2; }
								else { aCategory = 3; }

								if (!b.id && (b.source.isTileJunction || b.target.isTileJunction)) { bCategory = 0; }
								else if (b.isTileJunction) { bCategory = 1; }
								else if (!b.id) { bCategory = 2; }
								else { bCategory = 3; }

								return (aCategory < bCategory ? -1 : (aCategory === bCategory ? 0 : 1) );
							});
						}

						//////////////////// reacting to changes ///////////////////////////////////////////////////////

						force.on("tick", function tick() {
							junctionPoints
									.attr("cx", function (junction) { return junction.x = (junction.bindX ? junction.bindX(junction.x) : junction.x); })
									.attr("cy", function (junction) { return junction.y = (junction.bindY ? junction.bindY(junction.y) : junction.y); });

							junctionAreas
									.attr("cx", function (junction) { return junction.x; })
									.attr("cy", function (junction) { return junction.y; });

							connectionLines
									.attr("x1", function (d) { return d.source.x; })
									.attr("y1", function (d) { return d.source.y; })
									.attr("x2", function (d) { return d.target.x; })
									.attr("y2", function (d) { return d.target.y; });
						});

						var draggedJunction;
						force.drag().on("dragstart", function () {
							d3.event.sourceEvent.stopPropagation();
							draggedJunction = $(d3.event.sourceEvent.srcElement);
							draggedJunction.addSvgClass('dragged');
							$scope.dragging = true;
						}).on("dragend", function () {
							d3.event.sourceEvent.stopPropagation();
							draggedJunction.removeSvgClass('dragged');
							draggedJunction = undefined;
							$scope.dragging = false;
						});

						$scope.$on('treemap-redraw', function () {
							force.size([iElement.width(), iElement.height()]);
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
										junctionDirectConnections[pathArray[i]][pathArray[i - 1]] = true;
										junctionDirectConnections[pathArray[i]][pathArray[i + 1]] = true;
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

									var hiddenJunctions = [];

									var sourceJunction = tileJunctionMap[path.from];
									for (var i = 1; i < pathArray.length - 1; ++i) {
										if (_(junctionDirectConnections[pathArray[i]]).size() === 2) {
											hiddenJunctions.push(_(pathArray[i]).clone());
										} else {
											if (_(innerJunctionMap[pathArray[i]]).isUndefined()) {
												innerJunctionMap[pathArray[i]] = {
													id: pathArray[i],
													x : (tile1.x + tile2.x) / 2, // initially right in between; good enough
													y : (tile1.y + tile2.y) / 2,
													subtype: path.subtype
												};
												junctions.push(innerJunctionMap[pathArray[i]]);
											}

											//// record (for styling) if this junction is vascular; TODO: separate junctions per type
											sourceJunction.type = path.type;

											//// and add the connection
											connections.push({
												source: sourceJunction,
												target: innerJunctionMap[pathArray[i]],
												type  : path.type,
												subtype: path.subtype,
												hiddenJunctions: _(hiddenJunctions).clone()
											});
											sourceJunction = innerJunctionMap[pathArray[i]];
											hiddenJunctions = [];
										}
									}

									//// record (for styling) if this junction is vascular; TODO: separate junctions per type
									sourceJunction.type = path.type;
									tileJunctionMap[path.to].type = path.type;

									//// and add the connection
									connections.push({
										source: sourceJunction,
										target: tileJunctionMap[path.to],
										type  : path.type,
										subtype: path.subtype,
										hiddenJunctions: _(hiddenJunctions).clone()
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
