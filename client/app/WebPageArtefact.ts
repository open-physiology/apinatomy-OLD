/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="../../typings/own.d.ts" />

import _ = require('lodash');
import Artefact = require('../Artefact');

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class WebPageArtefact extends Artefact {

	//////////////////// Construction //////////////////////////////////////////

	constructor(properties) {
		super(_.extend({
			type  : 'webPage',
			parent: null
		}, properties));
	}

}

export = WebPageArtefact;
