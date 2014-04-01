'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module', 'd3', 'lodash'], function (app, d3, _) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	app.directive('amyTimeTrace', ['$window', function ($window) {
		return {
			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			restrict:    'E',
			templateUrl: 'partial/simulation-panel/time-trace/view.html',
			replace:     false,
			scope:       {
				trace:       '=amyTrace',
				currentTime: '=amyCurrentTime',
				maxTime:     '=amyMaxTime'
			},

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			controller: ['$scope', function ($scope) {}],

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			compile: function () {
				return {

					pre: function preLink($scope, iElement/*, iAttrs, controller*/) {

						var svgCanvas = d3.select(iElement.find('> svg > g')[0]);
						var svgPath = svgCanvas.select('path.trace');
						var margin = {top: 10, right: 10, bottom: 10, left: 40};
						var lineEncoding;
						var width;
						var height;
						var xScale;
						var yScale;
						var yAxis;

						svgCanvas.attr('transform', "translate(" + margin.left + "," + margin.top + ")");
						svgCanvas.select('rect.border').attr({ top: 0, left: 0 });
						svgCanvas.select('#dataArea > rect').attr({ top: 0, left: 0 });
						svgPath.attr('clip-path', 'url(#dataArea)').style($scope.trace.css);

						function drawData() {
							xScale = d3.scale.linear().range([0, width]).nice();
							yScale = d3.scale.linear().range([height, 0]).nice();

							yAxis = d3.svg.axis().scale(yScale).orient('left');

							lineEncoding = d3.svg.line()
									.x(function (d) { return xScale(d.time); })
									.y(function (d) { return yScale(d.value); });

							xScale.domain([0, $scope.currentTime]);
							yScale.domain(_($scope.trace.data).pluck('value').extent());

							svgPath.datum(_.filter($scope.trace.data, function (d) { return d.time <= $scope.currentTime; }))
									.attr("d", lineEncoding);

							svgCanvas.select(".y.axis").call(yAxis);
						}

						function adjustSize() {
							width = iElement.width() - margin.left - margin.right;
							height = iElement.height() - margin.top - margin.bottom;

							svgCanvas.select('rect.border').attr({ width: width, height: height });
							svgCanvas.select('#dataArea > rect').attr({ width: width, height: height });

							drawData();
						}

						adjustSize();

						// TODO: automatically react to size changes

						$scope.$watch('trace', drawData);
						$scope.$watch('currentTime', drawData);
						$scope.$watch('maxTime', drawData);

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
