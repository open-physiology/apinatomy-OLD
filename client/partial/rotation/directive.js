'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['lodash', 'app/module', 'utility/putStyle', 'element-directive/service'], function (_, ApiNATOMY, putStyle, ElementDirectiveServiceName) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	console.log("Loading 'partial/rotation/directive'");


	var BACK_AWAY_MAX = 1000;
	var LOWER_MAX = 160;
	var TILT_MAX = 80;
	var ROTATION_MAX = 45;


	ApiNATOMY.directive('amyRotation', [ElementDirectiveServiceName, function (elementDirective) {
		return elementDirective({
			'ng-mousedown': "enabled && onMouseDown($event)",
			'ng-mouseup':   "enabled && onMouseUp()",
			'ng-mousemove': "enabled && onMouseMove($event)"
		},{
			scope:      {
				amyModel: '=',
				enabled:  '='
			},
			controller: function ($scope) {

				//// initialize the model to the empty object

				$scope.amyModel = {};

				//// initialize local variables to 'no change'

				var backAway = 0;
				var lower = 0;
				var tilt = 0;
				var rotation = 0;

				var startingX, startingY, lastX, lastY;

				//// onMouseMove starts as an empty function,
				//// and gets actual behavior during 3D manipulation

				$scope.onMouseMove = _.noop;

				function activeOnMouseMove(event) {
					lastX = event.clientX;
					lastY = event.clientY;
					var newBackAway = backAwayFromMouseDistance(lastY - startingY);
					var newLower = lowerFromMouseDistance(lastY - startingY);
					var newTilt = tiltFromMouseDistance(lastY - startingY);
					var newRotation = rotationFromMouseDistance(lastX - startingX, newTilt);
					putStyle($scope.amyModel, 'transform',
							'translateZ(' + -newBackAway + 'px) ' +
							'translateY(' + newLower + 'px) ' +
							'rotateX(' + newTilt + 'deg) ' +
							'rotateZ(' + newRotation + 'deg)'
					);
				}

				//// the ways to start and end 3D manipulation

				$scope.onMouseDown = function (event) {
					startManipulation(event.clientX, event.clientY);
				};
				$scope.onMouseUp = function () {
					endManipulation();
				};
				$scope.$watch('enabled', function (newEnabled, oldEnabled) {
					if (oldEnabled && !newEnabled && startingX !== null) { endManipulation(); }
				});

				//// this is how to start and end manipulation

				function startManipulation(x, y) {
					$scope.$parent.$broadcast('3d-manipulation-start');
					startingX = lastX = x;
					startingY = lastY = y;
					$scope.onMouseMove = activeOnMouseMove;
				}

				function endManipulation() {
					backAway = backAwayFromMouseDistance(lastY - startingY);
					lower = lowerFromMouseDistance(lastY - startingY);
					tilt = tiltFromMouseDistance(lastY - startingY);
					rotation = rotationFromMouseDistance(lastX - startingX, tilt);
					$scope.onMouseMove = _.noop;
					startingX = startingY = lastX = lastY = null;
					$scope.$parent.$broadcast('3d-manipulation-end');
				}

				//// 3D manipulations based on mouse move distances

				function backAwayFromMouseDistance(dist) {
					return Math.max(0, Math.min(backAway + 5 * dist, BACK_AWAY_MAX));
				}

				function lowerFromMouseDistance(dist) {
					return Math.max(0, Math.min(lower + dist, LOWER_MAX));
				}

				function tiltFromMouseDistance(dist) {
					return Math.max(0, Math.min(tilt + .5 * dist, TILT_MAX));
				}

				function rotationFromMouseDistance(dist, newTilt) {
					return Math.max(
							-ROTATION_MAX * (newTilt / TILT_MAX),
							Math.min(rotation + .2 * dist,
									ROTATION_MAX * (newTilt / TILT_MAX)));
				}

			}
		});
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
