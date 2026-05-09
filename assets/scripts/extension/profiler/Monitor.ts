// import { resource } from "../../core/resources/ResourceManager";
import { List } from "../basecore/List";
import { RefClass } from "../basecore/RefDecorator";
import { IProfiler } from "./IProfiler";

const FREE_ASSETS_TIME = 10;

@RefClass
export class Monitor {
    private static _Ins: Monitor;

    private profilers : List<IProfiler> 
    private _taskSchel = undefined;

    /**
     * static Instance:Monitor
     */
    public static get Ins(): Monitor {
        if (this._Ins == null) {
            this._Ins = new Monitor();
            //@ts-ignore
            window.Monitor = this._Ins;
            this._Ins.init();
        }
        return this._Ins;
    }

    private init(){
        this.profilers = new List<IProfiler>();
    }

    public addProfiler(p : IProfiler){
        this.profilers.push(p);
    }


    public startTask() {
        this._taskSchel = setInterval(this.step.bind(this), FREE_ASSETS_TIME * 1000);
    }

    private step(){
        let size = 0;
        for (let i = 0; i < this.profilers.length; i++) {
            const profiler = this.profilers[i];
            let info = profiler.memoryInfo();
            console.log(info.tips);
            size += info.size;
        }

        // console.log(`内存检查${size}KB`);
    }

    public releaseTetxure() {
        // console.log("动态清理资源");
        //@ts-ignore
        cc.assetManager.releaseUnusedAssets();
    }

    public calCacheAesstsMemory() {
        let mem = 0;
        let num = 0;
        let ids = {};
        cc.assetManager.assets.forEach((val: cc.Asset, key: string) => {
            //@ts-ignore
            if (val.__classname__ == "cc.Texture2D") {
                let tex = val as cc.Texture2D;

                if (!ids[tex["_id"]]) {
                    let format = tex.getPixelFormat();
                    let p = 0;
                    switch (format) {
                        case cc.Texture2D.PixelFormat.RGBA8888:
                            p = tex.width * tex.height * 32;
                            break;
                        case cc.Texture2D.PixelFormat.RGB888:
                            p = tex.width * tex.height * 24;
                            break;
                    }
                    num++;
                    ids[tex["_id"]] = true;
                    // console.log("单个", tex["_id"], p);
                    mem += p;
                }

            }
        });
        console.log(`总纹理数量：${num}, 大小：${Math.floor(mem / 1048.576) / 1000}MB`);
    }

    private changeKB(mem: number){
        return `${Math.floor(mem  / 1.024) / 1000}KB`
    }


    public getProfilerInfo(){
        let ret = []
        for (let i = 0; i < this.profilers.length; i++) {
            const profiler = this.profilers[i];
            let info = profiler.memoryInfo();
            ret.push(info);
        }
        return ret;
    
    }
    private _textCaches = {};


    public addTexture(key: string, texture: cc.Texture2D) {
        this._textCaches[key] = texture;
    }

    public removeTexture(key: string) {
        delete this._textCaches[key];
    }


    private _cache = new cc.AssetManager.Cache<{ asset: cc.Asset, refCount: number }>();

    recordCache(): void {
        this._cache.clear();
        cc.assetManager.assets.forEach((asset, key) => {
            this._cache.add(key, { asset: asset, refCount: asset.refCount });
        });
        console.log('+++资源量：', this._cache.count);
    }

    compareCache(flag: number = 0): void {
        let newAssets = cc.assetManager.assets;
        console.log('+++记录时资源量：', this._cache.count, '+++当前资源量：', newAssets.count);
        let logMap = {};
        
        if(flag == 1){
            this._cache.forEach((assetInfo, key) => {
                let asset = assetInfo.asset;
                let className = asset['__classname__'];
                let name = asset.name;
                let oldRef = assetInfo.refCount;
                let newRef = asset.refCount;
                if (!newAssets.has(key)) {
                    logMap[key] = true;
                    console.log('+++清除资源：', key, newRef, className, name, 'oldRef:', oldRef);
                } else {
                    if (newRef != newAssets.get(key).refCount) {
                        console.log('逻辑错误，asset引用不一致', key, newRef, newAssets.get(key).refCount);
                    }
                    if (newRef > oldRef) {
                        console.log('+++引用增加资源：', key, newRef, className, name, 'oldRef:', oldRef);
                    } else if (newRef < oldRef) {
                        console.log('+++引用减少资源：', key, newRef, className, name, 'oldRef:', oldRef);
                    }
                }
            })
        }
        let mem = 0;
        newAssets.forEach((asset, key) => {
            if (!logMap[key] && !this._cache.has(key)) {
                let m = this.getAssetMemory(asset);
                mem += m;
                console.log('+++新增资源：', key, asset.refCount, asset['__classname__'], asset.name, 'oldRef:', 0, 'memory:', this.changeKB(m));
            }
        })
        console.log('+++新增资源总内存：', this.changeKB(mem));

        
    }

    private getAssetMemory(asset: cc.Asset): number{
        let ret = 0;
        let cn = asset['__classname__']
        switch(cn){
            case "cc.Texture2D":
            {
                let tex = asset as cc.Texture2D;
                let format = tex.getPixelFormat();
                switch (format) {
                    case cc.Texture2D.PixelFormat.RGBA8888:
                        ret = tex.width * tex.height * 4;
                        break;
                    case cc.Texture2D.PixelFormat.RGB888:
                        ret = tex.width * tex.height * 3;
                        break;
                }
                // if (tex["_texture"]) {
                    // console.log("纹理信息", key, tex.refCount, p, tex["_id"], tex["_texture"]["_id"]);
                // } else {
                    // console.log("纹理信息", key, tex.refCount, p, tex["_id"]);
                // }
                break;
            }
            case "cc.AudioClip":{
                let clip = asset as cc.AudioClip;
                //@ts-ignore
                let buffer = clip._audio as AudioBuffer;
                ret = buffer.length * 4 * buffer.numberOfChannels;  //32Float
                // PCM Buffersize=采样率*采样时间*采样位数/8*通道数（Bytes）
                break;
            }
            default:{

            }

        }
        return ret;
    }
}