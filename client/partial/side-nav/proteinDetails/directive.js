'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module', 'chroma', 'lodash'], function (app, color, _) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	app.directive('amyProteinDetails', [function () {
		return {
			restrict:    'E',
			replace:     true,
			transclude:  true,
			templateUrl: 'partial/side-nav/proteinDetails/view.html',
			scope:       {
				protein: '=amyProtein',
				fixed:   '=amyFixed'
			},

			controller: function ($scope) {

				$scope.Math = Math;

				$scope.extractChemblID = function (sm) {
					return sm._about.replace(/^.+(CHEMBL.+)/, '$1');
				};

				$scope.extractURL = function (sm) {
					return sm._about;
				};

				$scope.extractPrefLabel = function (sm) {
					var result;

					_(sm.exactMatch).forEach(function (match) {
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

				$scope.$watch('protein', function () {
					$scope.proteinLabel = null;
					_($scope.protein.info.exactMatch).forEach(function (match) {
						if (match.prefLabel) {
							$scope.proteinLabel = match.prefLabel.replace(/^(.+)\(homo sapiens\)\s*$/i, '$1');
							return false;
						}
					});
				});



			},

			compile: function () {
				return {

					pre: function preLink($scope, iElement/*, iAttrs, controller*/) {
						$scope.$watch('fixed', function (fixed) {
							iElement.css({
								backgroundColor: color(fixed ? 'green' : 'purple').brighten(60).css(),
								borderColor:     (fixed ? 'green' : 'purple'),
								borderStyle:     (fixed ? 'solid' : 'dashed')
							});
						});
					},

					post: function postLink(/*$scope, iElement, iAttrs, controller*/) {}

				};
			}
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
