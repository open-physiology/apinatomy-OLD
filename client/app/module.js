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

	ApiNATOMY.controller('MainController', ['$rootScope', '$window', function ($rootScope, $window) {

		//// initially disable global settings

		$rootScope.threeDRotateEnabled = false;
		$rootScope.simulationEnabled = false;

		//// manage bottom sliding panels

		var amySpacing = 15;      // $amy-spacing; TODO: automatically extract sass variables
		var amyPanelHeight = 250; // $amy-panel-height

		$rootScope.$watch('simulationEnabled', function (enabled) {
			if (enabled) {
				$('main').css('bottom', amyPanelHeight);
			} else {
				$('main').css('bottom', 0);
			}
			_($($window)).bindKey('trigger', 'resize').defer();
		});

	}]);


	return ApiNATOMY;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
