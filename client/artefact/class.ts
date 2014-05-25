/// <reference path="../lib-ts/lodash.d.ts" />




//
//declare var require:(moduleId: string) => any;
//
////noinspection JSUnusedAssignment
//var _ = require('lodash');

function Artefact(properties) {


	//// pass in the properties
	//
	_(this).assign(properties);


	//// ensure a unique identifier
	//
	if (!this.id) { this.id = _.uniqueId(); }


	//// manage the hierarchy
	//
	if (this.parent) {
		this.root = this.parent.root;
		this.parent.children.push(this);
	} else {
		this.root = this;
	}
	if (_(this.children).isUndefined()) {
		this.children = [];
	}


	////
	//


}

export = Artefact;

