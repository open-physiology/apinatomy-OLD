/// <reference path="../../ts-lib/jquery.d.ts" />
/// <reference path="../../ts-lib/jquery-svg-class.d.ts" />
/// <reference path="../../ts-lib/jquery-click-vs-drag.d.ts" />
/// <reference path="../../ts-lib/lodash.d.ts" />
/// <reference path="../../ts-lib/lodash-call.d.ts" />

import $ = require('jquery');
import _ = require('lodash');

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
	private _destructCallbacks: {():any}[] = [];

	destructor(): void {
		this.isBeingDestructed = true;
		_.forEachRight(this._destructCallbacks, _.call);
		this.isBeingDestructed = false;
		this.wasDestructed = true;
	}

	onDestruct(fn: {():any}): void {
		this._destructCallbacks.push(fn);
	}


	//////////////////// AngularJS Scope Binding ///////////////////////////////

	$scope: any;

	private constructor_Artefact1(): void {
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

	private constructor_Artefact2(): void {
		if (!this.id) { this.id = _.uniqueId(); }
	}


	//////////////////// Hierarchy /////////////////////////////////////////////

	parent: Artefact;
	root: Artefact;
	children: Artefact[];

	private constructor_Artefact3(): void {
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

	depthFirstTraversal(fn) {
		fn(this);
		_.forEach(this.children, function (child: Artefact) { child.depthFirstTraversal(fn) });
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

	static _focusCallbacks: {(Artefact, boolean):any}[] = [];
	static _focusFixCallbacks: {(Artefact, boolean):any}[] = [];

	static onFocus(fn: (Artefact, boolean)=>any) { Artefact._focusCallbacks.push(fn) }

	static onFocusFix(fn: (Artefact, boolean)=>any) { Artefact._focusFixCallbacks.push(fn) }

	private _focusCallbacks: {(boolean):any}[] = [];
	private _focusFixCallbacks: {(boolean):any}[] = [];

	static focusIsFixed: boolean = false;

	private _focus: boolean = false;
	get focus(): boolean { return this._focus }

	set focus(flag: boolean) {
		if (this._focus !== flag) {
			var that = this;
			that.root.depthFirstTraversal(function (artefact: Artefact) {
				if (artefact._focus === true && ((artefact === that && flag === false) || (artefact !== that && flag === true))) {
					artefact._focus = false;
					_.forEach(artefact._focusCallbacks, function (fn) { fn(false) });
					_.forEach(Artefact._focusCallbacks, function (fn) { fn(artefact, false) });
				}
			});
			that.root.depthFirstTraversal(function (artefact: Artefact) {
				if (artefact._focus === false && artefact === that && flag === true) {
					artefact._focus = true;
					_.forEach(artefact._focusCallbacks, function (fn) { fn(true) });
					_.forEach(Artefact._focusCallbacks, function (fn) { fn(artefact, true) });
				}
			});
		}
	}

	private _focusFixed: boolean = false;
	get focusFixed(): boolean { return this._focusFixed }

	set focusFixed(flag: boolean) {
		if (this._focusFixed !== flag) {
			var that = this;
			that.root.depthFirstTraversal(function (artefact: Artefact) {
				if ((artefact._focusFixed === true && artefact === that && flag === false) ||
						(artefact._focusFixed === true && artefact !== that && flag === true)) {
					artefact._focusFixed = false;
					_.forEach(artefact._focusFixCallbacks, function (fn) { fn(false) });
					_.forEach(Artefact._focusFixCallbacks, function (fn) { fn(that, false) });
					if (flag === false) { Artefact.focusIsFixed = false; }
				}
			});
			that.root.depthFirstTraversal(function (artefact: Artefact) {
				if (artefact._focusFixed === false && artefact === that && flag === true) {
					artefact._focus = true;
					artefact._focusFixed = true;
					Artefact.focusIsFixed = true;
					_.forEach(artefact._focusFixCallbacks, function (fn) { fn(true) });
					_.forEach(Artefact._focusFixCallbacks, function (fn) { fn(that, true) });
				}
			});
		}
	}

	private constructor_Artefact4(): void {
		var that = this;
		that.onDestruct(function () {
			that.focusFixed = false;
			that.focus = false;
		});
	}

	onFocus(fn: (boolean)=>any): void { this._focusCallbacks.push(fn); }

	onFocusFix(fn: (boolean)=>any): void { this._focusFixCallbacks.push(fn); }


	//////////////////// Detail Panel //////////////////////////////////////////

	detailTemplateUrl: string;


	//////////////////// Resources /////////////////////////////////////////////
	// TODO: make these three more globally available

	ResourceService: any;
	$bind: any;
	$q: any;
	THREE: any;
	threeDLayer: any;

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export class WebPage extends Artefact {

	//////////////////// Construction //////////////////////////////////////////

	constructor(properties) {
		super(_.extend({
			type  : 'webPage',
			parent: null
		}, properties));
	}


	//////////////////// Focus /////////////////////////////////////////////////


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
			var tileMap = that.parentTileMap();
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
					artefact = artefact.ancestor('tile');
				}
				if (flag) {
					that.highlighted = !!(artefact && artefact.entity && artefact.entity === that.entity);
				} else {
					that.highlighted = !artefact && !(artefact.entity && artefact.entity === that.entity);
				}
			}
		});
		Artefact.onFocusFix(function (artefact, flag) {
			if (artefact.type !== 'tile') {
				artefact = artefact.ancestor('tile');
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
				that.focus = true;
			});
			var mouseoutCallback = that.$bind(function (event) {
				event.stopPropagation();
				that.focus = false;
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
				that.focusFixed = !that.focusFixed;
			}));
			that.onDestruct(function () {
				that._svgElement.offClickNotDrop();
			});

		}

		//// how to react when focus is fixed:
		//
		that.onFocusFix(function (flag) { that._svgElement.setSvgClass('focus-fixed', flag); });
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
				that.focusFixed = true;
			}
		}), that.$bind(function () {
			that._svgElement.removeSvgClass('dragging');
			that.parentCircuitBoard().draggingVertex = false;
			$('svg[amy-graph-layer]').removeSvgClass('dragging');
			if (previousFocusedArtefact) {
				that.focusFixed = false;
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
				.children() // adding and discarding the 'svg' element prevents a bug where the line would not appear
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

		this.constructor_Protein1();
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


	//////////////////// Position //////////////////////////////////////////////

	private _newXCallbacks: {(number):any}[] = [];
	private _newYCallbacks: {(number):any}[] = [];

	onNewX(fn: (number)=>any) { this._newXCallbacks.push(fn) }

	onNewY(fn: (number)=>any) { this._newYCallbacks.push(fn) }

	offNewX(fn: (number)=>any) { _.pull(this._newXCallbacks, fn) }

	offNewY(fn: (number)=>any) { _.pull(this._newYCallbacks, fn) }


	private _x: number;
	private _y: number;

	get x(): number { return this._x }

	set x(x: number) {
		this._x = x;
		_.forEach(this._newXCallbacks, function (fn) { fn(x) });
	}

	get y(): number { return this._y }

	set y(y: number) {
		this._y = y;
		_.forEach(this._newYCallbacks, function (fn) { fn(y) });
	}


	//////////////////// 3D Layer //////////////////////////////////////////////

	private constructor_Protein1() {
		var that = this;

		var threeDLayer: any = null;
		var threeDModel: Protein3DModel = null;

		function passX(x) { threeDModel.x = x }

		function passY(y) { threeDModel.y = y }

		var deregisterWatch = that.$scope.$watch('$root.threeDEnabled', function (show3dNow, show3dBefore) {
			if (show3dNow) {
				threeDLayer = that.$scope.circuitBoard.threeDLayer;
				threeDModel = new Protein3DModel({
					id         : that.id + ':3dModel', // TODO: different ID for different translation
					parent     : that,
					protein    : that.protein,
					threeDLayer: threeDLayer,
					THREE      : that.THREE
				});
				that.onNewX(passX);
				that.onNewY(passY);
				passX(that.x);
				passY(that.y);
			} else if (show3dBefore) {
				threeDModel.destructor();
				threeDModel = null;
				threeDLayer = null;
				that.offNewX(passX);
				that.offNewY(passY);
			}
		});
		that.onDestruct(function () {
			if (threeDModel) {
				deregisterWatch();
				threeDModel.destructor();
			}
		});
	}


	//////////////////// Detail Panel //////////////////////////////////////////

	visibleSmallMolecules: any[] = [];

	showSmallMolecules: boolean = false;

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

// abstract
export class ThreeJSModel extends Artefact {

	//////////////////// Construction //////////////////////////////////////////

	constructor(properties) { super(properties); }


	//////////////////// Utility ///////////////////////////////////////////////

	forEachMesh(obj, fn) {
		var that = this;
		obj.traverse(function (thing) {
			if (thing instanceof that.THREE.Mesh) {
				fn(thing);
			}
		});
	}

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export class Static3DModel extends ThreeJSModel {

	//////////////////// Construction //////////////////////////////////////////

	constructor(properties) {
		super(_.extend({
			type        : 'static3DModel',
			relationType: '3D model'
		}, properties));

		this.constructor_Static3DModel1();
		this.constructor_Static3DModel2();
	}


	//////////////////// Model /////////////////////////////////////////////////

	threeDGroup: any;
	filename: string;
	parent3DObject: any;

	private object3DQ: any;

	private constructor_Static3DModel1() {
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

	private constructor_Static3DModel2() {
		var that = this;
		that.object3DQ.then(function (obj) {

			//// translate mouse events to focus events
			//
			function onMouseOver() {
				that.focus = true;
			}

			function onMouseOut() {
				that.focus = false;
			}

			function onClick() {
				that.focusFixed = !that.focusFixed;
			}

			that.threeDGroup.on(obj, 'mouseover', onMouseOver);
			that.threeDGroup.on(obj, 'mouseout', onMouseOut);
			that.threeDGroup.on(obj, 'click', onClick);
			that.onDestruct(function () {
				that.threeDGroup.off(obj, 'mouseover', onMouseOver);
				that.threeDGroup.off(obj, 'mouseout', onMouseOut);
				that.threeDGroup.off(obj, 'click', onClick);
			});

			//// change color based on focus-events
			//
			that.forEachMesh(obj, function (thing) {
				thing.userData.initialColor = thing.material.color;
			});
			that.onFocus(function (flag) {
				if (!that.focusFixed) {
					that.forEachMesh(obj, function (thing) {
						thing.material.color = (flag ? new that.THREE.Color('#ccffff') : thing.userData.initialColor);
					});
				}
			});
			that.onFocusFix(function (flag) {
				that.forEachMesh(obj, function (thing) {
					thing.material.color = (flag ? new that.THREE.Color('#00cc00') : thing.userData.initialColor);
				});
			});

		});
	}

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export class Protein3DModel extends ThreeJSModel {

	//////////////////// Construction //////////////////////////////////////////

	constructor(properties) {
		super(_.extend({
			type        : 'protein3DModel',
			relationType: '3D model'
		}, properties));

		this.constructor_Protein3DModel1();
		this.constructor_Protein3DModel2();
	}


	//////////////////// Model /////////////////////////////////////////////////

	protein: any;


	//////////////////// 3D Layer //////////////////////////////////////////////

	threeDLayer: any;
	threeDGroup: any;
	private kebab: any;
	private kebabStick: any;

	private constructor_Protein3DModel1() {
		var that = this;

		//// get a 3D group
		that.threeDGroup = that.threeDLayer.new3dGroup();
		that.onDestruct(function () { that.threeDGroup.remove() });

		//// set the 'region' to 0 so that x and y from the graph layer
		//// correspond properly to the x and y we give to the 3D object
		that.threeDGroup.setRegion({ top: 0, left: 0, width: 0, height: 0 });


		var translationLength = 400; // TODO: GET REAL DATA

		//// Get the gene translation to use; i.e., the longest of the gene
		//
		var geneTranslation: any = _.max(that.protein.translations, 'length');

		//// utility variable
		//
		var DEG_TO_RAD = Math.PI / 180;


		////////// Creating the kebab //////////

		that.kebab = new that.THREE.Object3D();
		that.kebab.rotation.x = 90 * DEG_TO_RAD;
		that.kebab.scale.y = .15;


		////////// Creating the stick //////////

		var stickMaterial = new that.THREE.MeshLambertMaterial({ color: 0xaaaaaa });
		var stickGeometry = new that.THREE.CylinderGeometry(1, 1, geneTranslation.length, 32);
		that.kebabStick = new that.THREE.Mesh(stickGeometry, stickMaterial);
		that.kebabStick.translateY(geneTranslation.length / 2);
		that.kebab.add(that.kebabStick);


		////////// Populating the kebab //////////

		_.forEach(geneTranslation.domains, function (domain: any, index: number) {
			new ProteinDomain3DModel({
				id           : that.id + ":domain:" + index,
				parent       : that,
				proteinDomain: domain,
				parentObject : that.kebab,
				THREE        : that.THREE,
				threeDGroup  : that.threeDGroup
			});
		});

		that.threeDGroup.object.add(that.kebab);

	}

	set x(x: number) { this.kebab.position.x = x }

	set y(y: number) { this.kebab.position.y = -y }


	//////////////////// Focus /////////////////////////////////////////////////

	private constructor_Protein3DModel2() {
		var that = this;

		//// translate mouse events to focus events
		//
		function onMouseOver() {
			that.focus = true;
		}

		function onMouseOut() {
			that.focus = false;
		}

		function onClick() {
			that.focusFixed = !that.focusFixed;
		}

		that.threeDGroup.on(that.kebabStick, 'mouseover', onMouseOver);
		that.threeDGroup.on(that.kebabStick, 'mouseout', onMouseOut);
		that.threeDGroup.on(that.kebabStick, 'click', onClick);
		that.onDestruct(function () {
			that.threeDGroup.off(that.kebabStick, 'mouseover', onMouseOver);
			that.threeDGroup.off(that.kebabStick, 'mouseout', onMouseOut);
			that.threeDGroup.off(that.kebabStick, 'click', onClick);
		});

		//// change color based on focus-events
		//
		that.forEachMesh(that.kebabStick, function (thing) {
			thing.userData.initialColor = thing.material.color;
		});
		that.onFocus(function (flag) {
			if (!that.focusFixed) {
				that.forEachMesh(that.kebabStick, function (thing) {
					thing.material.color = (flag ? new that.THREE.Color('#ccffff') : thing.userData.initialColor);
				});
			}
		});
		that.onFocusFix(function (flag) {
			that.forEachMesh(that.kebabStick, function (thing) {
				thing.material.color = (flag ? new that.THREE.Color('#00cc00') : thing.userData.initialColor);
			});
		});
	}

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export class ProteinDomain3DModel extends ThreeJSModel {

	//////////////////// Construction //////////////////////////////////////////

	constructor(properties) {
		super(_.extend({
			type        : 'proteinDomain3DModel',
			relationType: 'protein domain',
			detailTemplateUrl: 'partial/amy-circuit-board/amy-tile/protein-domain-detail-view.html'
		}, properties));

		this.constructor_ProteinDomain3DModel1();
		this.constructor_ProteinDomain3DModel2();
	}


	//////////////////// Model /////////////////////////////////////////////////

	proteinDomain: any;


	//////////////////// 3D Layer //////////////////////////////////////////////

	threeDGroup: any;
	parentObject: any;
	private domainObject: any;

	private constructor_ProteinDomain3DModel1() {
		var that = this;

		var domainGeometry = new this.THREE.CylinderGeometry(3, 3, 1, 32);
		var domainMaterial = new that.THREE.MeshLambertMaterial({ color: ProteinDomain3DModel.domainColor(that.proteinDomain) });
		that.domainObject = new that.THREE.Mesh(domainGeometry, domainMaterial);
		that.domainObject.translateY(.5 * that.proteinDomain.start + .5 * that.proteinDomain.end);
		that.domainObject.scale.y = (that.proteinDomain.end - that.proteinDomain.start);
		that.parentObject.add(that.domainObject);
	}


	//////////////////// Focus /////////////////////////////////////////////////

	private constructor_ProteinDomain3DModel2() {
		var that = this;

		//// translate mouse events to focus events
		//
		function onMouseOver() {
			that.focus = true;
		}

		function onMouseOut() {
			that.focus = false;
		}

		function onClick() {
			that.focusFixed = !that.focusFixed;
		}

		that.threeDGroup.on(that.domainObject, 'mouseover', onMouseOver);
		that.threeDGroup.on(that.domainObject, 'mouseout', onMouseOut);
		that.threeDGroup.on(that.domainObject, 'click', onClick);
		that.onDestruct(function () {
			that.threeDGroup.off(that.domainObject, 'mouseover', onMouseOver);
			that.threeDGroup.off(that.domainObject, 'mouseout', onMouseOut);
			that.threeDGroup.off(that.domainObject, 'click', onClick);
		});

		//// change color based on focus-events
		//
		that.forEachMesh(that.domainObject, function (thing) {
			thing.userData.initialColor = thing.material.color;
		});
		that.onFocus(function (flag) {
			if (!that.focusFixed) {
				that.forEachMesh(that.domainObject, function (thing) {
					thing.material.color = (flag ? new that.THREE.Color('#ccffff') : thing.userData.initialColor);
				});
			}
		});
		that.onFocusFix(function (flag) {
			that.forEachMesh(that.domainObject, function (thing) {
				thing.material.color = (flag ? new that.THREE.Color('#00cc00') : thing.userData.initialColor);
			});
		});
	}


	//////////////////// Detail Panel //////////////////////////////////////////

	getTitle() {
		if (this.proteinDomain.type === 'pfam') {
			return this.proteinDomain.pfam_name.replace('_', ' ');
		} else if (this.proteinDomain.type === 'signalp') {
			return "Signal Peptide";
		} else { // this.proteinDomain.type === 'tmhmm'
			return "TMHMM";
		}
	}


	//////////////////// Colors ////////////////////////////////////////////////

	private static domainColors: any = {};
	private static uniqueColors: any[];
	private static colorCounter: number = 0;

	private static domainColor(domain) {
		if (_.isUndefined(ProteinDomain3DModel.uniqueColors)) {
			ProteinDomain3DModel.uniqueColors = ProteinDomain3DModel.randomColorRange(100);
		}

		if (domain.type === 'signalp') {
			return 'black';
		} else if (_.isUndefined(domain.pfam_id)) {
			return 'gray';
		}

		if (_.isUndefined(ProteinDomain3DModel.domainColors[domain.pfam_id])) {
			ProteinDomain3DModel.domainColors[domain.pfam_id] = ProteinDomain3DModel.uniqueColors[ProteinDomain3DModel.colorCounter];
			ProteinDomain3DModel.colorCounter = (ProteinDomain3DModel.colorCounter + 1) % 100;
		}
		return ProteinDomain3DModel.domainColors[domain.pfam_id];
	}


	private static randomColorRange(total) {
		var i = 360 / (total - 1); // distribute the colors evenly on the hue range
		var r = []; // hold the generated colors
		for (var x = 0; x < total; x++) {
			r.push(ProteinDomain3DModel.hsvToRgb(i * x, 100, 100));
		}
		return r;
	}

	private static hsvToRgb(h, s, v) {
		// TODO: use chroma library instead of this function
		var r, g, b;
		var i;
		var f, p, q, t;

		// Make sure our arguments stay in-range
		h = Math.max(0, Math.min(360, h));
		s = Math.max(0, Math.min(100, s));
		v = Math.max(0, Math.min(100, v));

		// We accept saturation and value arguments from 0 to 100 because that's
		// how Photoshop represents those values. Internally, however, the
		// saturation and value are calculated from a range of 0 to 1. We make
		// That conversion here.
		s /= 100;
		v /= 100;

		if (s == 0) {
			// Achromatic (grey)
			r = g = b = v;
			return 'rgb(' + Math.round(r * 255) + ',' + Math.round(g * 255) + ',' + Math.round(b * 255) + ')';
		}

		h /= 60; // sector 0 to 5
		i = Math.floor(h);
		f = h - i; // factorial part of h
		p = v * (1 - s);
		q = v * (1 - s * f);
		t = v * (1 - s * (1 - f));

		switch (i) {
			case 0:
				r = v;
				g = t;
				b = p;
				break;
			case 1:
				r = q;
				g = v;
				b = p;
				break;
			case 2:
				r = p;
				g = v;
				b = t;
				break;
			case 3:
				r = p;
				g = q;
				b = v;
				break;
			case 4:
				r = t;
				g = p;
				b = v;
				break;
			default:
				r = v;
				g = p;
				b = q;
		}

		return 'rgb(' + Math.round(r * 255) + ',' + Math.round(g * 255) + ',' + Math.round(b * 255) + ')';
	}


}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////




























