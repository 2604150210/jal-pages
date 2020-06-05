const {src, dest, parallel, series, watch} = require('gulp')

const del = require('del')
const browserSync = require('browser-sync')
const bs = browserSync.create()

const loadPlugins = require('gulp-load-plugins')
const plugins = loadPlugins()
// 后面的插件都是plugins的属性，如：plugins.sass
const {sass, babel, swig, imagemin} = plugins

const cwd = process.cwd() // 获取当前命令行所在的工作目录
let config= {
  // default config
  build: {
    src: 'src',
    dist: 'dist',
    temp: 'temp',
    public: 'public',
    paths: {
      styles: 'assets/styles/*.scss',
      scripts: 'assets/scripts/*.js',
      pages: '*.html',
      images: 'assets/images/**',
      fonts: 'assets/fonts/**'
    }
  }
}
try {
  const loadConfig = require(`${cwd}/pages.config.js`)
  config = Object.assign({}, config, loadConfig)
} catch (e) {}

const clean = () => {
  return del([config.build.dist, config.build.temp])
}

const style = () => {
  return src(config.build.paths.styles, { base: config.build.src, cwd: config.build.src })
  .pipe(sass({ outputStyle: 'expanded' }))
  .pipe(dest(config.build.temp))
  .pipe(bs.reload({stream: true}))
}

const script = () => {
  return src(config.build.paths.scripts, { base: config.build.src, cwd: config.build.src })
  .pipe(babel({ presets: [require('@babel/preset-env')] }))
  .pipe(dest(config.build.temp))
  .pipe(bs.reload({stream: true}))
}

const page = () => {
  return src(config.build.paths.pages, {base: config.build.src, cwd: config.build.src})
  .pipe(swig(config.data))
  .pipe(dest(config.build.temp))
  .pipe(bs.reload({stream: true}))
}

const image = () => {
  return src(config.build.paths.images, {base: config.build.src, cwd: config.build.src})
  // .pipe(imagemin())
  .pipe(dest(config.build.dist))
}

const font = () => {
  return src(config.build.paths.fonts, {base: config.build.src, cwd: config.build.src})
  // .pipe(imagemin())
  .pipe(dest(config.build.dist))
}

const extra = () => {
  return src('**', {base: config.build.public, cwd: config.build.public})
  .pipe(dest(config.build.dist))
}

const serve = () => {
  watch(config.build.paths.styles, {cwd: config.build.src}, style)
  watch(config.build.paths.scripts, {cwd: config.build.src}, script)
  watch(config.build.paths.pages, {cwd: config.build.src}, page)

  watch([
    config.build.paths.images,
    config.build.paths.fonts,
  ], {cwd: config.build.src}, bs.reload)

  watch('**', {cwd: config.build.public}, bs.reload)

  bs.init({
    notify: false,
    port: 2080,
    open: false,
    server: {
      baseDir: [config.build.temp, config.build.src, config.build.paths.pages], // 按顺序查找
      routes: {
        '/node_modules': 'node_modules'
      }
    }
  })
}

const useref = () => {
  return src(config.build.paths.pages, { base: config.build.temp, cwd: config.build.temp })
  .pipe(plugins.useref({ searchPath: [config.build.temp, '.'] }))
  .pipe(plugins.if(/\.js$/, plugins.uglify()))
  .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
  .pipe(plugins.if(/\.html$/, plugins.htmlmin({
    collapseWhitespace: true,
    minifyCSS: true,
    minifyJS: true
  })))
  .pipe(dest(config.build.dist))
}

// const compile = parallel(style, script, page, image, font)
const compile = parallel(style, script, page)

// 上线之前执行的任务
const build = series(
  clean,
  parallel(
    series(compile, useref),
    image,
    font,
    extra
  )
)

// 开发阶段
const develop = series(compile, serve)

module.exports = {
  clean,
  build,
  develop,
}