'use strict'

const FStream = require('fs')
const argv = require('minimist')(process.argv.slice(2));

/**
 * 自动更新版本号插件
 * @author blacker
 * @param options
 */
function VersionPlugin(options) {
    let defaultOptions = {
        // 语义化版本号,传入false时，不更新版本
        semver: 'patch',
        // 是否在打包文件中注入版本信息文件
        inject: true,
        // 注入路径,'/'表示打包跟目录
        injectFileDirectory: '/',
        // 文件名字
        injectFileName: 'version.json',
        // 注入的版本号加入时间戳
        injectVersionTimestamp: true,
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
    let that = this
    compiler.hooks.done.tap('auto version plugin', function () {
        // 跳过开发环境
        if (compiler.options.mode === 'development') return
        // 获取项目 package.json
        let package_path = compiler.context + '/package.json'
        let package_json
        if (FStream.existsSync(package_path)) {
            package_json = require(package_path)
        } else {
            throw new Error('package.json 文件不存在')
        }

        // 获取升级方式
        let position = getSemverPosition(that.options)
        let newPackageJson = position !== false ? getNewPackageJson(package_json, position) : false

        // 写入package.json
        if (newPackageJson) {
            let path = compiler.context
            let jsonString = JSON.stringify(newPackageJson, null, that.options.packageIndent)
            writeFile(path, '/package.json', jsonString)
        }

        // 注入版本信息文件
        if (that.options.inject) {
            let version = newPackageJson.version || package_json.version
            let public_version = that.options.injectVersionTimestamp ? `${version}.${+new Date()}` : version
            let version_json = {
                version: public_version
            }
            if (that.options.custome) Object.assign(version_json, that.options.custome)
            let content = JSON.stringify(version_json)
            let build_path = compiler.options.output.path + that.options.injectFileDirectory
            writeFile(build_path,that.options.injectFileName,content)
        }
    })
}

const writeFile = (path, fileName, content) => {
    if (FStream.existsSync(path)) {
        write(path + fileName, content)
        return
    }
    FStream.mkdir(path, function (err) {
        if (err) throw err
        write(path + fileName, content)
    })

    function write(file, content) {
        FStream.writeFileSync(file, content, function (err) {
            if (err) throw err
        })
    }
}


/**
 * 获取更新后的 json
 *
 * @param    {json}     package_json    package.json: {"version":"1.1.1"}
 * @param    {number}   position        0，1，2
 *
 * @return   {json}     {"version":"1.2.0"}
 *
 */
const getNewPackageJson = (package_json, position) => {
    let oldJson = package_json
    let oldVersionArr = oldJson.version.split('.')
    oldVersionArr = oldVersionArr.map((i, k) => {
        if (k > position) {
            return 0
        }
        if (k === position) {
            return ++i
        }
        return i
    })
    oldJson.version = oldVersionArr.join('.')
    return oldJson
}

/**
 * 获取更新方式
 *
 * @return   {string}  'patch' 'minor' 'major'
 */
const getSemverPosition = (options) => {
    let value
    // 命令行
    const semver = {
        patch: 2,
        minor: 1,
        major: 0
    }
    Object.keys(semver).map(i => argv[i] ? value = semver[i] : '')
    // 没有获取到命令行参数
    if (value !== 0 && !value) {
        // 配置了不升级
        if (!options.semver) {
            return false
        }
        value = semver[options.semver]
    }
    return value
}


module.exports = VersionPlugin
