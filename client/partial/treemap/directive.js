'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['lodash', 'angular', 'app/module', 'partial/treemap/layout/service', 'element-directive/service', '$bind/service', 'partial/treemap/tile/directive'], function
		(_, ng, ApiNATOMY) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	var DEFAULT_TILE_SPACING = '1px';
	var DEFAULT_TILE_LAYOUT = 'twentyFourTile';


	ApiNATOMY.directive('amyTreemap', ['TileLayoutService', 'ElementDirectiveService', '$q', '$window', '$bind', function
			(TileLayoutService, elementDirective, $q, $window, $bind) {
		return {

			restrict: 'E',
			scope:    {
				attrLayout:  '@',
				attrSpacing: '@'
			},

			controller: ['$scope', function ($scope) {

				//// normalizing attributes

				$scope.layout = _($scope.attrLayout).or(DEFAULT_TILE_LAYOUT);
				$scope.spacing = _.parseInt(_($scope.attrSpacing).or(DEFAULT_TILE_SPACING));

				//// controller interface for the treemap

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
						var positions = TileLayoutService[$scope.layout](
								_(children)
										.pluck('layoutInterface')
										.each(function (childIface, i) { childIface.index = i; })
										.value(),
								controller.height() - $scope.spacing,
								controller.width() - $scope.spacing
						);

						//// adjust for tile spacing

						_(positions).each(function (pos) {
							pos.top += $scope.spacing;
							pos.left += $scope.spacing;
							pos.height -= $scope.spacing;
							pos.width -= $scope.spacing;
						});

						//// apply repositioning to the child tiles

						_(children).each(function (child, i) {
							child.reposition(positions[i]);
						});

					})).debounce(40).value()

				};

				return controller;
			}],

			compile: function () {
				return {

					pre:  function preLink($scope) {
						_($scope).defaults({
							layout: DEFAULT_TILE_LAYOUT,
							spacing: DEFAULT_TILE_SPACING
						});
					},

					post: function postLink($scope, iElement, iAttrs, controller) {
						controller.height = _(iElement).bindKey('height').value();
						controller.width = _(iElement).bindKey('width').value();
						$($window).on('resize', $bind(controller.requestRedraw));
					}

				};
			}

		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
