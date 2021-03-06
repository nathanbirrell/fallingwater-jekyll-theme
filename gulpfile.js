var gulp = require('gulp');
var $    = require('gulp-load-plugins')();

var path = require('path')
var shell = require('gulp-shell');
var browserSync = require('browser-sync').create();

var concat = require('gulp-concat');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var htmlmin = require('gulp-htmlmin');
var ghPages = require('gulp-gh-pages');


// FILE PATH CONFIG
var jsFiles = [
  'node_modules/what-input/what-input.js',
  'node_modules/foundation-sites/dist/foundation.js',
  'node_modules/vivus/dist/vivus.js',
  'node_modules/photoswipe/dist/photoswipe.js',
  'node_modules/photoswipe/dist/photoswipe-ui-default.js',
  'node_modules/slick-carousel/slick/slick.js',
  'js/modules/*.js',
  'js/*.js'
];
var jsDest = 'js/dist';

var sassPaths = [
  'node_modules/foundation-sites/scss',
  'node_modules/motion-ui/src',
  'node_modules/photoswipe/dist'
];

gulp.task('html', ['jekyll'], function() {
    // --> Minhtml
    gulp.src([
            path.join('_site/', '*.html'),
            path.join('_site/', '*/*/*.html'),
            path.join('_site/', '*/*/*/*.html')
        ])
        .pipe(htmlmin({
            collapseWhitespace: true
        }))
        .pipe(gulp.dest('_site/'))
        .pipe(browserSync.reload({
            stream: true,
            once: true
        }));
});

gulp.task('jekyll', [], function (gulpCallBack){
    var spawn = require('child_process').spawn;
    // After build: cleanup HTML
    var jekyll = spawn('jekyll', ['build'], {stdio: 'inherit'});

    jekyll.on('exit', function(code) {
        gulpCallBack(code === 0 ? null : 'ERROR: Jekyll process exited with code: '+code);
    });
});

gulp.task('build-jekyll', shell.task(['bundle exec jekyll build --config _config.yml,_config-prod.yml']));

gulp.task('serve-jekyll', shell.task(['bundle exec jekyll serve --config _config.yml']));

gulp.task('build-sass', function() {
  return gulp.src('scss/app.scss')
    .pipe($.sass({
      includePaths: sassPaths
    })
    .on('error', $.sass.logError))
    .pipe($.autoprefixer({
      browsers: ['last 2 versions', 'ie >= 9']
    }))
    .pipe(gulp.dest('css'))
    .pipe(browserSync.stream({match: '**/*.css'}));
});

gulp.task('build-js', function() {
  return gulp.src(jsFiles)
    // concat
    .pipe(concat('scripts.js'))
    .pipe(gulp.dest(jsDest))
    // uglify
    .pipe(rename('scripts.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest(jsDest))
    .pipe(browserSync.reload({stream:true, once: true}));
});

gulp.task('serve', function() {
  browserSync.init(null, {
      server: {
          baseDir: "./" + '_site/',
          injectChanges: true
      },
      // logFileChanges: true,
      // logLevel: 'debug',
      open: true        // Toggle to automatically open page when starting.
  });

  gulp.watch('scss/**/*.scss', ['build-sass']);

  gulp.watch(jsFiles, ['build-js']);

  // images are built as part of the Jekyll process
  gulp.watch('img/**/*', ['html']);
  gulp.watch('project-photos/**/*', ['html']);

  gulp.watch(['_config.yml'], ['html']);
  gulp.watch(['_posts/**/*.+(md|markdown|MD)'], ['html']);
  gulp.watch(['**/*.+(html|md|markdown|MD)', '!_site/**/*.*'], ['html']);
});

gulp.task('deploy-to-gh-pages', function() {
  return gulp.src('./_site/**/*')
    .pipe(ghPages());
});

gulp.task('dev', ['html','build-sass','build-js','serve', 'serve-jekyll']);
gulp.task('default', ['dev']);
gulp.task('build', ['html','build-sass','build-js']);
gulp.task('deploy', ['build','deploy-to-gh-pages']);
