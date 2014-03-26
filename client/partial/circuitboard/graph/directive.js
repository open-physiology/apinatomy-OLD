'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['lodash', 'angular', 'app/module', 'd3', 'resource/service'], function (_, ng, ApiNATOMY, D3) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	ApiNATOMY.directive('amyGraph', ['$window', '$bind', 'ResourceService', function ($window, $bind, Resources) {
		return {

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			restrict: 'E',
			template: '<svg></svg>',
			replace : false,
			scope   : {
				activeTiles: '=amyActiveTiles'
			},

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			compile: function () {
				return {

					pre: function preLink($scope, iElement/*, iAttrs, controller*/) {

						//////////////////// creating the graph ////////////////////////////////////////////////////////

						//// initialize the data

						var connections = [];
						var connectedTiles = [];
						var connectedTileMap = {};

						//// create the force layout

						var force = D3.layout.force()
								.nodes(connectedTiles)
								.links(connections)
								.size([iElement.width(), iElement.height()])
								.gravity(0)       // (no gravity pulling nodes to the center)
								.charge(-400)     // (400 mutual attraction)
								.linkDistance(0); // (no mutual repulsion)


						//// create corresponding svg elements

						var svg = D3.select(iElement.find('svg')[0]);
						var vessels = svg.selectAll('.vessel');
						var joins = svg.selectAll('.join');


						//////////////////// updating the graph ////////////////////////////////////////////////////////

						function updateGraph() {
							// using the D3 general update pattern:
							// http://bl.ocks.org/mbostock/3808218

							//// vessels

							vessels = svg.selectAll('line').data(connections, function (d) {
								return d.source + ' - ' + d.target;
							});
							vessels.enter().append("line").attr('class', 'vessel');
							vessels.transition().duration(600)
									.attr("x1", function (d) {
										return connectedTileMap[d.source].position.left + 15;
									})
									.attr("y1", function (d) {
										return connectedTileMap[d.source].position.top + 15;
									})
									.attr("x2", function (d) {
										return connectedTileMap[d.target].position.left + 15;
									})
									.attr("y2", function (d) {
										return connectedTileMap[d.target].position.top + 15;
									});
							vessels.exit().remove();

							//// joins

							joins = svg.selectAll('circle').data(connectedTiles, function (d) {
								return d.entity._id;
							});
							joins.enter().append("circle").attr('class', 'join').attr("r", 2);
							joins.transition().duration(600)
									.attr("cx", function (tile) {
										return tile.position.left + 15;
									})
									.attr("cy", function (tile) {
										return tile.position.top + 15;
									});
							joins.exit().remove();

							//// restart the force

							force.start();
						}

						//////////////////// reacting to changes ///////////////////////////////////////////////////////

						$scope.$on('treemap-redraw', function () {
							force.size([iElement.width(), iElement.height()]);
							updateGraph();
						});

						$scope.$watchCollection('activeTiles', function () {

							_($scope.activeTiles).forEach(function (activeTile) {
								activeTile.fixed = true; // TODO: this is not ideal, since we're chaning a $scope; fix later
								activeTile.x = activeTile.position.left;
								activeTile.y = activeTile.position.top;
							});

							Resources.paths(_($scope.activeTiles).pluck('entity').pluck('_id').value()).then(function (paths) {

								connectedTileMap = {};
								connections = [];

								//// first, get all junctions involved in these paths

								var junctionIds = [];
								var segments = [];
								_(paths).forEach(function (path) {
									path = path.path;

									console.debug(path);

									var x1fma = $scope.activeTiles[path[0]].position.left;
									var x2fma = $scope.activeTiles[path[path.length-1]].position.left;
									var y1fma = $scope.activeTiles[path[0]].position.top;
									var y2fma = $scope.activeTiles[path[path.length-1]].position.top;
									var segmentCount = path.length-1;
									var dx = (x2fma - x1fma) / segmentCount;
									var dy = (y2fma - y1fma) / segmentCount;

									console.debug('(' + x1fma + ', ' + y1fma + ')', '(' + x2fma + ', ' + y2fma + ')', '---', segmentCount + ' * (' + dx + ', ' + dy + ')');

									for (var i = 1; i < path.length-1; ++i) {
										if (!_(junctionIds).contains(path[i])) {
											connectedTileMap[path[i]] = {
												fixed: false,
												entity: {
													_id: path[i]
												},
												position: {
													left: x1fma + i * dx,
													top: y1fma + i * dy
												},
												x: x1fma + i * dx,
												y: y1fma + i * dy
											};
										}
										segments.push({
											source: path[i-1],
											target: path[i]
										});
									}
									segments.push({
										source: path[path.length-2],
										target: path[path.length-1]
									});
								});

								//// then, set all connections and connectedTiles
								//
								// all segments are connections
								connections = segments;
								// the connectedTiles are filtered out with the paths
								_(paths).forEach(function (path) {
									connectedTileMap[path.source] = $scope.activeTiles[path.source];
									connectedTileMap[path.target] = $scope.activeTiles[path.target];
								});
								// and they include all junctions
								connectedTiles = _.values(connectedTileMap);

								// OK; update the graph

								updateGraph();
							});
						});

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
