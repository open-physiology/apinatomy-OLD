'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['lodash', 'angular', 'app/module', 'partial/treemap/layout/service', 'element-directive/service'], function (_, ng, ApiNATOMY, TileLayoutServiceName, ElementDirectiveServiceName) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	console.log("Loading 'partial/treemap/directive'");


	var DEFAULT_TILE_SPACING = '1px';
	var DEFAULT_TILE_LAYOUT = 'twentyFourTile';


	ApiNATOMY.directive('amyTreemap', [TileLayoutServiceName, ElementDirectiveServiceName, '$q', '$window', function (TileLayoutService, elementDirective, $q, $window) {
		return elementDirective({
			scope: {
				layout:  '@',
				spacing: '@'
			},
			controller: function ($scope) {
				var tileSpacing = parseInt($scope.spacing || DEFAULT_TILE_SPACING);
				var tileLayout = $scope.layout || DEFAULT_TILE_LAYOUT;

				var element;
				var children = [];

				var controller = {
					registerMouseEnter: function () {
						if (!$scope.focus) {
							$scope.focus = true;
						}
					},

					registerMouseLeave: function () {
						if ($scope.focus) {
							$scope.focus = false;
						}
					},

					registerElement: function (newElement) {
						element = newElement;
						controller.requestRedraw();
					},

					registerChild: function (child) {
						children.push(child);
						controller.requestRedraw();
					},

					requestRedraw: _.debounce(_.bindKey($scope, '$apply', function () {
						if (element) {
							TileLayoutService[tileLayout](
									children,
									element.height(),
									element.width(),
									tileSpacing
							);
						}
					}), 10)
				};

				return controller;
			},
			link:       function ($scope, iElement, iAttrs, controller) {

				//// register the treemap DOM element with the controller

				controller.registerElement(iElement);

				//// redraw when the window changes size

				ng.element($window).bind('resize', _.bindKey($scope, '$apply', controller.requestRedraw));

			}
		});
	}]);


	return 'amyTreemap';


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
