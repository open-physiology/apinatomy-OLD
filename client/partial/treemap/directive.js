'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['lodash', 'angular', 'app/module', 'partial/treemap/layout/service', 'element-directive/service', '$bind/service', 'partial/treemap/tile/directive'], function (_, ng, ApiNATOMY, TileLayoutServiceName, ElementDirectiveServiceName, BindServiceName) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	console.log("Loading 'partial/treemap/directive'");


	var DEFAULT_TILE_SPACING = '1px';
	var DEFAULT_TILE_LAYOUT = 'twentyFourTile';


	ApiNATOMY.directive('amyTreemap', [TileLayoutServiceName, ElementDirectiveServiceName, '$q', '$window', BindServiceName, function (TileLayoutService, elementDirective, $q, $window, $bind) {
		return {
			restrict: 'E',
			scope:    {
				layout:  '@',
				spacing: '@'
			},

			controller: ['$scope', function ($scope) {
				var children = [];
				var controller = {

					height: undefined,
					width:  undefined,

					registerMouseEnter: function () {
						$scope.focus = true;
					},

					registerMouseLeave: function () {
						$scope.focus = false;
					},

					registerChild: function (child) {
						children.push(child);
						controller.requestRedraw();
					},

					requestRedraw: _($bind(function () {
						TileLayoutService[_($scope.layout).isString() ? $scope.layout : DEFAULT_TILE_LAYOUT](
								_(children).pluck('layoutInterface').value(),
								controller.height(),
								controller.width(),
								parseInt(_($scope.spacing).isUndefined() ? DEFAULT_TILE_SPACING : $scope.spacing)
						);
					})).debounce(40).value()

				};

				return controller;
			}],

			compile: function () {
				return {
					pre:  function preLink($scope, iElement, iAttrs, controller) {
						controller.height = _(iElement).bindKey('height').value();
						controller.width = _(iElement).bindKey('width').value();
						$($window).on('resize', $bind(controller.requestRedraw));
					},
					post: function postLink($scope, iElement, iAttrs, controller) {}
				};
			}

		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
