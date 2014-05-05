'use strict';

// Here is an overview of the sizing and
// positioning of a tile and its children:
//
//
//                                    width
//                 ╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄╮
//                 ┆                                         ┆
//
//               ┌─────────────────────────────────────────────┐  ┄┄┄┄╮ border
//         ╭┄┄┄  │ ╔═════════════════════════════════════════╗ │  ┄┄┄┄╯ width
//  header ┊     │ ║ header                                  ║ │
//  height ┊     │ ║                                         ║ │
//         ┊     │ ╟─────────────────────────────────────────╢ │  ┄┄┄┄╮ border
//         ├┄┄┄  │ ╠═════════════════════════════════════════╣ │  ┄┄┄┄╯ width
//         ┊     │ ║ section                                 ║ │
//         ┊     │ ║                                         ║ │
//         ┊     │ ║     ┌─────────────┐     ┌─────────┐     ║ │  ┄┄┄┄╮
//         ┊     │ ║     │ child       │     │ child   │     ║ │      ┊
//         ┊     │ ║     │             │     │         │     ║ │      ┊ child
//         ┊     │ ║     │             │     │         │     ║ │      ┊ height
//         ┊     │ ║     │             │     │         │     ║ │      ┊
//         ┊     │ ║     └─────────────┘     └─────────┘     ║ │  ┄┄┄┄╯
//  height ┊     │ ║                                         ║ │
//         ┊     │ ║                                         ║ │
//         ┊     │ ║     ┌───────┐     ┌───────────────┐     ║ │
//         ┊     │ ║     │ child │     │ child         │     ║ │
//         ┊     │ ║     │       │     │               │     ║ │
//         ┊     │ ║     │       │     │               │     ║ │
//         ┊     │ ║     │       │     │               │     ║ │
//         ┊     │ ║     └───────┘     └───────────────┘     ║ │  ┄┄┄┄╮
//         ┊     │ ║                                         ║ │      ┊ tile
//         ┊     │ ║                                         ║ │      ┊ spacing
//         ╰┄┄┄  │ ╚═════════════════════════════════════════╝ │  ┄┄┄┄╯
//               └─────────────────────────────────────────────┘
//
//                 ┆     ┆             ┆               ┆     ┆ ┆
//                 ╰┄┄┄┄┄╯             ╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄╯     ╰┄╯
//                  tile                  child width       border
//                 spacing                                  width
//


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module', 'lodash'], function (app, _) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


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
				hidden: (_(pos.height).approx(0) || _(pos.width).approx(0))
			}).value();
		}).value();
	}

	TileMap.register = function register() {
		if (_(arguments[0]).isString() && _(arguments[1]).isFunction()) {
			registeredLayouts[arguments[0]] = arguments[1];
		} else if (_(arguments[0]).isPlainObject()) {
			_(arguments[0]).forOwn(function (fn, name) { register(name, fn); });
		} else {
			throw new TypeError("Use either register(name, fn) or register({ name1: fn1, name2: fn2, ... }).");
		}
	};


	////////// Register the TileMap Service //////////

	app.value('TileMap', TileMap);


	////////// Predefined Layouts //////////

	function gridLayout(tiles, height, width, nrOfRows, nrOfColumns) {

		//// fix nr of rows and columns

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

		_(tiles).forEach(function (tile, index) {
			if (_(tile.index).isUndefined()) {
				tile.index = index;
			}
		});


		//// function for retrieving specific tiles by 2D position

		function tile(row, col) { return tiles[row * nrOfColumns + col]; }


		//// analyzing relative tile weight

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

	});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
