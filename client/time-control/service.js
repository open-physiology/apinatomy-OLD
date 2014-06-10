'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module'], function (app) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	app.factory('TimerService', ['$interval', '$q', function ($interval, $q) {

		var iface = {};

		////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		var intervalPromise = $q.defer();
		var endPromise = $q.defer();
		var timer = null;

		var INITIAL_STATE = {
			currentTime: 0,
			endTime:     0,
			interval:    100
		};

		var state = INITIAL_STATE;

		function startTimer(interval, beginning, end) {
			state.interval = interval;
			state.currentTime = beginning;
			state.endTime = end;
			timer = $interval(null, interval, Math.floor((end - beginning) / interval));
			timer.then(function () {
				endPromise.notify(state.currentTime);
			}, null, function () {
				state.currentTime += interval;
				intervalPromise.notify(state.currentTime);
			});
		}

		function stopTimer() {
			if (timer) {
				$interval.cancel(timer);
				timer = null;
			}
		}

		////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		iface.onInterval = function (fn) {
			intervalPromise.promise.then(null, null, fn);
		};

		iface.onEnd = function (fn) {
			endPromise.promise.then(null, null, fn);
		};

		iface.start = function (options) {
			startTimer( options.interval || 100,  options.beginning || 0,  options.end || 0 );
		};

		iface.resume = function () {
			if (state.currentTime < state.endTime) {
				startTimer(state.interval, state.currentTime, state.endTime);
			} else {
				endPromise.notify(state.currentTime);
			}
		};

		iface.pause = function () {
			stopTimer();
		};

		iface.togglePause = function () {
			if (timer) {
				iface.pause();
			} else {
				iface.resume();
			}
		};

		iface.stop = function () {
			stopTimer();
			intervalPromise.notify(0);
			state = INITIAL_STATE;
		};

		////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		return iface;

	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
