'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['jquery',
		'lodash',
	    'app/module',
	    'cellml/service'], function ($, _, app) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	app.controller('MainController', ['$scope', '$rootScope', '$window', 'CellMLService', 'ResourceService', function ($scope, $rootScope, $window, CellMLService, ResourceService) {

		//// initially disable global settings
		//
		$rootScope.threeDRotateEnabled = false;
		$rootScope.simulationEnabled = false;

		//// manage bottom sliding panels
		//
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




		/////////////////// TESTING WALKS ///////////////////////////////////

//		ResourceService.ancestors('fma:17462').then(function (ancestors) {
//			console.log(ancestors);
//		}).catch(function (err) {
//			console.error(err);
//		});

		/////////////////// TESTING CELLML SERVICE //////////////////////////


//		$scope.testArray = [
//			{ time: 0, value: 10 },
//			{ time: 1, value: 20 },
//			{ time: 2, value: 30 },
//			{ time: 3, value: 10 },
//			{ time: 4, value: 20 },
//			{ time: 5, value: 30 },
//			{ time: 6, value: 10 },
//			{ time: 7, value: 20 },
//			{ time: 8, value: 30 },
//			{ time: 9, value: 10 }
//		];


	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
