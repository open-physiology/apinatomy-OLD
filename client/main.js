'use strict';

// Logging several application phases

console.log('Running main.js...');


// RequireJS Configuration

require.config({
	paths: {
		'domReady'         : 'lib/requirejs-domready/domReady',
		'angular'          : 'lib/angular/angular',
		'angular-resource' : 'lib/angular-resource/angular-resource',
		'angular-bootstrap': 'lib/angular-bootstrap/ui-bootstrap-tpls',
		'angular-route'    : 'lib/angular-route/angular-route',
		'angular-animate'  : 'lib/angular-animate/angular-animate',
		'underscore'       : 'lib/underscore/underscore',
		'es5-shim'         : 'lib/es5-shim/es5-shim',
		'es6-shim'         : 'lib/es6-shim/es6-shim',
		'chroma'           : 'lib/chroma-js/chroma'
	},
	shim : {
		'angular'          : { exports: 'angular' },
		'angular-resource' : { deps: ['angular'] },
		'angular-bootstrap': { deps: ['angular'] },
		'angular-route'    : { deps: ['angular'] },
		'angular-animate'  : { deps: ['angular'] },
		'es6-shim'         : { deps: ['es5-shim'] }
	}
});


// The Angular ApiNATOMY Modules to Load

var APINATOMY_ANGULAR_MODULES = [
	'app/module',

	//'resource/service',
	//'partial/tile/layout/service',
	//'focus/service',

	'partial/top-nav/directive',
	'partial/side-nav/directive',
	'partial/treemap/directive',
	'partial/tile/directive',
	'partial/details/directive'
];


// First, load ES5 and ES6 shims

require(['es5-shim', 'es6-shim'], function () {

	// Then bootstrap Angular when the DOM is ready and the ApiNATOMY modules are loaded

	require(['angular', 'domReady!'].concat(APINATOMY_ANGULAR_MODULES), function (ng) {

		console.log('Bootstrapping Angular...');

		ng.bootstrap(document, ['ApiNATOMY']);

		console.log('Angular bootstrapped.');

	});

});


console.log('Done with main.js.');
