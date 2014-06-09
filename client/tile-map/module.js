'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['angular', 'lodash', 'jquery',
        'utility/approx', 'utility/div',
        'utility/or', 'utility/sum'], function (ng, _, $) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	var module = ng.module('tile-map', []);


//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  // Service /////////////////////////////////////////////////////////////////////////////////////////////////////////
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	// TODO: detect and forbid duplicate indices in the layout template
	function compoundLayout(tiles, layout, height, width) {

		//// dissect the 'layout' parameter

		var subLayout = _(layout).head();
		var childBlocks = _(layout).tail().value();


		//// create fake children to invoke the layout of this level

		var childBlockLayouts = _(childBlocks).map(function (childBlock, i) {
			var weight;
			if (_(childBlock).isNumber()) {
				weight = tiles[childBlock].weight;
			} else {
				weight = _.constant(_(tiles)
						.at(_(childBlock).flatten().filter(_.isNumber).unique().value())
						.pluck('weight')
						.sum(_.call));
			}
			return { weight: weight, index: i };
		}).value();
		var childBlockPositions = TileMap(childBlockLayouts, subLayout, height, width);


		//// combine the layout results for all childBlocks

		var result = new Array(tiles.length);
		_(childBlocks).each(function (childBlock, childBlockIndex) {
			if (_(childBlock).isArray()) {
				var map = [];
				var reIndexedChildBlock =
						_(childBlock).cloneDeep(function (val) {
							if (_(val).isNumber()) {
								var i = _(map).indexOf(val);
								if (i === -1) { i = map.push(val) - 1; }
								return i;
							} else { return undefined; }
						});
				var resultFromChildBlock =
						TileMap(
								_(tiles).at(map).map(function (tile, i) {
									return _(tile).assign({ index: i }).value();
								}).value(),
								reIndexedChildBlock,
								childBlockPositions[childBlockIndex].height,
								childBlockPositions[childBlockIndex].width,
								childBlockPositions[childBlockIndex].top,
								childBlockPositions[childBlockIndex].left
						);
				_(map).each(function (resultIndex, subResultIndex) {
					result[resultIndex] = resultFromChildBlock[subResultIndex];
				});
			} else {
				result[tiles[childBlock].index] = childBlockPositions[childBlockIndex];
			}
		});

		return result;
	}

	var registeredLayouts = {};

	function TileMap(tiles, layout, height, width, top, left) {
		top = _(top).or(0);
		left = _(left).or(0);

		var result;

		if (_(layout).isArray(layout)) {
			result = compoundLayout(tiles, layout, height, width);
		} else if (_(registeredLayouts).has(layout)) {
			result = registeredLayouts[layout](tiles, height, width);
		} else {
			throw new ReferenceError("No layout called '" + layout + "' is registered.");
		}

		return _(result).map(function (pos) {
			return _(pos).assign({
				top: pos.top + top,
				left: pos.left + left,
				hidden: (!pos.height || !pos.width || _(pos.height).approx(0) || _(pos.width).approx(0))
			}).value();
		}).value();
	}

	TileMap.register = function register() {
		if (_(arguments[0]).isString() && _(arguments[1]).isFunction()) {
			registeredLayouts[arguments[0]] = arguments[1];
			registeredLayouts[arguments[0]]._tileMapLayout_ = {
				stable: false
			};
			_(registeredLayouts[arguments[0]]._tileMapLayout_).assign(arguments[2]);
		} else if (_(arguments[0]).isPlainObject()) {
			var options = arguments[1];
			_(arguments[0]).forOwn(function (fn, name) { register(name, fn, options); });
		} else {
			throw new TypeError("Use either register(name, fn) or register({ name1: fn1, name2: fn2, ... }).");
		}
	};

	TileMap.layoutIsStable = function layoutIsStable(layout) {
		return registeredLayouts[layout]._tileMapLayout_.stable;
	};


	////////// Register the TileMap Service //////////

	module.value('TileMap', TileMap);


	////////// Predefined Layouts //////////

	function gridLayout(tiles, height, width, nrOfRows, nrOfColumns) {

		//// fix nr of rows and columns
		//
		if (_(nrOfRows).isNumber() && _(nrOfColumns).isNumber()) {
			// a fixed grid; extra tiles are placed outside the treemap canvas
		} else if (_(nrOfRows).isNumber() && !_(nrOfColumns).isNumber()) {
			nrOfColumns = Math.ceil(tiles.length / nrOfRows);
		} else if (!_(nrOfRows).isNumber() && _(nrOfColumns).isNumber()) {
			nrOfRows = Math.ceil(tiles.length / nrOfColumns);
		} else {
			nrOfRows = 1;
			nrOfColumns = tiles.length;
		}


		//// give each tile an index if they don't have one
		//
		_(tiles).forEach(function (tile, index) {
			if (_(tile.index).isUndefined()) {
				tile.index = index;
			}
		});


		//// function for retrieving specific tiles by 2D position
		//
		function tile(row, col) { return tiles[row * nrOfColumns + col]; }


		//// analyzing relative tile weight
		//
		var rowWeight = _(nrOfRows).range().map(function (row) {
			return _(nrOfColumns).range().map(function (col) {
				return (tile(row, col) ? tile(row, col).weight() : 0);
			}).max().value();
		}).value();

		var rowWeightSum = _.sum(rowWeight);

		var tileHeight = _(rowWeight).map(function (weight) {
			return height * _(weight).div(rowWeightSum);
		}).value();

		var colWeight = _(nrOfColumns).range().map(function (col) {
			return _(nrOfRows).range().map(function (row) {
				return (tile(row, col) ? tile(row, col).weight() : 0);
			}).max().value();
		}).value();

		var colWeightSum = _.sum(colWeight);

		var tileWidth = _(colWeight).map(function (weight) {
			return width * _(weight).div(colWeightSum);
		}).value();


		//// build the resulting layout array
		//
		var result = new Array(tiles.length);
		var top = 0;
		_(nrOfRows).range().each(function (row) {
			var left = 0;
			_(nrOfColumns).range().each(function (col) {
				if (tile(row, col)) {
					result[tile(row, col).index] = {
						top:    top,
						left:   left,
						height: tileHeight[row],
						width:  tileWidth[col]
					};
				}
				left += tileWidth[col];
			});
			top += tileHeight[row];
		});

		return result;
	}


	TileMap.register({

		slice: function (tiles, height, width) {
			return gridLayout(tiles, height, width, null, 1);
		},

		dice: function (tiles, height, width) {
			return gridLayout(tiles, height, width, 1, null);
		},

		twentyFourTile: function (tiles, height, width) {
			return gridLayout(tiles, height, width, 4, 6);
		},

		rowsOfTiles: function (tiles, height, width) {
			var rowCount = Math.floor(Math.sqrt(tiles.length));
			var maxColCount = Math.ceil(tiles.length / rowCount);

			var resultingLayout = new Array(rowCount + 1);
			resultingLayout[0] = "slice";

			var index = 0;

			_(rowCount).range().each(function (row) {
				resultingLayout[row + 1] = [];

				resultingLayout[row + 1].push("dice");

				for (; index < Math.min((row + 1) * maxColCount, tiles.length); ++index) {
					resultingLayout[row + 1].push(index);
				}
			});

			return TileMap(tiles, resultingLayout, height, width, 0, 0);
		}

	}, { stable: true });


//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  // Service /////////////////////////////////////////////////////////////////////////////////////////////////////////
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



	var DEFAULT_SPACING = 0;
	var DEFAULT_LAYOUT = 'rowsOfTiles';


	module.directive('tileMap', ['TileMap', '$window', function (TileMap, $window) {
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


	module.directive('tile', [function () {
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
