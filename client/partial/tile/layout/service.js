'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module', 'underscore', 'utility/sum'], function (ApiNATOMY, _, sum) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	console.log("Loading 'partial/tile/layout/service'");


	var TILE_LAYOUT_SERVICE = 'TileLayoutService';


	ApiNATOMY.factory(TILE_LAYOUT_SERVICE, ['$q', function ($q) {

		function gridLayout(tilePromises, size1, size2, spacing, repositionFn, nrOfDim2Tiles) {
			$q.all(tilePromises).then(function (tiles) {

				// fix nr of rows and columns
				nrOfDim2Tiles = nrOfDim2Tiles || tiles.length;
				var nrOfDim1Tiles = Math.ceil(tiles.length / nrOfDim2Tiles);

				function tile(dim1, dim2) { return tiles[dim1 * nrOfDim2Tiles + dim2]; }


				// compensating for the 1px border
				size1 -= 2;
				size2 -= 2;


				// compensating for spacing
				size1 -= nrOfDim1Tiles * spacing;
				size2 -= nrOfDim2Tiles * spacing;


				var dim1Importance = _.map(_.range(nrOfDim1Tiles), function (dim1) {
					return _.max(_.map(_.range(nrOfDim2Tiles), function (dim2) {
						return (!!tile(dim1, dim2) ? tile(dim1, dim2).importance() : 1);
					}));
				});
				var tileSize1 = _.map(dim1Importance, function (importance) {
					return (size1 - spacing) * importance / sum(dim1Importance);
				});

				var dim2Importance = _.map(_.range(nrOfDim2Tiles), function (dim2) {
					return _.max(_.map(_.range(nrOfDim1Tiles), function (dim1) {
						return (!!tile(dim1, dim2) ? tile(dim1, dim2).importance() : 1);
					}));
				});
				var tileSize2 = _.map(dim2Importance, function (importance) {
					return (size2 - spacing) * importance / sum(dim2Importance);
				});


				var pos1 = spacing;
				_.each(_.range(nrOfDim1Tiles), function (dim1) {
					var pos2 = spacing;
					_.each(_.range(nrOfDim2Tiles), function (dim2) {
						if (!!tile(dim1, dim2)) {
							repositionFn(tile(dim1, dim2), pos1, pos2, tileSize1[dim1], tileSize2[dim2]);
						}
						pos2 += tileSize2[dim2] + spacing
					});
					pos1 += tileSize1[dim1] + spacing;
				});

			});
		}


		return {
			slice: function (tiles, height, width, spacing) {
				gridLayout(tiles, height, width, spacing, function (tile, tilePos1, tilePos2, tileSize1, tileSize2) {
					tile.reposition(tilePos1, tilePos2, tileSize1, tileSize2);
				}, 1); // single column

			},

			dice          : function (tiles, height, width, spacing) {
				gridLayout(tiles, width, height, spacing, function (tile, tilePos1, tilePos2, tileSize1, tileSize2) {
					tile.reposition(tilePos2, tilePos1, tileSize2, tileSize1);
				}); // single row
			},

			twentyFourTile: function (tilePromises, height, width, spacing) {
				gridLayout(tilePromises, height, width, spacing, function (tile, tilePos1, tilePos2, tileSize1, tileSize2) {
					tile.reposition(tilePos1, tilePos2, tileSize1, tileSize2);
				}, 6); // six columns
			}
		}
	}]);


	return TILE_LAYOUT_SERVICE;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
