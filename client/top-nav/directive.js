'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module', 'css!top-nav/style'], function (app) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	app.directive('amyTopNav', ['ResourceService', function (ResourceService) {
		return {
			restrict   : 'E',
			replace    : true,
			templateUrl: 'top-nav/view.html',
			scope: false,
			controller: function ($scope) {

				//////////////////// Search ////////////////////////////////////////////////////////////////////////////

				$scope.getSearchResults = function getSearchResults($viewValue) {
					return ResourceService.search($viewValue);
				};

				var entitiesUnderAttention = [];

				function clearAttention() {
					_(entitiesUnderAttention).forEach(function (entity) {
						entity._searchResult = false;
					});
					entitiesUnderAttention = [];
				}

				$scope.$watch('entitySearch', function (entity) {
					clearAttention();
					if (entity && entity._id) {
						ResourceService.ancestors(entity._id).then(function (ancestors) {
							ancestors.push(entity._id);
							entitiesUnderAttention = ResourceService.entities(ancestors);
							_(entitiesUnderAttention).forEach(function (e) {
								e._searchResult = true;

								// FIXME: debug output requested by Bernard to find the right paths
								e._promise.then(function (ent) {
									console.log(ent.name + ' (' + ent._id + ')');
								});
							});
						}).catch(function (err) {
							console.error(err);
						});
					}
				});


			}
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
