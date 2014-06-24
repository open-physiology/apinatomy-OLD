/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../typings/own.d.ts" />

import _ = require('lodash');
//import artefacts = require('amy-circuit-board/artefacts');

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// abstract
class Artefact {

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
		if (!this.wasDestructed) {
			this.isBeingDestructed = true;
			_.forEachRight(this._destructCallbacks, _.call);
			this.isBeingDestructed = false;
			this.wasDestructed = true;
		}
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

	ancestor<T extends Artefact>(C: {new(any): T;}): T {
		var result = this.parent;
		while (result && !(result instanceof C)) {
			result = result.parent;
		}
		return <T>result;
	}

	getParent<T extends Artefact>(C: {new(any): T;}): T {
		return this.ancestor(C); // TODO: remove; redundant
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


	//////////////////// Detail Popup //////////////////////////////////////////

	popupTemplateUrl: string;


	//////////////////// Resources /////////////////////////////////////////////
	// TODO: make these three more globally available

	ResourceService: any;
	TimerService: any;
	$bind: any;
	$q: any;
	THREE: any;
	threeDLayer: any;
	$compile: any;

}

export = Artefact;
