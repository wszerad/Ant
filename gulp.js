var gulp = require('gulp'),
	uglify = require('gulp-uglify'),
	rename = require("gulp-rename"),
	watch = require('gulp-watch'),
	concat = require('gulp-concat');

gulp.task('dev', function() {
	return watch('./lib/*.js', function(){
		gulp.src(['./lib/start.js','./lib/core.js', './lib/object.js', './lib/array.js', './lib/date.js', './lib/number.js','./lib/end.js'])
			.pipe(concat('ant.dev.js'))
			.pipe(gulp.dest('./dist/'));
	});
});

gulp.task('dev-once', function() {
	return gulp.src(['./lib/start.js','./lib/core.js', './lib/object.js', './lib/array.js', './lib/date.js', './lib/number.js','./lib/end.js'])
		.pipe(concat('ant.dev.js'))
		.pipe(gulp.dest('./dist/'));
});

gulp.task('minify', ['dev-once'], function() {
	return gulp.src('dist/ant.dev.js')
		.pipe(uglify())
		.pipe(rename({
			suffix: ".min"
		}))
		.pipe(gulp.dest('dist'));
});

gulp.task('default', ['dev']);
gulp.task('production', ['dev-once', 'minify']);