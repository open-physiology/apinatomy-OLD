/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="../../typings/own.d.ts" />
/// <reference path="CircuitBoardArtefact.d.ts" />

import $ = require('jquery');
import _ = require('lodash');
import ColorRange = require('../color/ColorRange');
import Artefact = require('../Artefact');
import CircuitBoardArtefact = require('amy-circuit-board/CircuitBoardArtefact');

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
			that.ancestor(CircuitBoardArtefact).draggingVertex = true;
			if (that.focusFixed) {
				previousFocusedArtefact = false;
			} else {
				previousFocusedArtefact = true;
				that.focusFixed = true;
			}
		}), that.$bind(function () {
			that._svgElement.removeSvgClass('dragging');
			that.ancestor(CircuitBoardArtefact).draggingVertex = false;
			$('svg[amy-graph-layer]').removeSvgClass('dragging');
			if (previousFocusedArtefact) {
				that.focusFixed = false;
			}
		}));
		that.onDestruct(function () { that._svgElement.offMouseDragDrop(); });
	}


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

		this.constructor_VascularConnection1();
	}


	//////////////////// Model /////////////////////////////////////////////////

	connectionType: string;
	subtype: string;
	source: any;
	target: any;
	soleSegment: any;
	hiddenJunctions: any[];
	linkDistanceFactor: number;


	//////////////////// Graph Layer ///////////////////////////////////////////


	svgClass() { return 'connection ' + this.connectionType + ' ' + this.subtype }

	private graphSegmentGroup: any;

	private constructor_VascularConnection1() {
		var that = this;
		if (that.soleSegment) {

			that.linkDistanceFactor = 4;
			that.source.chargeFactor = 4;
			that.target.chargeFactor = 4;

			that.graphSegmentGroup = that.graphLayer.newGraphGroup();
			that.graphSegmentGroup.setGravityFactor(0);
			that.graphSegmentGroup.setChargeFactor(0);
			that.graphSegmentGroup.setRegion(that);

			var onVariablesToggle = (function () {
				var variablesToggleD = that.$q.defer();
				that.$scope.$watch('$root.simulation', function (simulation) {
					variablesToggleD.notify(simulation);
				});
				return function onVariablesToggle(fn) { variablesToggleD.promise.then(null, null, fn); }
			}());

			that.ResourceService.fmaIdToVariables(that.soleSegment.segmentId).then(function (variables) {
				_(variables).forEach(function (variableUri) {
					that.linkDistanceFactor += 1;

					var variableArtefact;

					function addVariableGlyph(variable) {
						variableArtefact = new EdgeVariableGlyph({
							id         : (that.id + ':variableGlyph:' + variable.uri),
							$scope     : that.$scope,
							parent     : that,
							variable   : variable,
							showVertex : true,
							graphZIndex: 600, // above inner junctions

							ResourceService: that.ResourceService,
							TimerService   : that.TimerService,
							$bind          : that.$bind,
							$compile       : that.$compile
						});
						that.graphSegmentGroup.addVertex(variableArtefact);
						variableArtefact.onDestruct(function () {
							that.graphSegmentGroup.removeVertex(variableArtefact);
						});
					}

					onVariablesToggle(function (simulation) {
						if (!variableArtefact && simulation && simulation.model.outputVariables[variableUri]) {
							addVariableGlyph(simulation.variable(variableUri));
						} else if (variableArtefact) {
							variableArtefact.destructor();
							variableArtefact = null;
						}
					});
				});
			});
		}
	}


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

export class VariableGlyph extends SvgVertexArtefact {

	//////////////////// Construction //////////////////////////////////////////

	constructor(properties) {
		super(_.extend({
			type            : 'variableGlyph',
			relationType    : 'variable',
			popupTemplateUrl: 'amy-circuit-board/amy-tile/variable-trace-popup.html',
			detailTemplateUrl: 'amy-circuit-board/amy-tile/variable-details.html'
		}, properties));

		this.constructor_VariableGlyph1();
	}


	//////////////////// Meta data /////////////////////////////////////////////

	variable: any;


	//////////////////// Color /////////////////////////////////////////////////

	private static colorRange = new ColorRange();
	private static colorMap: {[id:string]:Chroma;} = {};

	private get color() {
		if (_.isUndefined(VariableGlyph.colorMap[this.variable.uri])) {
			VariableGlyph.colorMap[this.variable.uri] = VariableGlyph.colorRange.next();
		}
		return VariableGlyph.colorMap[this.variable.uri];
	}


	//////////////////// Data-stream ///////////////////////////////////////////

	traceData: number[][];
	shadowTraceData: number[][][] = [];

	private refreshTraceData(): ng.IPromise<number[][]> {
		var that = this;
		return that.variable.getVariableDataUpToTime(that.TimerService.currentTime).then((traceData) => {
			for (var i = that.traceData.length; i < traceData.length; ++i) {
				that.traceData.push(traceData[i]);
			}
			for (var j = that.traceData.length; traceData.length < j; --j) {
				that.traceData.pop();
			}
		});
	}

	private initializeTraceData(): void {
		var that = this;

		that.traceData = [];
		that.refreshTraceData().then(() => {
			that.shadowTraceData.push(_.cloneDeep(that.traceData)); // first shadow trace
			var timePointCount = that.TimerService.timePointCount;
			that.TimerService.onTimeChange(function () {
				var prevTimerPointCount = timePointCount;
				timePointCount = that.TimerService.timePointCount;
				that.refreshTraceData()
						.then(() => {
							for (var i = prevTimerPointCount; i < timePointCount; ++i) {
								if (_.isUndefined(that.shadowTraceData[0][i])) {
									if (!_.isUndefined(that.traceData[i])) {
										that.shadowTraceData[0].push(that.traceData[i]);
									}
								} else if (that.shadowTraceData[0][i] !== that.traceData[i]) {
									that.shadowTraceData.unshift(_.cloneDeep(that.shadowTraceData[0].slice(0, i)));
									--i; //// try again on the new shadow trace
								}
							}
						});
			});
			that.TimerService.onMaxTimeChange(function (newMaxTime) {
				if (newMaxTime === 0) {
					that.refreshTraceData().then(() => {
						that.shadowTraceData.length = 0;
						that.shadowTraceData.push(_.cloneDeep(that.traceData));
					});
				}
			});
		});
	}


	//////////////////// Graph Layer ///////////////////////////////////////////

	svgHtml() { return '<rect class="core" width="15" height="15" x="-7.5" y="-7.5"></rect>' }

	svgClass() { return 'variable-glyph' }


	//////////////////// Detail Popup //////////////////////////////////////////

	private constructor_VariableGlyph1() {
		var that = this;

		var subScope = that.$scope.$new(true);
		subScope.artefact = that;

		var traceDialogElement = null;

		function generateTraceDialog() {

			that.initializeTraceData();

			traceDialogElement = that.$compile(
					'<trace-diagram readonly focus-time="$root.focusTime" trace="artefact.traceData" shadow-traces="artefact.shadowTraceData" interval-x="::artefact.TimerService.interval" max-x="artefact.TimerService.maxTime" trace-color="{{ ::artefact.color.css() }}"></trace-diagram>'
			)(subScope);

			// the extra `div` bypasses a bug (?) that manifested
			// when switching focus between multiple open dialogs
			var dialogContainer = $('<div></div>').appendTo('main');
			traceDialogElement.dialog({
				appendTo     : dialogContainer,
				autoOpen     : false,
				closeOnEscape: true,
				closeText    : '×',
				dialogClass  : 'variable-glyph-trace-dialog',
				draggable    : true,
				height       : 300,
				width        : 300,
				modal        : false,
				resizable    : false,
				title        : that.variable.name,
				close        : function () {
					$(that.element).removeSvgClass('highlighted');
				}
			});

			traceDialogElement.dialog('widget').on('mouseenter', function () {
				// TODO: react with a highlighted glyph
			});
			traceDialogElement.dialog('widget').on('mouseleave', function () {
				// TODO: react with an unhighlighted glyph
			});

			that.onDestruct(function () {
				traceDialogElement.dialog('destroy');
			});

		}

		$(that.element).clickNotDrop(that.$bind(function () {
			if (traceDialogElement && traceDialogElement.dialog('isOpen')) {
				traceDialogElement.dialog('close');
				$(that.element).removeSvgClass('highlighted');
			} else {
				if (!traceDialogElement) { generateTraceDialog(); }
				traceDialogElement.dialog('open');
				$(that.element).addSvgClass('highlighted')
						.children('.core').attr('fill', that.color.css()).attr('stroke', 'black');
			}
		}));

		$(that.element).on('mouseover', that.$bind(function (event) {
			event.stopPropagation();
			that.focus = true;
		}));

		$(that.element).on('mouseout', that.$bind(function (event) {
			event.stopPropagation();
			that.focus = false;
		}));
	}

}

export class EdgeVariableGlyph extends VariableGlyph {

	//////////////////// Construction //////////////////////////////////////////

	constructor(properties) {
		super(properties);
	}


	//////////////////// Graph Layer ///////////////////////////////////////////

	svgHtml() { return '<circle class="core" r="4.5" stroke="red"></rect>' }

	svgClass() { return 'variable-glyph' }

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
			type             : 'static3DModel',
			relationType     : '3D model',
			detailTemplateUrl: 'amy-circuit-board/amy-tile/static-3d-model-details.html'
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
		var deferred = that.$q.defer();
		that.object3DQ = deferred.promise;

		//// determine the proper loader for the 3d model
		//
		var loader;
		if (/\.swc$/.test(that.filename)) { loader = new that.THREE.SWCLoader(); }
		else if (/\.obj$/.test(that.filename)) { loader = new that.THREE.OBJLoader(); }
		else if (/\.json$/.test(that.filename)) {
			loader = new that.THREE.JSONLoader();
			that.detailTemplateUrl = 'amy-circuit-board/amy-tile/dynamic-3d-model-details.html';
		}
		else {
			deferred.reject('The file "' + that.filename + '" is not supported.');
			return;
		}

		//// load the object
		//
		loader.load(that.filename, function (obj) {

			//// if a geometry is given (for .json files), give it a mesh of its very own
			if (obj instanceof that.THREE.Geometry) {
				(function () {
					obj.computeMorphNormals();
					var material = new THREE.MeshLambertMaterial({
						color       : 0xffaa55,
						morphTargets: true,
						morphNormals: true,
						vertexColors: that.THREE.VertexColors,
						shading     : that.THREE.SmoothShading
					});
					obj = new THREE.MorphAnimMesh(obj, material);
					obj.duration = 1000 * 60 / 72; // 72 beats per minute; TODO: parametrize
					that.threeDGroup.onRender(function () {
						obj.time = that.TimerService.accurateTime;
						obj.updateAnimation(0);
					});
				}());
			}

			//// add this object to the parent object
			that.parent3DObject.add(obj);
			that.onDestruct(function () { that.parent3DObject.remove(obj) });

			//// calculate bounding box of object; used for several purposes
			that.object3DBoundingBox = that.getCompoundBoundingBox(obj);

			//// normalize position
			var translation = that.object3DBoundingBox.center().negate();
			obj.traverse(function (o) {
				if (o.geometry) {
					o.geometry.applyMatrix(new that.THREE.Matrix4().setPosition(translation));
				}
			});

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

export class StaticCompound3DModel extends ThreeJSModel {

	//////////////////// Construction //////////////////////////////////////////

	constructor(properties) {
		super(_.extend({
			type        : 'static3DModel',
			relationType: '3D model'
		}, properties));

		this.constructor_StaticCompound3DModel1();
		//		this.constructor_StaticCompound3DModel2();
	}


	//////////////////// Model /////////////////////////////////////////////////

	threeDGroup: any;
	filename: string[];
	parent3DObject: any;

	private object3DQs: any;

	private constructor_StaticCompound3DModel1() {
		var that = this;

		that.object3DQs = that.$q.all(_.map(that.filename, function (model: any) {

			//// normalize input
			//
			if (_.isString(model)) {
				model = { file: model, color: '#000000' };
			}

			//// set a promise for the 3D object
			//
			var deferred = that.$q.defer();

			//// determine the proper loader for the 3d model
			//
			var loader;
			if (/\.swc$/.test(model.file)) { loader = new that.THREE.SWCLoader(); }
			else if (/\.obj$/.test(model.file)) { loader = new that.THREE.OBJLoader(); }
			else {
				deferred.reject('The file "' + model.file + '" is not supported.');
				return;
			}

			//// load the object
			//
			loader.load(model.file, function (obj) {

				//// add this object to the parent object
				var parentObj = new that.THREE.Object3D();
				parentObj.add(obj);
				that.parent3DObject.add(parentObj);
				that.onDestruct(function () { that.parent3DObject.remove(obj) });

				//// set proper material properties
				obj.children[0].material.side = that.THREE.DoubleSide;
				obj.children[0].material.color = new that.THREE.Color(model.color);
				if (!_.isUndefined(model.opacity) && model.opacity < 1) {
					obj.children[0].material.opacity = model.opacity;
					obj.children[0].material.transparent = true;
				}

				//// resolve the promise for the object
				deferred.resolve(obj);

			});

			return deferred.promise;

		})).then(function (objs) {

			//// find communal bounding box
			that.object3DBoundingBox = null;
			_.forEach(objs, function (obj) {
				if (_.isNull(that.object3DBoundingBox)) {
					that.object3DBoundingBox = that.getCompoundBoundingBox(obj);
				} else {
					that.object3DBoundingBox.union(that.getCompoundBoundingBox(obj));
				}
			});

			//// normalize positions
			_.forEach(objs, function (obj: any) {
				obj.children[0].position.sub(that.object3DBoundingBox.center());
				//				obj.children[0].geometry.applyMatrix(new this.THREE.Matrix4().setPosition(that.object3DBoundingBox.center().negate())); // TODO: why doesn't this work?
			});

			return objs;
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

	adjustToSize(size: { width: number; height: number; }) {
		var that = this;

		that.object3DQs.then(function (objs) {

			var ratio = Math.min(size.width / that.object3DBoundingBox.size().x, size.height / that.object3DBoundingBox.size().y) * .7;

			_.forEach(objs, function (obj: any) {
				//// adjust size
				obj.scale.set(ratio, ratio, ratio);

				//// rotate 180 degrees (ugly hack for one specific FTU model); TODO: generalize
				var DEG_TO_RAD = Math.PI / 180;
				obj.rotation.x = 180 * DEG_TO_RAD;

				//// adjust 'altitude'
				obj.position.z = 0.5 * ratio * that.object3DBoundingBox.size().z;
			});

		});
	}


	//////////////////// Focus /////////////////////////////////////////////////

	//	private constructor_StaticCompound3DModel2() {
	//		var that = this;
	//		that.object3DQ.then(function (obj) {
	//
	//			//// translate mouse events to focus events
	//			//
	//			function onMouseOver() {
	//				that.focus = true;
	//			}
	//
	//			function onMouseOut() {
	//				that.focus = false;
	//			}
	//
	//			function onClick() {
	//				that.focusFixed = !that.focusFixed;
	//			}
	//
	//			that.threeDGroup.on(obj, 'mouseover', onMouseOver);
	//			that.threeDGroup.on(obj, 'mouseout', onMouseOut);
	//			that.threeDGroup.on(obj, 'click', onClick);
	//			that.onDestruct(function () {
	//				that.threeDGroup.off(obj, 'mouseover', onMouseOver);
	//				that.threeDGroup.off(obj, 'mouseout', onMouseOut);
	//				that.threeDGroup.off(obj, 'click', onClick);
	//			});
	//
	//			//// change color based on focus-events
	//			//
	//			that.forEachMesh(obj, function (thing) {
	//				thing.userData.initialColor = thing.material.color;
	//			});
	//			that.onFocus(function (flag) {
	//				if (!that.focusFixed) {
	//					that.forEachMesh(obj, function (thing) {
	//						thing.material.color = (flag ? new that.THREE.Color('#ccffff') : thing.userData.initialColor);
	//					});
	//				}
	//			});
	//			that.onFocusFix(function (flag) {
	//				that.forEachMesh(obj, function (thing) {
	//					thing.material.color = (flag ? new that.THREE.Color('#00cc00') : thing.userData.initialColor);
	//				});
	//			});
	//
	//		});
	//	}

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
			type             : 'proteinDomain3DModel',
			relationType     : 'protein domain',
			detailTemplateUrl: 'amy-circuit-board/amy-tile/protein-domain-detail-view.html'
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
		var domainGeometry = new this.THREE.CylinderGeometry(3, 3, 1, 32);
		var domainMaterial = new this.THREE.MeshLambertMaterial({ color: ProteinDomain3DModel.domainColor(this.proteinDomain).hex() });
		this.domainObject = new this.THREE.Mesh(domainGeometry, domainMaterial);
		this.domainObject.translateY(.5 * this.proteinDomain.start + .5 * this.proteinDomain.end);
		this.domainObject.scale.y = (this.proteinDomain.end - this.proteinDomain.start);
		this.parentObject.add(this.domainObject);
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

	getTitle(): string {
		switch (this.proteinDomain.type) {
		case 'pfam':
			return this.proteinDomain.pfam_name.replace('_', ' ');
		case 'signalp':
			return "Signal Peptide";
		case 'tmhmm':
			return "TMHMM";
		}
	}


	//////////////////// Color /////////////////////////////////////////////////
	// TODO: test the new color-ranges on the protein domains

	private static colorRange = new ColorRange();
	private static colorMap: { [id: string]: Chroma; } = {};

	private static domainColor(domain): Chroma {
		if (domain.type === 'signalp') {
			return Chroma.hex('#000');
		} else if (_.isUndefined(domain.pfam_id)) {
			return Chroma.hex('#888');
		}
		if (_.isUndefined(ProteinDomain3DModel.colorMap[domain.pfam_id])) {
			ProteinDomain3DModel.colorMap[domain.pfam_id] = ProteinDomain3DModel.colorRange.next();
		}
		return ProteinDomain3DModel.colorMap[domain.pfam_id];
	}

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


