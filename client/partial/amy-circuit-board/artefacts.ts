/// <reference path="../../ts-lib/lodash.d.ts" />

////////////////////////////////////////////////////////////////////////////////

import _ = require('lodash');
import Artefact = require('../../artefact/class');

////////////////////////////////////////////////////////////////////////////////

export interface Position {
	top: number;
	left: number;
	height: number;
	width: number;
}

////////////////////////////////////////////////////////////////////////////////

export class TileMap extends Artefact {

	maximizedChild: Tile;

	position: Position;

	constructor(properties) {
		super(_.extend({ type: 'tileMap' }, properties));
	}
}

////////////////////////////////////////////////////////////////////////////////

export class Tile extends Artefact {

	entity: any;
	active: boolean = true;
	highlighted: boolean = false;
	open: boolean = false;
	maximized: boolean = false;
	visible: boolean = true;

	position: Position;

	has3DModel: boolean = false;
	show3DModel: boolean = false;

	constructor(properties) {
		super(_.extend({ type: 'tile' }, properties));
	}

	destructor(): void {
		var tileMap = this.parentTileMap();
		if (tileMap.maximizedChild === this) {
			tileMap.maximizedChild = null;
		}
		super.destructor();
	}

	public parentTile(): Tile {
		return <Tile> this.ancestor('tile');
	}

	public parentTileMap(): TileMap {
		return <TileMap> this.ancestor('tileMap');
	}

}

////////////////////////////////////////////////////////////////////////////////

export class Protein extends Artefact {

	element: SVGElement;
	protein: any;

	constructor(properties) {
		super(_.extend({
			type        : 'protein',
			relationType: 'protein expression'
		}, properties));
	}

}


////////////////////////////////////////////////////////////////////////////////
