'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['lodash', 'app/module', 'utility/putStyle', '$bind/service'], function (_, ApiNATOMY, putStyle) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	var BACK_AWAY_MAX = 1000;
	var LOWER_MAX = 160;
	var TILT_MAX = 80;
	var ROTATION_MAX = 45;


	ApiNATOMY.directive('amyRotation', ['$bind', function ($bind) {
		return {
			restrict: 'E',
			scope:    {
				amyModel: '=',
				enabled:  '='
			},
			link:     function ($scope, iElement) {

				//////////////////// initialize the model to the empty object ////////////////////

				$scope.amyModel = {};


				//////////////////// 3D manipulations based on mouse move distances ////////////////////

				var backAway = 0;
				var lower = 0;
				var tilt = 0;
				var rotation = 0;

				function backAwayBy(dist) { return Math.max(0, Math.min(backAway + 5 * dist, BACK_AWAY_MAX)); }

				function lowerBy(dist) { return Math.max(0, Math.min(lower + dist, LOWER_MAX)); }

				function tiltBy(dist) { return Math.max(0, Math.min(tilt + .5 * dist, TILT_MAX)); }

				function rotateBy(dist, newTilt) {
					return Math.max(
							-ROTATION_MAX * (newTilt / TILT_MAX),
							Math.min(rotation + .2 * dist,
									ROTATION_MAX * (newTilt / TILT_MAX)));
				}


				//////////////////// 3D manipulation starts and ends with the 'enabled' attribute ////////////////////

				$scope.$watch('enabled', function (newEnabled, oldEnabled) {
					if (!oldEnabled && newEnabled) {
						$scope.$parent.$broadcast('3d-manipulation-enabled');
					}
					if (oldEnabled && !newEnabled) {
						if (startingX !== null) { endManipulation(); }
						$scope.$parent.$broadcast('3d-manipulation-disabled');
					}
				});

				iElement.on('mousedown', $bind(function (event) {
					$scope.enabled && startManipulation(event.clientX, event.clientY);
				}));

				iElement.on('mouseup', $bind(function () {
					$scope.enabled && endManipulation();
				}));


				//////////////////// 3D-manipulation implementation ////////////////////

				var startingX, startingY, lastX, lastY;

				var manipulateByMouseMove = $bind(function manipulateByMouseMove(event) {
					lastX = event.clientX;
					lastY = event.clientY;
					var newBackAway = backAwayBy(lastY - startingY);
					var newLower = lowerBy(lastY - startingY);
					var newTilt = tiltBy(lastY - startingY);
					var newRotation = rotateBy(lastX - startingX, newTilt);
					putStyle($scope.amyModel, 'transform',
							'translateZ(' + -newBackAway + 'px) ' +
							'translateY(' + newLower + 'px) ' +
							'rotateX(' + newTilt + 'deg) ' +
							'rotateZ(' + newRotation + 'deg)'
					);
				});


				//////////////////// starting and ending 3D manipulation ////////////////////

				function startManipulation(x, y) {
					$scope.$parent.$broadcast('3d-manipulation-start');
					startingX = lastX = x;
					startingY = lastY = y;
					iElement.on('mousemove', manipulateByMouseMove);
				}

				function endManipulation() {
					backAway = backAwayBy(lastY - startingY);
					lower = lowerBy(lastY - startingY);
					tilt = tiltBy(lastY - startingY);
					rotation = rotateBy(lastX - startingX, tilt);
					iElement.off('mousemove', manipulateByMouseMove);
					startingX = startingY = lastX = lastY = null;
					$scope.$parent.$broadcast('3d-manipulation-end');
				}

			}
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
