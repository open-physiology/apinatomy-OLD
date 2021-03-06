'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module',
        'lodash',
        'css!time-control/style',
        'time-control/service'], function (app, _) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	app.directive('amyTimeControl', ['TimerService', '$bind', function (TimerService, $bind) {
		return {
			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			restrict:    'E',
			replace:     true,
			templateUrl: 'time-control/view.html',
			scope:       true,

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			controller: ['$scope', function ($scope) {

				//// setting up the timer

				$scope.TimerService = TimerService;

				$scope.timer = { state: 'stopped' };


				//// format the time-strings

				$scope.timeFormat = function (time) {
					return _(time / 100)
							.multiBase([24, 60, 60, 10], 2)
							.suffixed (['d ', 'h ', 'm ', '.', 's'])
							.join('');
				};


				//// control the timer

				TimerService.resetTimer(100);

				$scope.$watch('timer.state', function (state) {
					switch (state) {
						case 'stopped':
							TimerService.stop();
							TimerService.currentTime = 0;
							_.defer($bind(function () {
								TimerService.maxTime = 0;
							}));
							break;
						case 'paused' : TimerService.stop(); break;
						case 'running': TimerService.start(); break;
					}
				});

				$scope.$root.$watchCollection('selectedVariables', function () {
					$scope.timer.state = 'stopped';
				});

			}]

			////////////////////////////////////////////////////////////////////////////////////////////////////////////
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
