declare module "aswallow" {

    export interface IAswallowConfig {
        /**
         * 外部资源目录路径
         * 默认ext-res
         */
        externalResPath: string,
        /**
         * 插件版本,自动生成
         * 
         */
        version?: string
        /**
         * 微信小游戏远程资源服务器地址
         * 默认取值于cc.assetManager.downloader.remoteServerAddress
         */
        miniGameRoot?: string,
        /**
         * 发布后的外部资源根路径
         * 原生 默认: 如果资源作为远程资源则cc.assetManager.downloader.remoteServerAddress+remote,否则取值 jsb.fileUtils.getDefaultResourceRootPath
         * web 默认 ""
         * 小游戏 默认使用 miniGameRoot，并且拼接/remote
         */
        extResRoot?: string
        /**
         * 模拟器预览时使用的服务器URL
         * 编辑器启动时，根据预览url自动生成
         */
        simulateExtBundleRoot?: string;
        /**
         * 原生外部资源是否为远程资源，默认为false
         * 构建时自动生成
         */
        nativeExtResIsRemote?: boolean

    }
}