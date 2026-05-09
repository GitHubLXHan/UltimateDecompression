declare module "aswallow" {
    interface IExtBundleVersion {
        path: string,
        version: string;
    }
    type ExtBundleVersionMap = { [key: string]: IExtBundleVersion };

    export interface IAswallowConfig {

        /**
         * 外部bundle资源目录路径
         * 默认ext-bundles
         */
        extBundleDir: string
        /**
         * 外部资源目录路径
         * 默认ext-res
         */
        externalResPath: string,
        /**
         * 默认相对于平台构建输出目录的路径,
         * 小游戏平台需要使用，用于替换externalResPath
         * 默认 build-ext-res
         *  */
        defaultBuildPath: string
        /**
         * 插件版本,自动生成
         * 
         */
        version?: string
        /**
         * 默认cc.assetManager.downloader.remoteServerAddress
         */
        miniGameRoot?: string,
        /**
         * 外部资源根路径
         * 原生 默认: jsb.fileUtils.getDefaultResourceRootPath
         * web 默认 ""
         * 小游戏 默认 miniGameRoot
         */
        extResRoot?: string
        /**
         * 模拟器外部bundle根路径
         * 自动生成
         */
        simulateExtBundleRoot?:string;
        /**
         * 外部bundle资源根路径
         * 原生 调试时(CC_DEBUG=true),使用simulateExtBundleRoot
         * web 默认 window.location.href
         */
        extBundleRoot?: string
        /**
         * 外部bundle名和信息映射字典
         * 自动生成
         */
        extBundleVersionMap?: { [key: string]: IExtBundleVersion }

    }
}