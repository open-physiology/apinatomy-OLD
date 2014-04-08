'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module', 'chroma', 'lodash'], function (ApiNATOMY, color, _) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	ApiNATOMY.directive('amyEntityDetails', [function () {
		return {
			restrict:    'E',
			replace:     true,
			transclude:  true,
			templateUrl: 'partial/side-nav/details/view.html',
			scope:       {
				bundle: '='
			},

			controller: function ($scope) {},

			compile: function () {
				return {

					pre: function preLink($scope, iElement/*, iAttrs, controller*/) {

						if (_($scope.bundle.styling).isUndefined()) { // TODO: trying to capture and repair this condition
							console.debug($scope.bundle);
						}

						iElement.putCSS($scope.bundle.styling.focus.css);
						iElement.css({
							backgroundColor: color($scope.bundle.styling.normal.css['&'].backgroundColor).brighten(30).css()
						});
					},

					post: function postLink(/*$scope, iElement, iAttrs, controller*/) {}

				};
			}
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
