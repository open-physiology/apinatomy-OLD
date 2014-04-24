'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['lodash', 'jquery', 'angular', 'app/module', 'd3', 'resource/service'], function (_, $, ng, app, d3) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	app.directive('amyProteinGraph', ['$bind', '$window', 'ResourceService', function ($bind/*, $window, Resources*/) {
		return {

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			restrict: 'E',
			template: '<svg></svg>',
			replace : false,
			scope   : {
				activeTileJunctions: '=amyActiveTileJunctions',
				dragging           : '=',
				visibleProteins    : '=amyVisibleProteins'
			},

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			compile: function () {
				return {

					pre: function preLink($scope, iElement/*, iAttrs, controller*/) {

						//////////////////// creating the graph ////////////////////////////////////////////////////////

						//// initialize the data

						$scope.visibleProteins = {};
						var connections = [];
						var junctions = [];


						//// create the force layout

						var force = d3.layout.force()
								.nodes(junctions)
								.links(connections)
								.size([iElement.width(), iElement.height()])
								.gravity(0)
								.charge(-30)
								.linkDistance(40);

						//// create corresponding svg elements

						var svg = d3.select(iElement.find('svg')[0]);
						var connectionLines = svg.selectAll('line');
						var junctionAreas = svg.selectAll('.junctionArea');

						//////////////////// updating the graph ////////////////////////////////////////////////////////

						function updateGraph() {
							// using the d3 general update pattern:
							// http://bl.ocks.org/mbostock/3808218

							//// restart the force

							force.nodes(junctions).links(connections).start();


							//// junctionAreas

							junctionAreas = svg.selectAll('.junctionArea').data(junctions, function (d) {
								return d.id;
							});
							junctionAreas.enter().append("circle")
									.attr('class', 'junctionArea')
									.attr("r", 4)
									.call(force.drag);
							junctionAreas
									.attr("cx", function (junction) {
										return junction.x = junction.bindX(junction.x);
									})
									.attr("cy", function (junction) {
										return junction.y = junction.bindY(junction.y);
									});
							junctionAreas.exit().remove();

							//// connectionLines

							connectionLines = svg.selectAll('line').data(connections,
									function (d) {
										return d.source.id + ' - ' + d.target.id;
									});
							connectionLines.enter().append("line").attr('class', 'vesselLine');
							connectionLines
									.attr("x1", function (d) {
										return d.source.x;
									})
									.attr("y1", function (d) {
										return d.source.y;
									})
									.attr("x2", function (d) {
										return d.target.x;
									})
									.attr("y2", function (d) {
										return d.target.y;
									});
							connectionLines.exit().remove();

							//// define a nice visual z-order for the svg elements

							svg.selectAll('*').sort(function (a, b) {
								return (!!a.id < !!b.id) ? -1 : (!!a.id === !!b.id ? 0 : 1);
							});
						}

						//////////////////// reacting to changes ///////////////////////////////////////////////////////

						force.on("tick", $bind(function tick(e) {
							var k = .1 * e.alpha;

							_(junctions).forEach(function (j) {
								j.x += (.5 * j.tile.x2 + .5 * j.tile.x1 - j.x) * k;
								j.y += (.5 * j.tile.y2 + .5 * j.tile.y1 - j.y) * k;
							});

							junctionAreas
									.attr("cx", function (junction) {
										return junction.x = junction.bindX(junction.x);
									})
									.attr("cy", function (junction) {
										return junction.y = junction.bindY(junction.y);
									});

							connectionLines
									.attr("x1", function (d) {
										return d.source.x;
									})
									.attr("y1", function (d) {
										return d.source.y;
									})
									.attr("x2", function (d) {
										return d.target.x;
									})
									.attr("y2", function (d) {
										return d.target.y;
									});
						}));

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

							//// reset connections and junctions

							_(connections).remove();
							_(junctions).remove();

							$scope.visibleProteins = {};


							//// populate junctions

							_(activeTileJunctions).forEach(function (tile) {

								function id(protein) {
									return "(" + tile.entity._id + ", " + protein + ")";
								}

								var bindX = _.bindKey(tile, 'bindX');
								var bindY = _.bindKey(tile, 'bindY');

								_(tile.entity.proteins).forEach(function (protein) {
									$scope.visibleProteins[id(protein)] = {
										bindX: bindX,
										bindY: bindY,
										x    : 0,
										y    : 0,
										id   : id(protein),
										tile : tile
									};
									junctions.push($scope.visibleProteins[id(protein)]);
								});

								_(tile.entity.proteinInteractions).forEach(function (interaction) {
									connections.push({
										source: $scope.visibleProteins[id(interaction.interaction[0])],
										target: $scope.visibleProteins[id(interaction.interaction[1])]
									});
								});

							});


							//// OK; update the graph

							updateGraph();
						}, true);

					},

					post: function postLink(/*$scope, iElement, iAttrs, controller*/) {
					}

				};
			}

			////////////////////////////////////////////////////////////////////////////////////////////////////////////
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
