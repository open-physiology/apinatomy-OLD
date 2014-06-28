'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['angular', 'lodash', 'd3', 'css!trace-diagram/style'], function (ng, _, d3) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	var module = ng.module('trace-diagram', []);


//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  // Util ////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	var getTextWidth = (function () {
		var canvas = document.createElement("canvas");
		var context = canvas.getContext("2d");
		context.font = '14px arial';
		return function (text) {
			return context.measureText(text).width;
		}
	}());




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
				traceColor:   '@',
				focusTime:    '='
			},
			link:        function ($scope, iElement/*, iAttrs, controller*/) {

				//////////////////// geometry //////////////////////////////////////////////////////////////////////////

				var margin = { top: 10, right: 10, bottom: 10, left: 30 }; // left is also adjusted dynamically
				var width, height;
				var svgCanvas = d3.select(iElement.find('> svg > g')[0]);

				svgCanvas.select('rect.border').attr({ top: 0, left: 0 });
				svgCanvas.select('#dataArea'+$scope.$id+' > rect').attr({ top: 0, left: 0 });

				var shadowCanvas = d3.select(iElement.find('> svg > g > g.shadow-traces')[0]);


				//////////////////// scales and axes ///////////////////////////////////////////////////////////////////

				var minY;
				var maxY;

				var xScale = d3.scale.linear();
				var yScale = d3.scale.linear();
				yScale.nice();

				var maxAxisLabelWidth = 0;
				$scope.$watchCollection(function () { return yScale.ticks(); }, function (ticks) {
					maxAxisLabelWidth = 0;
					_(ticks).forEach(function (nr) {
						nr = parseFloat(nr.toPrecision(12)); // smooth over rounding errors
						maxAxisLabelWidth = Math.max(maxAxisLabelWidth, getTextWidth(nr.toString()));
					});
					if (margin.left !== maxAxisLabelWidth + 20) {
						margin.left = maxAxisLabelWidth + 20;
						adjustSize();
					}
				});

				var yAxis = d3.svg.axis().scale(yScale).tickFormat(function (nr) {
					return parseFloat(nr.toPrecision(12)); // smooth over rounding errors
				});
				yAxis.orient('left');



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
					minY = Infinity;
					maxY = -Infinity;
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
					if (minY === maxY) { maxY = minY + 1; }

					//// perform scaling
					//
					xScale.domain([0, $scope.maxX]);
					yScale.domain([minY, maxY]);
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


				//////////////////// adjusting focus indicator /////////////////////////////////////////////////////////

				function drawFocusIndicator() {
					if (_.isUndefined($scope.focusTime)) {
						svgCanvas.select('.focus-indicator').attr({ visibility: 'hidden' });
					} else {
						svgCanvas.select('.focus-indicator').attr({ visibility: 'visible', x1: xScale($scope.focusTime), x2: xScale($scope.focusTime) });
					}
				}

				$scope.$watchGroup(['focusTime', 'trace.length'], drawFocusIndicator);


				//////////////////// adjusting focus indicator /////////////////////////////////////////////////////////

				$scope.onMouseMove = function onMouseMove($event) {
					$scope.focusTime = xScale.invert($event.offsetX - margin.left);
				};

				$scope.onMouseLeave = function onMouseLeave() {
					$scope.focusTime = undefined;
				};


				//////////////////// adjusting for new size ////////////////////////////////////////////////////////////

				function adjustSize() {
					if (iElement.width() > margin.left + margin.right &&
					    iElement.height() > margin.top + margin.bottom) { // only if margins don't overlap

						width = iElement.width() - margin.left - margin.right;
						height = iElement.height() - margin.top - margin.bottom;

						svgCanvas.attr('transform', "translate(" + margin.left + "," + margin.top + ")");
						svgCanvas.select('rect.border').attr({ width: width, height: height });
						svgCanvas.select('#dataArea'+$scope.$id+' > rect').attr({ width: width, height: height });
						svgCanvas.select('.focus-indicator').attr({ y1: 0, y2: height });

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
