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

export class VascularTileJunction extends Artefact {

    element: SVGElement;
    entity: any;

    constructor(properties) {
        super(_.extend({
            type        : 'vascularTileJunction',
            relationType: 'vascular junction'
        }, properties));
    }

}

////////////////////////////////////////////////////////////////////////////////

export class Protein extends Artefact {

	element: SVGElement;
	protein: any;
	ResourceService: any;

	constructor(properties) {
		super(_.extend({
			type        : 'protein',
			relationType: 'protein expression'
		}, properties));
	}

	////////////////////////////////////////////////////////////////////////////

	visibleSmallMolecules: any[] = [];

	smPagination: {
		pageSize   : number;
		page       : number;
		lastPage   : number;
	};

	initializeSmPagination() {
		this.smPagination = {
			pageSize: 10,
			page    : 1,
			lastPage: Math.ceil(this.protein.smallMoleculeInteractions.length / 10)
		};
		this.fetchSmPage();
	}

	fetchSmPage() {
        var that = this;

		var ids = this.protein.smallMoleculeInteractions.slice(
            ((this.smPagination.page - 1) * this.smPagination.pageSize),
            (this.smPagination.page * this.smPagination.pageSize)
		);

		this.ResourceService.smallMolecules(ids).then(function (smallMolecules) {
			_.remove(that.visibleSmallMolecules);
			_(smallMolecules).forEach(function (smallMolecule) {
				that.visibleSmallMolecules.push(smallMolecule);
			});
		});
	}

	prefLabel(): string {
		var result: string = null;
		if (this.protein.info) {
			_(this.protein.info.exactMatch).forEach(function (match: any) {
				if (match.prefLabel) {
					result = match.prefLabel.replace(/^(.+)\(homo sapiens\)\s*$/i, '$1');
					return false;
				}
			});
		}
		return result;
	}

	smChemblID(sm: any) {
		return sm.info._about.replace(/^.+(CHEMBL.+)/, '$1');
	}

	smURL(sm: any) {
		return sm.info._about;
	}

	smPrefLabel(sm: any): string {
		var result: string;

		if (sm.info) {
			_(sm.info.exactMatch).forEach(function (match: any) {
				if (match.prefLabel) {
					result = match.prefLabel;
					return false;
				}
			});
		}

		if (!result) { result = this.smChemblID(sm); }

		return result;
	}

}

////////////////////////////////////////////////////////////////////////////////
