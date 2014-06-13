'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['angular', 'lodash', 'd3', 'css!trace-diagram/style'], function (ng, _, d3) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	var module = ng.module('trace-diagram', []);


//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  // Directive ///////////////////////////////////////////////////////////////////////////////////////////////////////
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	module.directive('traceDiagram', ['$window', function ($window) {
		return {
			restrict:    'E',
			templateUrl: 'trace-diagram/view.html',
			scope:       {
				trace:        '=',
				shadowTraces: '=',
				maxX:         '=',
				traceColor:   '@'
			},
			link:        function ($scope, iElement/*, iAttrs, controller*/) {

				//////////////////// geometry //////////////////////////////////////////////////////////////////////////

				var margin = { top: 10, right: 10, bottom: 10, left: 40 };
				var width, height;
				var svgCanvas = d3.select(iElement.find('> svg > g')[0]);

				svgCanvas.attr('transform', "translate(" + margin.left + "," + margin.top + ")");
				svgCanvas.select('rect.border').attr({ top: 0, left: 0 });
				svgCanvas.select('#dataArea > rect').attr({ top: 0, left: 0 });

				var shadowCanvas = d3.select(iElement.find('> svg > g > g.shadow-traces')[0]);


				//////////////////// scales and axes ///////////////////////////////////////////////////////////////////

				var minX = 0;
				var minY = Infinity;
				var maxY = -Infinity;

				var yAxis = d3.svg.axis();
				yAxis.orient('left');

				var xScale = d3.scale.linear();
				var yScale = d3.scale.linear();


				//////////////////// paths /////////////////////////////////////////////////////////////////////////////

				var lineGenerator = d3.svg.line()
						.x(function (d) { return xScale(d[0]); })
						.y(function (d) { return yScale(d[1]); });

				var tracePath = svgCanvas.select('.normal.trace');
				var shadowTracePaths;


				//////////////////// drawing the trace /////////////////////////////////////////////////////////////////

				var drawData = _.debounce(function drawData() {

					//// adjust min/max values
					//
					_($scope.trace).forEach(function (d) {
						minY = Math.min(minY, d[1]);
						maxY = Math.max(maxY, d[1]);
					});
					_($scope.shadowTraces).forEach(function (shadow) {
						_(shadow).forEach(function (d) {
							minY = Math.min(minY, d[1]);
							maxY = Math.max(maxY, d[1]);
						});
					});

					//// perform scaling
					//
					xScale.domain([minX, $scope.maxX]);
					yScale.domain([minY, maxY]);
					yAxis.scale(yScale);
					svgCanvas.select(".y.axis").call(yAxis);

					//// draw the main trace
					//
					tracePath.datum($scope.trace).attr("d", lineGenerator);

					//// draw the shadow traces
					//
					if (!_($scope.shadowTraces).isUndefined()) {
						// using the d3 general update pattern:
						// http://bl.ocks.org/mbostock/3808218
						shadowTracePaths = shadowCanvas.selectAll('.shadow.trace').data($scope.shadowTraces);
						shadowTracePaths.enter().append('path')
								.classed('trace', true)
								.classed('shadow', true)
								.classed('normal', false);
						shadowTracePaths.exit().remove();
						shadowTracePaths.attr("d", function (d) { return lineGenerator(d); });
					}

				}, 50);

				//// draw the data when it changes
				//
				$scope.$watch('trace', drawData, true);
				$scope.$watch('shadowTraces', drawData, true);


				//////////////////// adjusting for new size ////////////////////////////////////////////////////////////

				function adjustSize() {
					if (iElement.width() > margin.left + margin.right &&
					    iElement.height() > margin.top + margin.bottom) {

						width = iElement.width() - margin.left - margin.right;
						height = iElement.height() - margin.top - margin.bottom;

						svgCanvas.select('rect.border').attr({ width: width, height: height });
						svgCanvas.select('#dataArea > rect').attr({ width: width, height: height });

						xScale.range([0, width]);
						yScale.range([height, 0]);

						drawData();

					}
				}

				//// do it now
				adjustSize();

				//// and when the window size changes
				$($window).on('resize', adjustSize);


			}// link: function ($scope, iElement, iAttrs, ngModel)
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
