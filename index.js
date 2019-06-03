'use strict'

var FStream = require('fs')

/**
 * 版本信息生成插件
 * @author blacker
 * @param options
 */
function VersionPlugin(options) {
    if (options.whereToPlus > 2) throw new Error('whereToPlus error: expected 0,1,2')
    var defaultOptions = {
        // 版本号以点分割成数组，第n位++。比如当前版本 1.0.0 whereToPlus为2，打包后的版本号为1.0.1。
        whereToPlus: 2,
        versionDirectory: 'public',
        addTimestamp: true,
        packageIndent: 2,
        version: false
    }
    this.options = Object.assign(defaultOptions, options)
}

/**
 * 生成版本号规则
 *
 * 1. 使用根目录下 package.json 中的版本号，打包时更新版本号，并写入目标目录下的 version.json 文件
 * 2. package.json 中版本号格式为 `${a}.${b}.${c}` 其中 a  为手动修改，b、c 从 0 开始根据环境不同每次打包 +1
 * 3. version.json 中版本号格式为 `${a}.${b}.${c}.${d}` a、b、c 同 package.json，d 为打包时间戳
 * 4. 打包时如果传入版本号，则优先使用传入的版本号
 *
 */
VersionPlugin.prototype.apply = function(compiler) {
    var that = this

    compiler.plugin('compile', function() {
        var package_path = compiler.context + '/package.json'
        var package_json
        if (FStream.existsSync(package_path)) {
            package_json = require(package_path)
        } else {
            throw new Error('package.json 文件不存在')
        }

        // 1. 修改 package.json 中的 version
        var package_version = package_json.version
        var package_version_arr = package_version.split('.')
        package_version_arr[that.options.whereToPlus] = +package_version_arr[that.options.whereToPlus] + 1
        var newVersion = that.options.version || package_version_arr.join('.')
        package_json.version = newVersion
        FStream.writeFileSync(
            'package.json',
            JSON.stringify(package_json, null, that.options.packageIndent)
        )

        // 2. 写入 version.json
        var build_path = compiler.context + '/' + that.options.versionDirectory
        var version_file = build_path + '/version.json'
        var public_version = that.options.addTimestamp
            ? `${newVersion}.${+new Date()}`
            : newVersion
        var content = `{"version":"${public_version}"}`
        if (FStream.existsSync(build_path)) {
            writeVersion(version_file, content)
            return
        }
        FStream.mkdir(build_path, function(err) {
            if (err) throw err
            writeVersion(version_file, content)
        })
    })
}

const writeVersion = (versionFile, content) => {
    FStream.writeFile(versionFile, content, function(err) {
        if (err) throw err
    })
}

module.exports = VersionPlugin
