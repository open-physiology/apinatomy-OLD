'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module', 'chroma', 'lodash', 'resource/service', 'focus/service', 'partial/treemap/layout/service', '$bind/service'], function (ApiNATOMY, color, _) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	var DEFAULT_TILE_SPACING = '5px';
	var DEFAULT_TILE_LAYOUT = 'slice';
	var DEFAULT_TILE_BORDER_WIDTH = '1px';
	var TILE_HEADER_HEIGHT = '26px';


	ApiNATOMY.directive('amyTile', ['$timeout', '$q', 'ResourceService', 'TileLayoutService', 'FocusService', '$bind', function
			($timeout, $q, qResources, TileLayoutService, FocusService, $bind) {
		return {
			restrict:    'E',
			replace:     false,
			transclude:  true,
			templateUrl: 'partial/treemap/tile/view.html',

			scope: {
				eid:             '@',
				attrLayout:      '@layout',
				attrSpacing:     '@spacing',
				attrBorderWidth: '@borderWidth'
			},

			controller: ['$scope', function ($scope) {

				//// normalizing attributes

				$scope.layout = _($scope.attrLayout).or(DEFAULT_TILE_LAYOUT);
				$scope.spacing = _.parseInt(_($scope.attrSpacing).or(DEFAULT_TILE_SPACING));
				$scope.borderWidth = _.parseInt(_($scope.attrBorderWidth).or(DEFAULT_TILE_BORDER_WIDTH));

				//// initializing scope fields

				$scope.open = false;
				$scope.contentHidden = true;
				$scope.inFocus = false;
				$scope.normalStyle = {};
				$scope.focusStyle = {};
				$scope.sizeStyle = {};

				//// tile interface for the layout engine

				var layoutInterface = {
					importance: function () {
						return $scope.open ? 3 : 1;
					}
				};

				//// controller interface for parent and child tiles

				var mouseHovering = false;
				var parent;
				var children = [];
				var controller = {

					layoutInterface: layoutInterface,

					connectWithParent: function (p) {
						parent = p;
						parent.registerChild(controller);
					},

					registerChild: function (c) {
						children.push(c);
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
					},

					reposition: function (pos) {

						_($scope.sizeStyle).assign(pos).assign({ lineHeight: pos.height + 'px' });

						//// scale the font and padding appropriately

						if ($scope.open) {
							_($scope.sizeStyle).assign({
								fontSize:     'auto',
								paddingLeft:  '8px',
								paddingRight: '8px'
							});
						} else {
							_($scope.sizeStyle).assign({
								fontSize:     Math.min(.3 * pos.height, .13 * pos.width),
								paddingLeft:  (.05 * pos.width),
								paddingRight: (.05 * pos.width)
							});
						}

						//// animation of showing and hiding tile content

						if ($scope.open) {
							$scope.contentHidden = false;
						} else if (!$scope.contentHidden) {
							$timeout(function () {
								$scope.contentHidden = true;
							}, 600);
						}

						//// lay out the child tiles

						var positions = TileLayoutService[_($scope.layout).isString() ? $scope.layout : DEFAULT_TILE_LAYOUT](
								_(children)
										.pluck('layoutInterface')
										.each(function (childIface, i) { childIface.index = i; })
										.value(),
								pos.height - $scope.spacing - 2 * $scope.borderWidth - _.parseInt(TILE_HEADER_HEIGHT),
								pos.width - $scope.spacing - 2 * $scope.borderWidth
						);

						//// adjust for tile spacing

						_(positions).each(function (pos) {
							pos.top += $scope.spacing;
							pos.left += $scope.spacing;
							pos.height -= $scope.spacing;
							pos.width -= $scope.spacing;
						});

						//// apply repositioning to the child tiles

						_(children).each(function (child, i) {
							child.reposition(positions[i]);
						});

					}

				};

				return controller;
			}],

			compile: function () {
				return {

					pre: function preLink($scope, iElement, iAttrs, controller) {

						//// set some non-changing css styling

						iElement.css('borderWidth', $scope.borderWidth);
						iElement.find('.top-header').css({
							borderWidth: $scope.borderWidth,
							lineHeight: _.parseInt(TILE_HEADER_HEIGHT) - $scope.borderWidth + 'px',
							fontSize: .8 * (_.parseInt(TILE_HEADER_HEIGHT) - $scope.borderWidth) + 'px'
						});

						//// connect with the parent tile

						controller.connectWithParent(iElement.parent().controller('amyTile') ||
						                             iElement.parent().controller('amyTreemap'));


						//// when any of those change (and this is not handled in the template)
						//// set the proper styling

						function setFocusStyle() {
							iElement.css(($scope.inFocus && !$scope.open) ?
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

							$scope.title = resources[$scope.eid].title;

							var bgColor = color(resources[$scope.eid].style.backgroundColor);
							$scope.normalStyle = _.create(resources[$scope.eid].style, {
								borderColor: bgColor,
								color: bgColor.luminance() > 0.5 ? 'black' : 'white'
							});
							$scope.focusStyle = _.create($scope.normalStyle, {
								backgroundColor: bgColor.brighten(40),
								borderColor:     bgColor.darken(40),
								color: bgColor.brighten(40).luminance() > 0.5 ? 'black' : 'white'
							});

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
							iElement.off('click', enabledOnClick);
						});
						$scope.$on('3d-manipulation-disabled', function () {
							iElement.on('click', enabledOnClick);
						});
					}

				}
			}
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
