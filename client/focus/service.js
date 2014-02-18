'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module'], function (ApiNATOMY) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	console.log("Loading 'focus/service'");


	var FOCUS_SERVICE = 'FocusService';


	ApiNATOMY.factory(FOCUS_SERVICE, function ($rootScope) {

		var eidStack = [];
		var reuseRange = [];

		var iface = {

			pushEid: function (eid) {
				eidStack.push(eid);
				reuseRange[eidStack.length - 1] = eidStack.length - 1;
				$rootScope.$broadcast('entity-focus', eid);
			},

			popEid: function (eid) {
				// a safety check; always need to specify the eid to pop off
				if (iface.topEid() !== eid) {
					throw new Error("popped the wrong eid '" + eid + "' " +
				                    "from the focus stack; " +
					                "the top one is '" + iface.topEid() + "'");
				}
				eidStack.pop();
				$rootScope.$broadcast('entity-focus', iface.topEid());
			},

			eidStack: function () {
				return eidStack;
			},

			eid: function (eidId) {
				if (eidId < eidStack.length) {
					return eidStack[eidId];
				} else {
					return null;
				}
			},

			topEid: function () {
				return iface.eid(eidStack.length - 1);
			},

			eidCount: function () {
				return eidStack.length;
			},

			eidIdRange: function () {
				return reuseRange;
			}

		};

		return iface;
	});


	return FOCUS_SERVICE;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
