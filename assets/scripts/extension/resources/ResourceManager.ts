import { PathUtils } from "../../core/utils/PathUtils";
import { Dictionary } from "../basecore/Dictionary";
import { PoolMgr } from "../pool/PoolMgr";
import { BaseProfiler } from "../profiler/BaseProfiler";
import { CCAsset } from "./CCAsset";
import { LoadTask } from "./LoadTask";
import { ResourceEventType } from "./ResourceEventType";
import { ResourceLoader } from "./ResourceLoader";
import { ResourceLoadPriority } from "./ResourceLoadPriority";

export module resource {
	export class AssetUtils {
		static getBytes(asset: cc.Asset | null): Uint8Array {
			if (asset && asset["_nativeAsset"]) {
				return new Uint8Array(asset["_nativeAsset"]);
			} else {
				return null;
			}
		}
	}

	export class ResourceManager extends BaseProfiler<ResourceEventType> {
		// 外部资源文件夹名称
		private static _extResPathPrefixList: string[] = ["ext_ui/", "shuzhi/", "heroBust/", "fashion/", "model/", "model_bs/", "fairylandHero/", "userProto"];
		/**外部加载资源记录依赖资源的key，内部加载的资源引擎会维护好依赖 */
		public static readonly ExtDepResKey = "_extDepRes";
		/**资源key */
		public static readonly UuidKey = "_uuid";
		/**拼装 SpriteFrame 资源uuid后缀 */
		private static readonly SpriteFrameSuffix = ".spriteframe";
		// 编辑器资源前缀
		public static resourcesPrefix: string = "db://assets/resources/";
		public static bundlesPrefix: string = "db://assets/bundles/module/";
		/**动态资源缓存时间，单位ms */
		private _dynamicAssetCacheTime = 3000;
		/**动态资源检查销毁时间间隔，单位ms */
		private _dynamicAssetCheckStep = 1000;
		// 需要远程加载的bundle包
		public bundleOutside = [];


		private _loader: ResourceLoader;
		private _gcTimer;

		constructor() {
			super();
			window["_a_r"] = () => {
				return ResourceManager.sInstance;
			};
			this._loader = new ResourceLoader();
		}

		public init(cacheTime: number, checkStep: number): void {
			this._dynamicAssetCacheTime = cacheTime * 1000;
			this._dynamicAssetCheckStep = checkStep * 1000;

			if (this._gcTimer) {
				clearInterval(this._gcTimer);
				this._gcTimer = undefined;
			}
			this._gcTimer = setInterval(() => {
				this._checkGC();
			}, this._dynamicAssetCheckStep);
		}

		private static _sInstance: ResourceManager;

		public static get sInstance(): ResourceManager {
			if (this._sInstance == null) {
				this._sInstance = new ResourceManager();
			}
			return this._sInstance;
		}

		/**最大并发加载数量 */
		public get maxRequestCountSimultaneously(): number {
			return this.loader.maxRequestCountSimultaneously;
		}

		public set maxRequestCountSimultaneously(maxRequestCountSimultaneously: number) {
			this.loader.maxRequestCountSimultaneously = maxRequestCountSimultaneously;
		}

		private get loader(): ResourceLoader {
			return this._loader;
		}

		/**全部动态资源缓存 */
		private _dynamicAssets: Dictionary<string, CCAsset> = new Dictionary();
		// 不能单独存储可释放列表，因为引擎底层销毁节点时减静态引用时我们不知道，除服hook资源减引用函数，但暂时没必要
		// private _unuseDynamicAssets: Dictionary<string, CCAsset> = new Dictionary();

		private _checkGC(): void {
			// console.log('+++动态资源数量：', this._dynamicAssets.length, '总资源数量：', cc.assetManager.assets.count);
			let now = new Date().getTime();
			// 这里列表数据可能很多，需要的话可以分帧释放，但要注意下一帧对应资源可能已经不需要释放了
			for (let i = this._dynamicAssets.length - 1; i >= 0; --i) {
				let ccAsset = this._dynamicAssets.getValueByIndex(i);
				if (ccAsset.asset.refCount == 1) {
					if (now - ccAsset.lastUseTimeStamp > ccAsset.cacheTiem) {
						this._dynamicAssets.removeAt(i);
						// 有些资源是自己拼装的，这里需要处理下依赖
						let asset = ccAsset.asset;
						let depRes: string[] = asset[ResourceManager.ExtDepResKey];
						if (depRes) {
							for (let depAssetKey of depRes) {
								let depAsset = cc.assetManager.assets.get(depAssetKey);
								if (!depAsset) {
									console.warn('逻辑错误，依赖资源不存在');
									continue;
								}
								this.uncacheAsset(depAsset);
							}
							asset[ResourceManager.ExtDepResKey] = undefined;
						}
						this.uncacheAsset(asset);
						PoolMgr.Ins.recover(ccAsset);
					}
				}
			}
		}

		/**添加动态管理资源 */
		public addDynamicAsset(asset: cc.Asset): void {
			let key = asset[ResourceManager.UuidKey];
			if (!this._dynamicAssets.contains(key)) {
				let ccAsset = PoolMgr.Ins.impl(CCAsset);
				ccAsset.init(key, this._dynamicAssetCacheTime);
				this._dynamicAssets.add(key, ccAsset);
				this.cacheAsset(asset);
			}
		}

		/**释放动态资源 */
		public releaseDynamicAsset(asset: cc.Asset): void {
			let dynamicAsset = this._dynamicAssets.getValue(asset[ResourceManager.UuidKey]);
			if (dynamicAsset?.asset?.refCount == 1) {
				this._dynamicAssets.remove(dynamicAsset.key);
				this.uncacheAsset(asset);
				PoolMgr.Ins.recover(dynamicAsset);
			}
		}

		/**判断对应任务是否在加载 */
		public isLoading(id: number): boolean {
			return ResourceManager.sInstance.loader.isTaskLoading(id);
		}

		/**停止加载对应任务 */
		public stopLoad(id: number): void {
			ResourceManager.sInstance.loader.stopLoadTask(id);
		}

		/**资源加引用 */
		public cacheAsset(asset: cc.Asset | cc.Asset[]): void {
			if (asset) {
				let assetList = Array.isArray(asset) ? asset : [asset];
				for (let tempAsset of assetList) {
					tempAsset.addRef();
					this._dynamicAssets.getValue(tempAsset[ResourceManager.UuidKey])?.updateTimeStamp();
				}
			}
		}

		/**
		 * 资源减引用
		 * @param asset 资源
		 */
		public uncacheAsset(asset: cc.Asset | cc.Asset[]): void {
			if (asset) {
				let assetList = Array.isArray(asset) ? asset : [asset];
				for (let tempAsset of assetList) {
					tempAsset.decRef();
					this._dynamicAssets.getValue(tempAsset[ResourceManager.UuidKey])?.updateTimeStamp();
				}
			}
		}

		/**判断是否为外部资源 */
		public isExtRes(path: string) {
			if (!path) {
				return false;
			}

			for (let i = 0; i < ResourceManager._extResPathPrefixList.length; i++) {
				if (path.startsWith(ResourceManager._extResPathPrefixList[i])) {
					return true;
				}
			}
			return false;
		}

		/**从缓存拿资源 */
		public getAsset<T extends cc.Asset>(path: string, type: typeof cc.Asset): T | undefined {
			let { bundleName, resPath } = this.parseResPath(path);
			if (bundleName) {
				let bundle = cc.assetManager.getBundle(bundleName);
				if (bundle) {
					let info = bundle.getInfoWithPath(resPath, type);
					if (info && info.uuid) {
						return cc.assetManager.assets.get(info.uuid) as T;
					}
				}
			} else {
				if (type && (type == cc.SpriteFrame || type == cc.Texture2D) && this.isExtRes(resPath)) {
					resPath = resPath + ".png";
				}
				let uuid = resPath + (type == cc.SpriteFrame ? ResourceManager.SpriteFrameSuffix : '');
				return cc.assetManager.assets.get(uuid) as T;
			}
		}

		/**
		 * 加载bundle
		 * @param bundleName bundle名
		 * @param onComplete 完成回调
		 */
		public loadBundle(bundleName: string, onComplete: (err: Error, bundle: cc.AssetManager.Bundle) => void) {
			let bundle = cc.assetManager.getBundle(bundleName);
			if (bundle) {
				onComplete(null, bundle);
			} else {
				cc.assetManager.loadBundle(bundleName, null, (err: Error, bundle: cc.AssetManager.Bundle) => {
					onComplete(err, bundle);
				});
			}
		}

		private _getLoadTask(priority = ResourceLoadPriority.NORMAL, loadFunc: Function, loadFuncTarget: any, onComplete?: Function, ...args: any[]): LoadTask {
			let loadTask = ResourceManager.sInstance.loader.fetchLoadTask();
			let taskId = loadTask.id;
			loadTask.priority = priority ? priority : ResourceLoadPriority.NORMAL;
			loadTask.loadFunc = loadFunc;
			loadTask.loadFuncTarget = loadFuncTarget;
			loadTask.loadFuncArgs = [(err: Error | null, asset: cc.Asset | cc.Asset[] | null) => {
				if (!err && asset) {
					let assets = Array.isArray(asset) ? asset : [asset];
					assets.forEach((temp) => this.addDynamicAsset(temp));
				}
				// 已经停止的任务不回调
				if (this.loader.isTaskValid(taskId)) {
					onComplete && onComplete(err, asset);
				}
				// 开始下一个任务
				this.loader.onLoadTaskDone(taskId);
			}].concat(args);
			return loadTask;
		}

		/**
		 * 预加载资源，暂不支持外部支援
		 * @param path 资源路径
		 * @param type 资源类型
		 * @param onComplete 预加载完成回调
		 * @returns 
		 */
		public preload(paths: string | string[], type: typeof cc.Asset, onComplete?: (err: Error | null, items: cc.AssetManager.RequestItem[] | null) => void): void {
			if (!paths) return;

			let bundleName = '';
			if (!Array.isArray(paths)) paths = [paths];
			let assetPaths: string[] = [];
			for (let i = 0; i < paths.length; ++i) {
				let ret = this.parseResPath(paths[i]);
				if (!bundleName) {
					bundleName = ret.bundleName;
				} else {
					if (bundleName != ret.bundleName) {
						onComplete && onComplete(new Error(i18n`preload 暂不支持批量加载不同bundle包资源:${ret.bundleName},${bundleName}`), null);
						return;
					}
				}
				assetPaths.push(ret.resPath);
			}
			if (bundleName && assetPaths.length) {
				this.loadBundle(bundleName, (err, bundle) => {
					if (err) {
						console.warn(err.message);
						onComplete && onComplete(err, null);
					} else {
						bundle.preload(assetPaths, type, (err, items) => {
							if (err) {
								console.warn(err.message);
							}
							onComplete && onComplete(err, items);
						})
					}
				});
			}
		}

		/**
		 * 加载单个资源
		 * @param path 资源路径
		 * @param type 资源类型
		 * @param onComplete 加载完成回调
		 * @param priority 优先级，默认为 NORMAL
		 * @returns
		 */
		public load<T extends cc.Asset>(path: string, type: typeof cc.Asset, onComplete?: (err: Error | null, data: T | null) => void, priority?: ResourceLoadPriority): number {
			if (typeof path !== 'string') {
				onComplete && onComplete(new Error(i18n`load 非字符串路径:${path}`), null);
				return;
			}

			// if (CC_JSB) {
			// 	//临时测试一下
			// 	let cacheAsset = this.getAsset(path, type) as T;
			// 	let newOnComplete = (err: Error | null, data: T | null)=>{
			// 		setTimeout(() => {
			// 			onComplete && onComplete(err, data);
			// 		}, 20);
			// 	}
			// 	if (cacheAsset) {
			// 		newOnComplete(null, cacheAsset);
			// 		return 0;
			// 	} else {
			// 		let { bundleName, resPath } = this.parseResPath(path);
			// 		let loadTask = this._getLoadTask(priority, this._loadInBundle, this, newOnComplete, bundleName, resPath, type);
			// 		ResourceManager.sInstance.loader.scheduleNextTask(loadTask);
			// 		return loadTask.id;
			// 	}
			// }else{
			let { bundleName, resPath } = this.parseResPath(path);
			let loadTask = this._getLoadTask(priority, this._loadInBundle, this, onComplete, bundleName, resPath, type);
			ResourceManager.sInstance.loader.scheduleNextTask(loadTask);
			return loadTask.id;
			// }

		}

		private _loadInBundle<T extends cc.Asset>(onComplete: (err: Error | null, data: T | null) => void, bundleName: string, path: string, type: typeof cc.Asset): void {
			if (this.isExtRes(path)) {
				if (type && (type == cc.SpriteFrame || type == cc.Texture2D)) {
					// path = cc.path.changeExtname(path, ".png");
					path += ".png";
				}
				 else if (type && (type == cc.TextAsset)) {
					// path = cc.path.changeExtname(path, ".atlas");
					path += ".atlas";
				} else if (type && (type == cc.JsonAsset)) {
					// path += cc.path.changeExtname(path, ".json");
					path += ".json";
				}

				let resReqItems = path;
				resReqItems = path;

				window.aswallow.extAssetMgr.load(
					resReqItems,
					(err, asset: cc.Asset) => {
						if (!err) {
							if (type && type == cc.SpriteFrame) {
								// SpriteFrame 需要自己组装
								asset = this._getSpriteFrame(asset as cc.Texture2D);
							}
						} else {
							console.warn(err.message);
							this.dispatchEvent(ResourceEventType.ResLoadError, "res loader error", `path:${path} msg:${err.message}`)
						}
						onComplete && onComplete(err, asset as T);
					},
					null
				);
			} else {
				this.loadBundle(bundleName, (err, bundle) => {
					if (err) {
						console.warn(err.message);
						onComplete && onComplete(err, null);
					} else {
						bundle.load(path, type, (err, asset) => {
							if (err) {
								console.warn(err.message);
								this.dispatchEvent(ResourceEventType.ResLoadError, "res loader error", `path:${path} msg:${err.message}`)
							}
							onComplete && onComplete(err, asset as T);
						})
					}
				});
			}
		}

		/**
		 * 批量加载资源，注意这里暂未支持批量加载外部资源
		 * @param paths 资源路径
		 * @param type 资源类型
		 * @param onComplete 加载完成回调
		 * @param priority 优先级，默认为 NORMAL
		 * @returns
		 */
		public loadList<T extends cc.Asset>(paths: string[], type: typeof cc.Asset, onComplete?: (err: Error | null, data: T[] | null) => void, priority?: ResourceLoadPriority): number {
			if (!paths || !Array.isArray(paths) || paths.length === 0) {
				onComplete && onComplete(new Error(i18n('loadList path为空')), null);
				return;
			}

			let tempBundleName: string;
			let tempPaths = [];
			for (let i = 0; i < paths.length; ++i) {
				let tempPath = paths[i];
				if (typeof tempPath !== 'string') {
					onComplete && onComplete(new Error(i18n`loadList 非字符串路径:${tempPath}`), null);
					return;
				}
				let { bundleName, resPath } = this.parseResPath(tempPath);
				if (tempBundleName === undefined) {
					tempBundleName = bundleName;
				} else if (bundleName !== tempBundleName) {
					onComplete && onComplete(new Error(i18n`loadList 暂不支持批量加载不同bundle包资源:${tempBundleName},${bundleName}`), null);
					return;
				}
				tempPaths.push(resPath);
			}

			if (!tempBundleName) {
				onComplete && onComplete(new Error(i18n`loadList 没有指定bundle包名`), null);
				return;
			}

			let loadTask = this._getLoadTask(priority, this._loadListInBundle, this, onComplete, tempBundleName, tempPaths, type);
			ResourceManager.sInstance.loader.scheduleNextTask(loadTask);
			return loadTask.id;
		}

		private _loadListInBundle<T extends cc.Asset>(onComplete: (err: Error | null, data: T[] | null) => void, bundleName: string, paths: string[], type: typeof cc.Asset): void {
			this.loadBundle(
				bundleName,
				(err: Error, bundle: cc.AssetManager.Bundle, extraData?: any) => {
					if (!err) {
						bundle.load(paths, type, (err, assets: cc.Asset[]) => {
							if (err) console.warn(err.message);
							onComplete && onComplete(err, assets as T[]);
						});
					} else {
						console.warn(err.message);
						onComplete && onComplete(err, null);
					}
				}
			);
		}

		/**加载SpriteFrame */
		public loadSpriteFrame(path: string, onComplete?: (err: Error | null, data: cc.SpriteFrame | null) => void, priority?: ResourceLoadPriority): number {
			return this.load(path, cc.SpriteFrame, onComplete, priority);
		}

		/**加载spine */
		public loadSpine(path: string, onComplete?: (err: Error | null, data: sp.SkeletonData | null) => void, priority?: ResourceLoadPriority): number {
			if (!this.isExtRes(path)) {
				return this.load(path, sp.SkeletonData, onComplete, priority);
			} else {
				// if (this.isExtRes(path)) {
				// 	aswallow.extAssetMgr.load(
				// 		[{ url: path + ".json", assetType: "SpineAsset", ext: ".json" }, path + ".atlas", path + ".png"],
				// 		(err, items) => {
				// 			let skeletonData = aswallow.extAssetMgr.get(path + ".json") as any;
				// 			doneCallback && doneCallback(skeletonData);
				// 			ResourceManager.sInstance.loader.onLoadTaskDone(loadTaskId);
				// 		},
				// 		null,
				// 		extraData
				// 	);
				// }
				onComplete && onComplete(new Error(i18n`暂不支持外部路径:${path}，请使用gameSpine组件`), null);
				return 0;
			}
		}

		/**加载二进制数据 */
		public loadBytes(path: string, onComplete?: (err: Error | null, data: Uint8Array | null) => void, priority?: ResourceLoadPriority): number {
			return this.load(path, cc.Asset, (err, data) => {
				if (!err) {
                    let bytes = AssetUtils.getBytes(data);
                    if (bytes) {
                        onComplete(null, bytes);
                    } else {
                        onComplete(null, null);
                    }
                } else {
                    onComplete(err, null);
                }
			}, priority);
		}

		/**加载远程资源 */
		public loadRemote(path: string, options: Record<string, any>, onComplete?: (err: Error | null, data: cc.Asset | null) => void, priority?: ResourceLoadPriority): number {
			if (typeof path !== 'string') {
				onComplete && onComplete(new Error(i18n`loadRemote 非字符串路径:${path}`), null);
				return;
			}

			let loadTask = this._getLoadTask(priority, this._loadInRemote, this, onComplete, path, options);
			ResourceManager.sInstance.loader.scheduleNextTask(loadTask);
			return loadTask.id;
		}

		private _loadInRemote(onComplete: (err: Error | null, data: cc.Asset | null) => void, path: string, options: Record<string, any>): void {
			cc.assetManager.loadRemote(path, options, (err, asset) => {
				if (err) {
					console.warn(err.message);
				} else {
					if (options.ext == ".png" && asset instanceof cc.Texture2D) {
						// SpriteFrame 需要自己组装
						asset = this._getSpriteFrame(asset);
					}
				}
				onComplete && onComplete(err, asset);
			});
		}

		/**拼装SpriteFrame并记录依赖 */
		private _getSpriteFrame(asset: cc.Texture2D): cc.SpriteFrame {
			if (!asset || !(asset instanceof cc.Texture2D)) return undefined;
			let cachePath = asset[ResourceManager.UuidKey] + ResourceManager.SpriteFrameSuffix;
			// 加载期间可能发起新的请求，检查下是否已有资源
			let cacheAsset = cc.assetManager.assets.get(cachePath);
			if (cacheAsset) {
				return cacheAsset as cc.SpriteFrame;
			} else {
				// 首次加载，模拟引擎处理，图片直接引用资源+1
				this.cacheAsset(asset);
				let spriteFrameAsset = new cc.SpriteFrame(asset);
				// 兼容引擎原生引用计数逻辑
				spriteFrameAsset[ResourceManager.UuidKey] = cachePath;
				// 记录直接引用资源，释放对应图片时再-1
				spriteFrameAsset[ResourceManager.ExtDepResKey] = [asset[ResourceManager.UuidKey]];
				if (cc.assetManager.assets.get(cachePath)) {
					console.warn('+++++资源管理器重复缓存图片', cachePath);
				}
				cc.assetManager.assets.add(cachePath, spriteFrameAsset);
				return spriteFrameAsset;
			}
		}


		/**
		 * 解析路径，获取bundle包名和资源路径
		 * @param source
		 * @returns {bundleName bundle包名 source 资源路径}
		 */
		public parseResPath(source: string): { bundleName: string; resPath: string; ext: string } {
			if (!source) {
				return { bundleName: "", resPath: "", ext: "" };
			}

			let bundleName = "";
			let resPath = "";
			let ext = "";

			// 设置 _bundleName 和 _source
			if (this.isExtRes(source)) {
				bundleName = "";
				resPath = source;
			} else {
				// 设置bundle包名以及重新组织路径
				let sourceArr = source.split("/");
				bundleName = sourceArr.splice(0, 1)[0];
				resPath = sourceArr.join("/");
			}

			ext =  PathUtils.splitext(resPath)[1];
			resPath = PathUtils.changeExtname(resPath, "");

			return { bundleName: bundleName, resPath: resPath, ext: ext };
		}
		/**
		 * 判断资源是否存在bundle包中
		 * 注：bundle包需先加载才有效
		 * @param path 
		 * @param type 
		 * @returns 
		 */
		public hasAssetInBundle(path: string, type: typeof cc.Asset): boolean {
			let { bundleName, resPath } = this.parseResPath(path);
			if (!bundleName) {
				return;
			}

			let bundle = cc.assetManager.getBundle(bundleName);
			if (!bundle) {
				return;
			}

			let info = bundle.getInfoWithPath(resPath, type);
			return !!info;
		}



		/////////////////////////////////////内存相关/////////////////////////////////////

		public memoryInfo(): { size: number, tips: string } {
			let ret = { size: 0, tips: "" }

			let countAll = cc.assetManager.assets.count;
			let memAll = 0;
			let memFreeAll = 0;

			//静态资源
			cc.assetManager.assets.forEach((val: cc.Asset, key: string) => {
				let s = this.getAssetMemory(val);
				memAll += s;
				if (val.refCount <= 0) {
					memFreeAll += s;
				}
			});

			let countDyn = this._dynamicAssets.length
			let memDyn = 0;
			let memFreeDyn = 0;

			//动态资源
			for (let i = 0; i < this._dynamicAssets.length; i++) {
				let ccAsset = this._dynamicAssets.getValueByIndex(i);
				let s = this.getAssetMemory(ccAsset.asset);
				memDyn += s;
				if (ccAsset.asset.refCount == 1) {
					memFreeDyn += s;
				}
			}

			let s1 = Math.floor(memFreeAll / 1048.576) / 1000;
			let s2 = Math.floor(memAll / 1048.576) / 1000;
			let s3 = Math.floor(memFreeDyn / 1048.576) / 1000;
			let s4 = Math.floor(memDyn / 1048.576) / 1000;

			ret.size = memAll;
			ret.tips = i18n`总资源：${s1}MB/${s2}MB（${countAll}个） 动态资源：${s3}MB/${s4}MB（${countDyn}个）`

			return ret;
		}



		private getAssetMemory(asset: cc.Asset): number {
			let ret = 0;
			let cn = asset['__classname__']
			switch (cn) {
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
				case "cc.AudioClip": {
					let clip = asset as cc.AudioClip;
					//@ts-ignore
					let buffer = clip._audio as AudioBuffer;
					ret = buffer.length * 4 * buffer.numberOfChannels;  //32Float
					// PCM Buffersize=采样率*采样时间*采样位数/8*通道数（Bytes）
					break;
				}
				default: {

				}

			}
			return ret;
		}

		public freeMemory(): number {
			return 0;
		};


		/////////////////////////////////////内存相关/////////////////////////////////////
	}
}
