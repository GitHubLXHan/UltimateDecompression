import { DragonBonesAssetParser, DragonBonesAtlasAssetParser } from "./dragonbone-asset-parser";
import { PlistAssetParser } from "./plist-asset-parser";
import { SpineAssetParser } from "./spine-asset-parser";
import { TiledMapAssetParser } from "./tiled-map-asset-parser";
const miniGamePlatforms = [
    cc.sys.WECHAT_GAME,
    cc.sys.ALIPAY_GAME,
    cc.sys.QTT_GAME,//趣头条
    cc.sys.BYTEDANCE_GAME,
    cc.sys.HUAWEI_GAME,
    cc.sys.OPPO_GAME,
    cc.sys.VIVO_GAME,
    cc.sys.XIAOMI_GAME,
    cc.sys.BAIDU_GAME,
    cc.sys.JKW_GAME,//CocosPlay
    cc.sys.LINKSURE,//连尚小游戏
    cc.sys.TAOBAO_MINIGAME//淘宝小游戏
];
export class AwExtAssetManager implements aswallow.IExtAssetManager {


    private _verUrlMap: { [key: string]: string } = {};
    // private _extAssetMap: { [key: string]: cc.Asset } = {};
    private _handlerMap: { [key: string]: aswallow.IAssetParser } = {};
    private _inited: boolean;
    constructor() {
        this.registAssetParser(new DragonBonesAssetParser());
        this.registAssetParser(new DragonBonesAtlasAssetParser());
        this.registAssetParser(new PlistAssetParser());
        this.registAssetParser(new SpineAssetParser());
        this.registAssetParser(new TiledMapAssetParser());
    }
    /**
    * 原生可读写目录路径，比如 /dara/data/some/path/to/
    * 远程服务器路径，比如 https://www.xxxx.com/
    * 原生JSB 默认assets
    * 模拟器 默认 window["deviceDataPath"];
    * web 默认 ""
    */
    private _root: string;

    public get root(): string {
        return this._root;
    }
    public set root(root: string) {
        if (root === undefined || root === null) return;
        this._root = root;
    }
    /**
     * 根文件夹名,默认ext-res
     */
    public _baseDir: string;

    public set baseDir(dirName: string) {
        if (dirName === undefined || dirName === null) return;
        this._baseDir = dirName;
    }
    public get baseDir(): string {
        return this._baseDir;
    }

    private _versionFilePath: string;

    public init(root?: string, baseDir?: string, versionFilePath?: string, retryCount?: number): Promise<boolean> {
        if (this._inited) return;
        this._inited = true;
        if (this._isMiniGame()) {
            const serverUrl = cc.assetManager.downloader.remoteServerAddress;
            this.root = `${serverUrl}`;
            this.baseDir = baseDir ? baseDir : "build-ext-res";
        }
        if (root && root.trim() !== "") {
            this._root = root;
        } else if (window["CC_SIMULATOR"]) {
            this._root = window["deviceDataPath"];
        } else if (CC_JSB) {
            this._root = "assets";
        }
        if (!this._root) {
            this._root = "";
        }
        if (!this._baseDir || this._baseDir.trim() === "") {
            this._baseDir = "ext-res";
        }

        this._versionFilePath = versionFilePath ? versionFilePath : "version.json";
        let transformUrl = "";
        if (CC_JSB) {
            transformUrl = this._transformUrl({ url: this._versionFilePath });
        } else {
            transformUrl = this._transformUrl({ url: `${this._versionFilePath}?t=${(new Date()).getTime()}` });
        }

        return new Promise<boolean>((res, rej) => {
            cc.assetManager.loadRemote(transformUrl, { maxRetryCount: retryCount }, (err, item: cc.JsonAsset) => {
                if (err) {
                    res(false);
                    this._verUrlMap = {};
                } else {
                    this._verUrlMap = item.json;
                    res(true);
                }

            })
        })
    }

    private _isMiniGame() {

        return miniGamePlatforms.includes(cc.sys.platform)
    }

    async initVersion(versionFilePath: string, retryCount: number = 2) {
        if (versionFilePath === void 0) { versionFilePath = this._versionFilePath; }
    }
    public registAssetParser(handler: aswallow.IAssetParser) {
        const handlerMap = this._handlerMap;
        if (!handler || !handler.type || handlerMap[handler.type]) {
            console.warn(`[ext-loader]解析处理器注册失败:: type:${handler ? handler.type : undefined}${handlerMap[handler.type] && (",处理器已经存在")}`);
            return;
        }
        handler.extAssetMgr = this;
        handler.onRegist && handler.onRegist();
        this._handlerMap[handler.type] = handler;
    }
    /**
     * 加载并解析外部资源
     * @param paths 
     * @param onComplete 
     * @param onProgress 
     * @param type 
     */
    public load(resReqItems: aswallow.ResRequestItem | aswallow.ResRequestItem[], onComplete?: (error: Error, result: aswallow.LoadResult) => void, onProgress?: (finish: number, total: number, item: any) => void, extraData?: any): void {
        resReqItems = this._resolveVerUrls(resReqItems);
        const len = resReqItems.length;
        let handler: aswallow.IAssetParser;
        const handlerMap = this._handlerMap;
        let resReqItem: aswallow.IResRequestItem;
        this.ccload(resReqItems as aswallow.IResRequestItem[], (err, items) => {
            let res: aswallow.LoadResult;
            if (!err) {
                let asset: any;
                const assetMap: { [key: string]: any } = {};
                let path: string;
                for (let i = 0; i < len; i++) {
                    resReqItem = resReqItems[i];
                    path = resReqItem.extResPath;
                    asset = this.get(path);
                    if (resReqItem.assetType && !asset["__extParsed"]) {

                        handler = resReqItem.assetType ? handlerMap[resReqItem.assetType] : undefined;
                        if (handler) {
                            asset = handler.parse(resReqItem.extResPath, asset);
                        }
                        asset["__extParsed"] = true;
                    }
                    if (asset) {
                        assetMap[resReqItem.extResPath] = asset;
                    }
                }
                const values = Object.values(assetMap)
                if (values.length > 1) {
                    res = {
                        isCompleted: true,
                        map: assetMap
                    }
                } else {
                    res = values[0];
                }
            }
            onComplete && onComplete(err, res);
        }, onProgress, extraData);

    }
    public get<T extends cc.Asset = any>(path: string): T {
        return cc.assetManager.assets.get(path) as any;
    }
    /**
     * 缓存资源
     * @param extAssetPath 
     * @param asset 
     */
    public cache(extAssetPath: string, asset: any): void {
        asset["__extAssetPath"] = extAssetPath;
        //chenxia 修改_uuid，兼容引擎原生引用计数释放逻辑
        asset["_uuid"] = extAssetPath;
        if (cc.assetManager.assets.get(extAssetPath)) {
            console.warn('+++++外部资源管理器重复缓存图片', extAssetPath);
        }
        cc.assetManager.assets.add(extAssetPath, asset);
    }
    public unCache(key: string): void {
        cc.assetManager.assets.remove(key);
    }
    public release(resReqItems: aswallow.ResRequestItem | aswallow.ResRequestItem[]): void {
        resReqItems = this._resolveVerUrls(resReqItems);
        let asset: cc.Asset;
        let reqItem: aswallow.IResRequestItem;
        for (let i = 0; i < resReqItems.length; i++) {
            reqItem = resReqItems[i] as aswallow.IResRequestItem;
            asset = this.get(reqItem.extResPath);
            if (asset) {
                this.unCache(reqItem.extResPath);
                asset.destroy();
            }
        }

    }
    public releaseAsset(asset: cc.Asset) {
        if (asset["__extAssetPath"]) {
            this.release(asset["__extAssetPath"]);
        } else {
            cc.assetManager.releaseAsset(asset);
        }
    }
    /**
     * 加载外部资源，不做解析
     * @param requestItems 
     * @param onComplete 
     * @param onProgress 
     */
    public ccload(requestItems: aswallow.IResRequestItem | aswallow.IResRequestItem[],
        onComplete?: (error: Error, result: any) => void,
        onProgress?: (finish: number, total: number, item: any) => void,
        extraData?: any) {
        const options = { preset: "remote", __isNative__: true, myLoadId: extraData?.myLoadId };
        const loadedMap = {};
        let loadedCount = 0;
        requestItems = Array.isArray(requestItems) ? requestItems : [requestItems];
        const needLoadRequestItems = [];
        for (let i = requestItems.length - 1; i >= 0; i--) {
            const path = requestItems[i].extResPath;
            const asset = this.get(path);
            if (asset) {
                loadedCount++;

                loadedMap[path] = asset;
            } else {
                needLoadRequestItems.push(requestItems[i])
            }
        }
        let res: aswallow.LoadResult;
        if (!needLoadRequestItems.length) {
            if (loadedCount > 1) {
                res = {
                    isCompleted: true,
                    map: loadedMap
                };
            } else {
                res = Object.values(loadedMap)[0] as any;
            }
            onComplete && onComplete(undefined, res);
        } else {
            cc.assetManager.loadAny(needLoadRequestItems, options, (function (finish, total, item) {
                loadedMap[item.url] = item.content;
                onProgress && onProgress instanceof Function && onProgress(finish, total, item);
            }), ((err, _native) => {
                if (!err) {
                    let asset: cc.Asset;
                    let content;
                    let reqItem: aswallow.IResRequestItem;
                    const factory = cc.assetManager.factory;
                    let ext: string;
                    for (let i = 0; i < needLoadRequestItems.length; i++) {
                        reqItem = needLoadRequestItems[i];
                        content = loadedMap[reqItem.url];
                        asset = this.get(reqItem.extResPath);
                        if (!asset) {
                            ext = reqItem.ext || cc.path.extname(reqItem.url);
                            factory.create(reqItem.url, content, ext, null, (err, out) => {
                                if (!err) {
                                    out._native = ext;
                                    asset = out;
                                }
                            });
                            if (reqItem.assetType) if (!asset["__extParsed"]) asset["__extParsed"] = false;
                            this.unCache(reqItem.url);
                            delete loadedMap[reqItem.url];

                            this.cache(reqItem.extResPath, asset);
                        }
                        loadedMap[reqItem.extResPath] = asset;
                    }
                    const assets = Object.values(loadedMap)
                    if (assets.length > 1) {
                        res = {
                            isCompleted: true,
                            map: loadedMap
                        }
                    } else {
                        res = assets[0] as any;
                    }

                }
                onComplete && onComplete(err, res);
            }));
        }
    }
    private _transformUrl(reqItem: aswallow.IResRequestItem): string {
        let url = reqItem.url;
        if (this._verUrlMap[url]) {
            url = this._verUrlMap[url];
        }
        url = cc.path.join(reqItem.root ? reqItem.root : this.root, reqItem.baseDir ? reqItem.baseDir : this._baseDir, url);
        return url;
    }
    private _resolveVerUrls(resReqItems: aswallow.ResRequestItem | aswallow.ResRequestItem[]): aswallow.IResRequestItem[] {
        resReqItems = Array.isArray(resReqItems) ? resReqItems : [resReqItems];
        let resReqItem: aswallow.ResRequestItem;
        let handler: aswallow.IAssetParser;
        const handlerMap = this._handlerMap;
        let resultReqs: aswallow.ResRequestItem[] = [];
        for (let i = resReqItems.length - 1; i >= 0; i--) {
            resReqItem = resReqItems[i];
            if (typeof resReqItem === "string") {
                resReqItem = { url: resReqItem };
                resultReqs.push(resReqItem);
            } else if (cc.path.extname(resReqItem.url) === "") {
                handler = resReqItem.assetType ? handlerMap[resReqItem.assetType] : undefined;
                if (handler) {
                    const deps = handler.getDepReqs ? handler.getDepReqs(resReqItem) : undefined
                    if (deps) {
                        resultReqs = (resultReqs as aswallow.ResRequestItem[]).concat(deps);

                    } else {
                        console.warn(`路径没后缀，获取引用为空:${resReqItem.url}`);
                    }

                } else {
                    console.warn(`路径没后缀，又没处理器获取引用:${resReqItem.url}`);
                }

                //移除
                // resReqItems[i] = resReqItems[resReqItems.length - 1];
                // resReqItems[resReqItems.length - 1] = resReqItem;
                // resReqItems.pop();
            } else {
                resultReqs.push(resReqItem);
            }
            const depUrls = resReqItem.deps;
            if (depUrls) {

                for (let k = 0; k < depUrls.length; k++) {
                    resReqItem = { url: depUrls[k] };
                    resultReqs.push(resReqItem);
                }
            }

        }
        resReqItems.length = 0;
        //处理路径
        for (let i = 0; i < resultReqs.length; i++) {
            resReqItem = resultReqs[i] as aswallow.IResRequestItem;
            resReqItem.extResPath = resReqItem.url;
            resReqItem.url = this._transformUrl(resReqItem);
        }

        return resultReqs as aswallow.IResRequestItem[];
    }

}
if (!window.aswallow) {
    window.aswallow = {} as any;
}
aswallow.extAssetMgr = new AwExtAssetManager();