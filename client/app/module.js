'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['jquery',
		'lodash',
	    'angular',
        'angular-animate',
        'angular-bootstrap',
        'angular-recursion',
        'angular-once',
        'angular-slider'], function ($, _, ng) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	var ApiNATOMY = ng.module('ApiNATOMY', ['ngAnimate',
	                                        'ui.bootstrap',
	                                        'RecursionHelper',
	                                        'once',
	                                        'vr.directives.slider']);


	ApiNATOMY.config(function ($locationProvider) {
		$locationProvider.html5Mode(true).hashPrefix('!');
	});

	ApiNATOMY.run(function ($rootScope) {

		//// some settings are initially disabled

		$rootScope.threeDRotateEnabled = false;
		$rootScope.simulationEnabled = false;

	});

	ApiNATOMY.controller('PanelController', ['$rootScope', '$window', function ($rootScope, $window) {
		var amySpacing = 15;      // $amy-spacing
		var amyPanelHeight = 250; // $amy-panel-height

		console.debug('PanelController');

		$rootScope.$watch('simulationEnabled', function (enabled) {
			if (enabled) {
				$('main').css('bottom', amySpacing + amyPanelHeight);
			} else {
				$('main').css('bottom', amySpacing);
			}
			_($($window)).bindKey('trigger', 'resize').defer();
		});
	}]);


	return ApiNATOMY;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
