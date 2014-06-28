'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['lodash', 'angular',
        'tile-map/module',
        'trace-diagram/module',
        'angular-bootstrap',
        'angular-recursion',
        'angular-slider'], function (_, ng) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	var app = ng.module('ApiNATOMY', [ 'tile-map'             , 'trace-diagram'   ,
	                                   'ui.bootstrap'         , 'RecursionHelper' ,
                                       'vr.directives.slider' ]);


	//// Global configuration:
	//
	app.config(function ($locationProvider) {
		$locationProvider.html5Mode(true).hashPrefix('!');
	});


	//// Register the variables we want to be available in every $scope everywhere.
	//
	app.run(['$rootScope', 'ResourceService', function ($rootScope, ResourceService) {
		$rootScope.constructor.prototype._ = _;
		$rootScope.constructor.prototype.console = console;
		$rootScope.constructor.prototype.Math = Math;
		$rootScope.constructor.prototype.ResourceService = ResourceService;
	}]);


	return app;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
