// Type definitions for jQuery 1.10.x / 2.0.x
// Project: http://jquery.com/
// Definitions by: Michiel Helvensteijn <https://github.com/mhelvens/>

/// <reference path="jquery.d.ts" />

interface JQuery {
	/**
	 * Adds the specified class(es) to each of the set of matched svg elements.
	 *
	 * @param className One or more space-separated classes to be added to the class attribute of each matched svg element.
	 */
	addSvgClass(className: string): JQuery;

	/**
	 * Removes the specified class(es) from each of the set of matched svg elements.
	 *
	 * @param className One or more space-separated classes to be removed from the class attribute of each matched svg element.
	 */
	removeSvgClass(className: string): JQuery;

	/**
	 * Toggles the specified class(es) on each of the set of matched svg elements.
	 *
	 * @param className One or more space-separated classes to be toggled on the class attribute of each matched svg element.
	 */
	toggleSvgClass(className: string): JQuery;

	/**
	 * Adds or removes the specified class(es) on each of the set of matched svg elements.
	 *
	 * @param className One or more space-separated classes to be affected on the class attribute of each matched svg element.
	 * @param flag Whether to add or remove the given classes.
	 */
	setSvgClass(className: string, flag: boolean): JQuery;

}
