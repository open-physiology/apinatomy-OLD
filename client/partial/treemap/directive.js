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

				$scope.pChildren = [];




				/////////////////////////////////////////////////////////////////////////////////////////
				$scope.xRotation = 0;
				$scope.yRotation = 0;
				$scope.style = { '-webkit-transform': '' };

				$rootScope.$watch('threeDRotate', function (newValue) {
					$scope.threeDRotate = newValue;
				});

				$scope.onMouseMove = function () {};
				$scope.xRotation = $scope.yRotation = 0;

				var startingX, startingY, startingTransform;
				$scope.onMouseDown = function (event) {
					startingX = event.clientX;
					startingY = event.clientY;
					startingTransform = $scope.style['-webkit-transform'];
					$scope.onMouseMove = adjustRotation;
				};

				function getTransformation(event) {
					//          ,
					//           ',
					//             '
					//         '''''O   (origin)
					//             /|
					//            / |
					//           /__|
					//          / a |
					//         /    |
					// Drag  FROM   |
					//              TO


					// TODO


					return 'rotate3d(0, 0, 0, deg)';
				}

				$scope.onMouseUp = function (event) {
					$scope.onMouseMove = function () {};
					$scope.xRotation += .5 * (startingX - event.clientX);
					$scope.yRotation += .5 * (event.clientY - startingY);
					startingX = startingY = null;
				};

				function adjustRotation(event) {
					$scope.style['-webkit-transform']
							= 'rotate3d(0, 0, 0, 0deg)';

//					-webkit-transform: rotate3d(1, 0, .5, 60deg);
//					-moz-transform: rotate3d(0.6, 1, 0.5, 55deg);
//					-ms-transform: rotate3d(0.6, 1, 0.5, 55deg);
//					-o-transform: rotate3d(0.6, 1, 0.5, 55deg);
//					transform: rotate3d(0.6, 1, 0.5, 55deg);
				}
				/////////////////////////////////////////////////////////////////////////////////////////






//				/////////////////////////////////////////////////////////////////////////////////////////
//				$scope.style = {
//					'-webkit-transform': 'rotateX(0) rotateY(0)'
//				};
//				$scope.xRotation = 0;
//				$scope.yRotation = 0;
//
//				$rootScope.$watch('threeDRotate', function (newValue) {
//					$scope.threeDRotate = newValue;
//				});
//
//				$scope.onMouseMove = function () {};
//				$scope.xRotation = $scope.yRotation = 0;
//
//				var startingX, startingY;
//				$scope.onMouseDown = function (event) {
//					startingX = event.clientX;
//					startingY = event.clientY;
//					$scope.onMouseMove = adjustRotation;
//				};
//
//				$scope.onMouseUp = function (event) {
//					$scope.onMouseMove = function () {};
//					$scope.xRotation += .5 * (startingX - event.clientX);
//					$scope.yRotation += .5 * (event.clientY - startingY);
//					startingX = startingY = null;
//				};
//
////				ng.element('main').bind('mousemove', $scope.onMouseMove);
////				ng.element('main').bind('mouseup', $scope.onMouseUp);
//
//				function adjustRotation(event) {
//					$scope.style['-webkit-transform']
//							= 'rotateX(' + ($scope.yRotation + .5 * (event.clientY - startingY)) + 'deg) ' +
//							  'rotateY(' + ($scope.xRotation + .5 * (startingX - event.clientX)) + 'deg) perspective(600px)';
//
////					-webkit-transform: rotate3d(1, 0, .5, 60deg);
////					-moz-transform: rotate3d(0.6, 1, 0.5, 55deg);
////					-ms-transform: rotate3d(0.6, 1, 0.5, 55deg);
////					-o-transform: rotate3d(0.6, 1, 0.5, 55deg);
////					transform: rotate3d(0.6, 1, 0.5, 55deg);
//				}
//				/////////////////////////////////////////////////////////////////////////////////////////

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
