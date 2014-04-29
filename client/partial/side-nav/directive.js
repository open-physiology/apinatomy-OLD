'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module', 'lodash', 'partial/side-nav/details/directive', 'partial/side-nav/proteinDetails/directive'], function (app, _) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	app.directive('amySideNav', [function () {
		return {
			restrict:    'E',
			replace:     true,
			templateUrl: 'partial/side-nav/view.html',
			controller:  function ($scope) {

				$scope._ = _;

				$scope.sideNav = $scope;

				$scope.bundles = [];

				$scope.$on('entity-focus', function (event, focusChain) {
					$scope.bundles = focusChain;
				});

				$scope.$on('protein-focus', function (event, protein) {
					$scope.protein = protein;
				});

				$scope.relationType = function (bundle) {
					var index = $scope.bundles.indexOf(bundle);
					if (index === -1) {
						return undefined;
					}
					var prev = $scope.bundles[index-1];
					return _(prev.entity.sub).where({ entity: bundle.entity }).pluck('type').value();
				};

			}
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
