/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="../../typings/own.d.ts" />

import $ = require('jquery');
import _ = require('lodash');
import Chroma = require('chroma');

class ColorRange {

	private static _colorByHue(h: number): Chroma {
		return Chroma.lch(50, 100, h % 360);
	}

	private _hue: number = 45; // starting with red (hue = 45)

	private _addToHue(v: number): void {
		this._hue = (this._hue + v) % 360;
	}

	private _sliceSize: number = 360*2;
	private _sliceCount: number = 1/2;
	private _sliceNr: number = 1;

	private _nextHue(): void {
		if (this._sliceNr >= this._sliceCount) {
			this._sliceSize /= 2;
			this._sliceCount *= 2;
			this._sliceNr = 0;
			this._addToHue(this._sliceSize / 2);
		}
		this._addToHue(this._sliceSize);
		this._sliceNr += 1;
	}


	next(): Chroma {
		var result = ColorRange._colorByHue(this._hue);
		this._nextHue();
		return result;
	}

}

export = ColorRange;
