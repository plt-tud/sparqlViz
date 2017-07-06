var gulp = require('gulp');
var typescript = require('gulp-typescript');
var browserSync = require('browser-sync');
var less = require('gulp-less');
var concat = require('gulp-concat');
var browserify = require('gulp-browserify');

var paths = {
    appJS: [
        "js/graphicalSPARQL/*.ts"
    ],
    libJS: [
        "js/sparql-js/sparqljs-browser.js",
        "node_modules/socket.io-client/dist/socket.io.js",
        "node_modules/jquery/dist/jquery.min.js",
        "node_modules/angular/angular.min.js",
        "node_modules/angular-route/angular-route.min.js",
        "node_modules/d3/build/d3.min.js",
        "node_modules/ngstorage/ngStorage.js"
    ]
};

gulp.task('browserify-sparqljs', function() {
    gulp.src('node_modules/sparqljs/sparql.js')
        .pipe(browserify({
            insertGlobals : true
        }))
        .pipe(gulp.dest('node_modules/sparqljs/'));
});

gulp.task('ts', function() {
    return gulp.src(['./src/**/*.ts', 'typings/browser.d.ts'])
        .pipe(typescript({
            out: 'charting.js'
        }))
        .pipe(gulp.dest('./dist'));
});

gulp.task('appJS', function() {
    return gulp.src(paths.appJS)
        .pipe(typescript({
            out: 'app.js'
        }))
        .pipe(gulp.dest('./js'));
});

gulp.task('libJS', function() {
    return gulp.src(paths.libJS)
        .pipe(concat('lib.js'))
        .pipe(gulp.dest('./js'))
});

gulp.task('less', function() {
    return gulp.src('./src/**/*.less')
        .pipe(less({

        }))
        .pipe(gulp.dest('./dist'));
});

gulp.task('watch-less', function() {
    gulp.watch(['./src/**/*.less'], ['less']);
});

gulp.task('watch-appjs', function() {
    gulp.watch(paths.appJS, ['appJS']);
});



gulp.task('browserSync', function() {
    browserSync.init({
        server: './',
        index: './index.html',
        port: 3030,
        files: ['*.*']
    });
});


gulp.task('watch', ['dist', 'watch-appjs', 'watch-less', 'browserSync'], function() {

});

gulp.task('dist', ['appJS', 'less', 'libJS'], function() {

});

gulp.task('default', ['dist'], function() {

});