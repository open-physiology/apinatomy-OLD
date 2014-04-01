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
				traces: '=amyTraces'
			},

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			controller: ['$scope', function ($scope) {

				//// format the time-strings

				$scope.timeFormat = function (ms) {
					var minutes = Math.floor(ms / 1000 / 60);
					var seconds = ms / 1000 - minutes * 60;
					return (minutes ? minutes + 'm ' : '') + seconds + 's';
				};


				//// control the timer

				$scope.currentTime = 0;
				$scope.maxTime = 4000;

				$scope.timerState = 'stopped';

				TimerService.onInterval(function (t) {
					$scope.currentTime = t;
				});

				TimerService.onEnd(function (t) {
					$scope.currentTime = t;
					$scope.timerState = 'paused';
				});

				$scope.$watch('timerState', function (newState, oldState) {
					if (newState === 'stopped') {
						TimerService.stop();
					} else if (newState === 'paused') {
						TimerService.pause();
					} else if (newState === 'running' && oldState === 'stopped') {
						// TODO: interval from metadata
						// TODO: end-time increases with simulation
						TimerService.start({ interval: 200, end: 4000 });
					} else if (newState === 'running' && oldState === 'paused') {
						TimerService.resume();
					}
				});


				//// temporary data; TODO: use real data

				$scope.traces = [
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
