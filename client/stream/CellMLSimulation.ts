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

	constructor(modelFile: any, timeInterval: number, prefetchSize: number) {
		var that = this;

		that.modelFile = modelFile;
		that.timeInterval = timeInterval;
		that.prefetchSize = prefetchSize;
		that.serverInstance = new CellMLService(modelFile);
		_(modelFile.outputVariables).forEach((outputVar: {name: string;}) => {
			that.dataCache[outputVar.name] = [];
		});
	}

	modelFile: any;
	timeInterval: number;
	serverInstance: any;
	prefetchSize: number;

	private timeToIndex(time: number): number {
		return time / this.timeInterval;
	}

	private dataCache: {[v:string]: number[][];} = {};
	private pastLastValidTime: number = 0;
	private latestPromise: ng.IPromise<any> = $q.when(null);

	getDataUpToTime(variable, time): ng.IPromise<number[][]> {
		var that = this;

		if (time >= that.pastLastValidTime) {
			that.latestPromise = that.latestPromise.then(() => {
				return that.serverInstance.executeModel(that.pastLastValidTime, time + that.prefetchSize, that.timeInterval).then((newValues: {[v:string]: number[][];}) => {
					_(newValues).forEach((varValues: number[][], varName: string) => {
						that.dataCache[varName].length = time + that.prefetchSize + 1;
						var i = that.timeToIndex(varValues[0][TIME]);
						_(varValues).forEach((val) => {
							that.dataCache[varName][i++] = val;
						});
					});
					that.pastLastValidTime = time + that.prefetchSize;
				});
			});
		}

		return that.latestPromise.then(() => {
			return that.dataCache[variable].slice(0, that.timeToIndex(time));
		});
	}

	setVariableValues(firstTime: number, values: {[v:string]: number;}): ng.IPromise<any> {
		var that = this;

		that.latestPromise = that.serverInstance.setValues(values).then(() => {
			that.pastLastValidTime = firstTime;
		});

		return that.latestPromise;
	}

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.factory('CellMLSimulation', ['CellMLService', '$q', (CellMLService_: any, $q_: ng.IQService) => {
	CellMLService = CellMLService_;
	$q = $q_;
	return CellMLSimulation;
}]);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
