'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module'], function (ApiNATOMY) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	ApiNATOMY.factory('FocusService', function ($rootScope) {

		var uriStack = [];
		var reuseRange = [];

		var iface = {

			pushUri: function (uri) {
				uriStack.push(uri);
				reuseRange[uriStack.length - 1] = uriStack.length - 1;
				$rootScope.$broadcast('entity-focus', uri);
			},

			popUri: function (uri) {
				// a safety check; always need to specify the uri to pop off
				if (iface.topUri() !== uri) {
					throw new Error("popped the wrong uri '" + uri + "' " +
				                    "from the focus stack; " +
					                "the top one is '" + iface.topUri() + "'");
				}
				uriStack.pop();
				$rootScope.$broadcast('entity-focus', iface.topUri());
			},

			uriStack: function () {
				return uriStack;
			},

			uri: function (uriId) {
				if (uriId < uriStack.length) {
					return uriStack[uriId];
				} else {
					return null;
				}
			},

			topUri: function () {
				return iface.uri(uriStack.length - 1);
			},

			uriCount: function () {
				return uriStack.length;
			},

			uriIdRange: function () {
				return reuseRange;
			}

		};

		return iface;
	});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
