'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module',
        'lodash',
        'css!time-control/style',
        'time-control/service'], function (app, _) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	app.directive('amyTimeControl', ['TimerService', function (TimerService) {
		return {
			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			restrict:    'E',
			replace:     true,
			templateUrl: 'time-control/view.html',
			scope:       true,

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			controller: ['$scope', function ($scope) {

				$scope.timer = {
					state:        'stopped',
					currentTime:  0,
					maxTime:      0,
					timeInterval: 100
				};


				//// format the time-strings

				$scope.timeFormat = function (time) {
					return _(time / 100)
							.multiBase([24, 60, 60, 10], 2)
							.suffixed (['d ', 'h ', 'm ', '.', 's'])
							.join('');
				};


				//// control the timer

				TimerService.onInterval(function (t) {
					$scope.timer.currentTime = t;
				});

				$scope.$watch('timer.state', function (state) {
					if (state === 'stopped') {
						TimerService.stop();
						$scope.timer.maxTime = 0;
					} else if (state === 'paused') {
						TimerService.pause();
					} else if (state === 'running') {
						TimerService.start({
							beginning: $scope.timer.currentTime,
							interval: $scope.timer.timeInterval
						});
					}
				});

				$scope.$watch('timer.currentTime', function (currentTime) {
					$scope.timer.maxTime = Math.max($scope.timer.maxTime, currentTime);
				});

				$scope.$watch('timer.maxTime', function (maxTime) {
					if (maxTime > 0 && $scope.timer.state === 'stopped') {
						$scope.timer.state = 'paused';
					}
				});

				$scope.$root.$watchCollection('selectedVariables', function () {
					$scope.timer.state = 'stopped';
				});


			}],

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			compile: function () {
				return {

					pre: function preLink(/*$scope, iElement, iAttrs, controller*/) {},

					post: function postLink(/*$scope, iElement, iAttrs, controller*/) {}

				};
			}

			////////////////////////////////////////////////////////////////////////////////////////////////////////////
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
