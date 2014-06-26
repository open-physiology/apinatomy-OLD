/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="../../typings/own.d.ts" />

import _ = require('lodash');

var TIME = 0;
var VALUE = 1;

class Variable {

	constructor(name, uri, streamSource) {
		this.name = name;
		this.uri = uri;
		this.streamSource = streamSource;
	}

	name: string;
	uri: string;
	streamSource: any;

	getDataUpToTime(endTime) {
		// TODO
	}


}

export = Variable;
