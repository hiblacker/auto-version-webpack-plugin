# auto-version-webpack-plugin

Automatically generate versions when building。构建时自动生成版本号。

## Installation

Using npm:

```
npm i --save-dev auto-version-webpack-plugin
```

Or yarn:

```
yarn add -D auto-version-webpack-plugin
```

## Usage

生成版本号规则：

1. 使用根目录下 `package.json` 中的版本号，打包时更新版本号，并写入目标目录下的 `version.json` 文件
2. `package.json` 中版本号格式为 `${a}.${b}.${c}` 其中 a 不做修改，b、c 从 0 开始根据配置不同每次打包 +1
3. `version.json` 中版本号格式为 `${a}.${b}.${c}.${d}` a、b、c 同 2，d 为打包时间戳
4. 打包时如果传入版本号，则优先使用传入的版本号，格式：`a.b.c`

```js
const AutoVersionPlugin = require('auto-version-webpack-plugin')

module.exports = {
    module: {
        // ...
        plugins: [
            new AutoVersionPlugin({
                // 版本号以点分割成数组，第n位++。比如当前版本 1.0.0 whereToPlus为2，打包后的版本号为1.0.1。
                whereToPlus: 2,
                // 打包的路径，相对于跟目录
                versionDirectory: 'public',
                // 默认值：true，是否添加时间戳
                addTimestamp: true,
                // 默认值:2，可不填。package.json 缩进
                packageIndent: 4,
                // 如果传入版本号，优先使用此版本号，如当前版本 1.1.2 传入version 2.0.0 则构建完成后版本为2.0.0
                version: '2.0.0'
            })
        ]
    }
}
```

## example

vue-cli3 项目：
```js
const VersionPlugin = require('auto-version-webpack-plugin')
// 获取命令行参数
const argv = require('minimist')(process.argv.slice(2));
// 自定义的环境变量，打包到测试环境时，VUE_APP_ENV=test 生产环境时VUE_APP_ENV=prod
const env = process.env.VUE_APP_ENV

module.exports = {
    // ...
    configureWebpack() {
        return {
            plugins: [
                new VersionPlugin({
                    /**
                     * 假如打包前版本号为：1.0.0
                     * 打包环境为test时 打包后版本号为：1.0.1
                     * 打包环境为prod时 打包后版本号为：1.1.0
                     * 
                     * 打包时传入版本参数，如：
                     * yarn build --version 2.0.0
                     * 则打包后的版本号为2.0.0
                     *
                     */
                    whereToPlus: env === 'test' ? 2 : 1,
                    packageIndent: 4,
                    version:argv.version
                })
            ]
        }
    }
}

```
