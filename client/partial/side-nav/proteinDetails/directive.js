'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module', 'chroma', 'lodash', 'resource/service'], function (app, color, _) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	app.directive('amyProteinDetails', ['ResourceService', function (ResourceService) {
		return {
			restrict   : 'E',
			replace    : true,
			transclude : true,
			templateUrl: 'partial/side-nav/proteinDetails/view.html',
			scope      : {
				protein: '=amyProtein',
				fixed  : '=amyFixed'
			},

			controller: function ($scope) {

				$scope.Math = Math;

				$scope.extractChemblID = function (sm) {
					return sm.info._about.replace(/^.+(CHEMBL.+)/, '$1');
				};

				$scope.extractURL = function (sm) {
					return sm.info._about;
				};

				$scope.extractPrefLabel = function (sm) {
					var result;

					_(sm.info.exactMatch).forEach(function (match) {
						if (match.prefLabel) {
							result = match.prefLabel;
							return false;
						}
					});

					if (!result) {
						result = $scope.extractChemblID(sm);
					}

					return result;
				};


				$scope.visibleSmallMolecules = [];
				$scope.smPagination = {
					pageSize: 10,
					page    : 1,
					lastPage: 1
				};

				$scope.$watch('protein', function () {
					$scope.proteinLabel = null;

					_($scope.protein.info.exactMatch).forEach(function (match) {
						if (match.prefLabel) {
							$scope.proteinLabel = match.prefLabel.replace(/^(.+)\(homo sapiens\)\s*$/i, '$1');
							return false;
						}
					});

					$scope.smPagination.page = 1;
					$scope.smPagination.lastPage = Math.ceil($scope.protein.smallMoleculeInteractions.length / $scope.smPagination.pageSize);
					fetchSmPage(1);
				});

				$scope.$watch('smPagination.page', fetchSmPage);

				function fetchSmPage(page) {
					var ids = $scope.protein.smallMoleculeInteractions.slice(
									(page - 1) * $scope.smPagination.pageSize,
									page * $scope.smPagination.pageSize
					);

					ResourceService.smallMolecules(ids).then(function (smallMolecules) {
						_($scope.visibleSmallMolecules).remove();
						_(smallMolecules).forEach(function (smallMolecule) {
							$scope.visibleSmallMolecules.push(smallMolecule);
						});
					});
				}


			},

			compile: function () {
				return {

					pre: function preLink($scope, iElement/*, iAttrs, controller*/) {
						$scope.$watch('fixed', function (fixed) {
							iElement.css({
								backgroundColor: color(fixed ? 'green' : 'purple').brighten(60).css(),
								borderColor    : (fixed ? 'green' : 'purple'),
								borderStyle    : (fixed ? 'solid' : 'dashed')
							});
						});
					},

					post: function postLink(/*$scope, iElement, iAttrs, controller*/) {
					}

				};
			}
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
