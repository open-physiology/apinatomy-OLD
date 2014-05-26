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
				$scope.mainArtefactFixed = false;

				function setArtefactFocus(artefact) {
					$scope.mainArtefact = artefact;
					_($scope.artefacts).remove();
					while (artefact) {
						if (artefact.detailTemplateUrl) {
							$scope.artefacts.unshift(artefact);
						}
						artefact = artefact.parent;
					}
				}

				$scope.$on('artefact-focus', function (e, artefact) {
					if ($scope.mainArtefact !== artefact && !$scope.mainArtefactFixed) {
						setArtefactFocus(artefact);
					}
				});

				$scope.$on('artefact-unfocus', function (e, artefact) {
					if (artefact === $scope.mainArtefact && !$scope.mainArtefactFixed) {
						$scope.mainArtefact = null;
						$scope.artefacts = [];
					}
				});

				$scope.$on('artefact-focus-fix', function (e, artefact) {
					if (artefact) { setArtefactFocus(artefact); }
					$scope.mainArtefactFixed = !!artefact;
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
