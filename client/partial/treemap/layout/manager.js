'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['lodash'], function (_) {
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
		var childBlockPositions = Layout(childBlockLayouts, subLayout, height, width);


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
						Layout(
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



	var registeredLayouts = {};

	function Layout(tiles, layout, height, width, top, left) {
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
				left: pos.left + left
			}).value();
		}).value();
	}


	Layout.register = function register() {
		if (_(arguments[0]).isString() && _(arguments[1]).isFunction()) {

			registeredLayouts[arguments[0]] = arguments[1];

		} else if (_(arguments[0]).isPlainObject()) {

			_(arguments[0]).forOwn(function (fn, name) {
				register(name, fn);
			});

		} else {
			throw new TypeError("Use either register(name, fn) or register({ name1: fn1, name2: fn2, ... }).");
		}
	};


	return Layout;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
