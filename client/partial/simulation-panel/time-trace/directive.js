'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module', 'd3', 'lodash'], function (app, d3, _) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	app.directive('amyTimeTrace', ['$window', function ($window) {
		return {
			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			restrict   : 'E',
			templateUrl: 'partial/simulation-panel/time-trace/view.html',
			replace    : false,
			scope      : {
				stream     : '=amyStream',
				currentTime: '=amyCurrentTime',
				maxTime    : '=amyMaxTime'
			},

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			controller: ['$scope', function (/*$scope*/) {}],

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			compile: function () {
				return {

					pre: function preLink($scope, iElement/*, iAttrs, controller*/) {

						var margin = { top: 10, right: 10, bottom: 10, left: 40 };
						var width, height;
						var svgCanvas = d3.select(iElement.find('> svg > g')[0]);

						svgCanvas.attr('transform', "translate(" + margin.left + "," + margin.top + ")");
						svgCanvas.select('rect.border').attr({ top: 0, left: 0 });
						svgCanvas.select('#dataArea > rect').attr({ top: 0, left: 0 });

						var yAxis = d3.svg.axis();
						var tracePath = svgCanvas.select('path.trace.normal');
						var shadowLines = svgCanvas.select('g.shadows > line');

						tracePath.attr('clip-path', 'url(#dataArea)').style($scope.stream.css);

						var xScale = d3.scale.linear();
						var yScale = d3.scale.linear();
						var lineGenerator = d3.svg.line()
								.x(function (d) {
									return xScale(d.time);
								})
								.y(function (d) {
									return yScale(d.value);
								});

						var shadowCanvas = d3.select(iElement.find('> svg > g > g.shadows')[0]);
						var shadowData = {};
						var minValue = Infinity;
						var maxValue = -Infinity;

						function drawData() {
							//// adjust min/max values

							_($scope.stream.data).filter(function (d) {
								return d.time <= $scope.maxTime
							}).forEach(function (d) {
								minValue = Math.min(minValue, d.value);
								maxValue = Math.max(maxValue, d.value);
							});

							//// perform scaling

							xScale.domain([0, $scope.maxTime]);
							yScale.domain([minValue, maxValue]);

							yAxis.scale(yScale).orient('left');
							svgCanvas.select(".y.axis").call(yAxis);

							//// draw the main trace

							tracePath.datum(_.filter($scope.stream.data, function (d) {
								return d.time <= $scope.currentTime;
							})).attr("d", lineGenerator);

							//// possibly add new shadows or remove all shadows if there is no data at all

							// TODO: move to a system where the shadow-traces are passed in from the outside as arrays,
							//     : not derived from the main trace

							if ($scope.maxTime === 0) {
								shadowData = {};
								minValue = Infinity;
								maxValue = -Infinity;
							} else {
								for (var i = 0; i < $scope.stream.data.length - 1; ++i) {
									var d = $scope.stream.data;
									if (d[i + 1].time <= $scope.currentTime) {
										shadowData[d[i].time + '(' + d[i].value + ',' + d[i + 1].value + ')'] = {
											time1 : d[i].time,
											time2 : d[i + 1].time,
											value1: d[i].value,
											value2: d[i + 1].value
										};
									}
								}
							}

							//// draw the shadows

							shadowLines = shadowCanvas.selectAll('line').data(_(shadowData).values().value(), function (d) {
								return d.time1 + '(' + d.value1 + ',' + d.value2 + ')';
							});
							shadowLines.enter().append("line").attr('clip-path', 'url(#dataArea)');
							shadowLines.attr("x1", function (d) {
								return xScale(d.time1);
							}).attr("y1", function (d) {
								return yScale(d.value1);
							}).attr("x2", function (d) {
								return xScale(d.time2);
							}).attr("y2", function (d) {
								return yScale(d.value2);
							});
							shadowLines.exit().remove();
						}

						function adjustSize() {
							width = iElement.width() - margin.left - margin.right;
							height = iElement.height() - margin.top - margin.bottom;

							svgCanvas.select('rect.border').attr({ width: width, height: height });
							svgCanvas.select('#dataArea > rect').attr({ width: width, height: height });

							xScale.range([0, width]);
							yScale.range([height, 0]);

							drawData();
						}

						adjustSize();

						// TODO: automatically react to size changes

						$scope.$watch('stream', drawData);
						$scope.$watch('currentTime', drawData);
						$scope.$watch('maxTime', drawData);

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
