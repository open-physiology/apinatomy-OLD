'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['angular', 'app/module', 'partial/tile/layout/service'], function
		(ng, ApiNATOMY, TileLayoutService) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	console.log("Loading 'partial/treemap/directive'");


	var apinatomyTreemap = 'apinatomyTreemap';


	ApiNATOMY.directive(apinatomyTreemap, [TileLayoutService, '$q', '$window', function
			(TileLayoutService, $q, $window) {
		return {
			restrict   : 'E',
			replace    : true,
			transclude : true,
			templateUrl: 'partial/treemap/view.html',

			scope: {
				layout : '@',
				spacing: '@'
			},

			controller: function ($rootScope, $scope) {
				var deferred = $q.defer();

				var controller = {
					registerMouseEnter: function () {
						if (!$scope.focus) {
							$scope.focus = true;
						}
					},

					registerMouseLeave: function () {
						if ($scope.focus) {
							$scope.focus = false;
						}
					},

					registerChild: function (qChildController) {
						$scope.pChildren.push(qChildController);
					}
				};

				$scope.tileSpacing = parseInt($scope.spacing || '1px');
				$scope.tileLayout = $scope.layout || 'slice';
				$scope.style = {};
				$scope.pChildren = [];


				/////////////////////////////////////////////////////////////////////////////////////////



				/////////////////////////////////////////////////////////////////////////////////////////


				deferred.resolve(controller);
				return deferred.promise;
			},
			link      : function ($scope, iElement) {
				// how to redraw the treemap
				function redraw() {
					if ($scope.tileLayout !== 'twentyFourTile' || $scope.pChildren.length === 24) {
						$scope.height = parseFloat(getComputedStyle(iElement[0]).height);
						$scope.width = parseFloat(getComputedStyle(iElement[0]).width);

						TileLayoutService[$scope.tileLayout]($scope.pChildren, $scope.height, $scope.width, $scope.tileSpacing);
					}
				}

				// we must redraw when the window changes size
				ng.element($window).bind('resize', $scope.$apply.bind($scope, redraw));

				// we must redraw when any tile-size has changed
				$scope.$parent.$on('tile-size-changed', redraw);
			}
		};
	}]);


	return apinatomyTreemap;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
