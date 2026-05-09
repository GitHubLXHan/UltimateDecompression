import { UIEventType } from "./types/UIEventType";
import { UILayerConfig, UILayerType } from "./types/UILayerType";
import { Listener } from "../eventListener/Listener";
import { Dictionary } from "../basecore/Dictionary";
import { List } from "../basecore/List";
import { EnumUtils } from "../utils/EnumUtils";
import { ClassUtils } from "../utils/ClassUtils";
import { LogMgr } from "../log/LogMgr";
import { LoadUtils } from "../utils/LoadUtils";
import { NodeUtils } from "../utils/NodeUtils";
import { TimeMgr } from "../time/TimeMgr";
import { View } from "./compoment/View";
import { DeviceUtils } from "../utils/DeviceUtils";
import { IProfiler } from "../profiler/IProfiler";
import { Monitor } from "../profiler/Monitor";

/**
 * @description:
 * @author: Zeros
 *
 * 注意：预制件命名规则 - view类名的小驼峰法
 */
export abstract class BaseUIMgr extends Listener<UIEventType, BaseUIMgr> implements IProfiler {
	//View实例的缓存库
	protected _instanceStore: Dictionary<string, ViewCache> = new Dictionary<string, ViewCache>();
	//View实例的缓存库，保存已关闭但未销毁的实例
	protected _instanceCacheStore: Dictionary<string, ViewCache> = new Dictionary<string, ViewCache>();
	//层级库
	protected _layerStore: Dictionary<UILayerType, cc.Node> = new Dictionary<UILayerType, cc.Node>();
	//销毁时的例外列表
	private _closeAllExcludeList: List<string> = new List<string>();
	//根节点
	private _root: cc.Node;
	private _prefabPath: string = "";
	private _isAllViewClosing: boolean = false;
	private _canvasSize: cc.Vec2 = new cc.Vec2();

	//UI自动销毁时间(秒)
	private _destroyTime: number = 10 * 60;
	//心跳
	private _idleTimer: number = 0;

	constructor() {
		super();
		Monitor.Ins.addProfiler(this);
	}

	/**
	 * @description: 初始化
	 * @param root 根显示对象
	 * @param width 宽度
	 * @param height 高度
	 * @param destroyTime 自动销毁时间(秒)
	 */
	public init(root: cc.Node, prefabPath: string, width: number = 720, height: number = 1280, destroyTime: number = 5) {
		this._root = root;
		if (prefabPath != null && prefabPath.length > 0) 1
		this._prefabPath = LoadUtils.folderPathFilter(prefabPath);

		this._canvasSize.x = width;
		this._canvasSize.y = height;
		this._destroyTime = destroyTime;

		//初始化层级节点
		let layerDic = EnumUtils.getDic(UILayerType);

		for (let i = 0; i < layerDic.length; i++) {
			let layerName = layerDic.getKeyByIndex(i);
			let layerType = UILayerType[layerName];
			if (!this._layerStore.contains(layerType)) {
				let node = new cc.Node();
				node.name = layerName || "";
				NodeUtils.addTransform(node, this._canvasSize.x, this._canvasSize.y);
				let top = 0
				let bottom = 0
				let config = UILayerConfig[layerType];
				if (config.saveAreaEnable) {
					top = DeviceUtils.Ins.statusBarHeight
					bottom = DeviceUtils.Ins.statusBottomHeight
				}
				// console.log(`statusBarHeight: ${top}`)
				// console.log(`statusBottomHeight: ${bottom}`)
				NodeUtils.addWidget(node, top, bottom, undefined, undefined);

				this._root.addChild(node);
				this._layerStore.add(layerType, node);

			}
		}

		if (this._idleTimer > 0) {
			TimeMgr.Ins.remove(this._idleTimer);
			this._idleTimer = 0;
		}

		this._idleTimer = TimeMgr.Ins.callInterval(5, this.checkDestroy.bind(this));
	}

	/**
	 * @description: 打开指定的UI
	 * @param classInfo 指定的窗口信息
	 * @param layerType 所在层级
	 * @param viewParams 附带参数
	 * @param isPlayAnimation 是否播放打开动画
	 */
	public open<T extends View>(classInfo: { new(): T } | string, layerType: UILayerType, viewParams?: any, isPlayAnimation: boolean = true): View | null {
		if (this._isAllViewClosing) {
			//正在关闭所有界面过程中不允许打开新界面
			LogMgr.log("正在关闭所有界面过程中不允许打开新界面");
			return null;
		}

		if (classInfo == null)
			return null;

		let className = ""
		if (typeof classInfo == "string") {
			className = classInfo
		} else {
			className = ClassUtils.getClassName(classInfo);
		}

		var cache = this._instanceStore.getValue(className);
		if (cache != null) {
			//窗口已经存在，调用再次打开
			// console.log("重复打开界面", className);
			//交换顺序，确保最后打开的放在最上面
			this._instanceStore.remove(className);
			this._instanceStore.add(className, cache);
			this.updateViewVisableByOpaque();

			//更新打开参数
			if (!cache.view.isInit) {
				cache.view.parent = this.getLayer(layerType);
				cache.view.loadSkin(viewParams, this.viewOpenDoneHandler.bind(this), isPlayAnimation);

			} else {
				cache.view.initRunData(viewParams);
				cache.view.updateView(viewParams);
			}
			this.addFocus(cache);
			this.dispatchEvent(UIEventType.Open, cache.name, cache.layerType);
			if (cache.view.root)
				this.dispatchEvent(UIEventType.ViewLoadDone, cache.name, cache && cache.layerType);
			return cache.view;
		}

		cache = this._instanceCacheStore.remove(className);
		if (cache == null) {
			let view = ClassUtils.getIns(className) as View;
			cache = new ViewCache(className, view, layerType);
		}
		// 界面可能在不同层级打开，这里要重新设置下
		cache.layerType = layerType;

		//检查销毁
		this.checkDestroy();

		this._instanceStore.add(cache.name, cache);
		cache.view.loadSkin(viewParams, this.viewOpenDoneHandler.bind(this), isPlayAnimation, this.viewLoadDoneHandler.bind(this));
		cache.view.parent = this.getLayer(layerType);

		this.updateViewVisableByOpaque()
		this.addFocus(cache);
		this.onViewStackUpdate();

		this.dispatchEvent(UIEventType.Open, cache.name, cache.layerType);

		return cache.view;
	}

	/**
	 * @description: 窗口加载完毕
	 * @param {string} name
	 */
	private viewLoadDoneHandler(name: string) {
		let cache = this._instanceStore.getValue(name)
		this.dispatchEvent(UIEventType.ViewLoadDone, name, cache && cache.layerType);
	}

	/**
	 * @description: 窗口加载完毕并播放完动画
	 * @param {string} name
	 * @param {string} isError
	 */
	private viewOpenDoneHandler(name: string, isError: boolean = false) {
		if (isError) {
			//加载失败
			let cache = this._instanceStore.remove(name);
			if (cache != null) {
				this.updateViewVisableByOpaque()
				this.removeFocus(cache);
				this.onViewStackUpdate();
				return;
			}
		}
		this.dispatchEvent(UIEventType.OpenAnimationDone, name);
	}

	/**
	 * @description: 控制界面渲染
	 * @param {string}
	 */

	private updateViewVisableByOpaque() {
		let isShow = true;
		let cacheView = undefined
		if (this._instanceStore.length > 0) {
			let max = this._instanceStore.length - 1;
			for (let i = max; i >= 0; i--) {
				let cache = this._instanceStore.getValueByIndex(i);
				if (!cacheView || cache.layerType == cacheView.layerType) {
					cache.view.visible = isShow;
					if (isShow && cache.view.isOpaque) {
						isShow = false;
						cacheView = cache;
					}
				}
			}
		}

		if (cacheView && this._instanceStore.length > 0) {
			//处理其他层
			let max = this._instanceStore.length - 1;
			for (let i = max; i >= 0; i--) {
				let cache = this._instanceStore.getValueByIndex(i);
				if (cache.layerType < cacheView.layerType) {
					cache.view.visible = false;
				} else if (cache.layerType > cacheView.layerType) {
					cache.view.visible = true;
				}
			}
		}
	}

	/**
	 * @description: 为直接界面缓存添加焦点
	 * @param {ViewCache} focusCache
	 */
	private addFocus(focusCache: ViewCache) {
		focusCache.view.isFocus = true;
		// if (this._instanceStore.length > 0) {
		// 	let max = this._instanceStore.length - 1;
		// 	for (let i = max; i >= 0; i--) {
		// 		let cache = this._instanceStore.getValueByIndex(i);
		// 		if (cache != focusCache && cache.layerType == focusCache.layerType) {
		// 			cache.view.isFocus = false;
		// 			return;
		// 		}
		// 	}
		// }
	}

	/**
	 * @description: 移除指定界面的焦点
	 * @param {ViewCache} focusCache
	 * @return {*}
	 */
	private removeFocus(focusCache: ViewCache) {
		focusCache.view.isFocus = false;
		// if (this._instanceStore.length > 0) {
		// 	let max = this._instanceStore.length - 1;
		// 	for (let i = max; i >= 0; i--) {
		// 		let cache = this._instanceStore.getValueByIndex(i);
		// 		if (cache != focusCache && cache.layerType == focusCache.layerType) {
		// 			cache.view.isFocus = true;
		// 			return;
		// 		}
		// 	}
		// }
	}

	/**
	 * @description: 关闭指定的UI
	 * @param classInfo 指定的UI信息
	 * @param isDestroy 是否直接销毁
	 * @param isPlayAnimation 是否播放关闭动画
	 * @param closeAbove 是否同时关闭处于同一层的上方所有界面
	 */
	public close<T extends View>(classInfo: { new(): T } | string, isDestroy: boolean = false, isPlayAnimation: boolean = true, closeAbove = false) {
		if (classInfo == null) return null;
		let className = ""

		if (typeof classInfo == "string") {
			className = classInfo
		} else {
			className = ClassUtils.getClassName(classInfo);
		}

		// 关闭界面时是否将其上方的界面全部关闭
		if (closeAbove) {
			let layerType = this._instanceStore.getValue(className)?.layerType;
			let index = this._instanceStore.getIndex(className);
			for (let i = this._instanceStore.length - 1; i >= index; i--) {
				let viewCache = this._instanceStore.getValueByIndex(i);
				if (viewCache) {
					if (viewCache.layerType != layerType || this._closeAllExcludeList.contains(viewCache.name)) continue;

					//执行关闭界面
					this.closeByName(viewCache.name, isDestroy, isPlayAnimation);
				}
			}
		} else {
			this.closeByName(className, isDestroy, isPlayAnimation);
		}

	}

	/**
	 * @description: 关闭所有界面 包括5个主界面 慎用
	 * @param {boolean} isDestroy 是否直接销毁
	 * @param {boolean} isPlayAnimation 是否播放关闭动画
	 */
	public closeAll(isDestroy: boolean = false, isPlayAnimation: boolean = false) {
		if (this._instanceStore.length > 0) {
			this._isAllViewClosing = true;

			for (let i = this._instanceStore.length - 1; i >= 0; i--) {
				let viewCache = this._instanceStore.getValueByIndex(i);
				//检查排除列表
				if (viewCache) {
					if (this._closeAllExcludeList.contains(viewCache.name)) continue;

					//执行关闭界面
					this.close(viewCache.name, isDestroy, isPlayAnimation);
				}
			}
			this._isAllViewClosing = false;
		}
	}

	/**
	 * @description: 关闭view层和pop层所有界面 一般业务用这个
	 * @param {*}
	 * @return {*}
	 */
	public closeAllViewAndPanel() {
		this.closeByLayerType(UILayerType.View);
	}

	/**
	 * @description: 关闭所有指定层级类型的界面
	 * @param {UILayerType} layerType
	 * @param {boolean} isDestroy
	 * @param {boolean} isPlayAnimation
	 */
	public closeByLayerType(layerType: UILayerType, isDestroy: boolean = false, isPlayAnimation: boolean = true) {
		if (this._instanceStore.length > 0) {
			this._isAllViewClosing = true;

			for (let i = this._instanceStore.length - 1; i >= 0; i--) {
				let viewCache = this._instanceStore.getValueByIndex(i);
				//检查排除列表
				if (viewCache) {
					if (viewCache.layerType != layerType || this._closeAllExcludeList.contains(viewCache.name)) continue;

					//执行关闭界面
					this.close(viewCache.name, isDestroy, isPlayAnimation);
				}
			}
			this._isAllViewClosing = false;
		}
	}

	/**
	 * @description: 关闭界面
	 * @param {string} className
	 * @param {boolean} isDestroy
	 */
	protected closeByName(className: string, isDestroy: boolean = false, isPlayAnimation: boolean = true) {
		let cache = this._instanceStore.remove(className);
		if (cache != null) {
			this.updateViewVisableByOpaque()
			if (!isDestroy) {
				//不销毁时缓存窗口，记录关闭时间
				cache.closeTime = TimeMgr.Ins.timestamp + this._destroyTime;
				this._instanceCacheStore.add(cache.name, cache);
			}

			if (!this._isAllViewClosing) {
				this.removeFocus(cache);
			}

			this.dispatchEvent(UIEventType.StartCloseAnimation, cache.name);
			cache.view.playCloseAnimation(this.viewCloseDoneHandler.bind(this), !isPlayAnimation, isDestroy);

			this.onViewStackUpdate();
		}
	}


	/**
	 * @description: 窗口关闭动画播放完毕
	 * @param {string} name
	 */
	protected viewCloseDoneHandler(name: string) {
		this.dispatchEvent(UIEventType.Close, name);
	}

	/**
	 * @description: 检查自动销毁
	 */
	private checkDestroy() {
		if (this._instanceCacheStore.length > 0) {
			let now = TimeMgr.Ins.timestamp;
			let max = this._instanceCacheStore.length - 1;
			for (let i = max; i >= 0; i--) {
				let cache = this._instanceCacheStore.getValueByIndex(i);
				if (!cache.view.alwaysCache && cache.closeTime < now) {
					//超过销毁时间，销毁缓存
					this._instanceCacheStore.removeAt(i);
					cache?.view?.destroy();
				}
			}
		}
	}


	/**
	 * @description: 指定的View是否处于打开状态
	 * @param {type}
	 */
	public isOpen<T extends View>(viewCls: { new(): T } | string) {
		if (typeof viewCls == "string") {
			return this._instanceStore.contains(viewCls);
		} else {
			return this._instanceStore.contains(ClassUtils.getClassName(viewCls));
		}
	}


	/**
	 * @description: 指定的View是否处于打开状态
	 * @param {type}
	 */
	public isOpenAndShowed<T extends View>(viewCls: { new(): T } | string) {
		if (typeof viewCls != "string") {
			viewCls = ClassUtils.getClassName(viewCls);
		}
		if (this._instanceStore.contains(viewCls)) {
			let view = this._instanceStore.getValue(viewCls);
			if (view.view.isInit && !view.view.isPlayAnimation) {
				return true;
			}
		}
		return false;
	}

	/**
	 * @description: 获取已经打开的View实例
	 * @param {type}
	 */
	public getView<T extends View>(classInfo: { new(): T } | string): View | null {
		if (classInfo == null) return null;

		let className: string = "";
		if (typeof classInfo == "string") {
			className = classInfo;
		} else {
			className = ClassUtils.getClassName(classInfo);
		}

		let cache = this._instanceStore.getValue(className);
		if (cache != null)
			return cache.view;

		return null;
	}

	/**
	 * @description: 添加关闭所有界面时的排除列表
	 * @param viewCls 指定的窗口
	 */
	public addCloseExclude<T extends View>(viewCls: { new(): T }) {
		let className: string = "";
		if (typeof viewCls == "string") {
			className = viewCls;
		} else {
			className = ClassUtils.getClassName(viewCls);
		}

		if (!this._closeAllExcludeList.contains(className)) this._closeAllExcludeList.add(className);
	}

	/**
	 * @description: 移除关闭所有界面时的排除列表
	 * @param viewCls 指定的窗口
	 */
	public removeCloseExcude<T extends View>(viewCls: { new(): T }) {
		let className: string = "";
		if (typeof viewCls == "string") {
			className = viewCls;
		} else {
			className = ClassUtils.getClassName(viewCls);
		}

		if (!this._closeAllExcludeList.contains(className)) this._closeAllExcludeList.remove(className);
	}

	/**
	 * @description: 获取层级类型对应的Node节点
	 * @param layerType 层级类型
	 */
	public getLayer(layerType: UILayerType) {
		return this._layerStore.getValue(layerType);
	}

	/**
	 * @description: 获取资源路径
	 * @param name
	 * @return:
	 */
	public getResPath(name: string): string {
		return this._prefabPath + name;
	}

	/**
	 * @description: 根节点
	 */
	public get root(): cc.Node {
		return this._root;
	}

	/**
	 * @description: 画布尺寸
	 */
	public get canvasSize(): cc.Vec2 {
		return this._canvasSize;
	}

	/**
	 * @description: 节点是否在场景中
	 * @param {cc} node
	 */
	public isInStage(node: cc.Node): boolean {
		if (node.parent == null)
			return false;

		if (node.parent != this._root)
			return this.isInStage(node.parent);

		return true;
	}

	protected onViewStackUpdate() {

	}

	public dispose() {
		if (this._idleTimer > 0) {
			TimeMgr.Ins.remove(this._idleTimer);
			this._idleTimer = 0;
		}

		this.closeAll();

		this._layerStore.clear();

		if (this._root != null) {
			this._root.removeFromParent();
			this._root = null;
		}
	}

	public clearInstanceCacheStore() {
		this._instanceCacheStore.clear()
	}

	public memoryInfo(): { size: number, tips: string } {
		return { size: 0, tips: i18n`UIMgr：缓存界面${this._instanceStore.length}个` }

	};

	public freeMemory(): number {
		return 0;
	}

}


/**
 * @description: 已创建的窗口实例数据
 */
export class ViewCache {
	public name: string;
	public view: View;
	public layerType: UILayerType;
	public closeTime: number = 0; //界面最后一次关闭时间

	constructor(name: string, view: View, layerType: UILayerType) {
		this.name = name;
		this.view = view;
		this.layerType = layerType;
	}
}