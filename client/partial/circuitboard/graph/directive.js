'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['lodash', 'angular', 'app/module', 'd3', 'resource/service'], function (_, ng, ApiNATOMY, d3) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//	var EXAMPLE_GRAPH = {
//		"nodes": [
//			{"x": 469, "y": 410},
//			{"x": 493, "y": 364},
//			{"x": 442, "y": 365},
//			{"x": 467, "y": 314},
//			{"x": 477, "y": 248},
//			{"x": 425, "y": 207},
//			{"x": 402, "y": 155},
//			{"x": 369, "y": 196},
//			{"x": 350, "y": 148},
//			{"x": 539, "y": 222},
//			{"x": 594, "y": 235},
//			{"x": 582, "y": 185},
//			{"x": 633, "y": 200}
//		],
//		"links": [
//			{"source": 0, "target": 1},
//			{"source": 1, "target": 2},
//			{"source": 2, "target": 0},
//			{"source": 1, "target": 3},
//			{"source": 3, "target": 2},
//			{"source": 3, "target": 4},
//			{"source": 4, "target": 5},
//			{"source": 5, "target": 6},
//			{"source": 5, "target": 7},
//			{"source": 6, "target": 7},
//			{"source": 6, "target": 8},
//			{"source": 7, "target": 8},
//			{"source": 9, "target": 4},
//			{"source": 9, "target": 11},
//			{"source": 9, "target": 10},
//			{"source": 10, "target": 11},
//			{"source": 11, "target": 12},
//			{"source": 12, "target": 10}
//		]
//	};

	ApiNATOMY.directive('amyGraph', ['$window', '$bind', 'Resources', function ($window, $bind, Resources) {
		return {

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			restrict: 'E',
			template: '<svg></svg>',
			replace : false,
			scope   : {},

			controller: ['$scope', '$rootScope', function ($scope, $rootScope) {

			}],

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			compile: function () {
				return {

					pre: function preLink($scope, iElement, iAttrs, controller) {

						var force = d3.layout.force()
								.size([iElement.width(), iElement.height()])
								.charge(-400)
								.linkDistance(40)
								.on("tick", tick);

						$($window).resize($bind(function (event) {
							console.debug(event);
							force.size([iElement.width(), iElement.height()]).start();
						}));

						var link = d3.select(iElement.find('svg')[0]).selectAll('.link');
						var node = d3.select(iElement.find('svg')[0]).selectAll('.node');


						// populating the graph

						// TEST DATA
						var nodes = ['24tile:60000001', '24tile:60000002', '24tile:60000007', '24tile:60000008']

						force.nodes(graph.nodes).links(graph.links).start();
						link = link.data(graph.links).enter().append("line").attr("class", "link");
						node = node.data(graph.nodes).enter().append("circle").attr("class", "node").attr("r", 5);
						// END of populating the graph

						function tick() {
							link
									.attr("x1", function (d) { return d.source.x; })
									.attr("y1", function (d) { return d.source.y; })
									.attr("x2", function (d) { return d.target.x; })
									.attr("y2", function (d) { return d.target.y; });

							node
									.attr("cx", function (d) { return d.x; })
									.attr("cy", function (d) { return d.y; });
						}



					},

					post: function postLink($scope, iElement, iAttrs, controller) {

					}

				};
			}

			////////////////////////////////////////////////////////////////////////////////////////////////////////////
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
