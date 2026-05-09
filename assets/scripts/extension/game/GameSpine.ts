/*
 * @Author: yf
 * @Date: 2021-07-23 13:56:33
 * @LastEditTime: 2023-07-03 17:27:52
 * @LastEditors: yf
 * @Description: In User Settings Edit
 * @FilePath: /client_v2_4/assets/scripts/module/common/component/GameSpine.ts
 */

import { resource } from "../resources/ResourceManager";
import { Dictionary } from "../basecore/Dictionary";
import { List } from "../basecore/List";
import { LogMgr } from "../log/LogMgr";
import { PathUtils } from "../../core/utils/PathUtils";

const { ccclass, property, executeInEditMode, menu, inspector } = cc._decorator;

export const SPINE_LOAD_COMPLETE = "loadComplete";

export const SPINE_LOW_DIR = "0.24/";
export const SPINE_HEIGHT_DIR = "1/";


/**模型品质等级 */
export const MODEL_QUALITY = cc.Enum({
	/**普通 */
	NORMAL: 1,
	/**低模 */
	LOW: 2,
	/**高模 */
	HIGH: 3,
});


@ccclass
@executeInEditMode
@menu("通用/GameSpine(骨骼动画)")
//这行代码可以让inspector变成sp.Skeleton那种样式  但是是全覆盖的 会覆盖掉自定义变量source(这里需要那个生成挂点 source用得少反而不必要)
@inspector("packages://inspector/inspectors/comps/skeleton2d.js")
export class GameSpine extends sp.Skeleton {
	private static PrefixUrl: string = "http://localhost:7456/ext-res/";

	private _loadIdList: List<number> = new List<number>();

	protected _dirty = false;

	@property
	private _source: string = "";
	@property({ type: cc.String })
	public set source(source: string) {
		if (this._source != source) {
			this._source = source;
			this._dirty = true;
		}
	}

	public get source(): string {
		return this._source || "";
	}

	@property
	protected _qualityLevel: number = MODEL_QUALITY.NORMAL;
	public get qualityLevel(): number {
		return this._qualityLevel;
	}
	public set qualityLevel(value: number) {
		if (value != this._qualityLevel) {
			this._qualityLevel = value;
			this._dirty = true;
		}
	}

	@property
	private _pathMap: boolean = true;
	// @property({ tooltip: "spriteSpine 转换为路径" })
	// get pathMap(): boolean {
	// 	return this._pathMap;
	// }
	// set pathMap(value: boolean) {
	// 	this._pathMap = value;
	// 	if (value) {
	// 		this._skeletonToUrl();
	// 	}
	// }

	@property({ type: [cc.String], readonly: true, editorOnly: true, displayName: "全部动作" })
	private animationNames: string[] = [];

	@property({ displayName: "当前动作" })
	customAnimation: string = "";

	protected _action: string;
	protected _isLoop: boolean = true;
	private _tempAssetList = new Dictionary<string, cc.Asset>();

	get action() {
		return this._action;
	}

	public onLoad() {
		if (this.skeletonData) {
			resource.ResourceManager.sInstance.cacheAsset(this.skeletonData);
		}

		if (!this._action) this._action = this.customAnimation;
		if (!this._action) this._action = this.animation;
		if (!this._action) this._action = this.defaultAnimation;
		//@ts-ignore
		if (!this._action) this._action = this._animationName;
		if (this._action) {
			//@ts-ignore
			this._animationName = this._action;
			this.animation = this._action;
			this.defaultAnimation = this._action;
		}

		this._isLoop = this.loop;

		let sourceTmp = this._source;
		if (sourceTmp) {
			this._source = "";
			this.source = sourceTmp;
		}

		// if (CC_EDITOR && this.skeletonData) {
		// 	this.pathMap = false;
		// }
	}

	protected update(dt: number): void {
		super.update && super.update(dt);
		if (this._dirty) {
			this._dirty = false;
			this.updateModel();
		}
	}

	public reset() {
		this._action = undefined;
		this._isLoop = false;
	}

	/**强制清理模型 */
	public forceClearModel(): void {
		// 资源减引用在下一帧，但有些情况下update可能已经不会调用，导致资源引用一直在，这里强制调用下以处理该情况
		this.source = '';
		this.updateModel();
	}

	/**
	 * @description: 播放特效
	 * @param {string} action 动作名
	 * @param {boolean} isLoop 是否循环
	 * @param {boolean} reset 强制重播
	 * @param {boolean} mix 混合插值
	 */
	public play(action: string, isLoop: boolean = false, reset: boolean = false, mix: number = 0) {
		if (this._dirty || this.skeletonData == null) {
			this._action = action;
			this._isLoop = isLoop;
			return;
		}

		if (action == null || action.length <= 0) {
			return;
		}

		if (reset || this._action != action || this._isLoop != isLoop) {
			let oldAction = this._action;

			this._action = action;
			this._isLoop = isLoop;
			if (!this.findAnimation(this._action)) {
				LogMgr.log(`模型${this._source}找不到对应动画${this._action}`);
				return;
			}
			if (mix > 0 && oldAction) {
				this.setMix(oldAction, this._action, mix);
			}
			return this.setAnimation(0, this._action, this._isLoop);
		}
	}

	public get isLoaded() {
		return !!this.skeletonData;
	}

	protected onLoadCompleteHandler() {
		if (CC_EDITOR) {
			return;
		}

		this.play(this._action, this._isLoop, true);
		if (this._loadCompletedHandle) {
			// if(CC_JSB){
			// 	setTimeout(() => {
			// 		this._loadCompletedHandle();
			// 	}, 20);
			// }else{
			this._loadCompletedHandle();
			// }

		}
		this.node.emit(SPINE_LOAD_COMPLETE);
	}

	private updateModel() {
		this._stopLoad();

		if (this._source == null || this._source.length <= 0) {
			this._updateSkeletonDataAndRefCount(undefined);
			return;
		}

		this._updateSkeletonDataAndRefCount(undefined);

		let resourceManagerIns = resource.ResourceManager.sInstance;
		if (resourceManagerIns.isExtRes(this._source)) {
			let preFix = CC_EDITOR ? GameSpine.PrefixUrl : "";
			let loadFunc = CC_EDITOR ? cc.assetManager.loadRemote.bind(cc.assetManager) : resourceManagerIns.load.bind(resourceManagerIns);
			let logFunc = CC_EDITOR ? Editor.error.bind(Editor) : LogMgr.logError.bind(LogMgr);
			this._source = CC_EDITOR ? this._source : this._parseSource(this._source);
			this._loadSpineRes(this._getQualityRes(preFix), loadFunc, logFunc);
		} else {
			if (this._qualityLevel == MODEL_QUALITY.NORMAL) {
				if (CC_EDITOR) {
					this._loadSpineInEditor(this._getQualityRes());
				} else {
					this._source = this._parseSource(this._source);

					let loadId = resourceManagerIns.loadSpine(this._source, (err, asset) => {
						if (err) {
							console.log(err.message);
							return;
						}
						if (!(asset instanceof sp.SkeletonData)) {
							// 缺少资源的情况下返回了一个非asset对象，该情况下可能导致内存问题，具体要看引擎是怎么处理加载成功的资源
							LogMgr.logError(`spine加载失败，可能是缺少资源导致：`, this._source);
							cc.assetManager.assets.remove(asset[resource.ResourceManager.UuidKey]);
							return;
						}
						this._updateSkeletonDataAndRefCount(asset);
						this.onLoadCompleteHandler();
					});
					this._loadIdList.add(loadId);
				}
			} else {
				LogMgr.logError(`非NORMAL模式只支持外部路径加载`);
			}
		}
	}

	protected _loadCompletedHandle: Function = null;
	public setLoadCompletedHandle(handle: Function) {
		this._loadCompletedHandle = handle;
	}
	public removeLoadCompletedHandle() {
		this._loadCompletedHandle = undefined;
	}

	/**
	 * 获取模型资源路径数组
	 * @param prefixStr 前缀
	 * @param needSuffix 是否需要文件名后缀
	 * @returns
	 */
	private _getQualityRes(prefixStr = ""): string[] {
		if (!this._source) {
			return [];
		}

		let result: string[] = [];
		if (this._qualityLevel == MODEL_QUALITY.NORMAL) {
			// @ts-ignore
			result.push(cc.path.join(prefixStr, this._source));
			// @ts-ignore
			result.push(cc.path.join(prefixStr, this._source));
		} else {
			let dirnameTmp = cc.path.dirname(this._source);
			let basenameTmp = cc.path.basename(this._source);
			let qualityRoot = this._qualityLevel == MODEL_QUALITY.LOW ? SPINE_LOW_DIR : SPINE_HEIGHT_DIR;
			// @ts-ignore
			result.push(cc.path.join(prefixStr, this._source));
			//@ts-ignore
			result.push(cc.path.join(prefixStr, dirnameTmp, qualityRoot, basenameTmp));
		}

		let suffix = [".json", ".atlas"];
		suffix.forEach((ext: string, index: number) => {
			result[index] = PathUtils.changeExtname(result[index], ext);
		});
		return result;
	}

	/**
	 * 运行中加载外部骨骼资源
	 * @param spineRes 通过 _getQualityRes 获得的资源路径
	 * @param loadFunc
	 * @param logFunc
	 * @returns
	 */
	private _loadSpineRes(spineRes: string[], loadFunc: (path: string, type: typeof cc.Asset, onComplete?: (err: Error | null, data: cc.Asset | null) => void) => any, logFunc?: Function) {
		if (!spineRes || spineRes.length == 0) {
			return;
		}

		if (!resource.ResourceManager.sInstance.isExtRes(spineRes[0].replace(GameSpine.PrefixUrl, ""))) {
			logFunc('分文件加载spine只支持外部路径' + spineRes[0]);
			return;
		}


		if (this._tempAssetList.length || this._loadIdList.length) {
			console.warn('+++++逻辑错误，gameSpine开启新加载前未清除上次加载的相关信息');
		}

		let checkCache = (uuid: string) => {
			let cacheAsset = cc.assetManager.assets.get(uuid) as sp.SkeletonData;
			if (cacheAsset) {
				this._setSpine(cacheAsset);
				return true;
			}
			return false;
		}

		let uuid = `${this._source}_${this.qualityLevel}.sp`;
		if (checkCache(uuid)) return;

		let jsonName = spineRes[0];
		let textName = spineRes[1];
		let textureChecked = false;
		// 资源文件加载完成后回调
		let loadComplete = () => {
			// 多个组件在未缓存资源时请求加载，到该回调时其他组件可能已经缓存了资源，这里需要判定下
			if (checkCache(uuid)) {
				return;
			}

			if (!textureChecked) {
				let textAsset = (<cc.TextAsset>this._tempAssetList.getValue(textName));
				if (textAsset) {
					// 检查是否需要追加图片下载
					textureChecked = true;
					let textureDir = cc.path.dirname(textName);
					let readayToRead = false;
					textAsset.text.split('\n').forEach((line) => {
						let trimLine = line.trim();
						if (trimLine.length === 0) {
							readayToRead = true;
						} else if (readayToRead) {
							readayToRead = false;
							// @ts-ignore
							let texturePath = cc.path.join(textureDir, trimLine);
							spineRes.push(texturePath);
						}
					});
					for (let i = 2; i < spineRes.length; ++i) {
						loadTextureFunc(spineRes[i]);
					}
				}
				// 外部资源加载在图片存在的情况下会直接返回资源，导致下面的逻辑执行两次
				return;
			}

			if (this._tempAssetList.length < spineRes.length) {
				return;
			}

			// // 注意这里所有资源都是动态下载来的，所以都会被资源管理器cache住，若不改变其引用就会等待释放
			// // 这里动态加载的jsonAsset和textAsset实际并不会被spine依赖，这里不从临时列表中移除，在setSpine里会uncache
			// let spineAsset = new sp.SkeletonData();
			// let UuidKey = resource.ResourceManager.UuidKey;
			// spineAsset[UuidKey] = uuid;
			// spineAsset[resource.ResourceManager.ExtDepResKey] = [];
			// let jsonAsset = <cc.JsonAsset>this._tempAssetList.getValue(jsonName);
			// spineAsset.skeletonJson = jsonAsset.json;
			// Editor.log("spineAsset.skeletonJson ==============")
			// Editor.log(jsonAsset.json)
			// // //测试代码
			// // let id = 0;
			// // let aims = jsonAsset.json.animations;
			// // for (const n in aims) {
			// // 	let element = aims[n];
			// // 	if(element["deform"])
			// // 		delete element["deform"]

			// // 	let bones = element["bones"]
			// // 	if(bones){
			// // 		for (const bonename in bones) {
			// // 			let bone = bones[bonename];
			// // 			for (const animationname in bone) {
			// // 				let ad = bone[animationname];
			// // 				if(ad[0]["curve"] == "stepped"){
			// // 					delete bone[animationname];
			// // 					// id ++;
			// // 				}
			// // 			}
			// // 		}
			// // 	}
			// // }

			// // console.log("删除", id);

			// // let attachments = jsonAsset.json.skins[0].attachments;
			// // for (const m in attachments) {
			// // 	let a = attachments[m];
			// // 	for (const n in a) {
			// // 		let p = a[n];
			// // 		if(p["type"] = "mesh"){
			// // 			delete a[n]
			// // 		}
			// // 		a[n] = {
			// // 			x : 0,
			// // 			y : 0,
			// // 			roatation: 0,
			// // 			width: 100,
			// // 			height: 100,
			// // 		}
			// // 	}
			// // }



			// let textAsset = <cc.TextAsset>this._tempAssetList.getValue(textName);
			// spineAsset.atlasText = textAsset.text;
			// Editor.log("spineAsset.atlasText ==============")
			// Editor.log(textAsset.text)
			// let textureNames: string[] = [];
			// let textures: cc.Texture2D[] = [];
			// for (let i = 2; i < spineRes.length; ++i) {
			// 	let path = spineRes[i];
			// 	// setSpine里会uncache临时资源，spine是依赖该图片资源的，所以这里从临时资源列表移除
			// 	let textureAsset = <cc.Texture2D>this._tempAssetList.remove(path);
			// 	textureNames.push(cc.path.basename(path));
			// 	textures.push(textureAsset);
			// 	// 记录直接引用资源，释放对应spine时再-1
			// 	spineAsset[resource.ResourceManager.ExtDepResKey].push(textureAsset[UuidKey]);
			// }
			// spineAsset["textureNames"] = textureNames;
			// Editor.log("textureNames ==============")
			// Editor.log(textureNames)
			// spineAsset.textures = textures;
			// Editor.log("spineAsset.textures ==============")
			// Editor.log(spineAsset.textures)

			let textAsset = <cc.TextAsset>this._tempAssetList.getValue(textName);
			let jsonAsset = <cc.JsonAsset>this._tempAssetList.getValue(jsonName);
			let spineAsset = this._createSkeletonData(uuid, textAsset, jsonAsset, spineRes, this._tempAssetList)
			if (cc.assetManager.assets.get(uuid)) {
				console.warn('+++++重复缓存spine', uuid, this.node.uuid);
			}
			cc.assetManager.assets.add(uuid, spineAsset);
			// 首次加载，加入动态资源缓存
			resource.ResourceManager.sInstance.addDynamicAsset(spineAsset);
			// setSpine(spineAsset);
			this._setSpine(spineAsset);
		};

		let loadTextureFunc = (path: string) => {
			// 加载 png文件
			let loadText2DId = loadFunc(path, cc.Texture2D, (err, texture2d: cc.Texture2D) => {
				this._loadIdList.remove(loadText2DId);
				if (err) {
					logFunc(`加载spine png失败，资源：${path}`);
					this._stopLoad();
					return;
				}
				this._addTempAsset(path, texture2d);
				loadComplete();
			});
			this._loadIdList.add(loadText2DId);
		}

		// 加载 json文件
		let loadJsonId = loadFunc(jsonName, cc.JsonAsset, (err, jsonAsset: cc.JsonAsset) => {
			this._loadIdList.remove(loadJsonId);
			if (err) {
				logFunc(`加载spine json失败，资源：${jsonName}`);
				this._stopLoad();
				return;
			}
			this._addTempAsset(jsonName, jsonAsset);
			loadComplete();
		});
		this._loadIdList.add(loadJsonId);

		// 加载 atlas文件
		let loadTextId = loadFunc(textName, cc.TextAsset, (err, textAsset: cc.TextAsset) => {
			this._loadIdList.remove(loadTextId);
			if (err) {
				logFunc(`加载spine atlas失败，资源：${textName}`);
				this._stopLoad();
				return;
			}
			this._addTempAsset(textName, textAsset);
			loadComplete();
		});
		this._loadIdList.add(loadTextId);
	}

	/**
	 * cache资源
	 * @param path
	 * @param asset
	 */
	private _addTempAsset(path: string, asset: cc.Asset): void {
		this._tempAssetList.add(path, asset);
		resource.ResourceManager.sInstance.cacheAsset(asset);
	}

	/**
	 * 编辑器模式下加载内部资源
	 * @param spineRes 通过 _getQualityRes 获得的资源路径
	 */
	private _loadSpineInEditor(spineRes: string[]) {
		if (!CC_EDITOR) return
		let jsonName = spineRes[0];
		let textName = spineRes[1];
		let textureChecked = false;
		let tempAssetList: Dictionary<string, cc.Asset> = new Dictionary<string, cc.Asset>();

		let loadAny = (path: string, assetType: typeof cc.Asset, cb: (assets: cc.Asset) => void) => {
			let res: { bundleName: string; resPath: string; ext: string } = resource.ResourceManager.sInstance.parseResPath(path);
			if (res.bundleName == "resources") {
				res.resPath = resource.ResourceManager.resourcesPrefix + res.resPath;
			} else {
				res.resPath = resource.ResourceManager.bundlesPrefix + res.bundleName + "/" + res.resPath;
			}
			res.resPath = PathUtils.changeExtname(res.resPath, res.ext);
			const uuid = Editor.assetdb.remote.urlToUuid(res.resPath);
			cc.assetManager.loadAny(`${uuid}`, { type: assetType, bundle: res.bundleName, requestType__: "uuid" }, (error: Error, assets: cc.Asset) => {
				if (error) {
					Editor.log(`节点 ${this.node.name} 骨骼资源失败 ${path} ${uuid} ${res.bundleName} ${res.resPath}`);
					return;
				}
				cb(assets);
			});
		}

		let loadComplete = () => {
			if (!textureChecked) {
				let textAsset = (<cc.TextAsset>tempAssetList.getValue(textName));
				if (textAsset) {
					// 检查是否需要追加图片下载
					textureChecked = true;
					let textureDir = cc.path.dirname(textName);
					let readayToRead = false;
					textAsset["_$nativeAsset"].split('\n').forEach((line) => {
						let trimLine = line.trim();
						if (trimLine.length === 0) {
							readayToRead = true;
						} else if (readayToRead) {
							readayToRead = false;
							// @ts-ignore
							let texturePath = cc.path.join(textureDir, trimLine);
							spineRes.push(texturePath);
							loadTextureFunc(texturePath);
						}
					});
				}
				// 外部资源加载在图片存在的情况下会直接返回资源，导致下面的逻辑执行两次
				return;
			}

			if (tempAssetList.length < spineRes.length) {
				return;
			}

			let uuid = `${this._source}_${this.qualityLevel}.sp`;
			let textAsset = <cc.TextAsset>tempAssetList.getValue(textName);
			let jsonAsset = <cc.JsonAsset>tempAssetList.getValue(jsonName);

			let spineAsset = this._createSkeletonData(uuid, textAsset, jsonAsset, spineRes, tempAssetList)
			this._setSpine(spineAsset);
		};

		// 加载 png文件
		let loadTextureFunc = (path: string) => {
			loadAny(path, cc.Texture2D, (texture2d: cc.Texture2D) => {
				tempAssetList.add(path, texture2d);
				loadComplete();
			});
		}

		// 加载 json文件
		loadAny(jsonName, cc.JsonAsset, (jsonAsset: cc.JsonAsset) => {
			jsonAsset.json = jsonAsset["_skeletonJson"];
			tempAssetList.add(jsonName, jsonAsset);
			loadComplete();
		});

		// 加载 atlas文件
		loadAny(textName, cc.TextAsset, (textAsset: cc.TextAsset) => {
			textAsset.text = textAsset["_$nativeAsset"]
			tempAssetList.add(textName, textAsset);
			loadComplete();
		});
	}

	private _createSkeletonData(uuid: string, textAsset: cc.TextAsset, jsonAsset: cc.JsonAsset, spineRes: string[], tempAssetList: Dictionary<string, cc.Asset>): sp.SkeletonData {
		let spineAsset = new sp.SkeletonData();
		let UuidKey = resource.ResourceManager.UuidKey;
		spineAsset[UuidKey] = uuid;
		spineAsset[resource.ResourceManager.ExtDepResKey] = [];
		spineAsset.skeletonJson = jsonAsset.json;

		spineAsset.atlasText = textAsset.text;
		let textureNames: string[] = [];
		let textures: cc.Texture2D[] = [];
		for (let i = 2; i < spineRes.length; ++i) {
			let path = spineRes[i];
			// setSpine里会uncache临时资源，spine是依赖该图片资源的，所以这里从临时资源列表移除
			let textureAsset = <cc.Texture2D>tempAssetList.remove(path);
			textureNames.push(cc.path.basename(path));
			textures.push(textureAsset);
			// 记录直接引用资源，释放对应spine时再-1
			spineAsset[resource.ResourceManager.ExtDepResKey].push(textureAsset[UuidKey]);
		}
		spineAsset["textureNames"] = textureNames;
		spineAsset.textures = textures;
		return spineAsset;
	}

	/**
	 * 设置骨骼数据
	 * @param spineAsset
	 */
	private _setSpine(spineAsset: sp.SkeletonData) {
		// TODO 编辑器模式下保存后会在_N$skeletonData字段中留下uuid，导致在加载该预制时加载不到对应uuid的骨骼资源从而报错
		//      或者保存的uuid为 .json文件的uuid时，则加载预制时引擎回去加载该骨骼动画，就像直接在编辑器拖拉赋值一样
		//      因此在编辑器模式下暂时不给skeletonData赋值，只打印提示
		if (CC_EDITOR) {
			Editor.log(`节点 ${this.node.name} 路径设置正确 ---> ${this._source}`);

			this.animationNames.length = 0;
			let animationsTmp: sp.spine.Animation[] = spineAsset.getRuntimeData(true).animations;
			animationsTmp?.forEach((ani: sp.spine.Animation) => {
				this.animationNames.push(ani.name);
			});

			this.customAnimation = this.animationNames[0] || "";
			return;
		}
		this._stopLoad();
		this._updateSkeletonDataAndRefCount(spineAsset);
		this.onLoadCompleteHandler()
	}

	private _updateSkeletonDataAndRefCount(newSk?: sp.SkeletonData) {
		if (this.skeletonData) resource.ResourceManager.sInstance.uncacheAsset(this.skeletonData);
		this.skeletonData = newSk;
		if (this.skeletonData) resource.ResourceManager.sInstance.cacheAsset(this.skeletonData);
	}

	private _stopLoad(): void {
		while (this._loadIdList.length > 0) {
			resource.ResourceManager.sInstance.stopLoad(this._loadIdList.shift());
		}
		this._tempAssetList.foreach((key, asset) => resource.ResourceManager.sInstance.uncacheAsset(asset));
		this._tempAssetList.clear();
	}

	/**
	 * 重写_refreshInspector
	 * 编辑器模式下，skeletonData变动时调用此函数
	 * @returns
	 */
	_refreshInspector() {
		if (!CC_EDITOR) return
		//@ts-ignore
		super._refreshInspector();

		if (!CC_EDITOR || !this._pathMap) {
			return;
		}

		this._skeletonToUrl();
	}

	/**
	 * 骨骼动画转路径
	 * @returns
	 */
	private _skeletonToUrl() {
		if (!CC_EDITOR) return
		if (!this.skeletonData || !CC_EDITOR || !this._pathMap) {
			return;
		}

		let skeletonPath = Editor.remote.assetdb.uuidToUrl(this.skeletonData["_uuid"]);
		if (!skeletonPath) {
			return;
		}

		if (skeletonPath.startsWith(resource.ResourceManager.bundlesPrefix)) {
			skeletonPath = skeletonPath.replace(resource.ResourceManager.bundlesPrefix, "");
		}
		if (skeletonPath.startsWith(resource.ResourceManager.resourcesPrefix)) {
			skeletonPath = skeletonPath.replace("db://assets/", "");
		}

		if (this._source != skeletonPath) {
			Editor.log(`节点 ${this.node.name} 路径转换: ${this.skeletonData.name} -> ${skeletonPath}`);
			this.source = skeletonPath;
		}
	}

	private _parseSource(source: string) {
		return source;
	}

	public onDestroy() {
		this._stopLoad();
		this._updateSkeletonDataAndRefCount(undefined);
		this._source = "";
		super.onDestroy();
	}
}