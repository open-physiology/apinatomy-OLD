'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module', 'lodash'], function (ApiNATOMY, _) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	//// WARNING: When using this service, the controller constructor of
	////          the directive is called twice, though only one is used.
	////          Be careful with side-effects. TODO: fix


	ApiNATOMY.factory('ElementDirectiveService', ['$compile', function ($compile) {

		return function elementDirective(newAttrs, directive) {

			//// the first parameter is optional

			if (_(directive).isUndefined()) {
				directive = newAttrs;
				newAttrs = {};
			}

			//// preserve the old 'link' and 'compile' functions of the directive

			var originalCompile = directive.compile;
			var originalLink = directive.link || _.noop;

			//// define the new post-link function

			function newPreLink(oldPreLink, $scope, iElement, iAttrs, controller, transclude) {
				if (!iElement.data('element-directive-second-branch')) {

					//// this is the first branch, and we mark the element to indicate that it has started

					iElement.data('element-directive-second-branch', true);

					//// add the custom attributes

					iElement.attr(newAttrs);

					//// compile the new element <--- this invokes the second 'link' branch

					$compile(iElement)($scope);

					//// transclude the content

					transclude(_(iElement).bindKey('append').value());

					//// call the original link function with the new element
					//// and new controller (but not the transclude function)

					var newController = iElement.data('element-directive-new-controller');
					oldPreLink.call(directive, $scope, iElement, iAttrs, newController);

				} else {

					//// pass the new controller back to the first branch

					iElement.data('element-directive-new-controller', controller);

					//// but delete the new scope; we're using the old one

					$scope.$destroy();

				}
			}


			//// prepare the directive object to produce a simple transclusion element,
			//// possibly with dynamically compiled attributes

			return _.extend(directive, {
				restrict:   'E',
				replace:    true,
				transclude: true,
				compile:    function (dElement) {
					if (originalCompile) {
						var linkFunctions = originalCompile.apply(arguments);
						return {
							pre:  newPreLink.bind(undefined, linkFunctions.pre),
							post: linkFunctions.post
						};
					} else {
						return {
							pre:  newPreLink.bind(undefined, _.noop),
							post: originalLink
						};
					}

				}
			});

		};

	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
