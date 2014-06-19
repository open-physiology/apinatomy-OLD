'use strict';


//// Logging several application phases

console.info('Starting main.js...');


//// RequireJS Configuration

requirejs.config({
	paths: {
		'es5-shim'                  : 'lib/es5-shim/es5-shim',
		'es6-shim'                  : 'lib/es6-shim/es6-shim',
		'domReady'                  : 'lib/requirejs-domready/domReady',
		'jquery'                    : 'lib/jquery/dist/jquery',
		'jqueryui'                  : 'lib/jquery-ui/jqueryui',
		'lodash'                    : 'lib/lodash/dist/lodash',
		'angular'                   : 'lib/angular/angular',
		'angular-touch'             : 'patched-lib/angular-touch',
		'angular-animate'           : 'lib/angular-animate/angular-animate',
		'angular-bootstrap'         : 'lib/angular-bootstrap/ui-bootstrap-tpls',
		'angular-recursion'         : 'lib/angular-recursion/angular-recursion',
		'angular-once'              : 'lib/angular-once/once',
		'angular-slider'            : 'patched-lib/angular-slider',
		'chroma'                    : 'lib/chroma-js/chroma',
		'd3'                        : 'lib/d3/d3',
		'threejs'                   : 'lib/threejs/build/three',
		'threejs-obj-loader'        : 'patched-lib/OBJLoader',
		'threejs-swc-loader'        : 'patched-lib/SWCLoader/SWCLoader',
		'threejs-css-3d-renderer'   : 'patched-lib/CSS3DRenderer',
		'threejs-trackball-controls': 'patched-lib/TrackballControls',
		'threex-domevents'          : 'lib/threex.domevents/threex.domevents',
		'stats'                     : 'lib/stats.js/build/stats.min'
	},
	shim : {
		'angular'                   : { exports: 'angular', deps: ['jquery'] },
		'jquery'                    : { exports: '$' },
		'jquery-ui'                 : ['jquery'],
		'lodash'                    : { exports: '_' },
		'threejs'                   : { exports: 'THREE' },
		'threejs-obj-loader'        : ['threejs'],
		'threejs-swc-loader'        : ['threejs'],
		'threejs-css-3d-renderer'   : ['threejs'],
		'threejs-trackball-controls': ['threejs'],
		'threex-domevents'          : { exports: 'THREEx', deps: ['threejs'] },
		'es6-shim'                  : ['es5-shim'],
		'angular-animate'           : ['angular'],
		'angular-bootstrap'         : ['angular'],
		'angular-recursion'         : ['angular'],
		'angular-once'              : ['angular'],
		'angular-touch'             : ['angular'],
		'angular-slider'            : ['angular', 'angular-touch'],
		'stats'                     : { exports: 'Stats' }
	},
	map  : {
		'*': { 'css': 'lib/require-css/css' }
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
	'utility/svgClass',
	'utility/prefixOf',
	'utility/derivedProperty',
	'utility/concatenated',
	'utility/extent',
	'utility/multiBase',
	'utility/between',
	'utility/ngRightClick',
	'utility/clickVsDrag'
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
