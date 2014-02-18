'use strict';

// Logging several application phases

console.log('Running main.js...');


// RequireJS Configuration

require.config({
	paths: {
		'domReady'         : 'lib/requirejs-domready/domReady',
		'angular'          : 'lib/angular/angular',
		'angular-resource' : 'lib/angular-resource/angular-resource',
		'angular-route'    : 'lib/angular-route/angular-route',
		'angular-animate'  : 'lib/angular-animate/angular-animate',
		'angular-bootstrap': 'lib/angular-bootstrap/ui-bootstrap-tpls',
		'underscore'       : 'lib/underscore/underscore',
		'es5-shim'         : 'lib/es5-shim/es5-shim',
		'es6-shim'         : 'lib/es6-shim/es6-shim',
		'chroma'           : 'lib/chroma-js/chroma'
	},
	shim : {
		'underscore'       : { exports: '_' },
		'angular'          : { exports: 'angular' },
		'es6-shim'         : { deps: ['es5-shim'] },
		'angular-resource' : { deps: ['angular'], init: function () { return 'ngResource'; } },
		'angular-route'    : { deps: ['angular'], init: function () { return 'ngRoute'; } },
		'angular-animate'  : { deps: ['angular'], init: function () { return 'ngAnimate'; } },
		'angular-bootstrap': { deps: ['angular'], init: function () { return 'ui.bootstrap'; } }
	}
});


// The Angular ApiNATOMY directives to Load

var APINATOMY_ANGULAR_DIRECTIVES = [
	'partial/top-nav/directive',
	'partial/side-nav/directive',
	'partial/treemap/directive',
	'partial/tile/directive',
	'partial/details/directive',
	'partial/3d-rotation/directive'
];


// First, load ES6 shims (and, implicitly, ES5 shims)

require(['es6-shim'], function () {

	// Then bootstrap Angular when the DOM is ready and the ApiNATOMY modules are loaded

	require(['angular', 'app/module', 'domReady!'].concat(APINATOMY_ANGULAR_DIRECTIVES), function (ng) {

		console.log('Bootstrapping Angular...');

		ng.bootstrap(document, ['ApiNATOMY']);

		console.log('Angular bootstrapped.');

	});

});


console.log('Done with main.js.');
