'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['lodash', 'app/module', '$bind/service'], function (_, app) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	_([{ name: 'Left'  , id: 1 },
	   { name: 'Middle', id: 2 },
	   { name: 'Right' , id: 3 }]).forEach(function (btn) {

		app.directive('ng'+btn.name+'Click', ['$parse', '$bind', '$document', function ($parse, $bind, $document) {
			return function ($scope, iElement, iAttrs) {

				//// Local variables:
				//
				var handler = $parse(iAttrs['ng'+btn.name+'Click']);
				var dragging;

				//// If ng-right-click is being registered, disable the context-menu.
				//
				if (btn.id === 3) { iElement.on('contextmenu', function () { return false; }); }

				//// On mouse down, start watching for mouse-dragging.
				//
				iElement.on('mousedown', $bind(function (event) {
					if (event.which === btn.id) {
						dragging = false;
						$($document).one('mousemove', function () { dragging = true; });
					}
				}));

				//// On mouse up, if no dragging took place, actually call the handler.
				//// (Mousemove handlers may stick around, but after firing once, they
				////  are automatically cleaned up anyway, so we won't bother doing it here.)
				//
				iElement.on((btn.id === 3 ? 'mouseup' : 'click'), $bind(function (event) {
					if (event.which === btn.id && !dragging) {
						handler($scope, {$event: event});
					}
				}));

			};
		}]);

	});



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
