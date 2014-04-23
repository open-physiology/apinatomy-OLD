'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['lodash', 'app/module', '$bind/service'], function (_, app) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	app.directive('iconBtn', ['$bind', function ($bind) {
		return {
			restrict: 'E',
			scope:    {
				ngModel: '=',
				classes: '=',
				states:  '='
			},
			link:     function ($scope, iElement) {
				iElement.css('background-size', iElement.height() - 4);

				var currentClass = '';

				function adjustToStatus() {
					iElement.removeClass(currentClass);
					if ($scope.classes && $scope.classes[$scope.ngModel]) {
						currentClass = $scope.classes[$scope.ngModel];
						iElement.addClass(currentClass);
					}
				}

				$scope.$watch('ngModel', adjustToStatus);
				$scope.$watch('classes', adjustToStatus);

				iElement.click($bind(function (event) {
					event.stopPropagation();
					if (!_($scope.states[$scope.ngModel]).isUndefined()) {
						$scope.ngModel = $scope.states[$scope.ngModel];
					}
				}));
			}
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
