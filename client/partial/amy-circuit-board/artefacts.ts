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
		_.forEachRight(this._destructCallbacks, function (fn) { fn() });
		this.isBeingDestructed = false;
		this.wasDestructed = true;
	}

	onDestruct(fn: Function): void {
		this._destructCallbacks.push(fn);
	}


	//////////////////// AngularJS Scope Binding ///////////////////////////////

	$scope: any;

	constructor_Artefact1(): void {
		if (this.$scope) {
			var that = this;

			//// If no parent has been given, try to find it as
			//// a property $scope.artefact in the $scope chain:
			that.parent = that.parent || that.$scope.$parent.artefact || null;

			//// When the $scope is destroyed, destruct this artefact:
			that.$scope.$on('$destroy', function () { that.destructor(); });
		}
	}


	//////////////////// Identity //////////////////////////////////////////////

	id: string;
	type: string;

	constructor_Artefact2(): void {
		if (!this.id) { this.id = _.uniqueId(); }
	}


	//////////////////// Hierarchy /////////////////////////////////////////////

	parent: Artefact;
	root: Artefact;
	children: Artefact[];

	constructor_Artefact3(): void {
		if (this.parent) {
			this.root = this.parent.root;
			this.parent.children.push(this);
			this.onDestruct(function () {
				_.pull(this.parent.children, this);
			});
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

	private _focusCallbacks: Function[] = [];
	private _unfocusCallbacks: Function[] = [];
	private _focusFixCallbacks: Function[] = [];
	private _focusUnfixCallbacks: Function[] = [];

	private static _somethingHasFocusFix: boolean = false;

	constructor_Artefact4(): void {
		var that = this;

		//// release focus fix when destructed
		//
		that.onDestruct(function () {
			if (that.focusFixed) {
				that.$scope.$root.$broadcast('artefact-focus-fix', null);
			}
		});

		//// watch for focus events
		//
		that.$scope.$on('artefact-focus', function (event, artefact/*, options*/) {
			if (!Artefact._somethingHasFocusFix && that === artefact) {
				_.forEach(that._focusCallbacks, function (fn) { fn() });
			}
		});
		that.$scope.$on('artefact-unfocus', function (event, artefact/*, options*/) {
			if (!Artefact._somethingHasFocusFix && that === artefact) {
				_.forEach(that._unfocusCallbacks, function (fn) { fn() });
			}
		});
		that.$scope.$on('artefact-focus-fix', function (event, newFocusFixInstance/*, options*/) {
			Artefact._somethingHasFocusFix = !!newFocusFixInstance;
			if (that.focusFixed && newFocusFixInstance !== that) {
				that.focusFixed = false;
				_.forEach(that._focusUnfixCallbacks, function (fn) { fn() });
			} else if (!that.focusFixed && newFocusFixInstance === that) {
				that.focusFixed = true;
				_.forEach(that._focusFixCallbacks, function (fn) { fn() });
			}
		});
	}

	onFocus(fn: Function): void { this._focusCallbacks.push(fn); }
	onUnfocus(fn: Function): void { this._unfocusCallbacks.push(fn); }
	onFocusFix(fn: Function): void { this._focusFixCallbacks.push(fn); }
	onFocusUnfix(fn: Function): void { this._focusUnfixCallbacks.push(fn); }


	//////////////////// Detail Panel //////////////////////////////////////////

	detailTemplateUrl: string;


	//////////////////// Resources /////////////////////////////////////////////
	// TODO: make these three more globally available

	$bind: any;
	ResourceService: any;
	$q: any;

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
		var that = this;
		that.onDestruct(function () {
			var tileMap = that.parentTileMap();
			if (tileMap.maximizedChild === that) {
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
		that.onFocusFix(function () { that._svgElement.setSvgClass('focus-fixed', true); });
		that.onFocusUnfix(function () { that._svgElement.setSvgClass('focus-fixed', false); });
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
		var previousFocusedArtefact; // TODO: restore old focus-fix
		that._svgElement.mouseDragDrop(that.$bind(function () {
			that._svgElement.addSvgClass('dragging');
			that.parentCircuitBoard().draggingVertex = true;
			if (that.focusFixed) {
				previousFocusedArtefact = false;
			} else {
				previousFocusedArtefact = true;
				that.$scope.$root.$broadcast('artefact-focus-fix', that);
			}
		}), that.$bind(function () {
			that._svgElement.removeSvgClass('dragging');
			that.parentCircuitBoard().draggingVertex = false;
			$('svg[amy-graph-layer]').removeSvgClass('dragging');
			if (previousFocusedArtefact) {
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

export class Static3DModel extends Artefact {

	//////////////////// Construction //////////////////////////////////////////

	constructor(properties) {
		super(_.extend({
			type          : 'static3DModel',
			relationType  : '3d model'
		}, properties));

		this.constructor_Static3DModel1();
		this.constructor_Static3DModel2();
	}


	//////////////////// Model /////////////////////////////////////////////////

	threeDGroup: any;
	filename: string;
	parent3DObject: any;

	private object3DQ: any;

	constructor_Static3DModel1() {
		var that = this;

		//// set a promise for the 3D object
		//
		var deferred = this.$q.defer();
		that.object3DQ = deferred.promise;

		//// determine the proper loader for the 3d model
		//
		var loader;
		if (/\.swc$/.test(that.filename)) { loader = new that.THREE.SWCLoader(); }
		else if (/\.obj$/.test(that.filename)) { loader = new that.THREE.OBJLoader(); }
		else {
			deferred.reject('The file "' + that.filename + '" is not supported.');
			return;
		}

		//// load the object
		//
		loader.load(that.filename, function (obj) {

			//// add this object to the parent object
			that.parent3DObject.add(obj);
			that.onDestruct(function () { that.parent3DObject.remove(obj) });

			//// process initial size and position
			that.processInitialSizeAndPosition(obj);

			//// resolve the promise for the object
			deferred.resolve(obj);

		});
	}


	//////////////////// Size and Position /////////////////////////////////////

	private object3DBoundingBox: any;

	private getCompoundBoundingBox(object3D) {
		var box = null;
		object3D.traverse(function (obj) {
			var geometry = obj.geometry;
			if (_.isUndefined(geometry)) { return }
			geometry.computeBoundingBox();
			if (_.isNull(box)) {
				box = geometry.boundingBox;
			} else {
				box.union(geometry.boundingBox);
			}
		});
		return box;
	}

	processInitialSizeAndPosition(obj) {
		//// calculate bounding box of object; used for several purposes
		this.object3DBoundingBox = this.getCompoundBoundingBox(obj);

		//// normalize position
		var translation = this.object3DBoundingBox.center().negate();
		obj.children[0].geometry.applyMatrix(new this.THREE.Matrix4().setPosition(translation));
	}

	adjustToSize(size: { width: number; height: number; }) {
		var that = this;

		that.object3DQ.then(function (obj) {
			//// adjust size
			var ratio = Math.min(size.width / that.object3DBoundingBox.size().x,
							size.height / that.object3DBoundingBox.size().y) * .7;
			if (/\.swc/.test(that.filename)) { ratio *= 2; } // neurons may take more space
			obj.scale.set(ratio, ratio, ratio);

			//// adjust 'altitude'
			obj.position.z = 0.5 * ratio * that.object3DBoundingBox.size().z + 30;
		});
	}


	//////////////////// Focus /////////////////////////////////////////////////

	private forEachMesh(fn) {
		var that = this;
		that.object3DQ.then(function (obj) {
			obj.traverse(function (thing) {
				if (thing instanceof that.THREE.Mesh) {
					fn(thing);
				}
			});
		});
	}

	constructor_Static3DModel2() {
		var that = this;
		that.object3DQ.then(function (/*obj*/) {

			//// translate mouse events to focus events
			//
			function onMouseOver() {
				that.$scope.$root.$broadcast('artefact-focus', that, {});
			}
			function onMouseOut() {
				that.$scope.$root.$broadcast('artefact-unfocus', that, {});
			}
			function onClick() {
				that.$scope.$root.$broadcast('artefact-focus-fix', that.focusFixed ? null : that, {});
			}
			that.threeDGroup.on('mouseover', onMouseOver);
			that.threeDGroup.on('mouseout', onMouseOut);
			that.threeDGroup.on('click', onClick);
			that.onDestruct(function () {
				that.threeDGroup.off('mouseover', onMouseOver);
				that.threeDGroup.off('mouseout', onMouseOut);
				that.threeDGroup.off('click', onClick);
			});

			//// change color based on focus-events
			//
			that.forEachMesh(function (thing) { thing.userData.initialColor = thing.material.color; });
			that.onFocus(function () {
				that.forEachMesh(function (thing) { thing.material.color = new that.THREE.Color('#ccffff'); });
			});
			that.onUnfocus(function () {
				that.forEachMesh(function (thing) { thing.material.color = thing.userData.initialColor; });
			});
			that.onFocusFix(function () {
				that.forEachMesh(function (thing) { thing.material.color = new that.THREE.Color('#00cc00'); });
			});
			that.onFocusUnfix(function () {
				that.forEachMesh(function (thing) { thing.material.color = thing.userData.initialColor; });
			});

		});
	}


	//////////////////// Resources /////////////////////////////////////////////
	// TODO: make these three more globally available

	THREE: any;

}
















////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
