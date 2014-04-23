'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['lodash', 'jquery', 'angular', 'app/module', 'd3', 'chroma', 'resource/service'], function (_, $, ng, app, d3, color) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	app.directive('amyVariableGlyphs', ['$window', '$bind', function ($window, $bind) {
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

						$scope.$root.selectedVariables = {};

						var junctions = [];

						//// create the force layout

						var force = d3.layout.force()
								.nodes(junctions)
								.size([iElement.width(), iElement.height()])
								.gravity(0)
								.charge(-200);

						//// create corresponding svg elements

						var svg = d3.select(iElement.find('svg')[0]);
						var variablePoints = svg.selectAll('.variablePoint');

						//////////////////// updating the graph ////////////////////////////////////////////////////////

						function updateGlyphs() {
							// using the d3 general update pattern:
							// http://bl.ocks.org/mbostock/3808218

							//// restart the force

							force.nodes(junctions).start();

							//// variablePoints

							variablePoints = svg.selectAll('.variablePoint').data(junctions, function (d) { return d.id; });
							variablePoints.enter().append('rect')
									.attr('class', 'variablePoint')
									.attr('width', 15)
									.attr('height', 15)
									.attr('title', function (d) { return d.variable.variable.name; })
									.call(force.drag)
									.on('click', $bind(onGlyphClick));
							variablePoints
									.attr('fill',   function (d) { return d.variable.selected ? d.variable.color : 'lightgray'; })
									.attr('stroke', function (d) { return d.variable.selected ? color(d.variable.color).darken(30).css() : 'black'; })
									.attr("x", function (junction) {
										junction.x = junction.bindX(junction.x);
										return junction.x - 7.5;
									})
									.attr("y", function (junction) {
										junction.y = junction.bindY(junction.y);
										return junction.y - 7.5;
									});
							variablePoints.exit().remove();

						}

						//////////////////// keeping track of colors ///////////////////////////////////////////////////

						$scope.unusedColors = [
							'green',
							'red',
							'blue',
							'yellow',
							'purple',
							'black', 'black', 'black', 'black', 'black',
							'black', 'black', 'black', 'black', 'black'
						];

						$scope.colorMap = {};

						function getColor(id) {
							if (_($scope.colorMap[id]).isUndefined()) {
								$scope.colorMap[id] = $scope.unusedColors.shift();
							}
							return $scope.colorMap[id];
						}


						//////////////////// reacting to changes ///////////////////////////////////////////////////////

						function onGlyphClick(d/*, i*/) {
							d.variable.selected = !d.variable.selected;
							updateGlyphs();
						}

						force.on("tick", function tick() {
							variablePoints
									.attr("x", function (junction) {
										junction.x = junction.bindX(junction.x);
										return junction.x - 7.5;
									})
									.attr("y", function (junction) {
										junction.y = junction.bindY(junction.y);
										return junction.y - 7.5;
									});
						});

						$scope.$on('treemap-redraw', function () {
							force.size([iElement.width(), iElement.height()]);
							updateGlyphs();
						});

						$scope.$watch('activeTileJunctions', function (activeTileJunctions) {

							//// reset junctions

							_(junctions).remove();


							//// get new ones

							_(activeTileJunctions).forEach(function (tile) {
								_(tile.entity.externals).forEach(function (external) {
									if (external.external.type === 'variable') {
										var id = "(" + tile.entity._id + ", " + external.external._id + ")";
										if (_($scope.$root.selectedVariables[id]).isUndefined()) {
											$scope.$root.selectedVariables[id] = {
												tile:     tile,
												variable: external.external,
												selected: false,
												color:    getColor(id)
											};
										}
										junctions.push({
											bindX:    _.bindKey(tile, 'bindX'),
											bindY:    _.bindKey(tile, 'bindY'),
											x:        0,
											y:        0,
											id:       id,
											variable: $scope.$root.selectedVariables[id]
										});
									}
								});
							});


							//// and remove the ones that are no longer visible from the scope object

							_($scope.$root.selectedVariables).keys().forEach(function (id) {
								if (!_(junctions).pluck('id').contains(id)) {
									delete $scope.$root.selectedVariables[id];
								}
							});


							//// OK; update the graph

							updateGlyphs();

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
