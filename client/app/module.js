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
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	var app = ng.module('ApiNATOMY', ['ngAnimate',
	                                  'ui.bootstrap',
	                                  'RecursionHelper',
	                                  'once',
	                                  'vr.directives.slider']);


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
		$scope.artefact = {
			id:       $scope.$id,
			type:     'webPage',

			//// artefact hierarchy:
			parent:   null,
			children: [],

			//// root entity:
			entity:   ResourceService.entities(['24tile:60000000'])[0]
		};

		//// It is the root artefact:
		//
		$scope.artefact.root = $scope.artefact;


		//////////////////// Manage bottom sliding panels //////////////////////////////////////////////////////////////

		var amySpacing = 15;      // $amy-spacing; TODO: automatically extract sass variables
		var amyPanelHeight = 250; // $amy-panel-height

		$scope.$root.$watch('simulationEnabled', function (enabled) {
			if (enabled) {
				$('main').css('bottom', amyPanelHeight);
			} else {
				$('main').css('bottom', 0);
			}
			_($($window)).bindKey('trigger', 'resize').defer();
		});

	}]);


	return app;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
