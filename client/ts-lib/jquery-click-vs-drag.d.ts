// Type definitions for jQuery 1.10.x / 2.0.x
// Project: http://jquery.com/
// Definitions by: Michiel Helvensteijn <https://github.com/mhelvens/>

/// <reference path="jquery.d.ts" />

interface JQuery {
	/**
	 * Sets a callback for when one of the matched set of elements is clicked but not dragged.
	 *
	 * @param fn The callback function for the click-not-drop event.
	 */
	clickNotDrop(fn: Function): JQuery;

	/**
	 * Sets a drag and a drop callback for when one of the matched set of elements is dragged but not clicked.
	 *
	 * @param dragFn The callback function for the mouse-drag-drop event.
	 * @param dropFn The callback function for the mouse-drag-drop event.
	 */
	mouseDragDrop(dragFn: Function, dropFn: Function): JQuery;

	/**
	 * Removes all clickNotDrop event handlers (actually, all 'mouseover' event handlers) from the matched elements.
	 */
	offClickNotDrop(): JQuery;

	/**
	 * Removes all offMouseDragDrop event handlers (actually, all 'mouseover' event handlers) from the matched elements.
	 */
	offMouseDragDrop(): JQuery;

}
