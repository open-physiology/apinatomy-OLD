/// <reference path="../../ts-lib/lodash.d.ts" />
/// <reference path="../../ts-lib/jquery.d.ts" />
/// <reference path="../../ts-lib/jquery-svg-class.d.ts" />
/// <reference path="../../ts-lib/jquery-click-vs-drag.d.ts" />

import _ = require('lodash');
import $ = require('jquery');

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export interface Position {
	top: number;
	left: number;
	height: number;
	width: number;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// abstract
export class Artefact {

	//////////////////// Construction //////////////////////////////////////////

	constructor(properties) {
		//// pass in the properties
		//
		_(this).assign(properties);

		//// delegate to the other constructor functions
		//
		this.constructor_Artefact1();
		this.constructor_Artefact2();
		this.constructor_Artefact3();
		this.constructor_Artefact4();
	}


	//////////////////// Destruction ///////////////////////////////////////////

	isBeingDestructed: boolean = false;
	wasDestructed: boolean = false;
	private _destructCallbacks: Function[] = [];

	destructor(): void {
		this.isBeingDestructed = true;
		_.forEachRight(this._destructCallbacks, function (fn) { fn(); });
		this.isBeingDestructed = false;
		this.wasDestructed = true;
	}

	onDestruct(fn: Function): void {
		this._destructCallbacks.push(fn);
	}


	//////////////////// Identity //////////////////////////////////////////////

	id: string;
	type: string;

	constructor_Artefact1(): void {
		if (!this.id) { this.id = _.uniqueId(); }
	}


	//////////////////// Hierarchy /////////////////////////////////////////////

	parent: Artefact;
	root: Artefact;
	children: Artefact[];

	connectWithParent() {
		this.root = this.parent.root;
		this.parent.children.push(this);
		this.onDestruct(function () {
			_.pull(this.parent.children, this);
		});
	}

	constructor_Artefact2(): void {
		if (this.parent) {
			this.connectWithParent();
		} else {
			this.root = this;
		}
		if (_.isUndefined(this.children)) {
			this.children = [];
		}
	}


	//////////////////// Ancestor Access ///////////////////////////////////////

	ancestor(type: string): Artefact {
		var result = this.parent;
		while (result && result.type !== type) {
			result = result.parent;
		}
		return result;
	}

	parentCircuitBoard(): CircuitBoard {
		return <CircuitBoard> this.ancestor('circuitBoard');
	}

	parentTileMap(): TileMap {
		return <TileMap> this.ancestor('tileMap');
	}

	parentTile(): Tile {
		return <Tile> this.ancestor('tile');
	}


	//////////////////// Focus /////////////////////////////////////////////////

	focusFixed: boolean;

	constructor_Artefact3(): void {
		var that = this;
		that.onDestruct(function () {
			if (this.focusFixed) {
				this.$scope.$root.$broadcast('artefact-focus-fix', null);
			}
		});
	}


	//////////////////// Detail Panel //////////////////////////////////////////

	detailTemplateUrl: string;


	//////////////////// AngularJS Scope Binding ///////////////////////////////

	$scope: any;

	constructor_Artefact4(): void {
		if (this.$scope) {
			var that = this;

			//// If no parent has been given, try to find it as
			//// a property $scope.artefact in the $scope chain:
			//
			if (!that.parent) {
				that.parent = that.$scope.$parent.artefact || null;
			}

			//// When the $scope is destroyed, destruct this artefact:
			//
			that.$scope.$on('$destroy', function () {
				that.destructor();
			});
		}
	}


	//////////////////// Resources /////////////////////////////////////////////
	// TODO: make these three more globally available

	$bind: any;
	ResourceService: any;

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export class WebPage extends Artefact {

	constructor(properties) {
		super(_.extend({
			type: 'webPage',
			parent: null
		}, properties));
	}

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export class CircuitBoard extends Artefact {

	//////////////////// Construction //////////////////////////////////////////

	constructor(properties) {
		super(_.extend({
			type: 'circuitBoard'
		}, properties));
	}


	//////////////////// Model /////////////////////////////////////////////////

	entity: any;


	//////////////////// Graph Layer ///////////////////////////////////////////

	draggingVertex: boolean = false;


	//////////////////// Treemap Layer /////////////////////////////////////////

	position: Position;

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export class TileMap extends Artefact {

	//////////////////// Construction //////////////////////////////////////////

	constructor(properties) {
		super(_.extend({
			type: 'tileMap'
		}, properties));
	}


	//////////////////// Treemap Layer /////////////////////////////////////////

	maximizedChild: Tile;
	position: Position;

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export class Tile extends Artefact {

	//////////////////// Construction //////////////////////////////////////////

	constructor(properties) {
		super(_.extend({
			type: 'tile'
		}, properties));

		this.constructor_Tile1();
	}


	//////////////////// Model /////////////////////////////////////////////////

	entity: any;


	//////////////////// Treemap Layer /////////////////////////////////////////

	active: boolean = true;
	highlighted: boolean = false;
	open: boolean = false;
	maximized: boolean = false;
	visible: boolean = true;
	position: Position;

	constructor_Tile1(): void {
		this.onDestruct(function () {
			var tileMap = this.parentTileMap();
			if (tileMap.maximizedChild === this) {
				tileMap.maximizedChild = null;
			}
		})
	}


	//////////////////// 3D Layer //////////////////////////////////////////////

	has3DModel: boolean = false;
	show3DModel: boolean = false;

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// abstract
export class SvgArtefact extends Artefact {

	//////////////////// Construction //////////////////////////////////////////

	constructor(properties) { super(properties) }


	//////////////////// Graph Layer ///////////////////////////////////////////

	generateSvgElement(): JQuery { throw new Error('Calling an abstract method!') }

	_svgElement: JQuery;
	get element(): HTMLElement {
		if (!this._svgElement) {
			this._svgElement = this.generateSvgElement();
			this.setFocusEvents();
		}
		return this._svgElement.get(0);
	}

	setFocusEvents(): void {
		var that = this;

		if (that.detailTemplateUrl) {

			//// temporary focus on mouse-move
			//
			var mouseoverCallback = that.$bind(function (event) {
				event.stopPropagation();
				that.$scope.$root.$broadcast('artefact-focus', that, {});
			});
			var mouseoutCallback = that.$bind(function (event) {
				event.stopPropagation();
				that.$scope.$root.$broadcast('artefact-unfocus', that, {});
			});
			that._svgElement.on('mouseover', mouseoverCallback);
			that._svgElement.on('mouseout', mouseoutCallback);
			that.onDestruct(function () {
				that._svgElement.off('mouseover', mouseoverCallback);
				that._svgElement.off('mouseout', mouseoutCallback);
			});


			//// fixed focus on click
			//
			that._svgElement.clickNotDrop(that.$bind(function () {
				that.$scope.$root.$broadcast('artefact-focus-fix',
						that.focusFixed ? null : that);
			}));
			that.onDestruct(function () {
				that._svgElement.offClickNotDrop();
			});

		}


		//// how to react when focus is fixed:
		//
		var deregisterFocusWatch = that.$scope.$on('artefact-focus-fix', function (e, artefact) {
			that.focusFixed = (artefact === that);
			that._svgElement.setSvgClass('focus-fixed', that.focusFixed);
		});
		that.onDestruct(deregisterFocusWatch);
	}

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// abstract
export class SvgVertexArtefact extends SvgArtefact {

	//////////////////// Construction //////////////////////////////////////////

	constructor(properties) { super(properties) }


	//////////////////// Graph Layer ///////////////////////////////////////////

	svgHtml(): string { throw new Error('Calling an abstract method!'); }

	svgClass(): string { throw new Error('Calling an abstract method!'); }

	generateSvgElement(): JQuery {
		return $('<svg>' + this.svgHtml() + '</svg>')
				.addSvgClass(this.svgClass());
	}

	setFocusEvents(): void {
		super.setFocusEvents();

		var that = this;

		//// react to dragging by temporarily fixing focus (if not already fixed)
		//
		var removeFocusFixOnDrop;
		that._svgElement.mouseDragDrop(that.$bind(function () {
			that._svgElement.addSvgClass('dragging');
			that.parentCircuitBoard().draggingVertex = true;
			if (that.focusFixed) {
				removeFocusFixOnDrop = false;
			} else {
				removeFocusFixOnDrop = true;
				that.$scope.$root.$broadcast('artefact-focus-fix', that);
			}
		}), that.$bind(function () {
			that._svgElement.removeSvgClass('dragging');
			that.parentCircuitBoard().draggingVertex = false;
			$('svg[amy-graph-layer]').removeSvgClass('dragging');
			if (removeFocusFixOnDrop) {
				that.$scope.$root.$broadcast('artefact-focus-fix', null);
			}
		}));
		that.onDestruct(function () { that._svgElement.offMouseDragDrop(); });
	}

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// abstract
export class SvgEdgeArtefact extends SvgArtefact {

	//////////////////// Construction //////////////////////////////////////////

	constructor(properties) { super(properties) }


	//////////////////// Graph Layer ///////////////////////////////////////////

	svgClass(): string { throw new Error('Calling an abstract method!'); }

	generateSvgElement(): JQuery {
		return $('<svg><line></line></svg>')
				.children() // adding and discarding the 'svg' element fixes a bug where the line would not appear
				.addSvgClass(this.svgClass());
	}

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export class VascularTileJunction extends SvgVertexArtefact {

	//////////////////// Construction //////////////////////////////////////////

	constructor(properties) {
		super(_.extend({
			type          : 'vascularTileJunction',
			relationType  : 'vascular junction',
			connectionType: 'vascular'
		}, properties));
	}


	//////////////////// Model /////////////////////////////////////////////////

	connectionType: string;


	//////////////////// Graph Layer ///////////////////////////////////////////

	svgHtml() { return '<circle class="core" r="5"></circle>' }

	svgClass() { return 'tile-junction ' + this.connectionType }

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export class VascularBranchingJunction extends SvgVertexArtefact {

	//////////////////// Construction //////////////////////////////////////////

	constructor(properties) {
		super(_.extend({
			type          : 'vascularBranchingJunction',
			relationType  : 'vascular junction',
			connectionType: 'vascular'
		}, properties));
	}


	//////////////////// Model /////////////////////////////////////////////////

	connectionType: string;
	subtype: string;


	//////////////////// Graph Layer ///////////////////////////////////////////

	svgHtml() { return '<circle class="core" r="2"></circle>' }

	svgClass() { return 'branching-junction ' + this.connectionType + ' ' + this.subtype }

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export class VascularConnection extends SvgEdgeArtefact {

	//////////////////// Construction //////////////////////////////////////////

	constructor(properties) {
		super(_.extend({
			type          : 'vascularConnection',
			relationType  : 'vascular connection',
			connectionType: 'vascular'
		}, properties));
	}


	//////////////////// Model /////////////////////////////////////////////////

	connectionType: string;
	subtype: string;
	source: any;
	target: any;
	hiddenJunctions: any[];


	//////////////////// Graph Layer ///////////////////////////////////////////

	svgClass() { return 'connection ' + this.connectionType + ' ' + this.subtype }


	//////////////////// Detail Panel //////////////////////////////////////////

	trueSource: any;
	trueTarget: any;
	segments: any[] = [];

	initializeSegmentData(): void {
		var that = this;

		that.segments = [];

		var innerJunctions = _.clone(that.hiddenJunctions);

		if (that.subtype === 'arterial') {
			that.trueSource = that.target;
			that.trueTarget = that.source;
			innerJunctions.reverse();
		} else { // 'venous'
			that.trueSource = that.source;
			that.trueTarget = that.target;
		}

		var sourceId = that.trueSource.entity ? that.trueSource.entity._id : that.trueSource.id;
		var targetId = that.trueTarget.entity ? that.trueTarget.entity._id : that.trueTarget.id;

		that.ResourceService.connections(_.union(innerJunctions, [sourceId, targetId])).then(function (data) {

			//// how to add a segment to the list (quite crude; a linear search)
			//
			function addSegment(from, to) {
				_(data).forEach(function (segmentData: any) {
					if ((segmentData.from === from && segmentData.to === to) || (segmentData.from === to && segmentData.to === from)) {
						that.segments.push(segmentData);
						return false; // break the loop
					}
				});
			}

			//// adding the segments
			//
			var lastJunction = sourceId;
			_(innerJunctions).forEach(function (innerJunction) {
				addSegment(lastJunction, innerJunction);
				lastJunction = innerJunction;
			});
			addSegment(lastJunction, targetId);

			if (that.trueSource.entity) { _.first(that.segments).from = that.trueSource.entity; }
			if (that.trueTarget.entity) { _.last(that.segments).to = that.trueTarget.entity; }

		}, function (err) {
			console.error(err);
		});
	}

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export class NeuralTileJunction extends SvgVertexArtefact {

	//////////////////// Construction //////////////////////////////////////////

	constructor(properties) {
		super(_.extend({
			type          : 'neuralTileJunction',
			relationType  : 'neural junction',
			connectionType: 'neural'
		}, properties));
	}


	//////////////////// Model /////////////////////////////////////////////////

	connectionType: string;


	//////////////////// Graph Layer ///////////////////////////////////////////

	svgHtml() { return '<circle class="core" r="5"></circle>' }

	svgClass() { return 'tile-junction ' + this.connectionType }

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export class NeuralBranchingJunction extends SvgVertexArtefact {

	//////////////////// Construction //////////////////////////////////////////

	constructor(properties) {
		super(_.extend({
			type          : 'neuralBranchingJunction',
			relationType  : 'neural junction',
			connectionType: 'neural'
		}, properties));
	}


	//////////////////// Model /////////////////////////////////////////////////

	connectionType: string;
	subtype: string;


	//////////////////// Graph Layer ///////////////////////////////////////////

	svgHtml() { return '<circle class="core" r="2"></circle>' }

	svgClass() { return 'branching-junction ' + this.connectionType + ' ' + this.subtype }

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export class NeuralConnection extends SvgEdgeArtefact {

	//////////////////// Construction //////////////////////////////////////////

	constructor(properties) {
		super(_.extend({
			type          : 'neuralConnection',
			relationType  : 'neural connection',
			connectionType: 'neural'
		}, properties));
	}


	//////////////////// Model /////////////////////////////////////////////////

	connectionType: string;
	subtype: string;
	source: any;
	target: any;


	//////////////////// Graph Layer ///////////////////////////////////////////

	svgClass() { return 'connection ' + this.connectionType + ' ' + this.subtype }

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export class Protein extends SvgVertexArtefact {

	//////////////////// Construction //////////////////////////////////////////

	constructor(properties) {
		super(_.extend({
			type        : 'protein',
			relationType: 'protein expression'
		}, properties));
	}


	//////////////////// Model /////////////////////////////////////////////////

	protein: any;


	//////////////////// Graph Layer ///////////////////////////////////////////

	svgHtml() {
		return '<circle class="core" r="5"></circle>'
				+ (_.isEmpty(this.protein.smallMoleculeInteractions) ? ''
						: '<circle class="small-molecule-indicator" r="9"></circle>')
	}

	svgClass() { return 'protein' }


	//////////////////// Detail Panel //////////////////////////////////////////

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

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export class ProteinInteraction extends SvgEdgeArtefact {

	//////////////////// Construction //////////////////////////////////////////

	constructor(properties) {
		super(_.extend({
			type          : 'proteinInteraction',
			relationType  : 'protein interaction',
			connectionType: 'proteinInteraction'
		}, properties));
	}


	//////////////////// Model /////////////////////////////////////////////////

	source: any;
	target: any;


	//////////////////// Graph Layer ///////////////////////////////////////////

	svgClass() { return 'protein-interaction' }

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
