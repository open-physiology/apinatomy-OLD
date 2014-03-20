'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module'], function (ApiNATOMY) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	function isString(value){return typeof value === 'string';}

	var lowercase = function(string){return isString(string) ? string.toLowerCase() : string;};

	function toBoolean(value) {
		if (typeof value === 'function') {
			value = true;
		} else if (value && value.length !== 0) {
			var v = lowercase("" + value);
			value = !(v == 'f' || v == '0' || v == 'false' || v == 'no' || v == 'n' || v == '[]');
		} else {
			value = false;
		}
		return value;
	}


	ApiNATOMY.directive('amyOnce', ['$animate', function($animate) {
		return {
			transclude: 'element',
			priority: 600,
			terminal: true,
			restrict: 'A',
			$$tlb: true,
			link: function ($scope, $element, $attr, ctrl, $transclude) {
				var removeWatch = $scope.$watch($attr.amyOnce, function amyOnceWatchAction(value) {
					if (toBoolean(value)) {
						removeWatch();
						$transclude($scope.$new(), function (clone) {
							clone[clone.length++] = document.createComment(' end amyOnce: ' + $attr.amyOnce + ' ');
							$animate.enter(clone, $element.parent(), $element);
						});
					}
				});
			}
		};
	}]);


	ApiNATOMY.directive('amyUntil', ['$animate', function($animate) {
		return {
			transclude: 'element',
			priority: 600,
			terminal: true,
			restrict: 'A',
			$$tlb: true,
			link: function ($scope, $element, $attr, ctrl, $transclude) {
				var removeWatch = $scope.$watch($attr.amyUntil, function amyOnceWatchAction(value) {
					if (!toBoolean(value)) {
						removeWatch();
						$transclude($scope.$new(), function (clone) {
							clone[clone.length++] = document.createComment(' end amyUntil: ' + $attr.amyUntil + ' ');
							$animate.enter(clone, $element.parent(), $element);
						});
					}
				});
			}
		};
	}]);



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
