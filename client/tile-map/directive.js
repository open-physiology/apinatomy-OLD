'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module', 'lodash', 'tile-map/service'], function (app, _) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	var DEFAULT_SPACING = 0;
	var DEFAULT_LAYOUT = 'rowsOfTiles';


	app.directive('tileMap', ['TileMap', '$window', function (TileMap, $window) {
		return {
			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			restrict: 'EA',
			replace : false,
			scope   : {
				layout : '@tileLayout',
				spacing: '@tileSpacing',
				tiles  : '=?'
			},

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			controller: function () {
				return {}; // returning an empty object, to be populated in the compile phase
			},

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			compile: function () {
				return {
					pre : function preLink($scope, iElement, iAttrs, controller) {

						$scope.tiles = [];

						var spacing = parseFloat(_($scope.spacing).or(DEFAULT_SPACING));
						var layout = _($scope.layout).or(DEFAULT_LAYOUT);
						var position = {
							width : iElement.width(),
							height: iElement.height()
						};
						var positions = [];

						function positionWithSpacing(position) {
							return {
								top   : position.top + spacing,
								left  : position.left + spacing,
								height: position.height - spacing,
								width : position.width - spacing
							};
						}


						////////// Procedures //////////////////////////////////////////////////////////////////////////

						var processNewTiles = _.debounce(function processNewTiles() {
							var newTiles = iElement.children('[tile], tile').toArray();
							_($scope.tiles).remove();
							_(newTiles).forEach(function (element) {
								element = $(element);

								element.css({
									position : 'absolute',
									borderBox: 'border-box'
								});

								var tileObj = {
									weight : _.constant(parseFloat(_(element.attr('tile-weight')).or(1))),
									element: element
								};

								$scope.tiles.push(tileObj);

								element.data('tileObj', tileObj);
							});
							calculateAndApplyPositions();
						}, 100);

						var calculateAndApplyPositions = _.throttle(function calculateAndApplyPositions() {
							positions = TileMap(
									$scope.tiles, layout,
									(position.height - spacing),
									(position.width - spacing)
							);
							_(positions).forEach(function (position, index) {
								if (position.hidden) {
									// Somehow, setting 'visibility' to 'hidden' rather than
									// 'display' to 'none' gives a significant speedup
									$scope.tiles[index].element.css('visibility', 'hidden');
								} else {
									var correctedPosition = positionWithSpacing(position);
									$scope.tiles[index].position = correctedPosition;
									$scope.tiles[index].element.css('visibility', 'visible');
									$scope.tiles[index].element.css(correctedPosition);
									$scope.tiles[index].element.attr('tileHeight', correctedPosition.height);
									$scope.tiles[index].element.attr('tileWidth', correctedPosition.width);
									// TODO: does it work with Infinity?
								}
							});
							iElement.trigger('resize');
						}, 50);


						////////// Controller; the way to communicate with individual tiles ////////////////////////////

						controller.registerTile = function (tile) {
							processNewTiles();
							return {
								registerNewWeight: function (newWeight) {
									if (!_(tile.data('tileObj')).isUndefined()) {
										tile.data('tileObj').weight = _.constant(newWeight);
										calculateAndApplyPositions();
									}
								}
							};
						};


						////////// Responding to changes ///////////////////////////////////////////////////////////////

						$($window).resize(_.throttle(function onResize() {
							var newSize = {
								width : iElement.width(),
								height: iElement.height()
							};
							if (!_(position.width).approx(newSize.width) || !_(position.height).approx(newSize.height)) {
								_(position).assign(newSize);
								calculateAndApplyPositions();
							}
						}, 50));

						$scope.$watch('layout', function recalculateAndApplyPositionsForNewLayout(newLayout, oldLayout) {
							if (newLayout !== oldLayout) {
								layout = _(newLayout).or(DEFAULT_LAYOUT);
								calculateAndApplyPositions();
							}
						});

						$scope.$watch('spacing', function recalculateAndApplyPositionsForNewSpacing(newSpacing, oldSpacing) {
							if (newSpacing !== oldSpacing) {
								spacing = parseFloat(_(newSpacing).or(DEFAULT_SPACING));
								calculateAndApplyPositions();
							}
						});

					},
					post: function postLink(/*$scope, iElement, iAttrs, controller*/) {}
				};
			}

			////////////////////////////////////////////////////////////////////////////////////////////////////////////
		};
	}]);


	app.directive('tile', [function () {
		return {
			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			restrict: 'EA',
			require : '^tileMap',

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			compile: function () {
				return {
					pre : function preLink($scope, iElement, iAttrs, controller) {

						////////// Getting an interface from the controller //////////

						var iface = controller.registerTile(iElement);


						////////// Responding to change //////////

						iAttrs.$observe('tileWeight', function (newWeight) {
							iface.registerNewWeight(parseFloat(_(newWeight).or(1)));
						});

					},
					post: function postLink(/*$scope, iElement, iAttrs, controller*/) {}
				};
			}

			////////////////////////////////////////////////////////////////////////////////////////////////////////////
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
