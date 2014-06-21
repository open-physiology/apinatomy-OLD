/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="../../typings/own.d.ts" />

import $ = require('jquery');
import _ = require('lodash');
import Chroma = require('chroma');

var PHI = (1 + Math.sqrt(5)) / 2; // golden ratio

class ColorRange {

	private _hue:       number = 45; // starting with red
	private _lightness: number = 50; // (lightness = 50, hue = 45)

	private _cycle(prop, bottom, top, q) {
		this[prop] = (this[prop] - bottom + (top-bottom) / q) % (top-bottom) + bottom;
	}

	next(): Chroma {
		var result = Chroma.lch(this._lightness, 100, this._hue);
		this._cycle('_hue', 0, 360, PHI);
		this._cycle('_lightness', 10, 90, PHI/2.5);
		return result;
	}

}

export = ColorRange;
