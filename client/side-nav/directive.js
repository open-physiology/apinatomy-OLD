'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module', 'lodash', 'amy-circuit-board/artefacts', 'css!side-nav/style', 'side-nav/details/directive'], function (app, _, artefacts) {
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

				$scope.Artefact = artefacts.Artefact;

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

				// TODO: convert to new focus system

				artefacts.Artefact.onFocus(function (artefact, flag) {
					if (!artefacts.Artefact.focusIsFixed) {
						if (artefact !== $scope.mainArtefact && flag === true) {
							setArtefactFocus(artefact);
						} else if (artefact === $scope.mainArtefact && flag === false) {
							$scope.mainArtefact = null;
							$scope.artefacts = [];
						}
					}
				});

				artefacts.Artefact.onFocusFix(function (artefact, flag) {
					if (flag === true && $scope.mainArtefact !== artefact) {
						setArtefactFocus(artefact);
					} else if (flag === false && $scope.mainArtefact === artefact) {
						setArtefactFocus(null);
					}
				});

//				$scope.$on('artefact-focus', function (e, artefact) {
//					if ($scope.mainArtefact !== artefact && !$scope.mainArtefactFixed) {
//						setArtefactFocus(artefact);
//					}
//				});
//
//				$scope.$on('artefact-unfocus', function (e, artefact) {
//					if (artefact === $scope.mainArtefact && !$scope.mainArtefactFixed) {
//						$scope.mainArtefact = null;
//						$scope.artefacts = [];
//					}
//				});
//
//				$scope.$on('artefact-focus-fix', function (e, artefact) {
//					if (artefact) { setArtefactFocus(artefact); }
//					$scope.mainArtefactFixed = !!artefact;
//				});

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
