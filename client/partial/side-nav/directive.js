'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module', 'lodash', 'partial/side-nav/details/directive'], function (app, _) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	app.directive('amySideNav', [function () {
		return {
			restrict   : 'E',
			replace    : true,
			templateUrl: 'partial/side-nav/view.html',
			controller : function ($scope) {

				$scope.artefacts = [];
				$scope.mainArtefact = [];

				// TODO: Some weird stuff is going on. When a protein artefact is put on top of $scope.artefacts,
				//     : it appears from the template as though $scope.artefacts is empty, even though
				//     : it is clearly not empty when measured in this file. This does not happen when
				//     : a tile artefact is put on top.

				$scope.$on('artefact-focus', function (e, artefact) {
					if ($scope.mainArtefact !== artefact) {

						$scope.mainArtefact = artefact;
						_($scope.artefacts).remove();
						while (artefact) {
							if (artefact.detailTemplateUrl) {
								$scope.artefacts.unshift(artefact);
							}
							artefact = artefact.parent;
						}
					}
				});

				$scope.$on('artefact-unfocus', function (e, artefact) {
					if (artefact === $scope.mainArtefact) {
						$scope.mainArtefact = null;
						$scope.artefacts = [];
					}
				});

				$scope.relTypeArray = function relTypeArray(artefact) {
					return _(artefact.relationType).isArray()
							? artefact.relationType
							: [artefact.relationType];
				};

			}
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
