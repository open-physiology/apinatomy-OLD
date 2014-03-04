'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module', 'chroma', 'lodash', 'resource/service'], function
		(ApiNATOMY, color, _) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	ApiNATOMY.directive('amyEntityDetails', ['ResourceService', function (qResources) {
		return {
			restrict:    'E',
			replace:     true,
			transclude:  true,
			templateUrl: 'partial/side-nav/details/view.html',
			scope:       {
				uriFn: '&uri'
			},

			controller: function ($scope) {
				$scope.$watch('uriFn()', function (newUri) {
					if (newUri !== null) {
						qResources.structures([newUri]).then(function (structure) {
							// The database currently has dangling references, which require conditional code;
							// TODO: The database should not allow dangling references; fix this fundamentally
							if (structure.length === 0) {
								_($scope).assign({
									uri:  newUri,
									name: '(' + newUri + ')',
									css: {}
								});
							} else {
								_($scope).assign({
									uri:  newUri,
									name: structure[0].name,
									css: _(structure[0].tile).isUndefined() ? {} : _(structure[0].tile.css['&']).create({
										backgroundColor: color(structure[0].tile.css['&'].backgroundColor).brighten(40)
									}).value()
								});
							}
						});
					}
				});
			}
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
