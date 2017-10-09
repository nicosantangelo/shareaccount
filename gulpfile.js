var path      = require('path')
var gulp      = require('gulp')
var uglify    = require('gulp-uglify-es').default
var minifyCss = require('gulp-minify-css')
var htmlmin   = require('gulp-htmlmin')
var imagemin  = require('gulp-imagemin')

var DIST_FOLDER = 'popup'

var paths = {
  html: toDist('*.html'),

  js: toDist('js', '*.js'),

  css: toDist('css', 'styles.css'),

  images: toDist('images', '*.png'),
}

gulp.task('html', function() {
  return gulp.src(paths.html)
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest(DIST_FOLDER))
})

gulp.task('scripts', function() {
  return gulp.src(paths.js)
    .pipe(uglify())
    .pipe(gulp.dest(toDist('js')))
})

gulp.task('styles', function() {
  return gulp.src(paths.css)
      .pipe(minifyCss({keepSpecialComments: 0}))
    .pipe(gulp.dest(toDist('css')))
})

gulp.task('images', function() {
  return gulp.src(paths.images)
    .pipe(imagemin({optimizationLevel: 5}))
    .pipe(gulp.dest(toDist('images')))
})

gulp.task('watch', function() {
  var toWatch = paths.html
    .concat(paths.js)
    .concat(paths.css)

  gulp.watch(toWatch, [ 'build' ])
})

gulp.task('build', ['html', 'scripts', 'styles', 'images'])

gulp.task('default', ['watch', 'build'])


function toDist(...args) {
  const parts = [DIST_FOLDER].concat(args)
  return path.join.apply(path, parts)
}
