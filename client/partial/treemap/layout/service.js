'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module', 'lodash'], function (ApiNATOMY, _) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	console.log("Loading 'partial/layout/service'");


	ApiNATOMY.factory('TileLayoutService', [function () {

		function gridLayout(tiles, size1, size2, repositionFn, nrOfDim2Tiles) {

			var result = new Array(tiles.length);

			//// fix nr of rows and columns

			nrOfDim2Tiles = _(nrOfDim2Tiles).or(tiles.length);
			var nrOfDim1Tiles = Math.ceil(tiles.length / nrOfDim2Tiles);

			function tile(dim1, dim2) { return tiles[dim1 * nrOfDim2Tiles + dim2]; }

			//// rest

			var dim1Importance = _(nrOfDim1Tiles).range().map(function (dim1) {
				return _(nrOfDim2Tiles).range().map(function (dim2) {
					return (tile(dim1, dim2) ? tile(dim1, dim2).importance() : 1);
				}).max().value();
			}).value();

			var dim1ImportanceSum = _.sum(dim1Importance);

			var tileSize1 = _(dim1Importance).map(function (importance) {
				return size1 * importance / dim1ImportanceSum;
			}).value();

			var dim2Importance = _(nrOfDim2Tiles).range().map(function (dim2) {
				return _(nrOfDim1Tiles).range().map(function (dim1) {
					return (tile(dim1, dim2) ? tile(dim1, dim2).importance() : 1);
				}).max().value();
			}).value();

			var dim2ImportanceSum = _.sum(dim2Importance);

			var tileSize2 = _(dim2Importance).map(function (importance) {
				return size2 * importance / dim2ImportanceSum;
			}).value();





			var pos1 = 0;
			_(nrOfDim1Tiles).range().each(function (dim1) {
				var pos2 = 0;
				_(nrOfDim2Tiles).range().each(function (dim2) {
					if (tile(dim1, dim2)) {
						result[tile(dim1, dim2).index] = repositionFn(pos1, pos2, tileSize1[dim1], tileSize2[dim2]);
					}
					pos2 += tileSize2[dim2];
				});
				pos1 += tileSize1[dim1];
			});

			return result;
		}


		return {
			slice: function (tiles, height, width) {
				return gridLayout(tiles, height, width, function (tilePos1, tilePos2, tileSize1, tileSize2) {
					return { top: tilePos1, left: tilePos2, height: tileSize1, width: tileSize2 };
				}, 1); // single column

			},

			dice: function (tiles, height, width) {
				return gridLayout(tiles, width, height, function (tilePos1, tilePos2, tileSize1, tileSize2) {
					return { top: tilePos2, left: tilePos1, height: tileSize2, width: tileSize1 };
				}); // single row
			},

			twentyFourTile: function (tiles, height, width) {
				return gridLayout(tiles, height, width, function (tilePos1, tilePos2, tileSize1, tileSize2) {
					return { top: tilePos1, left: tilePos2, height: tileSize1, width: tileSize2 };
				}, 6); // six columns
			}
		}
	}]);


	return 'TileLayoutService';


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
