'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module', 'lodash', 'partial/side-nav/details/directive', 'partial/side-nav/proteinDetails/directive'], function (app, _) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	app.directive('amySideNav', [function () {
		return {
			restrict   : 'E',
			replace    : true,
			templateUrl: 'partial/side-nav/view.html',
			controller : function ($scope) {

				$scope.artefacts = [];
				$scope.mainArtefact = [];

				$scope.$on('artefact-focus', function (e, artefact) {
					if ($scope.mainArtefact !== artefact) {
						$scope.mainArtefact = artefact;
						$scope.artefacts = [];
						var a = artefact;
						while (a) {
							if (a.show) {
								$scope.artefacts.unshift(a);
							}
							a = a.parent;
						}
					}
				});

				$scope.$on('artefact-unfocus', function (/*e, artefact*/) {
					$scope.artefacts = [];
				});


				$scope.relTypeArray = function relTypeArray(artefact) {
					return _(artefact.relationType).isArray()
							? artefact.relationType
							: [artefact.relationType];
				};


				/////////////////////////////////


//				$scope.sideNav = $scope;
//
//				$scope.bundles = [];
//
//				$scope.$on('entity-focus', function (event, focusChain) {
//					$scope.bundles = focusChain;
//				});
//
//				$scope.$on('protein-focus', function (event, protein) {
//					if (!$scope.proteinFixed) {
//						$scope.protein = protein;
//					}
//				});
//
//				$scope.$on('protein-fix', function (event, protein) {
//					$scope.protein = protein;
//					$scope.proteinFixed = !!protein;
//				});
//
//				$scope.relationType = function (bundle) {
//					var index = $scope.bundles.indexOf(bundle);
//					if (index === -1) {
//						return undefined;
//					}
//					var prev = $scope.bundles[index-1];
//					return _(prev.entity.sub).where({ entity: bundle.entity }).pluck('type').value();
//				};

			}
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
