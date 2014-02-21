'use strict';

define(['lodash'], function (lodash) {
	console.log("Removing global lodash variable...");
	return lodash.noConflict();
});
