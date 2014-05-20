'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['lodash', 'app/module', 'd3'], function (_, app, d3) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	app.directive('traceDiagram', ['$bind', '$window', function ($bind, $window) {
		return {
			restrict: 'E',
			templateUrl: 'partial/trace-diagram/view.html',
			scope:    true,
			require:  'ngModel',
			link:     function ($scope, iElement, iAttrs, ngModel) {

				//////////////////// initializing the directive ////////////////////////////////////////////////////////

				function init() {

					//////////////////// geometry //////////////////////////////////////////////////////////////////////

					var margin = { top: 10, right: 10, bottom: 10, left: 40 };
					var width, height;
					var svgCanvas = d3.select(iElement.find('> svg > g')[0]);

					svgCanvas.attr('transform', "translate(" + margin.left + "," + margin.top + ")");
					svgCanvas.select('rect.border').attr({ top: 0, left: 0 });
					svgCanvas.select('#dataArea > rect').attr({ top: 0, left: 0 });











					//////////////////// old operations ////////////////////////////////////////////////////////////////
					// TODO: organize

					var yAxis = d3.svg.axis();
					yAxis.orient('left');
					var tracePath = svgCanvas.select('path.trace.normal');

					tracePath.attr('clip-path', 'url(#dataArea)');

					var xScale = d3.scale.linear();
					var yScale = d3.scale.linear();
					var lineGenerator = d3.svg.line()
							.x(function (d) { return xScale(d[iAttrs['keyX']]); })
							.y(function (d) { return yScale(d[iAttrs['keyY']]); });

					var minValue = Infinity;
					var maxValue = -Infinity;



//					var shadowLines = svgCanvas.select('g.shadows > line');
//					var shadowCanvas = d3.select(iElement.find('> svg > g > g.shadows')[0]);
//					var shadowData = {};










					//////////////////// caption ///////////////////////////////////////////////////////////////////////

					iAttrs.$observe('caption', function (caption) {
						$scope.caption = caption;
					});


					//////////////////// adjusting for new size ////////////////////////////////////////////////////////

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
					//
					adjustSize();

					//// and when the window size changes
					//
					$($window).on('resize', adjustSize);


					//////////////////// drawing the trace /////////////////////////////////////////////////////////////

					function drawData() {

						//// adjust min/max values
						//
						_(ngModel.$modelValue).forEach(function (d) {
							minValue = Math.min(minValue, d[iAttrs['keyY']]);
							maxValue = Math.max(maxValue, d[iAttrs['keyY']]);
						});


						//// perform scaling
						//
						xScale.domain([0, _(ngModel.$modelValue).pluck(iAttrs['keyX']).max()]);
						yScale.domain([minValue, maxValue]);
						yAxis.scale(yScale);
						svgCanvas.select(".y.axis").call(yAxis);


						//// draw the main trace
						//
						tracePath.datum(ngModel.$modelValue).attr("d", lineGenerator);


//						//// possibly add new shadows or remove all shadows if there is no data at all
//						//
//						// TODO: move to a system where the shadow-traces are passed in from the outside as arrays,
//						//     : not derived from the main trace (maybe)
//						//
//						if ($scope.timer.maxTime === 0) {
//							shadowData = {};
//							minValue = Infinity;
//							maxValue = -Infinity;
//						} else {
//							var data = ngModel.$modelValue; // abbreviation
//							for (var i = 0; i < data.length - 1; ++i) {
//								if (data[i + 1]['keyX'] <= $scope.timer.currentTime) {
//									shadowData[data[i]['keyX'] + '(' + data[i]['keyY'] + ',' + data[i + 1]['keyY'] + ')'] = {
//										time1:  data[i]['keyX'],
//										time2:  data[i + 1]['keyX'],
//										value1: data[i]['keyY'],
//										value2: data[i + 1]['keyY']
//									};
//								}
//							}
//						}
//
//
//						//// draw the shadows
//						//
//						shadowLines = shadowCanvas.selectAll('line').data(_(shadowData).values().value(), function (d) {
//							return d.time1 + '(' + d.value1 + ',' + d.value2 + ')';
//						});
//						shadowLines.enter().append("line").attr('clip-path', 'url(#dataArea)');
//						shadowLines.attr("x1", function (d) {
//							return xScale(d.time1);
//						}).attr("y1", function (d) {
//							return yScale(d.value1);
//						}).attr("x2", function (d) {
//							return xScale(d.time2);
//						}).attr("y2", function (d) {
//							return yScale(d.value2);
//						});
//						shadowLines.exit().remove();
					}

					//// do it when the model changes
					//
					ngModel.$render = drawData;

					//// do it when the elements of the model change; TODO: this is a bit of a hack on ngModelController
					//
					$scope.$watchCollection(function () { return ngModel.$modelValue; }, ngModel.$render);


					//////////////////// when is the trace empty ///////////////////////////////////////////////////////

					ngModel.$isEmpty = _.isEmpty;

				}// function init()


				//// initialize now
				//
				init();

			}// link: function ($scope, iElement, iAttrs, ngModel)
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
