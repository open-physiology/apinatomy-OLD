'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['angular',
	'app/module',
	'chroma',
	'lodash',
	'partial/treemap/layout/manager',
	'resource/service',
	'$bind/service',
	'partial/icon-btn/directive'], function (ng, ApiNATOMY, color, _, Layout) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	var DEFAULT_LAYOUT = 'rowsOfTiles';
	var DEFAULT_TILE_SPACING = '2px';
	var DEFAULT_BORDER_WIDTH = '1px';
	var TILE_HEADER_HEIGHT = '26px';


	ApiNATOMY.directive('amyTile', ['$timeout', function ($timeout) {
		return {

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			restrict   : 'E',
			replace    : false,
			transclude : true,
			templateUrl: 'partial/treemap/tile/view.html',
			scope      : {
				open             : '=amyOpen',
				weight           : '=amyWeight',
				title            : '=amyTitle',
				layout           : '=amyLayout',
				sizeButtonModel  : '=amySizeButtonModel',
				sizeButtonStates : '=amySizeButtonStates',
				sizeButtonClasses: '=amySizeButtonClasses',
				frontIcon        : '=amyFrontIcon',
				frontIconTitle   : '=amyFrontIconTitle',
				onReadyFn        : '&onReady',
				afterRepositionFn: '&afterReposition'
			},

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			controller: function () {
				return {}; // the controller is really defined in the pre-link function
			},

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			compile: function () {
				return {

					pre: function preLink($scope, iElement, iAttrs, controller) {

						//// initializing scope

						_($scope).assign({
							tileSpacing  : _.parseInt(_($scope.attrTileSpacing).or(DEFAULT_TILE_SPACING)),
							borderWidth  : _.parseInt(DEFAULT_BORDER_WIDTH),
							contentHidden: true
						});


						//// tile interface for the layout engine

						var layoutInterface = {
							weight: function () {
								return $scope.weight;
							}
						};


						//// defining the controller interface for parent and child tiles

						var parent;
						var children = [];
						var position = {
							top   : 0,
							left  : 0,
							width : 0,
							height: 0
						};
						_(controller).assign({

							layoutInterface: layoutInterface,

							connectWithParent: function (p) {
								parent = p;
								parent.registerChild(controller);
							},

							registerChild: function (c) {
								children.push(c);
							},

							requestRedraw: function () {
								parent.requestRedraw();
							},

							positionInTreemap: function () {
								var parentPos = parent.positionInTreemap();
								return {
									top            : parentPos.top + parentPos.childTopOffset + position.top,
									left           : parentPos.left + parentPos.childLeftOffset + position.left,
									height         : position.height,
									width          : position.width,
									childTopOffset : 2 * $scope.borderWidth + _.parseInt(TILE_HEADER_HEIGHT),
									childLeftOffset: $scope.borderWidth
								};
							},

							reposition: function (pos) {

								//// update position

								if (!_.approx(pos.top, position.top) || !_.approx(pos.left, position.left)) {
									position.top = pos.top;
									position.left = pos.left;
								}

								//// update size

								if (!_.approx(pos.height, position.height) || !_.approx(pos.width, position.width)) {

									//// set the tile

									position.height = pos.height;
									position.width = pos.width;
									position.lineHeight = pos.height + 'px';

									//// scale the font and padding appropriately

									_(position).assign(
											$scope.open ? ({
												fontSize    : 'auto',
												paddingLeft : '8px',
												paddingRight: '8px'
											}) : ({
												fontSize    : Math.min(.3 * pos.height, .13 * pos.width),
												paddingLeft : (.05 * pos.width),
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

								//// notify new position

								$scope.afterRepositionFn({ newPosition: controller.positionInTreemap() });


								//// apply position

								iElement.css(position);
								iElement.find('> .full-header').css({
									'max-height': position.height - 2 * $scope.borderWidth
								});


								//// reposition any child tiles - TODO: move to layout directive

								if (!_(children).isEmpty()) {
									var positions = Layout(
											_(children)
													.pluck('layoutInterface')
													.forEach(function (childIface, i) {
														childIface.index = i;
													}).value(),
											$scope.layout || DEFAULT_LAYOUT,
											pos.height - $scope.tileSpacing - 3 * $scope.borderWidth - _.parseInt(TILE_HEADER_HEIGHT),
											pos.width - $scope.tileSpacing - 2 * $scope.borderWidth
									);

									//// adjust for tile spacing

									_(positions).forEach(function (pos) {
										pos.top += $scope.tileSpacing;
										pos.left += $scope.tileSpacing;
										pos.height -= $scope.tileSpacing;
										pos.width -= $scope.tileSpacing;
									});

									//// apply repositioning to the child tiles

									_(children).forEach(function (child, i) {
										child.reposition(positions[i]);
									});
								}

							}// reposition

						});// controller


						//// connect with the parent tile controller

						controller.connectWithParent(iElement.parent().controller('amyTile') ||
								iElement.parent().controller('amyTreemap'));


						//// set some non-changing css styling for the header

						iElement.find('.top-header').css({
							lineHeight: (_.parseInt(TILE_HEADER_HEIGHT) - 1) + 'px',
							fontSize  : .8 * (_.parseInt(TILE_HEADER_HEIGHT) - 1) + 'px'
						});


						//// redraw when relevant values change

						$scope.$watch('weight', controller.requestRedraw);
						$scope.$watch('layout', controller.requestRedraw);
						$scope.$watch('tileSpacing', controller.requestRedraw);

					},

					post: function postLink($scope/*, iElement, iAttrs, controller*/) {
						$scope.onReadyFn();
					}

				}
			}

			////////////////////////////////////////////////////////////////////////////////////////////////////////////
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
