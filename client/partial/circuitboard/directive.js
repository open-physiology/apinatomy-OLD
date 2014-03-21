'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['lodash',
	'angular',
	'app/module',
	'partial/treemap/layout/manager',
	'partial/treemap/layout/predefined',
	'$bind/service',
	'defaults/service',
	'partial/treemap/directive',
	'partial/circuitboard/tile/directive',
	'partial/circuitboard/graph/directive'], function (_, ng, ApiNATOMY) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	ApiNATOMY.directive('amyCircuitboard', ['ResourceService', function (ResourceService) {
		return {

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			restrict   : 'E',
			replace    : false,
			templateUrl: 'partial/circuitboard/view.html',

			controller: ['$scope', '$rootScope', function ($scope, $rootScope) {

				$scope.rootTile = $scope;
				$scope.childTiles = [];

				$scope.buildFocusChain = function () {
					var focusChain = [];
					_($scope.childTiles).forEach(function (childTile) {
						focusChain = childTile.recursivelyBuiltFocusChain();
						if (!_(focusChain).isEmpty()) {
							return false;
						}
					});
					$rootScope.setFocus(focusChain);
				};

				$scope.findVisibleEntities = function () {
					var result = {};
					_($scope.childTiles).forEach(function (childTile) {

					});
				};

			}],

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			compile: function () {
				return {

					pre: function preLink($scope/*, iElement, iAttrs, controller*/) {
						$scope.children = ResourceService.entities(
								_.chain(_.range(60000001, 60000024 + 1)).map(function (nr) {
									return '24tile:' + nr
								}).value()
						);
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
