'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module', 'chroma', 'lodash'], function (app, color, _) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	app.directive('amyEntityDetails', [function () {
		return {
			restrict   : 'E',
			replace    : true,
			templateUrl: 'partial/side-nav/details/view.html',
			require    : '?ngModel',
			scope      : true,

			compile: function () {
				return {

					pre: function preLink($scope, iElement, iAttrs, ngModel) {

						iAttrs.$observe('focusFixed', function (focusFixed) {
							$scope.focusFixed = $scope.$eval(focusFixed);
						});

						ngModel.$render = function () {
							$scope.artefact = ngModel.$modelValue;
							if ($scope.artefact.styling && $scope.artefact.styling.focus && $scope.artefact.styling.normal) {
								iElement.putCSS($scope.artefact.styling.focus.css);
								iElement.css(
										'backgroundColor',
										color($scope.artefact.styling.normal.css['&'].backgroundColor).brighten(30).css()
								);
							}
						};
					}

				};
			}
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
