'use strict';

//// load the real jquery

define(['jquery'], function (jquery) {
	//// then let angular load and pick up the global jquery variable

	require(['angular'], function () {
		//// then remove that global variable

		console.log("Removing global jQuery variable...");
		return jquery.noConflict(true);
	});
});
