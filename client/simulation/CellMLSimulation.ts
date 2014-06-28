/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="../../typings/own.d.ts" />
/// <amd-dependency path="app/module" />
/// <amd-dependency path="cellml/service" />
declare var require;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import _ = require('lodash');
var app: ng.IModule = require("app/module");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var CellMLService: any;
var $q: ng.IQService;

var TIME = 0;
var VALUE = 1;

class CellMLSimulation {

	constructor(model: any, timeInterval: number, prefetchSize: number) {
		var that = this;

		that.model = model;
		that.timeInterval = timeInterval;
		that.prefetchSize = prefetchSize;
		that.serverInstance = new CellMLService(model);
		_(model.outputVariables).forEach((outputVar: {uri: string;}) => {
			that.dataCache[outputVar.uri] = [];
		});
	}

	model: any;
	timeInterval: number;
	serverInstance: any;
	prefetchSize: number;

	private timeToIndex(time: number): number {
		return time / this.timeInterval;
	}

	private dataCache: {[v:string]:number[][];} = {};
	private pastLastValidTime: number = 0;
	private latestPromise: ng.IPromise<any> = $q.when(null);

	getVariableDataUpToTime(variable, time): ng.IPromise<number[][]> {
		var that = this;

		if (time >= that.pastLastValidTime) {
			that.latestPromise = that.latestPromise.then(() => {
				return that.serverInstance.executeModel(that.pastLastValidTime, time + that.prefetchSize * that.timeInterval, that.timeInterval).then((newValues: {[v:string]: number[][];}) => {
					_(newValues).forEach((varValues: number[][], varName: string) => {
						var i = that.timeToIndex(varValues[0][TIME]);
						_(varValues).forEach((val) => {
							that.dataCache[varName][i++] = val;
						});
					});
					that.pastLastValidTime = time + that.prefetchSize * that.timeInterval;
				});
			});
		}

		return that.latestPromise.then(() => {
			return that.dataCache[variable].slice(0, that.timeToIndex(time) + 1);
		});
	}

	setVariableValues(firstTime: number, values: {[v:string]: number;}): ng.IPromise<any> {
		var that = this;

		that.latestPromise = that.serverInstance.setValues(values).then(() => {
			that.pastLastValidTime = firstTime;
		});

		return that.latestPromise;
	}

	variable(uri: string) {
		var that = this;
		return {
			get uri(): string {
				return uri;
			},
			get name(): string {
				return that.model.outputVariables[uri].name;
			},
			getVariableDataUpToTime(time: number): ng.IPromise<number[][]> {
				return that.getVariableDataUpToTime(uri, time);
			}
		};
	}

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.factory('CellMLSimulation', ['CellMLService', '$q', (CellMLService_: any, $q_: ng.IQService) => {
	CellMLService = CellMLService_;
	$q = $q_;
	return CellMLSimulation;
}]);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export = CellMLSimulation;
