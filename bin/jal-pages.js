#!/usr/bin/env node
// MAC下文件读写权限要改为755

console.log('jal-pages')

process.argv.push('--cwd')
process.argv.push(process.cwd())
process.argv.push('--gulpfile')
process.argv.push(require.resolve('..'))
// console.log(process.argv)// 命令行中传递的参数

require('gulp-cli')();