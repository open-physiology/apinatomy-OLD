'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['angular', 'app/module'], function (ng, ApiNATOMY) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	console.log("Loading 'partial/treemap/directive'");


	var apinatomyTreemap = ApiNATOMY.directive('apinatomyTreemap', ['TileLayoutService', '$q', '$window', function (TileLayoutService, $q, $window) {
		return {
			restrict   : 'E',
			replace    : true,
			transclude : true,
			templateUrl: 'partial/treemap/view.html',

			scope      : {
				layout : '@',
				spacing: '@'
			},

			controller : function ($scope) {
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

				$scope.pChildren = [];

				$scope.style = {};
				$scope.style.top = 0;
				$scope.style.left = 0;
				$scope.style.height = 0;
				$scope.style.width = 0;

				deferred.resolve(controller);

				return deferred.promise;
			},
			link       : function ($scope, iElement) {
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
