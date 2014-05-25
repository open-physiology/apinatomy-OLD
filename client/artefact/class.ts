/// <reference path="../ts-lib/lodash.d.ts" />

import _ = require('lodash');

class Artefact {

	id: string;
	type: string;

	parent: Artefact;
	root: Artefact;
	children: Artefact[];

	detailTemplateUrl: string;

	constructor(properties) {
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
		if (_.isUndefined(this.children)) {
			this.children = [];
		}
	}

	destructor(): void {
		_.pull(this.parent.children, this);
	}

	ancestor<T>(type: string): Artefact {
		var result = this.parent;
		while (result && result.type === type) {
			result = result.parent;
		}
		return result;
	}

}

export = Artefact;
