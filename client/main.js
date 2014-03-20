'use strict';


//// Logging several application phases

console.info('Starting main.js...');


//// RequireJS Configuration

requirejs.config({
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
		'angular-recursion': 'lib/angular-recursion/angular-recursion',
		'angular-once':      'lib/angular-once/once',
		'chroma':            'lib/chroma-js/chroma'
	},
	shim:  {
		'angular':           { exports: 'angular', deps: ['jquery'] },
		'jquery':            { exports: '$' },
		'lodash':            { exports: '_' },
		'es6-shim':          ['es5-shim'],
		'angular-resource':  ['angular'],
		'angular-route':     ['angular'],
		'angular-animate':   ['angular'],
		'angular-bootstrap': ['angular'],
		'angular-recursion': ['angular'],
		'angular-once':      ['angular']
	}
});


//// Monkey patch Require.js to log every module load to the console
//
//var oldReqLoad = requirejs.load;
//function reqLogLoad(context, moduleName, url) {
//	console.log("Loading:", moduleName);
//	return oldReqLoad(context, moduleName, url);
//}
//requirejs.load = reqLogLoad;


//// Utility modules to load up front

var UTILITY_MODULES = [
	'utility/or',
	'utility/sum',
	'utility/repeat',
	'utility/approx',
	'utility/call',
	'utility/div',
	'utility/putCSS',
    'utility/prefixOf'
];


//// First, load ES6 shims (and, implicitly, ES5 shims).
//// Also load lodash and jquery to make sure no module
//// can see their global variables.

require(['es6-shim', 'lodash', 'jquery'].concat(UTILITY_MODULES), function () {

	//// then bootstrap the Angular application

	console.info('Bootstrapping Angular...');

	require(['app/bootstrap'], function () {
		console.info('Angular bootstrapped.');
	});

});
