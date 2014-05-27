'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module', 'chroma', 'lodash', 'resource/service'], function (app, color, _) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	app.directive('amyVascularDetails', ['ResourceService', function (ResourceService) {
		return {
			restrict   : 'E',
			replace    : true,
			transclude : true,
			templateUrl: 'partial/side-nav/vascularDetails/view.html',
			scope      : {
				segment: '=amySegment',
				fixed  : '=amyFixed'
			},

			controller: function ($scope) {

				$scope.$watch('segment', function (segment) {

					$scope.subSegments = [];

					var allJunctions = _(segment.hiddenJunctions).clone();
					allJunctions.push(segment.source.id);
					allJunctions.push(segment.target.id);

					ResourceService.connections(allJunctions).then(function (data) {
						var subSegmentsDone = {};

						function addSegment(from, to) {
							console.log(from + ' - ' + to);

							_(data).forEach(function (segmentData) {

								if (segmentData.from === from && segmentData.to === to || segmentData.from === to && segmentData.to === from) {

									if (!subSegmentsDone[segmentData.from + '-' + segmentData.to]) {
										subSegmentsDone[segmentData.from + '-' + segmentData.to] = true;
										$scope.subSegments.push(segmentData);
									}

								}

							});
						}

						console.log('----------', segment);

						var lastJunction = segment.source.id;
						_(segment.hiddenJunctions).forEach(function (hiddenJunction) {
							addSegment(lastJunction, hiddenJunction);
							lastJunction = hiddenJunction;
						});
						addSegment(lastJunction, segment.target.id);

						console.log('----------');

					}, function (err) {
						console.error(err);
					});

				});


			},

			compile: function () {
				return {

					pre: function preLink($scope, iElement/*, iAttrs, controller*/) {},

					post: function postLink(/*$scope, iElement, iAttrs, controller*/) {}

				};
			}
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
