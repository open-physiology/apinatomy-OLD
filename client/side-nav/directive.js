'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module', 'lodash', 'Artefact', 'css!side-nav/style', 'side-nav/details/directive'], function (app, _, Artefact) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	app.directive('amySideNav', [function () {
		return {
			restrict   : 'E',
			replace    : true,
			templateUrl: 'side-nav/view.html',
			controller : function ($scope) {

				$scope.artefacts = [];
				$scope.mainArtefact = [];
				$scope.mainArtefactFixed = false;

				$scope.Artefact = Artefact;

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

				Artefact.onFocus(function (artefact, flag) {
					if (!Artefact.focusIsFixed) {
						if (artefact !== $scope.mainArtefact && flag === true) {
							setArtefactFocus(artefact);
						} else if (artefact === $scope.mainArtefact && flag === false) {
							$scope.mainArtefact = null;
							$scope.artefacts = [];
						}
					}
				});

				Artefact.onFocusFix(function (artefact, flag) {
					if (flag === true && $scope.mainArtefact !== artefact) {
						setArtefactFocus(artefact);
					} else if (flag === false && $scope.mainArtefact === artefact) {
						setArtefactFocus(null);
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
