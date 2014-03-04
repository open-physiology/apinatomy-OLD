'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['angular',
        'app/module',
        'chroma',
        'lodash',
        'partial/treemap/layout/manager',
        'resource/service',
        'focus/service',
        '$bind/service',
        'partial/icon-btn/directive'], function
		(ng, ApiNATOMY, color, _, Layout) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	// TODO: separate from uri and resources; these directives will be for general-purpose treemaps
	// TODO  and specific apinatomy treemap/tile directives will connect them to the fma model


	var DEFAULT_TILE_SPACING = '5px';
	var DEFAULT_LAYOUT = 'rowsOfTiles';
	var DEFAULT_BORDER_WIDTH = '1px';
	var TILE_HEADER_HEIGHT = '26px';


	ApiNATOMY.directive('amyTile', ['$timeout', '$q', 'ResourceService', 'FocusService', '$bind', function
			($timeout, $q, qResources, FocusService, $bind) {
		return {

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			restrict:    'E',
			replace:     false,
			transclude:  true,
			templateUrl: 'partial/treemap/tile/view.html',
			scope:       {
				uri:             '@',
				attrLayout:      '@layout',
				attrTileSpacing: '@tileSpacing',
				attrBorderWidth: '@borderWidth',
				open:            '=',
				depth:           '@'
				//,
//				attrTitle:       '@',
//				attrCSS:         '='
			},

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			controller: ['$scope', function ($scope) {

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
							FocusService.pushUri($scope.uri);
						}
					},

					registerMouseLeave: function () {
						if (mouseHovering) {
							_(children).each(function (child) {
								child.registerMouseLeave();
							});
							mouseHovering = false;
							FocusService.popUri($scope.uri);
						}
					},

					requestRedraw: function () {
						parent.requestRedraw();
					},

					reposition: function (pos) {

						//// update position

						if (!_.approx(pos.top, $scope.sizing.top) || !_.approx(pos.left, $scope.sizing.left)) {
							_($scope.sizing).assign({
								top:  pos.top,
								left: pos.left
							});
						}

						//// update size

						if (!_.approx(pos.height, $scope.sizing.height) || !_.approx(pos.width, $scope.sizing.width)) {
							_($scope.sizing).assign({
								height: pos.height,
								width:  pos.width,
								lineHeight: pos.height + 'px'
							});

							//// scale the font and padding appropriately

							_($scope.sizing).assign(
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

			}],

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			compile: function () {
				return {

					pre: function preLink($scope, iElement, iAttrs, controller) {

						//// initializing scope

						_($scope).assign({
							layout:        _($scope.attrLayout).or(DEFAULT_LAYOUT),
							tileSpacing:   _.parseInt(_($scope.attrTileSpacing).or(DEFAULT_TILE_SPACING)),
							borderWidth:   _.parseInt(_($scope.attrBorderWidth).or(DEFAULT_BORDER_WIDTH)),
							open:          false,
							fullSize:      false,
							contentHidden: true,
							inFocus:       false,
							hasChildren:   false,
							normalCSS:     {},
							focusCSS:      {},
							sizing:        {
								top:    0,
								left:   0,
								width:  0,
								height: 0
							}
						});
						$scope.css = {};


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

						function setStyle() {
							$scope.css = ($scope.inFocus && !($scope.open && $scope.hasChildren)) ?
							             $scope.focusCSS :
							             $scope.normalCSS;
						}

						function applyStyle() {
							iElement.css($scope.css);
						}

						function applySize() {
							iElement.css($scope.sizing);
							iElement.find('> .full-header').css({
								'max-height': $scope.sizing.height - 2 * $scope.borderWidth
							});
						}

						$scope.$watchCollection('normalCSS', applyStyle);
						$scope.$watchCollection('focusCSS', applyStyle);
						$scope.$watch('css', applyStyle);
						$scope.$watch('inFocus', setStyle);

						$scope.$watchCollection('sizing', applySize);
						$scope.$watch('layout', controller.requestRedraw);
						$scope.$watch('tileSpacing', controller.requestRedraw);
						$scope.$watch('fullSize', controller.requestRedraw);


						//// when a tile is closed, make sure it is not full-sized when opened again

						$scope.$watch('open', function (newOpen) {
							iElement.toggleClass('open', newOpen);
							if (!newOpen) { $scope.fullSize = false; }
						});


						//// when the resources are available, populate and style the tile

						qResources.structures([$scope.uri]).then(function (structure) {

							var bgColor;

							// The database currently has dangling references, which require conditional code;
							// TODO: The database should not allow dangling references; fix this fundamentally
							if (structure.length === 0) {

								$scope.title = '(' + $scope.uri + ')';

								//// no style available; TODO: program a nicer defaulting mechanism
								if ($scope.depth % 2 === 0) {
									bgColor = color('#ffaaaa');
								} else {
									bgColor = color('#ffffff');
								}
								$scope.normalCSS = {
									backgroundColor: bgColor,
									borderColor:     bgColor.brighten(20),
									color: bgColor.luminance() > 0.5 ? 'black' : 'white'
								};
								$scope.focusCSS = _.create($scope.normalCSS, {
									backgroundColor: bgColor.brighten(40),
									borderColor:     bgColor.darken(40),
									color: bgColor.brighten(40).luminance() > 0.5 ? 'black' : 'white'
								});

							} else {

								$scope.title = structure[0].name;

								if (!_(structure[0].tile).isUndefined()) {

									$scope.layout = _(structure[0].tile.layout).or($scope.layout);

									bgColor = color(structure[0].tile.css['&'].backgroundColor);
									$scope.normalCSS = _.create(structure[0].tile.css['&'], {
										borderColor: bgColor,
										color: bgColor.luminance() > 0.5 ? 'black' : 'white'
									});
									$scope.focusCSS = _.create($scope.normalCSS, {
										backgroundColor: bgColor.brighten(40),
										borderColor:     bgColor.darken(40),
										color: bgColor.brighten(40).luminance() > 0.5 ? 'black' : 'white'
									});

								} else {
									//// no style available; TODO: program a nicer defaulting mechanism
									if ($scope.depth % 2 === 0) {
										bgColor = color('#999999');
									} else {
										bgColor = color('#ffffff');
									}
									$scope.normalCSS = {
										backgroundColor: bgColor,
										borderColor:     bgColor.brighten(20),
										color: bgColor.luminance() > 0.5 ? 'black' : 'white'
									};
									$scope.focusCSS = _.create($scope.normalCSS, {
										backgroundColor: bgColor.brighten(40),
										borderColor:     bgColor.darken(40),
										color: bgColor.brighten(40).luminance() > 0.5 ? 'black' : 'white'
									});
								}

								$scope.css = $scope.normalCSS;

							}

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

						$scope.$on('entity-focus', function (event, uri) {
							$scope.inFocus = (uri === $scope.uri);
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

			////////////////////////////////////////////////////////////////////////////////////////////////////////////
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
