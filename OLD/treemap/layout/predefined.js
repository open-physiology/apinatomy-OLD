'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['lodash', 'partial/treemap/layout/manager'], function (_, Layout) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


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
					result[tile(row, col).index] = { top: top, left: left, height: tileHeight[row], width: tileWidth[col] };
				}
				left += tileWidth[col];
			});
			top += tileHeight[row];
		});

		return result;
	}


	Layout.register({

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

			var resultingLayout = new Array(rowCount+1);
			resultingLayout[0] = "slice";

			var index = 0;

			_(rowCount).range().each(function (row) {
				resultingLayout[row+1] = [];

				resultingLayout[row+1].push("dice");

				for (; index < Math.min((row+1) * maxColCount, tiles.length); ++index) {
					resultingLayout[row+1].push(index);
				}
			});

			return Layout(tiles, resultingLayout, height, width, 0, 0);
		}

	});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
