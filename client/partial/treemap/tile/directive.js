'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['angular',
        'app/module',
        'chroma',
        'lodash',
        'partial/treemap/layout/manager',
        'resource/service',
        '$bind/service',
        'partial/icon-btn/directive',
        'utility/attrchange'], function (ng, ApiNATOMY, color, _, Layout) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	var DEFAULT_LAYOUT = 'rowsOfTiles';
	var DEFAULT_TILE_SPACING = '2px';
	var DEFAULT_BORDER_WIDTH = '1px';
	var TILE_HEADER_HEIGHT = '26px';


	ApiNATOMY.directive('amyTile', ['$timeout', function ($timeout) {
		return {

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			restrict:    'E',
			replace:     false,
			transclude:  true,
			templateUrl: 'partial/treemap/tile/view.html',
			scope:       {
				open:              '=amyOpen',
				weight:            '=amyWeight',
				title:             '=amyTitle',
				layout:            '=amyLayout',
				sizeButtonModel:   '=amySizeButtonModel',
				sizeButtonStates:  '=amySizeButtonStates',
				sizeButtonClasses: '=amySizeButtonClasses',
				onReady:           '&'
			},

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			controller: function () {
				return {}; // the controller is actually defined in the pre-link function
			},

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			compile: function () {
				return {

					pre: function preLink($scope, iElement, iAttrs, controller) {

						//// initializing scope

						_($scope).assign({
							tileSpacing:   _.parseInt(_($scope.attrTileSpacing).or(DEFAULT_TILE_SPACING)),
							borderWidth:   _.parseInt(DEFAULT_BORDER_WIDTH),
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
						var sizing = {
							top:    '50%',
							left:   '50%',
							width:  0,
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

							reposition: function (pos) {

								//// update position

								if (!_.approx(pos.top, sizing.top) || !_.approx(pos.left, sizing.left)) {
									_(sizing).assign({
										top:  pos.top,
										left: pos.left
									});
								}

								//// update size

								if (!_.approx(pos.height, sizing.height) || !_.approx(pos.width, sizing.width)) {
									_(sizing).assign({
										height: pos.height,
										width:  pos.width,
										lineHeight: pos.height + 'px'
									});

									//// scale the font and padding appropriately

									_(sizing).assign(
											$scope.open ? ({
												fontSize:     'auto',
												paddingLeft:  '8px',
												paddingRight: '8px'
											}) : ({
												fontSize:     Math.min(.3 * pos.height, .13 * pos.width),
												paddingLeft:  (.05 * pos.width),
												paddingRight: (.05 * pos.width)
											}));


									//// apply sizing

									iElement.css(sizing);
									iElement.find('> .full-header').css({
										'max-height': sizing.height - 2 * $scope.borderWidth
									});


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

								if (!_(children).isEmpty()) {
									var positions = Layout(
											_(children)
													.pluck('layoutInterface')
													.each(function (childIface, i) { childIface.index = i; })
													.value(),
											$scope.layout || DEFAULT_LAYOUT,
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

						});// controller


						//// connect with the parent tile controller

						controller.connectWithParent(iElement.parent().controller('amyTile') ||
						                             iElement.parent().controller('amyTreemap'));


						//// set some non-changing css styling for the header

						iElement.find('.top-header').css({
							lineHeight:    (_.parseInt(TILE_HEADER_HEIGHT) - 1) + 'px',
							fontSize: .8 * (_.parseInt(TILE_HEADER_HEIGHT) - 1) + 'px'
						});


						//// redraw when relevant values change

						$scope.$watch('weight', controller.requestRedraw);
						$scope.$watch('layout', controller.requestRedraw);
						$scope.$watch('tileSpacing', controller.requestRedraw);

					},

					post: function postLink($scope/*, iElement, iAttrs, controller*/) {
						$scope.onReady();
					}

				}
			}

			////////////////////////////////////////////////////////////////////////////////////////////////////////////
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
