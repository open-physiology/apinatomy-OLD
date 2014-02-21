'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module', 'chroma', 'utility/newFromPrototype', 'resource/service'], function
		(ApiNATOMY, color, newFromPrototype, ResourceService) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	console.log("Loading 'partial/side-nav/details/directive'");


	ApiNATOMY.directive('amyEntityDetails', [ResourceService, function (qResources) {
		return {
			restrict   : 'E',
			replace    : true,
			transclude : true,
			templateUrl: 'partial/side-nav/details/view.html',
			scope      : {
				eidFn: '&eid'
			},

			controller: function ($scope) {
				qResources.then(function (resources) {
					$scope.resources = resources;

					$scope.eidFnResult = $scope.eidFn();

					$scope.$watch('eidFn()', function () {
						$scope.eidFnResult = $scope.eidFn();
						if ($scope.eidFn() !== null) {
							$scope.eid = $scope.eidFn();
							$scope.title = resources[$scope.eid].title;
							$scope.style = newFromPrototype(resources[$scope.eid].style);
							$scope.style.backgroundColor = color(resources[$scope.eid].style.backgroundColor).brighten(40);
						}
					});
				});
			}
		};
	}]);


	return 'amyEntityDetails';


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
