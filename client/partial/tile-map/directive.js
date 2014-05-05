'use strict';

// 'css!partial/tile-map/temp',

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module', 'lodash', 'partial/tile-map/service'], function (app, _) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	var DEFAULT_SPACING = 0;
	var DEFAULT_LAYOUT = 'rowsOfTiles';


	app.directive('tileMap', ['TileMap', function (TileMap) {
		return {
			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			restrict: 'EA',
			replace:  false,
			scope:    {
				layout:  '@tileLayout',
				spacing: '@tileSpacing',
				tiles:   '=?tiles'
			},

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			controller: function () {
				return {}; // returning an empty object, to be populated in the compile phase
			},

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			compile: function () {
				return {
					pre:  function preLink($scope, iElement, iAttrs, controller) {

						$scope.tiles = [];

						var spacing = parseFloat(_($scope.spacing).or(DEFAULT_SPACING));
						var layout = _($scope.layout).or(DEFAULT_LAYOUT);
						var position = {
							width:  iElement.width(),
							height: iElement.height()
						};


						////////// Procedures //////////

						function positionWithSpacing(position) {
							return {
								top: position.top + spacing,
								left: position.left + spacing,
								height: position.height - spacing,
								width: position.width - spacing
							};
						}

						var processNewTiles = function processNewTiles() {

							var newTiles = iElement.children('[tile]').toArray();

							_($scope.tiles).remove();

							_(newTiles).forEach(function (element) {
								element = $(element);

								element.css({
									position:  'absolute',
									borderBox: 'border-box'
								});

								var tileObj = {
									weight:  _.constant(parseFloat(_(element.attr('tile-weight')).or(1))),
									element: element
								};

								$scope.tiles.push(tileObj);

								element.data('tileObj', tileObj);
							});

							calculateAndApplyPositions();

						};

						function calculateAndApplyPositions() {
							var positions = TileMap(
									$scope.tiles, layout,
									(position.height - spacing),
									(position.width - spacing)
							);

							_(positions).forEach(function (position, index) {
								if (position.hidden) {
									$scope.tiles[index].element.hide();
								} else {
									var correctedPosition = positionWithSpacing(position);
									$scope.tiles[index].position = correctedPosition;
									$scope.tiles[index].element.show();
									$scope.tiles[index].element.css(correctedPosition);
									$scope.tiles[index].element.attr('tileHeight', correctedPosition.height);
									$scope.tiles[index].element.attr('tileWidth', correctedPosition.width);
									// TODO: does it work with Infinity?
								}
							});
						}


						////////// Controller; the way to communicate with individual tiles //////////

						controller.registerTile = function (tile) {

							processNewTiles();

							return {
								registerNewWeight: function (newWeight) {
									tile.data('tileObj').weight = _.constant(newWeight);
									calculateAndApplyPositions();
								}
							};

						};


						////////// Responding to changes //////////

//						$scope.$watch('position', function recalculateAndApplyPositionsForNewSize(newPosition) {
//
//
//							if (_(newPosition).isUndefined()) {
//								position = {
//									width:  iElement.width(),
//									height: iElement.height()
//								};
//							} else {
//								position = newPosition;
//								position.width -= (parseFloat(iElement.css('borderLeftWidth')) +
//								                   parseFloat(iElement.css('borderRightWidth')));
//								position.height -= (parseFloat(iElement.css('borderTopWidth')) +
//								                    parseFloat(iElement.css('borderBottomWidth')));
//							}
//							calculateAndApplyPositions();
//						});

						iAttrs.$observe('tileMapHeight', function (newHeight) {
							position.height = (_(newHeight).isUndefined())
									? iElement.height()
									: newHeight - parseFloat(iElement.css('borderTopWidth')) - parseFloat(iElement.css('borderBottomWidth'));
							calculateAndApplyPositions();
						});

						iAttrs.$observe('tileMapWidth', function (newWidth) {
							position.width = (_(newWidth).isUndefined())
									? iElement.width()
									: newWidth - parseFloat(iElement.css('borderLeftWidth')) - parseFloat(iElement.css('borderRightWidth'));
							calculateAndApplyPositions();
						});

						$scope.$watch('position', function recalculateAndApplyPositionsForNewSize(newPosition) {


							if (_(newPosition).isUndefined()) {
								position = {
									width:  iElement.width(),
									height: iElement.height()
								};
							} else {
								position = newPosition;
								position.width -= (parseFloat(iElement.css('borderLeftWidth')) +
								                   parseFloat(iElement.css('borderRightWidth')));
								position.height -= (parseFloat(iElement.css('borderTopWidth')) +
								                    parseFloat(iElement.css('borderBottomWidth')));
							}
							calculateAndApplyPositions();
						});

						$scope.$watch('layout', function recalculateAndApplyPositionsForNewLayout(newLayout) {
							layout = _(newLayout).or(DEFAULT_LAYOUT);
							calculateAndApplyPositions();
						});

						$scope.$watch('spacing', function recalculateAndApplyPositionsForNewSpacing(newSpacing) {
							spacing = parseFloat(_(newSpacing).or(DEFAULT_SPACING));
							calculateAndApplyPositions();
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

			restrict: 'A',
			require:  '^tileMap',

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			compile: function () {
				return {
					pre:  function preLink($scope, iElement, iAttrs, controller) {

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
