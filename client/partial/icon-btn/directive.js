'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module', '$bind/service'], function (ApiNATOMY) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	//// expects urls of dark (black) icons for active and inactive state

	ApiNATOMY.directive('iconBtn', ['$bind', function ($bind) {
		return {
			restrict: 'E',
			scope:    {
				ngModel:      '=',
				activeIcon:   '@',
				inactiveIcon: '@'
			},
			link:     function ($scope, iElement) {

				iElement.css('background-size', iElement.height()-4);

				function adjustToStatus() {
					iElement.toggleClass('iconBtnActive', $scope.ngModel);
					iElement.css(
							'backgroundImage',
							'url(' + ($scope.ngModel ?
							          $scope.activeIcon :
							          $scope.inactiveIcon) + ')'
					);
				}

				$scope.$watch('ngModel', adjustToStatus);
				$scope.$watch('activeIcon', adjustToStatus);
				$scope.$watch('inactiveIcon', adjustToStatus);

				iElement.click($bind(function (event) {
					event.stopPropagation();
					$scope.$eval('ngModel = !ngModel');
				}));
			}
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
