'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['jquery',
        'lodash',
        'angular',
        'amy-circuit-board/artefacts',
        'color/ColorRange',
        'tile-map/module',
        'trace-diagram/module',
        'angular-animate',
        'angular-bootstrap',
        'angular-recursion',
        'angular-once',
        'angular-slider'], function ($, _, ng, artefacts, ColorRange) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	var app = ng.module('ApiNATOMY', [ 'tile-map'        , 'trace-diagram' ,
	                                   'ngAnimate'       , 'ui.bootstrap'  ,
	                                   'RecursionHelper' , 'once'          ,
	                                   'vr.directives.slider'              ]);


	//// Global configuration:
	//
	app.config(function ($locationProvider) {
		$locationProvider.html5Mode(true).hashPrefix('!');
	});


	//// Register the variables we want to be available in every $scope everywhere.
	//
	app.run(['$rootScope', function ($rootScope) {
		$rootScope.constructor.prototype._ = _;
		$rootScope.constructor.prototype.console = console;
		$rootScope.constructor.prototype.Math = Math;
	}]);


	//// The main web-page controller:
	//
	app.controller('MainController', ['$scope', '$window', 'ResourceService', function ($scope, $window, ResourceService) {

		//////////////////// Artefact Hierarchy ////////////////////////////////////////////////////////////////////////

		//// The web-page:
		//
		$scope.webPage =
		$scope.artefact = new artefacts.WebPage({
			id:     $scope.$id,
			entity: ResourceService.entities(['24tile:60000000'])[0],
			$scope: $scope
		});


		//////////////////// the margins of the circuitboard ///////////////////////////////////////////////////////////

		var AMY_SPACING = 15;         // $amy-spacing; TODO: automatically extract sass variables
		var AMY_SIDE_NAV_WIDTH = 200; // $amy-side-nav-width

		$scope.circuitBoardMargins = {
			top:    AMY_SPACING,
			left: AMY_SIDE_NAV_WIDTH + AMY_SPACING,
			bottom: AMY_SPACING,
			right:  AMY_SPACING
		};


		//////////////////// Manage bottom sliding panels //////////////////////////////////////////////////////////////

		var AMY_FOOTER_HEIGHT = 60;   // $amy-footer-height

		$scope.$root.$watch('simulationEnabled', function (enabled) {
			if (enabled) {
				$('main').css('bottom', AMY_FOOTER_HEIGHT);
				$('footer').show();
			} else {
				$('main').css('bottom', 0);
				$('footer').hide();
			}
			_($($window)).bindKey('trigger', 'resize').defer();
		});

	}]);


	return app;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
