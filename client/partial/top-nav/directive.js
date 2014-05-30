'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module'], function (app) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	app.directive('amyTopNav', ['ResourceService', function (ResourceService) {
		return {
			restrict   : 'E',
			replace    : true,
			templateUrl: 'partial/top-nav/view.html',
			scope: false,
			controller: function ($scope) {

				//////////////////// Search ////////////////////////////////////////////////////////////////////////////

//				$scope.getSearchResults = ResourceService.getSearchResults;


				var entitiesUnderAttention = [];

				function clearAttention() {
					_(entitiesUnderAttention).forEach(function (entity) {
						entity._searchResult = false;
					});
					entitiesUnderAttention = [];
				}

				$scope.$root.$watch('searchID', function (id) {
					clearAttention();
					if (!_(id).isEmpty()) {
						ResourceService.ancestors(id).then(function (ancestors) {
							var entities = ancestors;
							entities.push(id);
							entitiesUnderAttention = ResourceService.entities(entities);
							_(entitiesUnderAttention).forEach(function (entity) {
								entity._searchResult = true;
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
