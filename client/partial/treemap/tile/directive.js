'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['angular', 'app/module', 'chroma', 'lodash', 'partial/treemap/layout/manager', 'resource/service', 'focus/service', '$bind/service', 'partial/icon-btn/directive'], function (ng, ApiNATOMY, color, _, Layout) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	var DEFAULT_TILE_SPACING = '5px';
	var DEFAULT_TILE_LAYOUT = 'slice';
	var DEFAULT_TILE_BORDER_WIDTH = '1px';
	var TILE_HEADER_HEIGHT = '26px';


	ApiNATOMY.directive('amyTile', ['$timeout', '$q', 'ResourceService', 'FocusService', '$bind', function
			($timeout, $q, qResources, FocusService, $bind) {
		return {
			restrict:    'E',
			replace:     false,
			transclude:  true,
			templateUrl: 'partial/treemap/tile/view.html',

			scope: {
				eid:             '@',
				attrLayout:      '@layout',
				attrTileSpacing: '@tileSpacing',
				attrBorderWidth: '@borderWidth'
			},

			controller: ['$scope', function ($scope) {

				$scope.layout = _.chain($scope.attrLayout).or(DEFAULT_TILE_LAYOUT).value();
				$scope.tileSpacing = _.parseInt(_($scope.attrSpacing).or(DEFAULT_TILE_SPACING));
				$scope.borderWidth = _.parseInt(_($scope.attrBorderWidth).or(DEFAULT_TILE_BORDER_WIDTH));

				//// if the layout is a stringified array, deserialize from JSON - TODO: make nicer

				if ($scope.layout.charAt(0) === '[') {
					$scope.layout = ng.fromJson($scope.layout);
				}

				//// initializing scope fields

				$scope.open = false;
				$scope.fullSize = false;
				$scope.contentHidden = true;
				$scope.inFocus = false;
				$scope.normalStyle = {};
				$scope.focusStyle = {};
				$scope.style = $scope.normalStyle;
				$scope.sizeStyle = {};
				$scope.hasChildren = false;
				$scope.sizeStyle = {
					top:    0,
					left:   0,
					width:  0,
					height: 0
				};

				//// tile interface for the layout engine

				var layoutInterface = {
					weight: function () {
						return $scope.open ? ($scope.fullSize ? Infinity : 3) : 1;
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
						$scope.hasChildren = true;
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

						//// update position

						if (!_.approx(pos.top, $scope.sizeStyle.top) || !_.approx(pos.left, $scope.sizeStyle.left)) {
							_($scope.sizeStyle).assign({
								top:  pos.top,
								left: pos.left
							});
						}

						//// update size

						if (!_.approx(pos.height, $scope.sizeStyle.height) || !_.approx(pos.width, $scope.sizeStyle.width)) {
							_($scope.sizeStyle).assign({
								height: pos.height,
								width:  pos.width,
								lineHeight: pos.height + 'px'
							});

							//// scale the font and padding appropriately

							_($scope.sizeStyle).assign(
									$scope.open ? ({
										fontSize:     'auto',
										paddingLeft:  '8px',
										paddingRight: '8px'
									}) : ({
										fontSize:     Math.min(.3 * pos.height, .13 * pos.width),
										paddingLeft:  (.05 * pos.width),
										paddingRight: (.05 * pos.width)
									}));

							//// animation of showing and hiding tile content

							if ($scope.open) {
								$scope.contentHidden = false;
							} else if (!$scope.contentHidden) {
								$timeout(function () {
									$scope.contentHidden = true;
								}, 600);
							}

						}

						//// reposition any child tiles

						if ($scope.hasChildren) {
							var positions = Layout(
									_(children)
											.pluck('layoutInterface')
											.each(function (childIface, i) { childIface.index = i; })
											.value(),
									$scope.layout,
									pos.height - $scope.tileSpacing - 3 * $scope.borderWidth - _.parseInt(TILE_HEADER_HEIGHT),
									pos.width - $scope.tileSpacing - 2 * $scope.borderWidth
							);

							//// adjust for tile spacing

							_(positions).each(function (pos) {
								pos.top += $scope.tileSpacing;
								pos.left += $scope.tileSpacing;
								pos.height -= $scope.tileSpacing;
								pos.width -= $scope.tileSpacing;
							});

							//// apply repositioning to the child tiles

							_(children).each(function (child, i) {
								child.reposition(positions[i]);
							});
						}

					}// reposition

				};// controller

				return controller;

			}],// controller

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
							$scope.style = ($scope.inFocus && !($scope.open && $scope.hasChildren)) ?
							               $scope.focusStyle :
							               $scope.normalStyle;
						}

						function applyFocusStyle() {
							iElement.css($scope.style);
						}

						function applySizeStyle() {
							iElement.css($scope.sizeStyle);
						}

						$scope.$watch('inFocus', setFocusStyle);
						$scope.$watch('style', applyFocusStyle);
						$scope.$watchCollection('normalStyle', applyFocusStyle);
						$scope.$watchCollection('focusStyle', applyFocusStyle);
						$scope.$watchCollection('sizeStyle', applySizeStyle);
						$scope.$watch('layout', controller.requestRedraw);
						$scope.$watch('tileSpacing', controller.requestRedraw);
						$scope.$watch('fullSize', controller.requestRedraw);


						//// when the resources are available, populate and style the tile

						qResources.then(function (resources) {

							$scope.title = resources[$scope.eid].title;

							$scope.layout = _(resources[$scope.eid].tile.layout).or($scope.layout);

							var bgColor = color(resources[$scope.eid].tile.style.backgroundColor);
							$scope.normalStyle = _.create(resources[$scope.eid].tile.style, {
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
