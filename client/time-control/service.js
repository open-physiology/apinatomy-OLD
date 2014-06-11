'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module', 'lodash'], function (app, _) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	app.factory('TimerService', ['$interval', '$q', function ($interval, $q) {

		var iface = {};

		////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		var timeChangePromise = $q.defer();
		var endPromise = $q.defer();
		var timer = null;

		var INITIAL_STATE = {
			currentTime: 0,
			maxTime:     0,
			interval:    100,
			endTime:     Infinity
		};

		var state = _.clone(INITIAL_STATE);

		////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		iface.resetTimer = function resetTimer(interval, startTime, endTime) {
			iface.stop();
			state.currentTime = _(startTime).or(INITIAL_STATE.currentTime);
			state.maxTime = state.currentTime;
			state.interval = _(interval).or(INITIAL_STATE.interval);
			state.endTime = _(endTime).or(INITIAL_STATE.endTime);
		};

		Object.defineProperty(iface, "currentTime", {
			get: function () { return state.currentTime; },
			set: function (time) {
				state.currentTime = time;
				state.maxTime = Math.max(state.maxTime, state.currentTime);
				timeChangePromise.notify(state.currentTime);
			},
			enumerable: true,
			configurable: false
		});

		Object.defineProperty(iface, "interval", {
			get: function () { return state.interval; },
			enumerable: true,
			configurable: false
		});

		Object.defineProperty(iface, "endTime", {
			get: function () { return state.endTime; },
			enumerable: true,
			configurable: false
		});

		Object.defineProperty(iface, "maxTime", {
			get: function () { return state.maxTime; },
			set: function (time) {
				state.maxTime = time;
				if (state.maxTime < state.currentTime) {
					iface.currentTime = state.maxTime;
				}
			},
			enumerable: true,
			configurable: false
		});

		Object.defineProperty(iface, "timePointCount", {
			get: function () { return state.currentTime / state.interval + 1; },
			enumerable: false,
			configurable: false
		});

		// // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // //

		iface.onTimeChange = function onTimeChange(fn) {
			timeChangePromise.promise.then(null, null, fn);
		};

		iface.onEndTime = function onEndTime(fn) {
			endPromise.promise.then(null, null, fn);
		};

		// // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // //

		iface.start = function start() {
			if (!timer) {
				timer = $interval(null, state.interval, Math.floor((state.endTime - state.startTime) / state.interval));
				timer.then(function () {
					endPromise.notify(state.currentTime);
				}, null, function () {
					iface.currentTime = state.currentTime + state.interval;
				});
			}
		};

		iface.stop = function pause() {
			if (timer) {
				$interval.cancel(timer);
				timer = null;
			}
		};

		////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		return iface;

	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
