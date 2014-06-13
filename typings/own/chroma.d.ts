
// Type definitions for chroma-js 0.5.7
// Project: http://driven-by-data.net/about/chromajs
// Definitions by: Michiel Helvensteijn <https://github.com/mhelvens>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

declare class Chroma {

	/**
	 *
	 *
	 * @param x
	 * @param y
	 * @param z
	 * @param m
	 */
	static color(x: any, y: any, z: any, m: any): any;

	/**
	 *
	 *
	 * @param h
	 * @param s
	 * @param l
	 * @param a
	 */
	static hsl(h: any, s: any, l: any, a: any): any;

	/**
	 *
	 *
	 * @param h
	 * @param s
	 * @param v
	 * @param a
	 */
	static hsv(h: any, s: any, v: any, a: any): any;

	/**
	 *
	 *
	 * @param r
	 * @param g
	 * @param b
	 * @param a
	 */
	static rgb(r: any, g: any, b: any, a: any): any;

	/**
	 *
	 *
	 * @param x
	 */
	static hex(x: any): any;

	/**
	 *
	 *
	 * @param x
	 */
	static css(x: any): any;

	/**
	 *
	 *
	 * @param l
	 * @param a
	 * @param b
	 */
	static lab(l: any, a: any, b: any): any;

	/**
	 *
	 *
	 * @param l
	 * @param c
	 * @param h
	 */
	static lch(l: any, c: any, h: any): any;

	/**
	 *
	 *
	 * @param h
	 * @param s
	 * @param i
	 */
	static hsi(h: any, s: any, i: any): any;

	/**
	 *
	 *
	 * @param r
	 * @param g
	 * @param b
	 * @param a
	 */
	static gl(r: any, g: any, b: any, a: any): any;

	/**
	 *
	 *
	 * @param a
	 * @param b
	 * @param f
	 * @param m
	 */
	static interpolate(a: any, b: any, f: any, m: any): any;

	/**
	 *
	 *
	 * @param a
	 * @param b
	 * @param f
	 * @param m
	 */
	static mix(a: any, b: any, f: any, m: any): any;

	/**
	 *
	 *
	 * @param a
	 * @param b
	 */
	static contrast(a: any, b: any): any;

	/**
	 *
	 *
	 * @param color
	 */
	static luminance(color: any): any;

	/**
	 *
	 *
	 * @param colors
	 * @param positions
	 */
	static scale(colors: any, positions: any): any;

	/**
	 *
	 */
	static scales: any;

	/**
	 *
	 *
	 * @param data
	 * @param key
	 * @param filter
	 */
	static analyze(data: any, key: any, filter: any): any;

	/**
	 *
	 *
	 * @param data
	 * @param mode
	 * @param num
	 */
	static limits(data: any, mode: any, num: any): any;

	/**
	 *
	 */
	static brewer: any;

	/**
	 *
	 */
	static colors: any;

	/**
	 *
	 */
	rgb(): any;

	/**
	 *
	 */
	rgba(): any;

	/**
	 *
	 */
	hex(): any;

	/**
	 *
	 */
	toString(): any;

	/**
	 *
	 */
	hsl(): any;

	/**
	 *
	 */
	hsv(): any;

	/**
	 *
	 */
	lab(): any;

	/**
	 *
	 */
	lch(): any;

	/**
	 *
	 */
	hsi(): any;

	/**
	 *
	 */
	gl(): any;

	/**
	 *
	 */
	luminance(): any;

	/**
	 *
	 */
	name(): any;

	/**
	 *
	 *
	 * @param alpha
	 */
	alpha(alpha: any): any;

	/**
	 *
	 *
	 * @param mode
	 */
	css(mode?: any): any;

	/**
	 *
	 *
	 * @param f
	 * @param col
	 * @param m
	 */
	interpolate(f: any, col: any, m: any): any;

	/**
	 *
	 */
	premultiply(): any;

	/**
	 *
	 *
	 * @param amount
	 */
	darken(amount: any): any;

	/**
	 *
	 *
	 * @param amount
	 */
	darker(amount: any): any;

	/**
	 *
	 *
	 * @param amount
	 */
	brighten(amount: any): any;

	/**
	 *
	 *
	 * @param amount
	 */
	brighter(amount: any): any;

	/**
	 *
	 *
	 * @param amount
	 */
	saturate(amount: any): any;

	/**
	 *
	 *
	 * @param amount
	 */
	desaturate(amount: any): any;

}

declare module "chroma" {

export = Chroma

}
