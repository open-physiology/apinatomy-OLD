'use strict';

beforeEach(function() {

	var matchers = {};

	/**
	 * Assert that both actual and parameter are functions with the
	 * same implementation modulo whitespace.
	 * @param  {Function} fn
	 * @return {Boolean}
	 */
	matchers.toHaveSameFunctionImplementationAs = function (fn) {
		return (typeof this.actual === 'function') &&
		       (typeof fn === 'function') &&
		       this.actual.toString().replace(/\s+/g, ' ') === fn.toString().replace(/\s+/g, ' ');
	};

	/**
	 * Assert that actual is the prototype of obj.
	 * @param  {Object} obj
	 * @return {Boolean}
	 */
	matchers.toBePrototypeOf = function (obj) {
		return this.actual.isPrototypeOf(obj);
	};

	/**
	 * Assert that obj is the prototype of actual
	 * @param  {Object} obj
	 * @return {Boolean}
	 */
	matchers.toHavePrototype = function (obj) {
		return obj.isPrototypeOf(this.actual);
	};

	this.addMatchers(matchers);

});
