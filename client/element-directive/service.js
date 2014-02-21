'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module', 'lodash'], function (ApiNATOMY, _) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	console.log("Loading 'element-directive/service'");


	//// WARNING: When using this service, the controller constructor of
	////          the directive is called twice, though only one is used.
	////          Be careful with side-effects. (TODO: fix)


	ApiNATOMY.factory('ElementDirectiveService', ['$compile', function ($compile) {

		return function elementDirective(newAttrs, directive) {

			//// the first parameter is optional

			if (_.isUndefined(directive)) {
				directive = newAttrs;
				newAttrs = {};
			}

			//// preserve the old 'link' function of the directive

			var oldPostLink = directive.link || _.noop;

			// TODO: preserve old 'compile', including pre and post linker

			//// prepare the directive object to produce a simple transclusion element,
			//// possibly with dynamically compiled attributes

			return _.extend(directive, {
				restrict:   'E',
				replace:    true,
				transclude: true,
				link:       function ($scope, iElement, iAttrs, controller, transclude) {
					if (!iElement.data('element-directive-second-branch')) {
						iElement.data('element-directive-second-branch', true);

						//// add the custom attributes

						iElement.attr(newAttrs);

						//// compile the new element <--- this invokes the second 'link' branch

						$compile(iElement)($scope);

						//// transclude the content

						transclude(_.bindKey(iElement, 'append'));

						//// call the original link function with the new element
						//// and new controller (but not the transclude function)

						var newController = iElement.data('element-directive-new-controller');
						oldPostLink.call(directive, $scope, iElement, iAttrs, newController);

					} else {

						//// pass the new controller back to the first branch

						iElement.data('element-directive-new-controller', controller);

						//// but delete the new scope; we're using the old one

						$scope.$destroy();

					}
				}
			});

		};

	}]);


	return 'ElementDirectiveService';


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
