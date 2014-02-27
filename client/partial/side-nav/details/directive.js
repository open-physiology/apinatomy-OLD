'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module', 'chroma', 'lodash', 'resource/service'], function
		(ApiNATOMY, color, _, ResourceService) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	console.log("Loading 'partial/side-nav/details/directive'");


	ApiNATOMY.directive('amyEntityDetails', [ResourceService, function (qResources) {
		return {
			restrict:    'E',
			replace:     true,
			transclude:  true,
			templateUrl: 'partial/side-nav/details/view.html',
			scope:       {
				eidFn: '&eid'
			},

			controller: function ($scope) {
				qResources.then(function (resources) {
					$scope.resources = resources;

//					$scope.eidFnResult = $scope.eidFn();

					$scope.$watch('eidFn()', function (newEid) {
//						$scope.eidFnResult = $scope.eidFn();
						if (newEid !== null) {
							_($scope).assign({
								eid:   newEid,
								title: resources[newEid].title,
								style: _(resources[newEid].style).create({
									backgroundColor: color(resources[newEid].style.backgroundColor).brighten(40)
								}).value()
							});
						}
					});
				});
			}
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
