'use strict'

var FStream = require('fs')

/**
 * 自动更新版本号插件
 * @author blacker
 * @param options
 */
function VersionPlugin(options) {
    if (options.whereToPlus > 2) throw new Error('whereToPlus error: expected 0,1,2')
    var defaultOptions = {
        // 语义化版本号
        semver:'patch',
        // 注入路径
        versionDirectory: '/',
        // 文件名字
        fileName:'version.json',
        packageIndent: 2,
        custome: null
    }
    this.options = Object.assign(defaultOptions, options)
}

/**
 * 更新版本号规则
 *
 * 1. 使用根目录下 package.json 中的版本号，打包时更新版本号，并写入打包目录下的 version.json 文件
 * 2. 遵从 Semver 规范（语义化版本号），权重顺序：
 *      - 1 命令行：
 *          --patch 升级补丁版本号
 *          --minor 升级小版本号
 *          --major 升级大版本号
 *
 *      - 2 修改配置：semver:
 *          "patch" 升级补丁版本号
 *          "minor" 升级小版本号
 *          "major" 升级大版本号
 *
 *      - 3 若不想默认升级，修改配置：semver:false
 *
 * 3. custome 加入自定义信息
 *
 */
VersionPlugin.prototype.apply = function (compiler) {
    var that = this

    compiler.plugin('compile', function (compilation, callback) {
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
        if (that.options.whereToPlus === 1) package_version_arr[2] = 0
        var newVersion = that.options.version || package_version_arr.join('.')
        package_json.version = newVersion
        FStream.writeFileSync(
            'package.json',
            JSON.stringify(package_json, null, that.options.packageIndent)
        )

        // 2. 写入 version.json
        var build_path = compiler.context + '/' + that.options.versionDirectory
        var version_file = build_path + that.options.fileName
        var public_version = that.options.addTimestamp ? `${newVersion}.${+new Date()}` : newVersion
        var version_json = {
            version: public_version
        }
        if (that.options.custome) Object.assign(version_json, that.options.custome)
        var content = JSON.stringify(version_json)
        if (FStream.existsSync(build_path)) {
            writeVersion(version_file, content)
            return
        }
        FStream.mkdir(build_path, function (err) {
            if (err) throw err
            writeVersion(version_file, content)
        })
        callback()
    })
}

const writeVersion = (versionFile, content) => {
    FStream.writeFile(versionFile, content, function (err) {
        if (err) throw err
    })
}

module.exports = VersionPlugin
