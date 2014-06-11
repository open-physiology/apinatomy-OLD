/// <reference path="tsd.d.ts" />

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

interface LoDashStatic {

	/**
	 * Calls the function that is passed as a parameter and returns the result.
	 *
	 * @param fn the function to call
	 */
	call<T>(fn: ()=>T): T;

	/**
	 * Calls all the functions given in an array in order.
	 *
	 * @param A the array of functions to call
	 */
	callEach( A: {():any}[] ): void;

	/**
	 * Calls all the functions given in an array in reverse order.
	 *
	 * @param A the array of functions to call
	 */
	callEachRight( A: {():any}[] ): void;

}
