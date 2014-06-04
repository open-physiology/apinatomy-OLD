/// <reference path="lodash.d.ts" />

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
