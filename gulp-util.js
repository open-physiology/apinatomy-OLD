'use strict';

var baseDirOption = { base: process.cwd() };

////////////////////////////////////////////////////////////////////////////////////////////////////

var gulp = require('gulp');
var rename = require('gulp-rename');

////////////////////////////////////////////////////////////////////////////////////////////////////
// a version of 'rename' that groups all extensions, e.g., '.min.js'                              //
////////////////////////////////////////////////////////////////////////////////////////////////////

exports.rename = function (fn) {
	return rename(function (file) {
		var extraExt = /^(.+?)(\..+)$/.exec(file.basename + file.extname);
		if (extraExt) {
			file.basename = extraExt[1];
			file.extname = extraExt[2];
		}
		fn(file);
	});
};

////////////////////////////////////////////////////////////////////////////////////////////////////
// a way to register a transpilation for both batch-jobs and file-watchers                        //
////////////////////////////////////////////////////////////////////////////////////////////////////

exports.register = function (name, glob, processFn) {
	gulp.task(name, function () {
		processFn(gulp.src(glob, baseDirOption)).pipe(gulp.dest('.'));
	});

	gulp.task('watch-' + name, function () {
		gulp.watch(glob, function (event) {
			if (event.type !== 'deleted') {
				processFn(gulp.src(event.path, baseDirOption)).pipe(gulp.dest('.'));
			}
		});
	});
};

