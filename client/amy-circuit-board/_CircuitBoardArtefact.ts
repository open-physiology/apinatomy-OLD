/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="../../typings/own.d.ts" />

import _ = require('lodash');
import Artefact = require('../Artefact');

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export class TileMapArtefact extends Artefact {

	//////////////////// Construction //////////////////////////////////////////

	constructor(properties) {
		super(_.extend({
			type: 'tileMap'
		}, properties));
	}


	//////////////////// Treemap Layer /////////////////////////////////////////

	maximizedChild: TileArtefact;
	position: Position;

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export class TileArtefact extends Artefact {

	//////////////////// Construction //////////////////////////////////////////

	constructor(properties) {
		super(_.extend({
			type: 'tile'
		}, properties));

		this.constructor_Tile1();
		this.constructor_Tile2();
	}


	//////////////////// Model /////////////////////////////////////////////////

	entity: any;


	//////////////////// Treemap Layer /////////////////////////////////////////

	active: boolean = true;
	open: boolean = false;
	maximized: boolean = false;
	visible: boolean = true;
	position: Position;

	private constructor_Tile1(): void {
		var that = this;
		that.onDestruct(function () {
			var tileMap = that.ancestor(TileMapArtefact);
			if (tileMap.maximizedChild === that) {
				tileMap.maximizedChild = null;
			}
		})
	}


	//////////////////// Focus /////////////////////////////////////////////////

	highlighted: boolean = false;

	private constructor_Tile2(): void {
		var that = this;
		var descendantFocusFixed = false;
		Artefact.onFocus(function (artefact, flag) {
			if (!descendantFocusFixed) {
				if (artefact.type !== 'tile') {
					artefact = artefact.ancestor(TileArtefact);
				}
				if (artefact && artefact.entity && artefact.entity === that.entity) {
					that.highlighted = flag
				} else if (artefact && (!artefact.entity || artefact.entity !== that.entity) && flag) {
					that.highlighted = false;
				}
			}
		});
		Artefact.onFocusFix(function (artefact, flag) {
			if (artefact.type !== 'tile') {
				artefact = artefact.ancestor(TileArtefact);
			}
			if (flag) {
				that.highlighted = !!(artefact && artefact.entity && artefact.entity === that.entity);
				descendantFocusFixed = that.highlighted;
			} else {
				descendantFocusFixed = false;
			}
		});
	}


	//////////////////// 3D Layer //////////////////////////////////////////////

	has3DModel: boolean = false;
	show3DModel: boolean = false;

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export class CircuitBoardArtefact extends Artefact {

	//////////////////// Construction //////////////////////////////////////////

	constructor(properties) {
		super(_.extend({
			type: 'circuitBoard'
		}, properties));
	}


	//////////////////// Subclasses ////////////////////////////////////////////

	static TileMapArtefact = TileMapArtefact;
	static TileArtefact = TileArtefact;


	//////////////////// Model /////////////////////////////////////////////////

	entity: any;


	//////////////////// Graph Layer ///////////////////////////////////////////

	draggingVertex: boolean = false;


	//////////////////// Treemap Layer /////////////////////////////////////////

	position: Position;

}
