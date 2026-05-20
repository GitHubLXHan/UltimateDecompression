declare global {
    namespace cc {
        interface IFactory {
            create(url: string, data: any, ext: string, options: any, cb: (err, out) => void): void
        }
        interface AssetManager {
            factory: IFactory
        }
    }
    /**
     * 如燕
     */
    namespace aswallow {
        /**
         * 外部资源管理器
         */
        let extAssetMgr: IExtAssetManager;
        /**
         * 加载结果
         */
        interface ILoadResult {
            isCompleted: boolean,
            map: { [key: string]: cc.Asset };
        }
        /**
         * 加载结果
         */
        type LoadResult = cc.Asset | ILoadResult;
        /**
         * 预加载结果
         */
        interface IPreLoadResult {
            isCompleted: boolean,
            map: { [key: string]: cc.Asset };
        }
        /**
         * 预加载结果
         */
        type PreLoadResult = any | IPreLoadResult;
        interface IExtAssetManager {
            /**
            * 原生可读写目录路径，比如 /dara/data/some/path/to/
            * 远程服务器路径，比如 https://www.xxxx.com/
            * 原生JSB 默认assets
            * 模拟器 默认 window["deviceDataPath"];
            * web 默认 ""
            */
            root: string;
            /**
             * 根文件夹名,默认ext-res
             */
            baseDir: string;
            /**
             * 初始化
             * 初始化默认root和baseDir
             * @param root 根路径，原生平台默认assets，web平台默认"",小游戏平台读取cc.assetManager.downloader.remoteServerAddress，也就是构建时配置的资源服务器地址
             * @param baseDir 基础路径 ，小游戏平台默认 build-ext-res，其他默认ext-res
             * @param versionFilePath 版本记录文件路径 默认 ${root}/${baseDir}/version.json
             * @param retryCount 重试次数 默认2
             * @returns Promise<boolean>
             */
            init(root?: string, baseDir?: string, versionFilePath?: string, retryCount?: number): Promise<boolean>;
            /**
             * 缓存资源
             * @param url 
             * @param asset 
             */
            cache(url: string, asset: any): void;
            /**
             * 获取资源
             * @param path 路径 
             */
            get<T extends cc.Asset = any>(path: string): T;
            /**
             * 加载资源
             * @param resReqItems 
             * @param onComplete 
             * @param onProgress 
             */
            load(resReqItems: aswallow.ResRequestItem | aswallow.ResRequestItem[]
                , onComplete?: (error: Error, result: LoadResult) => void
                , onProgress?: (finish: number, total: number, item: any) => void
                , extraData?: any): void;
            /**
             * 移除缓存
             * @param key assetsMapKey
             */
            unCache(key: string): void;
            /**
             * 释放资源
             * @param resReqItems 请求配置信息数组
             */
            release(resReqItems: aswallow.ResRequestItem | aswallow.ResRequestItem[]): void
            /**
             * 释放资源
             * @param asset 资源
             */
            releaseAsset(asset: cc.Asset): void;
        }
        interface IAssetParser {
            type: keyof IExtAssetTypeKey,
            /**
             * 注册时赋值
             */
            extAssetMgr: IExtAssetManager;
            /**
             * 当注册时 
             */
            onRegist?(): void
            // getDeps?(url: string): aswallow.ResRequestItem[],
            /**
             * 解析
             * @param path 路径 没有经过处理的路径
             * @param data 数据
             */
            parse(path: string, data: any): any;
            /**
             * 获取所有引用资源请求对象
             * @param path 
             */
            getDepReqs?(req: aswallow.ResRequestItem): aswallow.ResRequestItem[]
        }
        type ResRequestItem = string | IResRequestItem;
        interface IResRequestItem {
            /**
             * 路径
             * !!不需要赋值!!
             */
            extResPath?: string
            /**
             * 绝对路径
             * 如果不带后缀则自动按照同名解析依赖文件 
             * 但需要给解析类型
             * 比如图集
             * url:ext-res/atlas/emoji
             * __extType:"plist"
             * 自动解析
             * ext-res/atlas/emoji.plist
             * ext-res/atlas/emoji.png
             * */
            url: string,
            /**后缀 */
            ext?: string,
            /**
             * 依赖需要写后缀
             *  
             * */
            deps?: string[]
            /**
             * 解析类型
             */
            assetType?: keyof IExtAssetTypeKey;
            /**
             * 原生可读写目录路径，比如 /dara/data/some/path/to/
             * 远程服务器路径，比如 https://www.xxxx.com/
             */
            root?: string
            /**
             * 根文件夹名,默认ext-res
             */
            baseDir?: string
            /**
             * 其余参数
             */
             extraData?: any
        }

    }
    interface IExtAssetTypeKey {

    }

}
export { };