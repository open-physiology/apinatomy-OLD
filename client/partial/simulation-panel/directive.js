'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module',
	'lodash',
	'partial/simulation-panel/time-trace/directive',
	'timer/service',
	'partial/simulation-panel/stream/service'], function (app, _) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	app.directive('amySimulationPanel', ['TimerService', 'StreamService', function (TimerService, StreamService) {
		return {
			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			restrict   : 'E',
			replace    : false,
			templateUrl: 'partial/simulation-panel/view.html',
			scope      : {
				streams: '=amyStreams'
			},

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			controller: ['$scope', function ($scope) {

				$scope.timer = {
					state       : 'stopped',
					currentTime : 0,
					maxTime     : 0,
					timeInterval: 100
				};

				//// format the time-strings

				$scope.timeFormat = function (time) {
					return _(time / 100)
							.multiBase([24, 60, 60, 10], 2)
							.suffixed(['d ', 'h ', 'm ', '.', 's'])
							.join('');
				};


				//// the streams
				// temporary data; TODO: use real data

				$scope.streams = [
					{
						_id : 'var:1',
						css : { stroke: 'green' },
						data: []
					},
					{
						_id : 'var:2',
						css : { stroke: 'red' },
						data: []
					}
				];

				var stream0 = StreamService.newRandomDataStream($scope.streams[0], 'data', $scope.timer.timeInterval);
				var stream1 = StreamService.newRandomDataStream($scope.streams[1], 'data', $scope.timer.timeInterval);

				var maxTimeWithData = 0;

				//// control the timer

				TimerService.onInterval(function (t) {
					if (maxTimeWithData < t) { // TODO: more flexible conditions for preloading data (now it's done exactly when needed)
						stream0.loadMoreEntries(10);
						stream1.loadMoreEntries(10); // TODO: for all streams
						maxTimeWithData +=  10 * $scope.timer.timeInterval;
					}
					$scope.timer.currentTime = t;
				});

				$scope.$watch('timer.state', function (state) {
					if (state === 'stopped') {
						TimerService.stop();
						$scope.timer.maxTime = 0;
					} else if (state === 'paused') {
						TimerService.pause();
					} else if (state === 'running') {
						// TODO: interval from metadata
						TimerService.start({ beginning: $scope.timer.currentTime, interval: $scope.timer.timeInterval });

						//// reinitialize stream generator
						stream0.loadMoreEntries(1, $scope.timer.currentTime);
						stream1.loadMoreEntries(1, $scope.timer.currentTime);
						maxTimeWithData = $scope.timer.currentTime + $scope.timer.timeInterval;
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


			}],

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			compile: function () {
				return {

					pre: function preLink(/*$scope, iElement, iAttrs, controller*/) {
					},

					post: function postLink(/*$scope, iElement, iAttrs, controller*/) {
					}

				};
			}

			////////////////////////////////////////////////////////////////////////////////////////////////////////////
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
