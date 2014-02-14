'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module', 'chroma', 'utility/newFromPrototype', 'resource/service', 'focus/service', 'partial/tile/layout/service'], function (ApiNATOMY, color, newFromPrototype) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	console.log("Loading 'partial/tile/directive'");


	var tile = ApiNATOMY.directive('tile', function () {
		return {
			restrict   : 'E',
			replace    : true,
			transclude : true,
			templateUrl: 'partial/tile/view.html',

			scope: {
				eid    : '@',
				layout : '@',
				spacing: '@',
				open   : '@'
			},

			controller: ['$scope', 'FocusService', 'TileLayoutService', 'ResourceService', '$timeout', function ($scope, FocusService, TileLayoutService, qResources, $timeout) {
				var qController = qResources.then(function (resources) {

					// interface for inter-tile communication

					var qChildControllers = [];
					var importance = 1;

					var controller = {
						registerChild: function (qChildController) {
							qChildControllers.push(qChildController);
							$scope.hasChildren = true;
						},

						registerParent: function (newQParentController) {
							newQParentController.then(function (parentController) {
								expandControllerInterface(parentController);
								parentController.registerChild(qController);
								$scope.$emit('tile-size-changed', qController);
							});
						}
					};

					// to expand the controller interface once the parent controller is resolved:

					function expandControllerInterface(parentController) {
						// expand the controller interface once we have the parent controller

						controller.eid = function () {
							return $scope.eid;
						};

						controller.importance = function () {
							return importance;
						};

						controller.reposition = function (top, left, height, width) {
							$scope.style['normal'].top = top + 'px';
							$scope.style['normal'].left = left + 'px';
							$scope.style['normal'].height = height + 'px';
							$scope.style['normal'].lineHeight = height + 'px';
							$scope.style['normal'].width = width + 'px';

							if ($scope.open) {
								$scope.hidden = false;

								$scope.style['normal'].fontSize = 'auto';
							} else {
								$timeout(function () {
									$scope.hidden = true;
								}, 600);

								// scale the font and padding proportionately with the tile-size
								$scope.style['normal'].fontSize = Math.min(.3 * height, .13 * width) + 'px';
								$scope.style['normal'].paddingLeft = (.05 * width) + 'px';
								$scope.style['normal'].paddingRight = (.05 * width) + 'px';
							}

							TileLayoutService[$scope.tileLayout](
									qChildControllers,
									height - 26,
									width,
									$scope.tileSpacing
							);
						};

						controller.registerMouseEnter = function () {
							if (!$scope.focus) {
								parentController.registerMouseEnter();
								$scope.focus = true;
								FocusService.pushEid($scope.eid);
							}
						};

						controller.registerMouseLeave = function () {
							if ($scope.focus) {
								FocusService.popEid($scope.eid);
								parentController.registerMouseEnter();
								$scope.focus = false;
							}
						};


						// sending entity focus events on mouse-enter

						$scope.onMouseEnter = function () {
							controller.registerMouseEnter();
						};

						$scope.onMouseLeave = function () {
							controller.registerMouseLeave();
						};
					}


					// fetching attributes

					$scope.eid = $scope.eid || 'NoEidSpecified';
					$scope.tileLayout = $scope.layout || 'slice';
					$scope.tileSpacing = parseInt($scope.spacing || '5px');
					$scope.open = !!$scope.open;
					$scope.focus = false;
					$scope.hidden = true;
					$scope.hasChildren = false;


					// initializing other scope fields

					$scope.title = resources[$scope.eid].title;
					$scope.state = 'normal';
					$scope.style = {};


					// sending entity focus events on mouse-enter

					$scope.onMouseEnter = function () {};
					$scope.onMouseLeave = function () {};


					// styling for the normal state

					$scope.style['normal'] = newFromPrototype(resources[$scope.eid].style);
					$scope.style['normal'].top = '0px';
					$scope.style['normal'].left = '0px';
					$scope.style['normal'].height = '0px';
					$scope.style['normal'].width = '0px';
					$scope.style['normal'].fontSize = $scope.style['normal'].lineHeight = '0px';
					$scope.style['normal'].borderColor = $scope.style['normal'].backgroundColor;
					$scope.style['normal'].color = color($scope.style['normal'].backgroundColor).luminance() > 0.5 ? 'black' : 'white';


					// styling for the highlighted state

					$scope.style['focus'] = newFromPrototype($scope.style['normal']);
					$scope.style['focus'].backgroundColor = color($scope.style['normal'].backgroundColor).brighten(40);
					$scope.style['focus'].borderColor = color($scope.style['normal'].borderColor).darken(40);
					$scope.style['focus'].color = color($scope.style['focus'].backgroundColor).luminance() > 0.5 ? 'black' : 'white';


					// receiving entity focus events

					$scope.$on('entity-focus', function (event, eid) {
						if (eid === $scope.eid) {
							$scope.state = 'focus';
						} else {
							$scope.state = 'normal';
						}
					});


					// when clicking the tile, open or close it

					$scope.onClick = function ($event) {
						// prevent the parent from being 'clicked' as well
						$event.stopPropagation();

						// open or close it
						$scope.open = !$scope.open;

						// toggle its importance (so it is drawn larger)
						importance = ($scope.open ? 3 : 1);

						// signal the size-change
						$scope.$emit('tile-size-changed', qController);
					};


					return controller;

				});

				return qController;
			}],

			link: function ($scope, iElement, iAttrs, qController) {

				// link to parent controller

				qController.then(function (controller) {
					controller.registerParent(iElement.parent().controller('tile') ||
					                          iElement.parent().controller('apinatomyTreemap'));
				});

				// hack to make 'overflow: hidden' with 'line-height = height' work

				if (!iElement.parent().data('nbsp-hack')) {
					iElement.parent().data('nbsp-hack', true);
					iElement.parent().append('<span style="font-size: 0;">&nbsp;</span>');
				}

			}
		};
	});


	return tile;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
