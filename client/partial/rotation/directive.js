'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['lodash', 'app/module', 'utility/putStyle', '$bind/service'], function (_, app, putStyle) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	var BACK_AWAY_MAX = 1000;
	var LOWER_MAX = 160;
	var TILT_MAX = 80;
	var ROTATION_MAX = 45;


	app.directive('amyRotation', ['$bind', '$window', function ($bind, $window) {
		return {
			restrict: 'E',
			scope   : {
				amyModel      : '=',
				transformation: '=amyTransformation',
				enabled       : '='
			},
			link    : function ($scope, iElement) {

				//////////////////// initialize the model to the empty object ////////////////////

				$scope.amyModel = {};


				//////////////////// the mouse events driving 3D manipulation ////////////////////

				var startingX = 0, startingY = 0, lastX = 0, lastY = 0;

				var manipulateByMouseMove = $bind(function manipulateByMouseMove(event) {
					lastX = event.pageX;
					lastY = event.pageY;
					transform(lastX - startingX, lastY - startingY);
				});

				iElement.on('mousedown', $bind(function onMouseDown(event) {
					if ($scope.enabled) {
						startingX = lastX = event.pageX;
						startingY = lastY = event.pageY;
						$($window).on('mousemove', manipulateByMouseMove);
					}
				}));

				$($window).on('mouseup', $bind(function onMouseUp() {
					if ($scope.enabled) {
						updateTransformation();
						startingX = startingY = lastX = lastY = null;
						$($window).off('mousemove', manipulateByMouseMove);
					}
				}));


				//////////////////// 3D manipulations based on drag distances ////////////////////

				$scope.transformation = {
					translate: {
						x: 0,
						y: 0,
						z: 0
					},
					rotate: {
						x: 0,
						y: 0,
						z: 0
					}
				};
				
				var currentTransformation = { backAway: 0, lower: 0, tilt: 0, rotation: 0 };

				function newTransformation(distX, distY) {
					var result = {
						backAway: _(currentTransformation.backAway + 5 * distY).between(0, BACK_AWAY_MAX),
						lower:    _(currentTransformation.lower + distY)       .between(0, LOWER_MAX    ),
						tilt:     _(currentTransformation.tilt + .5 * distY)   .between(0, TILT_MAX     )
					};
					var rotationLimit = ROTATION_MAX * (result.tilt / TILT_MAX);
					result.rotation = _(currentTransformation.rotation + .2 * distX).between(-rotationLimit, rotationLimit);
					return result;
				}

				function updateTransformation() {
					currentTransformation = newTransformation(lastX - startingX, lastY - startingY);
				}

				function transform(distX, distY) {
					var transformation = newTransformation(distX, distY);
					putStyle($scope.amyModel, 'transform', (
							'translateZ(' + -transformation.backAway + 'px) ' +
							'translateY(' + transformation.lower + 'px) ' +
							'rotateX(' + transformation.tilt + 'deg) ' +
							'rotateZ(' + transformation.rotation + 'deg)'));
					$scope.transformation = {
						translate: {
							x: 0,
							y: transformation.lower,
							z: -transformation.backAway
						},
						rotate: {
							x: transformation.tilt,
							y: 0,
							z: transformation.rotation
						}
					};
				}

			}
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
