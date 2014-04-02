'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module',
        'lodash',
        'partial/simulation-panel/time-trace/directive',
        'timer/service'], function (app, _) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	app.directive('amySimulationPanel', ['TimerService', function (TimerService) {
		return {
			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			restrict:    'E',
			replace:     false,
			templateUrl: 'partial/simulation-panel/view.html',
			scope:       {
				streams: '=amyStreams'
			},

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			controller: ['$scope', function ($scope) {

				//// format the time-strings

				$scope.timeFormat = function (time) {
					return _(time / 100)
							.multiBase([24, 60, 60, 10], 2)
							.suffixed(['d ', 'h ', 'm ', '.', 's'])
							.join('');
				};


				//// control the timer

				$scope.timer = {
					state: 'stopped',
					currentTime: 0,
					maxTime: 0
				};

				TimerService.onInterval(function (t) {
					$scope.timer.currentTime = t;
				});

				TimerService.onEnd(function (t) {
					$scope.timer.currentTime = t;
					$scope.timer.state = 'paused';
				});

				$scope.$watch('timer.state', function (newState, oldState) {
					if (newState === 'stopped') {
						TimerService.stop();
						$scope.timer.maxTime = 0;
					} else if (newState === 'paused') {
						TimerService.pause();
					} else if (newState === 'running') {
						// TODO: interval from metadata
						TimerService.start({ beginning: $scope.timer.currentTime, interval: 200 });
					}
				});

				$scope.$watch('timer.currentTime', function (currentTime) {
					if (currentTime > $scope.timer.maxTime) {
						$scope.timer.maxTime = currentTime;
					}
				});

				$scope.$watch('timer.maxTime', function (maxTime) {
					if (maxTime > 0 && $scope.timer.state === 'stopped') {
						$scope.timer.state = 'paused';
					}
				});


				//// temporary data; TODO: use real data

				$scope.streams = [
					{
						_id:  'var:1',
						css:  { stroke: 'green' },
						data: [
							{ time: 0, value: 4 },
							{ time: 200, value: 1 },
							{ time: 400, value: 3 },
							{ time: 600, value: 5 },
							{ time: 800, value: 2 },
							{ time: 1000, value: 7 },
							{ time: 1200, value: 3 },
							{ time: 1400, value: 4 },
							{ time: 1600, value: 3 },
							{ time: 1800, value: 6 },
							{ time: 2000, value: 4 },
							{ time: 2200, value: 2 },
							{ time: 2400, value: 3 },
							{ time: 2600, value: 4 },
							{ time: 2800, value: 7 },
							{ time: 3000, value: 1 },
							{ time: 3200, value: 2 },
							{ time: 3400, value: 3 },
							{ time: 3600, value: 4 },
							{ time: 3800, value: 9 },
							{ time: 4000, value: 7 }
						]
					},
					{
						_id:  'var:2',
						css:  { stroke: 'red' },
						data: [
							{ time: 0, value: 17 },
							{ time: 200, value: 19 },
							{ time: 400, value: 14 },
							{ time: 600, value: 13 },
							{ time: 800, value: 12 },
							{ time: 1000, value: 11 },
							{ time: 1200, value: 17 },
							{ time: 1400, value: 14 },
							{ time: 1600, value: 13 },
							{ time: 1800, value: 12 },
							{ time: 2000, value: 14 },
							{ time: 2200, value: 16 },
							{ time: 2400, value: 13 },
							{ time: 2600, value: 14 },
							{ time: 2800, value: 13 },
							{ time: 3000, value: 17 },
							{ time: 3200, value: 12 },
							{ time: 3400, value: 15 },
							{ time: 3600, value: 13 },
							{ time: 3800, value: 11 },
							{ time: 4000, value: 14 }
						]
					}
				];
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
