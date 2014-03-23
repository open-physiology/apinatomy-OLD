'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module', 'lodash', 'chroma'], function (ApiNATOMY, _, color) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	var CONTEXT = { _: _, color: color };


	ApiNATOMY.factory('defaults', ['$parse', function ($parse) {
		return function defaults(spec) {

			//noinspection FunctionWithInconsistentReturnsJS
			spec = _(spec).cloneDeep(function (val) {
				if (_(val).isString()) {
					var refs = _.map(val.match(/`.+?`/g), function (ref) {
						return $parse('me' + ref.substring(1, ref.length - 1));
					});
					return _.extend($parse(val.replace(/`(.+?)`/g, "(me$1)")), {refs: refs});
				}
			});


			//// recursive auxiliary function; returns true if a change to obj was made
			function withDefaultsAux(defSpec, obj, refs, params) {
				var change = false;
				_(defSpec).keys().forEach(function (key) {

					if (_(obj).has(key)) {
						if (_(defSpec[key]).isPlainObject() && _(obj[key]).isPlainObject()) {
							change = withDefaultsAux(defSpec[key], obj[key], refs, params) || change;
						}
					} else if (_(defSpec[key]).isPlainObject()) {
						obj[key] = {};
						change = withDefaultsAux(defSpec[key], obj[key], refs, params) || change;
					} else if (_(defSpec[key]).isFunction()) {
						if (_(defSpec[key].refs).every(function (ref) {
							return !_(ref({}, _.extend({ me: refs }, CONTEXT, params))).isUndefined();
						})) { // if none of the references are undefined, assign this default
							obj[key] = defSpec[key]({}, _.extend({ me: refs }, CONTEXT, params));
						}
					}

				});
				return change;
			}


			return function withDefaults(obj, params) {
				var result = (_(obj).isUndefined() ? {} : _(obj).cloneDeep());

				do {
					var change = withDefaultsAux(spec, result, result, params || {});
				} while (change);

				return result;
			};
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
