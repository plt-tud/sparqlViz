var gulp = require('gulp');
var typescript = require('gulp-typescript');
var browserSync = require('browser-sync');
var less = require('gulp-less');
var concat = require('gulp-concat');
var browserify = require('gulp-browserify');
var gulpCopy = require('gulp-copy');





var paths = {
    static: [
        "index.html",
        "templates/**",
        "img/**",
        "fonts/**",
        "css/**"
    ],
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


gulp.task('static', function() {
    return gulp
        .src(paths.static)
        .pipe(gulpCopy("dist"));
});


gulp.task('appJS', function() {
    return gulp.src(paths.appJS)
        .pipe(typescript({
            out: 'app.js'
        }))
        .pipe(gulp.dest('dist/js'));
});

gulp.task('libJS', function() {
    return gulp.src(paths.libJS)
        .pipe(concat('lib.js'))
        .pipe(gulp.dest('dist/js'))
});

gulp.task('less', function() {
    return gulp.src('./**/*.less')
        .pipe(less({

        }))
        .pipe(gulp.dest('dist'));
});

gulp.task('watch-less', function() {
    gulp.watch(['./**/*.less'], ['less']);
});

gulp.task('watch-appjs', function() {
    gulp.watch(paths.appJS, ['appJS']);
});



gulp.task('browserSync', function() {
    browserSync.init({
        server: 'dist/',
        index: './index.html',
        port: 3030
    });
});


gulp.task('watch', ['dist', 'watch-appjs', 'browserSync'], function() {

});

gulp.task('dist', ['appJS', 'libJS', 'static'], function() {

});

gulp.task('default', ['dist'], function() {

});