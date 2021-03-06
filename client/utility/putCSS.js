'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['jquery', 'lodash'], function ($, _) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	$.fn.extend({
		putCSS: function (rules) {
			_(rules).each(function (css, selector) {
				var context;
				if (selector.trim() === '&') {
					context = this;
				} else if (selector.trim().charAt(0) === '&') {
					context = this.find(selector.trim().substr(1).trim());
				} else {
					context = this.find(selector);
				}
				context.css(css);
			}, this);
		}
	});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
