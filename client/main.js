'use strict';


// Logging several application phases

console.log('Running main.js...');


// RequireJS Configuration

require.config({
	paths: {
		'es5-shim':          'lib/es5-shim/es5-shim',
		'es6-shim':          'lib/es6-shim/es6-shim',
		'domReady':          'lib/requirejs-domready/domReady',
		'jquery':            'lib/jquery/dist/jquery',
		'lodash':            'lib/lodash/dist/lodash',
		'angular':           'lib/angular/angular',
		'angular-resource':  'lib/angular-resource/angular-resource',
		'angular-route':     'lib/angular-route/angular-route',
		'angular-animate':   'lib/angular-animate/angular-animate',
		'angular-bootstrap': 'lib/angular-bootstrap/ui-bootstrap-tpls',
		'chroma':            'lib/chroma-js/chroma'
	},
	shim:  {
		'angular':           { exports: 'angular' },
		'jquery':            { exports: '$' },
		'lodash':            { exports: '_' },
		'es6-shim':          { deps: ['es5-shim'] },
		'angular-resource':  { deps: ['angular'], init: function () { return 'ngResource'; } },
		'angular-route':     { deps: ['angular'], init: function () { return 'ngRoute'; } },
		'angular-animate':   { deps: ['angular'], init: function () { return 'ngAnimate'; } },
		'angular-bootstrap': { deps: ['angular'], init: function () { return 'ui.bootstrap'; } }
	}
});


// The Angular ApiNATOMY directives to Load

var APINATOMY_ANGULAR_DIRECTIVES = [
	'partial/top-nav/directive',
	'partial/side-nav/directive',
	'partial/treemap/directive',
	'partial/rotation/directive'
];


//// First, load ES6 shims (and, implicitly, ES5 shims).
//// Also load lodash and jquery to make sure no module
//// can see their global variables.

require(['es6-shim', 'lodash', 'jquery'], function () {

	//// Then bootstrap Angular when the DOM is ready and the ApiNATOMY modules are loaded

	require(['angular', 'app/module', 'domReady!'].concat(APINATOMY_ANGULAR_DIRECTIVES), function (ng) {

		console.log('Bootstrapping Angular...');

		ng.bootstrap(document, ['ApiNATOMY']);

		console.log('Angular bootstrapped.');

	});

});


console.log('Done with main.js.');
