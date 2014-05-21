'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['lodash', 'jquery', 'angular', 'app/module', 'd3', 'resource/service'], function (_, $, ng, app, d3) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	app.directive('amyGraphLayer', ['$window', '$bind', 'ResourceService', function ($window, $bind, Resources) {
		return {

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			restrict: 'E',
			template: '<svg></svg>',
			replace:  true,
			scope:    true,

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			compile: function () {
				return {
					pre: function preLink($scope, iElement/*, iAttrs, controller*/) {

						//////////////////// creating the graph ////////////////////////////////////////////////////////

						//// initialize the data
						//
						var edgeArtefacts = [];
						var vertexArtefacts = [];

						//// create the force layout
						//
						var force = d3.layout.force()
								.nodes(vertexArtefacts)
								.links(edgeArtefacts)
								.size([iElement.width(), iElement.height()])
								.gravity(0)
								.charge(-400)
								.linkDistance(10);

						//// create corresponding svg elements
						//
						var svg = d3.select(iElement[0]);
						var edges = svg.selectAll('.edge');
						var vertices = svg.selectAll('.vertex');

						//////////////////// updating the graph ////////////////////////////////////////////////////////

						function updateGraph() {
							// using the d3 general update pattern:
							// http://bl.ocks.org/mbostock/3808218

							// TODO: Have separate 'vertices' and 'edges' collections for each 'd3 module'.
							//     : Every tile will have one of those, for, e.g., proteins. Also, the entire
							//     : circuitboard will have one, for connectivity data.

							//// restart the force
							//
							force.nodes(vertexArtefacts).links(edgeArtefacts).start();

							//// vertices
							//
							vertices = svg.selectAll('.vertex').data(vertexArtefacts, _.createCallback('id'));
							vertices.enter().append(function (d) { return d.svgElement; }).classed('vertex', true);
							vertices.attr("cx", function (d) { return d.x; })
									.attr("cy", function (d) { return d.y; }); // TODO: allow d.x and d.y to be relative to a given rectangular region
							vertices.exit().remove();

							//// edges
							//
							edges = svg.selectAll('.edge').data(edgeArtefacts, _.createCallback('id'));
							edges.enter().append(function (d) { return d.svgElement; }).classed('edge', true);
							edges   .attr("x1", function (d) { return d.source.x; })
									.attr("y1", function (d) { return d.source.y; })
									.attr("x2", function (d) { return d.target.x; })
									.attr("y2", function (d) { return d.target.y; }); // TODO: see above
							edges.exit().remove();

							// TODO: sorting for z-order
						}

						force.on("tick", function tick() {
							vertices.attr("cx", function (d) { return d.x; })
									.attr("cy", function (d) { return d.y; }); // TODO: see above

							edges   .attr("x1", function (d) { return d.source.x; })
									.attr("y1", function (d) { return d.source.y; })
									.attr("x2", function (d) { return d.target.x; })
									.attr("y2", function (d) { return d.target.y; }); // TODO: see above
						});

						//////////////////// reacting to changes ///////////////////////////////////////////////////////

						//// when a vertex is dragged
						//
						var draggedVertex;
						force.drag().on("dragstart", function () {
							d3.event.sourceEvent.stopPropagation();
							draggedVertex = $(d3.event.sourceEvent.srcElement);
							draggedVertex.addSvgClass('dragged');
							//$scope.dragging = true; // TODO: re-enable this, to disable tile highlighting (maybe)
						}).on("dragend", function () {
							d3.event.sourceEvent.stopPropagation();
							draggedVertex.removeSvgClass('dragged');
							draggedVertex = undefined;
							//$scope.dragging = false;
						});

						// TODO: update graph when either content or size changes



					}
				};
			}

			////////////////////////////////////////////////////////////////////////////////////////////////////////////
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
