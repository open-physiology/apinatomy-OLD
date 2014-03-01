'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['lodash', 'angular', 'app/module', 'partial/treemap/layout/manager', 'partial/treemap/layout/predefined', '$bind/service', 'partial/treemap/tile/directive'], function (_, ng, ApiNATOMY, Layout) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	var DEFAULT_TILE_SPACING = '1px';
	var DEFAULT_TILE_LAYOUT = 'twentyFourTile';


	ApiNATOMY.directive('amyTreemap', ['$q', '$window', '$bind', function ($q, $window, $bind) {
		return {

			restrict: 'E',
			scope:    {
				attrLayout:      '@layout',
				attrTileSpacing: '@tileSpacing'
			},

			controller: ['$scope', function ($scope) {

				//// normalizing attributes

				$scope.layout = _($scope.attrLayout).or(DEFAULT_TILE_LAYOUT);
				$scope.tileSpacing = _.parseInt(_($scope.attrTileSpacing).or(DEFAULT_TILE_SPACING));

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
						var positions = Layout(
								_(children)
										.pluck('layoutInterface')
										.map(function (childIface, i) {
											return _.chain(childIface).clone().assign({ index: i }).value();
										}).value(),
								$scope.layout,
								controller.height() - $scope.tileSpacing,
								controller.width() - $scope.tileSpacing
						);

						//// adjust for tile spacing

						_(positions).each(function (pos) {
							pos.top += $scope.tileSpacing;
							pos.left += $scope.tileSpacing;
							pos.height -= $scope.tileSpacing;
							pos.width -= $scope.tileSpacing;
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

					pre: function preLink($scope) {
						_($scope).defaults({
							layout:      DEFAULT_TILE_LAYOUT,
							tileSpacing: DEFAULT_TILE_SPACING
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
