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


	app.config(function ($locationProvider) {
		$locationProvider.html5Mode(true).hashPrefix('!');
	});


	app.run(['$rootScope', function ($rootScope) {
		$rootScope.constructor.prototype._ = _;
		$rootScope.constructor.prototype.console = console;
		$rootScope.constructor.prototype.Math = Math;
	}]);


	app.controller('MainController', ['$scope', '$window', 'ResourceService', function ($scope, $window, ResourceService) {

		//////////////////// Artefact Hierarchy ////////////////////////////////////////////////////////////////////////

		$scope.webPage =
		$scope.artefact = {
			id:       $scope.$id,
			type:     'webPage',
			show:     false,

			//// artefact hierarchy:
			parent:   null,
			children: [],

			//// root entity:
			entity:   ResourceService.entities(['24tile:60000000'])[0]
		};

		$scope.artefact.root = $scope.artefact;


		//////////////////// Initially disable global settings /////////////////////////////////////////////////////////

		$scope.$root.threeDRotateEnabled = false;
		$scope.$root.simulationEnabled = false;


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
