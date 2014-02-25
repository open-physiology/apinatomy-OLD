'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module', 'chroma', 'utility/newFromPrototype', 'lodash', 'resource/service', 'focus/service', 'partial/treemap/layout/service'], function
		(ApiNATOMY, color, newFromPrototype, _, ResourceServiceName, FocusServiceName, TileLayoutServiceName) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	console.log("Loading 'partial/treemap/tile/directive'");


	var DEFAULT_TILE_SPACING = '5px';
	var DEFAULT_TILE_LAYOUT = 'slice';


	ApiNATOMY.directive('amyTile', ['$timeout', '$q', ResourceServiceName, TileLayoutServiceName, FocusServiceName, function ($timeout, $q, qResources, TileLayoutService, FocusService) {
		return {
			restrict:    'E',
			replace:     true,
			transclude:  true,
			templateUrl: 'partial/treemap/tile/view.html',

			scope: {
				eid:     '@',
				layout:  '@',
				spacing: '@',
				open:    '@'
			},

			controller: ['$scope', function ($scope) {

				//// setting default attributes

				$scope.tileLayout = $scope.layout || DEFAULT_TILE_LAYOUT;
				$scope.tileSpacing = parseInt($scope.spacing || DEFAULT_TILE_SPACING);
				$scope.open = !!$scope.open;


				//// initializing scope fields

				$scope.focus = false;
				$scope.hidden = true;
				$scope.hasChildren = false;
				$scope.interactionEnabled = true;
				$scope.style = {};
				$scope.style['normal'] = {};
				$scope.style['focus'] = {};
				$scope.state = 'normal';


				//// receiving entity focus events, to share focus
				//// across different tiles with the same eid

				$scope.$on('entity-focus', function (event, eid) {
					if (eid === $scope.eid) {
						$scope.state = 'focus';
					} else {
						$scope.state = 'normal';
					}
				});


				//// when clicking the tile, open or close it

				$scope.onClick = function ($event) {
					//// prevent the parent from being 'clicked' too
					$event.stopPropagation();

					//// open or close this tile
					$scope.open = !$scope.open;

					//// signal the size-change
					controller.requestRedraw();
				};


				//// pause interaction during 3d manipulation

				$scope.$on('3d-manipulation-start', function () { $scope.interactionEnabled = false; });
				$scope.$on('3d-manipulation-end', function () { $scope.interactionEnabled = true; });


				//// when the resources are available, populate and style the tile

				qResources.then(function (resources) {
					//// title
					$scope.title = resources[$scope.eid].title;

					//// styling for the normal state
					$scope.style['normal'] = newFromPrototype(resources[$scope.eid].style);
					$scope.style['normal'].top = '0px';
					$scope.style['normal'].left = '0px';
					$scope.style['normal'].height = '0px';
					$scope.style['normal'].width = '0px';
					$scope.style['normal'].fontSize = '0px';
					$scope.style['normal'].lineHeight = '0px';
					$scope.style['normal'].borderColor = $scope.style['normal'].backgroundColor;
					$scope.style['normal'].color = color($scope.style['normal'].backgroundColor).luminance() > 0.5 ? 'black' : 'white';

					//// styling for the highlighted state
					$scope.style['focus'] = newFromPrototype($scope.style['normal']);
					$scope.style['focus'].backgroundColor = color($scope.style['normal'].backgroundColor).brighten(40);
					$scope.style['focus'].borderColor = color($scope.style['normal'].borderColor).darken(40);
					$scope.style['focus'].color = color($scope.style['focus'].backgroundColor).luminance() > 0.5 ? 'black' : 'white';
				});


				//// the controller interface for this tile

				var children = [];
				var dParent = $q.defer();

				var controller = {

					registerElement: function (newElement) {
						var parent = newElement.parent().controller('amyTile') ||
						             newElement.parent().controller('amyTreemap');
						dParent.resolve(parent);
						parent.registerChild(controller);
					},

					registerChild: function (child) {
						children.push(child);
						$scope.hasChildren = true;
					},

					qParent: function () { return dParent.promise; },

					children: function () { return children; },

					eid: function () { return $scope.eid; },

					importance: function () { return ($scope.open ? 3 : 1); },

					reposition:         function (top, left, height, width) {
						$scope.style['normal'].top = top + 'px';
						$scope.style['normal'].left = left + 'px';
						$scope.style['normal'].height = height + 'px';
						$scope.style['normal'].lineHeight = height + 'px';
						$scope.style['normal'].width = width + 'px';

						if ($scope.open) {
							//// reveal the content

							$scope.hidden = false;


							//// set the font size to 'normal'

							$scope.style['normal'].fontSize = 'auto';
						} else {
							//// hide the content after 600ms to achieve a nice animation

							$timeout(function () { $scope.hidden = true; }, 600);


							//// scale the font and padding proportionately with the tile-size

							$scope.style['normal'].fontSize = Math.min(.3 * height, .13 * width) + 'px';
							$scope.style['normal'].paddingLeft = (.05 * width) + 'px';
							$scope.style['normal'].paddingRight = (.05 * width) + 'px';
						}

						TileLayoutService[$scope.tileLayout](children, height - 26, width, $scope.tileSpacing);
					},

					registerMouseEnter: function () {},

					registerMouseLeave: function () {},

					requestRedraw: function () {
						controller.qParent().then(function (parent) {
							parent.requestRedraw();
						});
					}

				};

				return controller;
			}],

			link: function ($scope, iElement, iAttrs, controller) {
				//// register the DOM element of this tile with the controller

				controller.registerElement(iElement);


				//// when the parent is known, allow mouse-enter/leave events

				controller.qParent().then(function (parent) {

					controller.registerMouseEnter = function () {
						if (!$scope.focus) {
							parent.registerMouseEnter();
							$scope.focus = true;
							FocusService.pushEid($scope.eid);
						}
					};

					controller.registerMouseLeave = function () {
						if ($scope.focus) {
							_.each(controller.children(), function (child) {
								child.registerMouseLeave();
							});
							$scope.focus = false;
							FocusService.popEid($scope.eid);
						}
					};
				});


				//// sending entity focus events on mouse-enter/leave

				$scope.onMouseEnter = function () { controller.registerMouseEnter(); };
				$scope.onMouseLeave = function () { controller.registerMouseLeave(); };


				//// hack to make 'overflow: hidden' with 'line-height = height' work

				if (!iElement.parent().data('nbsp-hack')) {
					iElement.parent().data('nbsp-hack', true);
					iElement.parent().append('<span style="font-size: 0;">&nbsp;</span>');
				}

			}
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
