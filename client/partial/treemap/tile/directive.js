'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module', 'chroma', 'utility/newFromPrototype', 'lodash', 'resource/service', 'focus/service', 'partial/treemap/layout/service', '$bind/service'], function
		(ApiNATOMY, color, newFromPrototype, _, ResourceServiceName, FocusServiceName, TileLayoutServiceName, BindServiceName) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	console.log("Loading 'partial/treemap/tile/directive'");


	var DEFAULT_TILE_SPACING = '5px';
	var DEFAULT_TILE_LAYOUT = 'slice';


	ApiNATOMY.directive('amyTile', ['$timeout', '$q', ResourceServiceName, TileLayoutServiceName, FocusServiceName, BindServiceName, function ($timeout, $q, qResources, TileLayoutService, FocusService, $bind) {
		return {
			restrict:    'E',
			replace:     false,
			transclude:  true,
			templateUrl: 'partial/treemap/tile/view.html',

			scope: {
				eid:     '@',
				layout:  '@',
				spacing: '@',
				open:    '@'
			},

			controller: ['$scope', function ($scope) {
				var mouseHovering = false;
				var parent;
				var children = [];
				var controller = {

					connectWithParent: function (p) {
						parent = p;
						parent.registerChild(controller);
					},

					registerChild: function (c) {
						children.push(c); // TODO: inline; no wrapper function needed (but test first)
					},

					eid: function () {
						return $scope.eid;
					},

					importance: function () {
						return ($scope.open ? 3 : 1); // TODO: This '3 times larger' thing should be more flexible
					},

					reposition: function (top, left, height, width) {

						//// set the size of this tile

						_($scope.sizeStyle).assign({
							top: top + 'px',
							left: left + 'px',
							height: height + 'px',
							width: width + 'px',
							lineHeight: height + 'px'
						});

						//// scale the font and padding appropriately

						if ($scope.open) {
							_($scope.sizeStyle).assign({
								fontSize: 'auto',
								paddingLeft: '8px',
								paddingRight: '8px'
							});
						} else {
							_($scope.sizeStyle).assign({
								fontSize: Math.min(.3 * height, .13 * width) + 'px',
								paddingLeft: (.05 * width) + 'px',
								paddingRight: (.05 * width) + 'px'
							});
						}

						//// animation of showing and hiding tile content

						if ($scope.open) {
							$scope.contentHidden = false;
						} else {
							$timeout(function () {
								$scope.contentHidden = true;
							}, 600);
						}

						//// lay out the child tiles

						TileLayoutService[_($scope.layout).isString() ? $scope.layout : DEFAULT_TILE_LAYOUT](
								children, // TODO: pass specific layout-only interface instead
								height - 26, width, // TODO: remove magic number (height of the tile header)
								parseInt(_($scope.spacing).isUndefined() ? DEFAULT_TILE_SPACING : $scope.spacing)
						);

					},

					registerMouseEnter: function () {
						if (!mouseHovering) {
							parent.registerMouseEnter();
							mouseHovering = true;
							FocusService.pushEid($scope.eid);
						}
					},

					registerMouseLeave: function () {
						if (mouseHovering) {
							_(children).each(function (child) {
								child.registerMouseLeave();
							});
							mouseHovering = false;
							FocusService.popEid($scope.eid);
						}
					},

					requestRedraw: function () {
						parent.requestRedraw();
					}

				};

				return controller;
			}],

			compile: function () {
				return {

					pre: function preLink($scope, iElement, iAttrs, controller) {

						//// initializing scope fields

						$scope.contentHidden = true;
						$scope.inFocus = false;
						$scope.normalStyle = {};
						$scope.focusStyle = {};
						$scope.sizeStyle = {};


						//// connect with the parent tile

						controller.connectWithParent(iElement.parent().controller('amyTile') ||
						                             iElement.parent().controller('amyTreemap'));


						//// when any of those change (and this is not handled in the template)
						//// set the proper styling

						function setFocusStyle() {
							iElement.css($scope.inFocus && !$scope.open ?
							             $scope.focusStyle :
							             $scope.normalStyle);
						}

						function setSizeStyle() {
							iElement.css($scope.sizeStyle);
						}

						$scope.$watch('inFocus', setFocusStyle);
						$scope.$watchCollection('normalStyle', setFocusStyle);
						$scope.$watchCollection('focusStyle', setFocusStyle);
						$scope.$watchCollection('sizeStyle', setSizeStyle);


						//// when the resources are available, populate and style the tile

						qResources.then(function (resources) {

							//// title

							$scope.title = resources[$scope.eid].title;

							//// styling for the normal state

							$scope.normalStyle = newFromPrototype(resources[$scope.eid].style);
							$scope.normalStyle.borderColor = $scope.normalStyle.backgroundColor;
							$scope.normalStyle.color = color($scope.normalStyle.backgroundColor).luminance() > 0.5 ? 'black' : 'white';

							//// styling for the highlighted state

							$scope.focusStyle = newFromPrototype($scope.normalStyle);
							$scope.focusStyle.backgroundColor = color($scope.normalStyle.backgroundColor).brighten(40);
							$scope.focusStyle.borderColor = color($scope.normalStyle.borderColor).darken(40);
							$scope.focusStyle.color = color($scope.focusStyle.backgroundColor).luminance() > 0.5 ? 'black' : 'white';

						});

					},

					post: function postLink($scope, iElement, iAttrs, controller) {

						// In the postLink function, it is guaranteed that all children
						// of this tile have been processed, at least, with preLink. So
						// here, we do all the stuff for which the presence of all child-
						// tiles is required.

						//// sending entity focus events on mouse-enter/leave

						iElement.on('mouseenter', $bind(controller.registerMouseEnter));
						iElement.on('mouseleave', $bind(controller.registerMouseLeave));


						//// receiving entity focus events

						$scope.$on('entity-focus', function (event, eid) {
							$scope.inFocus = (eid === $scope.eid);
						});


						//// open up a tile on mouse-click

						var enabledOnClick = $bind(function enabledOnClick(event) {
							event.stopPropagation();
							$scope.open = !$scope.open;
							controller.requestRedraw();
						});
						iElement.on('click', enabledOnClick);


						//// disable tile-clicks during 3d manipulation

						$scope.$on('3d-manipulation-enabled', function () {
							iElement.on('click', enabledOnClick);
						});
						$scope.$on('3d-manipulation-disabled', function () {
							iElement.off('click', enabledOnClick);
						});

					}

				}
			}
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
