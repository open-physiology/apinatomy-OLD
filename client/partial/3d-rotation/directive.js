'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module', 'utility/putStyle'], function (ApiNATOMY, putStyle) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	console.log("Loading 'partial/3d-rotation/directive'");


	var BACK_AWAY_MAX = 800;
	var LOWER_MAX = 160;
	var TILT_MAX = 80;
	var ROTATION_MAX = 45;


	var amy3DRotation = 'amyRotation';


	ApiNATOMY.directive(amy3DRotation, [function () {
		return {
			restrict   : 'E',
			replace    : true,
			transclude : true,
			templateUrl: 'partial/3d-rotation/view.html',
			scope      : {
				amyModel: '=',
				enabled : '='
			},
			controller : function ($scope) {
				$scope.amyModel = {};
				putStyle($scope.amyModel, 'transform', 'translateZ(0) translateY(0) rotateX(0) rotateZ(0)');

				$scope.backAway =
				$scope.lower =
				$scope.tilt =
				$scope.rotation = 0;
												console.log('(', $scope.enabled, ')');
				$scope.enabled = (typeof $scope.enabled !== 'undefined' && ($scope.enabled === '' || $scope.enabled === 'true'));

				$scope.onMouseMove = function () {};

				var startingX, startingY;
				$scope.onMouseDown = function (event) {
					$scope.$parent.$broadcast('3d-manipulation-start');
					startingX = event.clientX;
					startingY = event.clientY;
					$scope.onMouseMove = adjustRotation;
				};
				$scope.onMouseUp = function (event) {
					$scope.onMouseMove = function () {};
					$scope.backAway = backAwayFromMouseDistance(event.clientY - startingY);
					$scope.lower = lowerFromMouseDistance(event.clientY - startingY);
					$scope.tilt = tiltFromMouseDistance(event.clientY - startingY);
					$scope.rotation = rotationFromMouseDistance(event.clientX - startingX, $scope.tilt);
					startingX = startingY = null;
					$scope.$parent.$broadcast('3d-manipulation-end');
				};

				function backAwayFromMouseDistance(dist) {
					return Math.max(0, Math.min($scope.backAway + 5 * dist, BACK_AWAY_MAX));
				}

				function lowerFromMouseDistance(dist) {
					return Math.max(0, Math.min($scope.lower + dist, LOWER_MAX));
				}

				function tiltFromMouseDistance(dist) {
					return Math.max(0, Math.min($scope.tilt + .5 * dist, TILT_MAX));
				}

				function rotationFromMouseDistance(dist, tilt) {
					return Math.max(
							-ROTATION_MAX * (tilt / TILT_MAX),
							Math.min($scope.rotation + .2 * dist,
									ROTATION_MAX * (tilt / TILT_MAX)));
				}

				function adjustRotation(event) {
					var newBackAway = backAwayFromMouseDistance(event.clientY - startingY);
					var newLower = lowerFromMouseDistance(event.clientY - startingY);
					var newTilt = tiltFromMouseDistance(event.clientY - startingY);
					var newRotation = rotationFromMouseDistance(event.clientX - startingX, newTilt);
					putStyle($scope.amyModel, 'transform',
							'translateZ(' + -newBackAway + 'px) ' +
							'translateY(' + newLower + 'px) ' +
							'rotateX(' + newTilt + 'deg) ' +
							'rotateZ(' + newRotation + 'deg)'
					);
				}


			}
		};
	}]);


	return amy3DRotation;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
