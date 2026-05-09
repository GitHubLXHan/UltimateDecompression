declare module "aswallow" {
    export interface IBuildConfig {
        /**插件版本 */
        version?: string
        /**是否启动 */
        isOpen: boolean,
        /**
         * 输出子项目命令行构建日志到编辑器控制台，默认false
         */
        outputSubProjBuildLog?: boolean,
        /**输出预览服务器日志 */
        outputPreviewServerLog?: boolean,
        /**
         * 强制重新发布，默认true
         */
        forceBuildSubProj?: boolean,
        /**
         * 多线程发布
         * 自动部署时可以开启
         * 默认false
         */
        mutiProgressBuildSubProj?: boolean,

        /**
         * 自定义构建脚本路径，相对路径
         * 属于跟随项目的固定配置 读取 settings/aswallow-build-config.json
         */
        scriptPath: string,
        /**
       * 子项目路径构建配置字典
       * key是子项目路径，尽量是相对路径，也可绝对
       * 属于跟随项目的固定配置 读取 settings/aswallow-build-config.json
       */
        subProjConfig: Record<string, any>,

        /**
         * 外部资源平台对应构建配置
         * 所有平台默认将外部资源作为远程资源
         * key为平台类型key，value为是否作为远程资源
         * 如果作为远程资源，构建时将复制到remote文件夹中
         * 平台类型:android,ios,web-mobile,web-desktop,mini-game,runtime
         * web平台默认构建到assets目录同级下
         * 小游戏和runtime平台默认构建到remote文件夹下
         * 属于跟随项目的固定配置 读取 settings/aswallow-build-config.json
         */
        extResPlatformBuildSetting: Record<string, boolean>
    }
    export interface IBuilderOption {
        /**构建的平台 */
        platform: "web-mobile" | "web-desktop" | "android" | "win32" | "ios" | "mac" | "wechatgame" | "wechatgame-subcontext" | "baidugame" | "baidugame-subcontext" | "xiaomi" | "alipay" | "qgame" | "quickgame" | "huawei" | "cocosplay" | "fb-instant-games" | "android-instant"
        /**engine 中需要排除的模块，模块可以从 
         * 这里:https://github.com/holycanvas/engine/blob/76460006e5046475cb714c48f801af8ea6a4fac9/modules.json
         *  查找到 */
        excludedModules: string[],
        /** 构建目录 */
        buildPath: string,
        /**主场景的 uuid 值（参与构建的场景将使用上一次的编辑器中的构建设置） */
        startScene: string,
        /**
         * 是否需要加入 source maps
         */
        sourceMaps: string,
        /**是否为 debug 模式 */
        debug: boolean
        /**
         * web desktop 窗口宽度
         */
        previewWidth: number
        /**
         * web desktop 窗口高度
         */
        previewHeight: number
        /**
         * web mobile 平台（不含微信小游戏）下的旋转选项 
         */
        webOrientation: ["landscape" | "portrait" | "auto"]
        /**
         * 是否内联所有 SpriteFrame
         */
        inlineSpriteFrames: boolean,
        /**是否将图集中的全部 SpriteFrame 合并到同一个包中 */
        optimizeHotUpdate: boolean
        /**- 包名 */
        packageName: string
        /**是否使用 debug keystore */
        useDebugKeystore: boolean
        /**keystore 路径 */
        keystorePath: string
        /**keystore 密码 */
        keystorePassword: string
        /**keystore 别名 */
        keystoreAlias: string
        /**keystore 别名密码 */
        keystoreAliasPassword: string,
        /**
         * native 平台（不含微信小游戏）下的旋转选项 [portrait, upsideDown, landscapeLeft, landscapeRight] 因为这是一个 object，所以定义会特殊一些：
        orientation={'landscapeLeft': true} 或 orientation={'landscapeLeft': true, 'portrait': true}
         */
        orientation: Object
        /**
         * native 平台下的模板选项 [default、link]
         */
        template: string
        /**
         * 设置编译 android 使用的 api 版本
         */
        apiLevel: number
        /**
         * 设置 android 需要支持的 cpu 类型，可以选择一个或多个选项[armeabi - v7a、arm64 - v8a、x86]
    因为这是一个数组类型，数据类型需要像这样定义，注意选项需要用引号括起来：

    appABIs = ['armeabi-v7a', 'x86']
         */
        appABIs: string[]
        /**
         * 是否在 Web 平台下插入 vConsole 调试插件
         */
        embedWebDebugger: boolean
        /**
         * 是否开启 md5 缓存
         */
        md5Cache: boolean
        /**
         * 是否在发布 native 平台时加密 js 文件
         */
        encryptJs: boolean,
        /**
         * 加密 js 文件时使用的密钥
         */
        xxteaKey: string
        /**
         * 加密 js 文件后是否进一步压缩 js 文件
         */
        zipCompressJs: boolean
        /**
         * 是否在构建完成后自动进行编译项目，默认为 否。
         */
        autoCompile: boolean
        /**
         * 参数文件路径。如果定义了这个字段，那么构建时将会按照 json 文件格式来加载这个数据，并作为构建参数
         */
        configPath: string,
        /**
         * 只构建脚本和资源
         */
        buildScriptsOnly: boolean
    }
    export interface IAssetBundleOption {

    }
    export interface IConfig {
        /**插件版本 */
        version?: string
        /**是否启动 */
        isOpen: boolean,

        /**自定义构建脚本路径，相对路径 */
        scriptPath: string

        /**子项目路径 */
        subProjPaths: string[]


    }


    export interface IPlatformBuildConfig {
        /**是否相对于平台构建输出目录 */
        isRelativePlatformBuildPath: boolean
        /**构建路径 */
        buildPath: string
    }
    export interface IBuildOption {

        /**
         * 转换为相对项目路径的绝对路径
         * 比如 local => xxx/projectPath/local
         * @param relativePath 
         * @returns 
         */
        resolveToProjectPath?(relativePath: string): string,
        /**外部资源目录路径 */
        externalResPath?: string,
        /**输出路径 */
        targetPath?: string,
        /**
         * 文件匹配工具
         * 使用文档：https://github.com/mrmlnc/fast-glob
         */
        fastGlob?: typeof import("fast-glob")
        /**
         * 文件操作工具
         * 使用文档：https://github.com/jprichardson/node-fs-extra
         */
        fs?: typeof import("fs-extra")
        /**插件工具函数 */
        utils: typeof import("./src/main/utils")
        /**
         * 子项目发布工具
         */
        subProjPublishUtils: typeof import("./src/main/sub-proj-build-utils");
        /**nodejs 路径处理工具模块 */
        path: typeof import("path")
        configs: { buildConfig: IBuildConfig, aswallowConfig: IAswallowConfig }
    }
    export interface IBuildScript {
        /**构建开始 */
        onBuildStart: (options: BuildOptions, cb: Function, toolOpt: IBuildOption) => void
        /**构建结束之前 */
        onBeforeBuildFinish: (options: BuildOptions, cb: Function, toolOpt: IBuildOption) => void
        /**构建结束 */
        onBuildFinished: (options: BuildOptions, cb: Function, toolOpt: IBuildOption) => void
    }

    export interface ICCSettings {
        bundleVers: Record<string, string>
        remoteBundles: any[],
        subpackages: any[]
        platform: string
        launchScene: string,
        hasStartSceneBundle: boolean
        hasResourcesBundle: boolean
        groupList: string[]
        collisionMatrix: Array<boolean[]>
        orientation: string,
        jsList: string[]
    }
}
declare module "aswallow-utils" {
    import * as fse from "fs-extra"
    import * as path from "path";
    import * as crypto from "crypto";
    /**
     * 转换为相对项目路径的绝对路径
     * 比如 local => xxx/projectPath/local
     * @param relativePath 
     * @returns 
     */
    export function resolveToProjectPath(relativePath: string): string;
    /**
     * 
     * @param configPath 绝对或者相对路径
     * @param config 
     * @returns 
     */
    export function saveConfig(configPath: string, config: any): void;

    /**
     * 读取配置
     * @param configPath 
     */
    export function getConfig(configPath: string): any;
    /**
     * 遍历文件
     * @param dirPath 文件夹路径
     * @param eachCallback 遍历回调 (filePath: string) => void
     */
    export function forEachFile(fileOrDirPath: string, eachCallback?: (filePath: string) => void): void;
    function readFile(filepath: string): any;
    //md5
    export function md5(filepath: string): string;
    /**
     * 给文件名加md5后缀
     * @param filepath 
     * @returns md5-filepath
     */
    export function renameByMD5(filepath: string): string;
    /**
     * 生成version.json
     * @param dirPath 
     */
    export function versionExtRes(dirPath: string): void;
}
