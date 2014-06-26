'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['jquery', 'app/module', 'app/WebPageArtefact',
        'resource/service',
        'top-nav/directive',
        'side-nav/directive',
        'amy-circuit-board/directive',
        'time-control/directive'], function ($, app, WebPageArtefact) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//	console.log(app);
//	debugger;


	app.directive('amyApp', ['$window', 'ResourceService', function ($window, ResourceService) {
		return {
			restrict:    'E',
			replace:     true,
			templateUrl: 'app/view.html',
			scope:       true,
			compile:     function () {
				var linker = {};
				linker.pre = function ($scope) {

					//////////////////// Artefact Hierarchy ////////////////////////////////////////////////////////////

					//// The web-page:
					//
					$scope.webPage =
					$scope.artefact = new WebPageArtefact({
						id:     $scope.$id,
						entity: ResourceService.entities(['24tile:60000000'])[0],
						$scope: $scope
					});


					//////////////////// the margins of the circuitboard ///////////////////////////////////////////////

					var AMY_SPACING = 15;         // $amy-spacing; TODO: automatically extract sass variables
					var AMY_SIDE_NAV_WIDTH = 200; // $amy-side-nav-width

					$scope.circuitBoardMargins = {
						top:    AMY_SPACING,
						left: AMY_SIDE_NAV_WIDTH + AMY_SPACING,
						bottom: AMY_SPACING,
						right:  AMY_SPACING
					};


					//////////////////// Manage bottom sliding panels //////////////////////////////////////////////////

					var AMY_FOOTER_HEIGHT = 60;   // $amy-footer-height

					$scope.$root.$watch('simulationEnabled', function (enabled) {
						if (enabled) {
							$('main').css('bottom', AMY_FOOTER_HEIGHT);
							$('footer').show();
						} else {
							$('main').css('bottom', 0);
							$('footer').hide();
						}
						$($window).trigger('resize');
						$($window).trigger('resize'); // TODO: the second call is needed (for some reason) to let the circuit-board adjust size
					});

				};
				return linker;
			}
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
