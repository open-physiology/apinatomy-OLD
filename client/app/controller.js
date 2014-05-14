'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['jquery',
		'lodash',
	    'app/module',
	    'cellml/service'], function ($, _, app) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	app.controller('MainController', ['$rootScope', '$window', 'CellMLService', function ($rootScope, $window, CellMLService) {

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



		/////////////////// TESTING CELLML SERVICE //////////////////////////


//		console.log('Testing CellML Service...');
//
//		CellMLService.loadModel().then(function () {
//			console.log('Model Loaded...');
//			CellMLService.executeModel(0, 5000, 500).then(function () {
//				console.log('Model Executed...');
//			});
//		});


	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
