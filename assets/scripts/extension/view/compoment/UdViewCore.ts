import { UdDeviceKit } from "../../utils/UdDeviceKit";
import { UdAudioDef } from "../../audio/UdAudioDef";
import { UdAudioHub } from "../../audio/UdAudioHub";
import { UdSeqList } from "../../basecore/UdSeqList";
import { UdBindMeta } from "../../basecore/UdDecoratorKit";
import { UdLogCore } from "../../log/UdLogCore";
import { udRes } from "../../resources/UdResHub";
import { UdReflectKit } from "../../utils/UdReflectKit";
import { UdViewMotion } from "../animations/UdViewMotion";
import { UdResFinder } from "./UdResFinder";

/**
 * @description: 全屏类界面父类
 *  生命周期:   init(root)  和预制绑定
 *             initRunData() 初始化变量 会在第一次打开和从缓存中打开时调用
 *             updateView(params) 更新界面 会在第一次打开和从缓存中打开时调用 其他时机需自己管理
 *  其他参数&函数  skinName :预制体名称 默认是类名（首字母小写）
 *              show hide 设置对应的visible=true  添加和删除事件
 *              close 从界面上移除 相当于关闭界面
 */

@UdBindMeta
export abstract class UdViewCore extends UdLogCore {
	private _isFirstClose: boolean = true;
	private _isPlayAnimation = false;
	private _resBase!: UdResFinder;
	private _name: string = "";
	private _prefabPath: string = "";
	private _bundleName: string = "resources"; //默认在udRes里面
	private _root!: cc.Node;

	//记录需要播放的动画数量
	private _maxAnimation: number = 0;
	//动画对象数量
	private _animations: UdSeqList<UdViewMotion>;
	//动画回调
	private _animationCallback: (name: string, error?: boolean) => void;
	//关闭后是否自动销毁
	private _closeAndDestroy: boolean = false;
	//加载id
	private _loadId: number = 0;
	//父节点
	private _parent: cc.Node;
	//打开参数
	private _openArgs: any[];

	//当前是否属于焦点状态
	private _isFocus: boolean = false;
	//输入阻挡组件
	private _isBlockInputEvents: boolean = true;
	//输入主档事件
	private _blockInputEvents: cc.BlockInputEvents;
	private _fewTimeoutId: NodeJS.Timeout;

	private _prefab: cc.Asset;
	//是否播放默认关闭音效
	private _isPlayDefaultCloseSound: boolean = true;

	private static readonly Bit16: number = 0xff;

	/**忽略刘海屏顶部适配 */
	private _ignoreWidgetTopAdjust: boolean = false;
	/**忽略底部适配 */
	private _ignoreWidgetBottomAdjust: boolean = false;

	private _sourceOpacity = -1

	public constructor() {
		super();
		this._name = UdReflectKit.getClassName(this);
	}

	/**
	 * @description: 打开界面，包含加载
	 * @param {any} args 打开界面参数
	 * @param {function} callback 打开界面参数
	 * @param isPlayAnimation 是否播放打开动画
	 * @param loadDoneCB 是否播放打开动画
	 */
	public loadSkin(args: any[], callback: (name: string, error?: boolean) => void, isPlayAnimation: boolean, loadDoneCB?: (name: string) => void) {
		if (this.prefabPath == null || this.prefabPath.length <= 0) {
			console.warn("未指明skinName", this._name);
			return;
		}
		this._animationCallback = callback;
		this._openArgs = args;

		if (this._loadId > 0) {
			//正在加载
			return;
		}

		if (this._root != null) {
			//已加载过
			loadDoneCB && loadDoneCB(this.name);
			this.startFillView(callback, isPlayAnimation);
			return;
		}

		this._loadId = udRes.UdResHub.sInstance.load(this.prefabPath, cc.Prefab, (err: Error, prefab: cc.Prefab) => {
			this._loadId = 0;
			if (err != null) {
				this.logError("View加载失败:", this.prefabPath);
				this._loadId = -1;
				callback(this.name, true);
				return;
			}
			this._prefab = prefab;
			udRes.UdResHub.sInstance.cacheAsset(prefab);

			this.init(cc.instantiate(prefab));
			loadDoneCB && loadDoneCB(this.name);
			this.startFillView(callback, isPlayAnimation);
		});
	}

	/**
	 * @description: 开始填充窗口
	 * @param {function} callback
	 * @param isPlayAnimation 是否播放打开动画
	 */
	private startFillView(callback: (name: string, error: boolean) => void, isPlayAnimation: boolean) {
		this.parent = this._parent;
		this.updateWidget();
		let tempArgs = this._openArgs;
		this._openArgs = null;
		this.initRunData(tempArgs);
		this.updateView(tempArgs);
		this.show();
		this.visible = true;
		//先设置透明
		this.clearFewTimeout();

		this._sourceOpacity = this._root.opacity;
		this._root.opacity = 0;
		this.onFocusUpdate();

		this._fewTimeoutId = setTimeout(() => {
			//初始化后延迟动画
			this._root.opacity = this._sourceOpacity //View.Bit16;
			this._sourceOpacity = -1
			this.playOpenAnimation(callback, !isPlayAnimation);

		}, 0);
		this.log("打开窗口:", this.name);
	}

	private clearFewTimeout() {
		if (this._fewTimeoutId != null) {
			clearTimeout(this._fewTimeoutId);
			this._fewTimeoutId = null;
			if (this._root && this._sourceOpacity >= 0) {
				this._root.opacity = this._sourceOpacity
				this._sourceOpacity = -1
			}
		}
	}

	/**
	 * @description: 设置父节点
	 */
	public get parent(): cc.Node {
		return this._parent;
	}
	public set parent(parent: cc.Node) {
		if (this._root != null) {
			if (this._root.parent != parent) {
				this._root.removeFromParent();

				if (parent != null) {
					parent.addChild(this._root);
				}
				this.onFocusUpdate();
			}
		}
		this._parent = parent;
	}

	/**
	 * @description: 初始化
	 * @param {type}
	 */
	protected init(root: cc.Node, needFullScreen = true) {
		if (this._root != null) return;

		this._root = root;

		this.isBlockInputEvents = this.isBlockInputEvents;

		if (this._resBase == null) this._resBase = new UdResFinder();

		this._resBase.init(this._root);

		let animations = this._root.getComponentsInChildren(UdViewMotion);
		if (animations != null && animations.length > 0) {
			if (this._animations == null) {
				this._animations = new UdSeqList<UdViewMotion>();
			} else {
				this._animations.clear();
			}
			animations.forEach((value: UdViewMotion, index: number) => {
				value.isAutoStart = false;
			});

			this._animations.addArray(
				animations.filter((e) => {
					return e.effectByView;
				})
			);
		}

		//牺牲大小换空间(scale缩小了)
		// //适配宽度
		let widget = this._root.getComponent(cc.Widget);
		// let canvasSize = cc.view.getCanvasSize();
		// let height = 720 / canvasSize.width * canvasSize.height
		//高放缩到一样大 然后宽度拉满
		// let scale = height < 1280 && (canvasSize.width < canvasSize.height) ? height / 1280 : 1
		// this.root.scale = scale
		if (needFullScreen) {
			if (!widget) widget = this.root.addComponent(cc.Widget);
			if (widget) {
				if (UdDeviceKit.Ins.IsXyx) {
					if (UdDeviceKit.Ins.statusBarHeight <= 0) {
						//windows没有刘海 不需要适配
						widget.top = 0
					} else {
						widget.top = this.ignoreWidgetTopAdjust ? -UdDeviceKit.Ins.statusBarHeight : - UdDeviceKit.Ins.xyxBarHeight + 30;
					}
				} else {
					widget.top = this.ignoreWidgetTopAdjust ? -UdDeviceKit.Ins.statusBarHeight : 0;
				}

				widget.bottom = this.ignoreWidgetBottomAdjust ? -UdDeviceKit.Ins.statusBottomHeight : 0;
				widget.isAlignTop = widget.isAlignBottom = true;
			}
		}
		if (widget != null) widget.updateAlignment();
	}

	protected updateWidget() {
		let widget = this._root.getComponent(cc.Widget);
		if (widget != null) {
			widget.updateAlignment();
		}
	}

	/**
	 * @description: 一些运行时数据的初始化 会在第一次打开和从缓存中打开时调用
	 * @param {*}
	 * @return {*}
	 */
	public initRunData(args?: any) { }

	/**
	 * @description: 显示对象
	 */
	public get root(): cc.Node {
		return this._root;
	}

	//是否永久缓存
	private _alwaysCache: boolean = false;
	/**
	 * @description: 是否永久缓存，不销毁
	 */
	public get alwaysCache(): boolean {
		return this._alwaysCache;
	}
	public set alwaysCache(value: boolean) {
		this._alwaysCache = value;
	}

	/**
	 * @description: 忽略刘海屏顶部适配
	 */
	protected get ignoreWidgetTopAdjust(): boolean {
		return this._ignoreWidgetTopAdjust;
	}
	protected set ignoreWidgetTopAdjust(value: boolean) {
		this._ignoreWidgetTopAdjust = value;
	}

	/**
	 * @description: 忽略底部适配
	 */
	protected get ignoreWidgetBottomAdjust(): boolean {
		return this._ignoreWidgetBottomAdjust;
	}
	protected set ignoreWidgetBottomAdjust(value: boolean) {
		this._ignoreWidgetBottomAdjust = value;
	}

	/**
	 * @description: 名字
	 */
	public get name(): string {
		return this._name;
	}

	/**
	 * @description: 预制件名称
	 */
	protected get prefabPath(): string {
		return this._prefabPath;
	}
	protected set prefabPath(value: string) {
		this._prefabPath = value;
	}

	/**
	 * @description: 所在bundle包。默认udRes
	 */
	protected get bundleName(): string {
		return this._bundleName;
	}
	protected set bundleName(value: string) {
		this._bundleName = value;
	}

	/**
	 * @description: 是否初始化完成
	 */
	public get isInit(): boolean {
		return this._root != null;
	}

	/**
	 * @description: 是否正在播放动画
	 */
	public get isPlayAnimation(): boolean {
		return this._isPlayAnimation;
	}
	/**
	 * @description: 加载失败状态
	 */
	protected get isLoadError(): boolean {
		return this._loadId < 0;
	}

	/**
	 * @description: 是否阻挡输入事件
	 */
	protected get isBlockInputEvents(): boolean {
		return this._isBlockInputEvents;
	}
	protected set isBlockInputEvents(value: boolean) {
		this._isBlockInputEvents = value;

		if (this._root == null)
			return;

		if (this._isBlockInputEvents) {
			if (this._blockInputEvents == null) {
				this._blockInputEvents = this._root.addComponent(cc.BlockInputEvents);
			}

			this._blockInputEvents.enabled = this._isBlockInputEvents;
		} else {
			if (this._blockInputEvents != null) {
				this._blockInputEvents.enabled = this._isBlockInputEvents;
			}
		}
	}

	private _isOpaque: boolean = false; //涉及UI遮挡优化
	/**
	 * @description: 是否不透明界面
	 */
	public get isOpaque(): boolean {
		return this._isOpaque;
	}
	/**
	 * @description: 是否不透明界面
	 */
	public set isOpaque(v: boolean) {
		this._isOpaque = v;
	}

	/**
	 * @description: 更新界面
	 * @param {type}
	 */
	public updateView(args?: any) { }

	private _visible: boolean = true;

	public get visible(): boolean {
		return this._visible;
	}

	//仅关闭渲染，不影响逻辑处理
	public set visible(visible: boolean) {
		if (this._visible != visible) {
			if (this._root != null) {
				this.setNodeRenderAble(this._root, visible);
				this._visible = visible;
				this.onVisibleChange();
			}
		}
	}

	/**
	 * @description: 设置节点是否渲染
	 * @param {cc} node
	 * @param {number} visible 是否渲染
	 */
	public setNodeRenderAble(node: cc.Node, visible: boolean) {

		if (CC_JSB) {
			if (visible) {
				//@ts-ignore
				node.opacity = 255;
			} else {
				//@ts-ignore
				node.opacity = 0;
			}
		} else {
			if (visible) {
				//@ts-ignore
				node._renderFlag &= ~cc.RenderFlow.FLAG_DONOTHING
			} else {
				//@ts-ignore
				node._renderFlag |= cc.RenderFlow.FLAG_DONOTHING
			}
		}

	}

	protected onVisibleChange(): void {

	}

	/**
	 * @description: 显示界面内容
	 * @param {type}
	 */
	public show() {
		if (!this.isInit) return;
		if (this._root != null) this._root.active = true;

		this.addEvents();
		this.onFocusUpdate();
	}

	/**
	 * @description: 隐藏界面内容
	 * @param {type}
	 */
	public hide() {
		if (this._loadId > 0) {
			udRes.UdResHub.sInstance.stopLoad(this._loadId);
			this._loadId = 0;
		}
		if (!this.isInit) return;

		if (!this._isPlayAnimation) {
			this.removeEvents();
		}

		if (this._root != null) {
			this._root.active = false;
		}

		this.onFocusUpdate();
		this.stopAnimation();
	}

	/**
	 * @description: 添加事件侦听
	 * @param {type}
	 */
	protected addEvents() { }

	/**
	 * @description: 移除事件侦听
	 * @param {type}
	 */
	protected removeEvents() { }

	/**
	 * @description: 播放打开界面动画
	 * @param {*} callback
	 * @param {boolean} isSkip
	 */
	public playOpenAnimation(callback: (name: string, error?: boolean) => void, isSkip: boolean): void {
		this.stopAnimation();
		this._isPlayAnimation = true;
		this._animationCallback = callback;
		if (isSkip) {
			this.openAnimationDoneHandler();
			return;
		}

		if (this._animations != null && this._animations.length > 0) {
			let max = this._animations.length;
			for (let i = 0; i < max; i++) {
				let animation = this._animations.get(i);
				if (animation.playOpenAnimation && animation.nodeActive) {
					this._maxAnimation++;
				}
			}

			if (this._maxAnimation > 0) {
				//这里第二次循环看起来虽然低效，但根据实际使用频率与GC的关系这种写法相对较好
				for (let i = 0; i < max; i++) {
					let animation = this._animations.get(i);
					if (animation.playOpenAnimation && animation.nodeActive) {
						animation.doOpen(this.openAnimationDoneHandler.bind(this));
					}
				}
			} else {
				this.openAnimationDoneHandler();
			}
		} else {
			this.openAnimationDoneHandler();
		}
	}

	/**
	 * @description: 播放单个开始动画结束
	 */
	private openAnimationDoneHandler() {
		this._maxAnimation--;
		if (this._maxAnimation > 0) return;

		let callback = this._animationCallback;
		this.stopAnimation();
		if (callback != null) {
			callback(this.name);
		}
		this.onOpenAnimationCompleted();
	}

	/**
	 * @description: 播放关闭窗口动画，完成后将会自动执行关闭窗口
	 * @param {*} callback
	 * @param {boolean} isSkip
	 * @param {boolean} isDestroy
	 * @param {boolean} isPlayCloseSound
	 */
	public playCloseAnimation(callback: (name: string) => void, isSkip: boolean, isDestroy: boolean = false, isPlayCloseSound: boolean = true) {
		if (!this.isInit) {
			this.clearFewTimeout();
			this.closeAnimationDoneHandler();
			return;
		}

		if (isPlayCloseSound && this.isPlayDefaultCloseSound) {
			UdAudioHub.Ins.playSound(UdAudioDef.PanelCloseSfx);
		}

		this.clearFewTimeout();

		this.removeEvents();
		this.stopAnimation();
		this._isPlayAnimation = true;
		this._animationCallback = callback;
		this._closeAndDestroy = isDestroy;

		if (isSkip || this._root == null) {
			this.closeAnimationDoneHandler();
			return;
		}

		if (this._isFirstClose) {
			let animations = this._root.getComponentsInChildren(UdViewMotion);
			if (animations != null && animations.length > 0) {
				if (this._animations == null) {
					this._animations = new UdSeqList<UdViewMotion>();
				} else {
					this._animations.clear();
				}

				this._animations.addArray(
					animations.filter((e) => {
						return e.effectByView;
					})
				);
			}
			this._isFirstClose = false;
		}

		if (this._animations != null && this._animations.length > 0) {
			let max = this._animations.length;
			for (let i = 0; i < max; i++) {
				let animation: UdViewMotion = this._animations.get(i);
				if (animation.playCloseAnimation && animation.nodeActive) {
					this._maxAnimation++;
				}
			}

			if (this._maxAnimation > 0) {
				//这里第二次循环看起来虽然低效，但根据实际使用频率与GC的关系这种写法相对较好
				for (let i = 0; i < max; i++) {
					let animation = this._animations.get(i);
					if (animation.playCloseAnimation && animation.nodeActive) {
						animation.doClose(this.closeAnimationDoneHandler.bind(this));
					}
				}
			} else {
				this.closeAnimationDoneHandler();
			}
		} else {
			this.closeAnimationDoneHandler();
		}
	}

	/**
	 * @description: 关闭界面单个动画播放完毕
	 */
	private closeAnimationDoneHandler() {
		this._maxAnimation--;
		if (this._maxAnimation > 0) return;

		let callback = this._animationCallback;
		this.stopAnimation();
		if (callback != null) {
			callback(this.name);
		}

		if (this._closeAndDestroy) {
			this._onClose();
			this.destroy();
		} else {
			this._onClose();
		}
	}

	private _onClose() {
		if (this._loadId > 0) {
			udRes.UdResHub.sInstance.stopLoad(this._loadId);
			this._loadId = 0;
		}
		this.onClose();
	}

	/// <summary>
	/// 停止所有界面动画
	/// </summary>
	/// <param name="isDestroy">是否销毁</param>
	private stopAnimation(isDestroyAnimation: boolean = false) {
		this._maxAnimation = 0;
		if (this._animations != null && this._animations.length > 0) {
			for (let i = 0; i < this._animations.length; i++) {
				let animation = this._animations.get(i);
				animation.stop();
			}

			if (isDestroyAnimation) this._animations.clear();
		}

		this._animationCallback = null;
		this._isPlayAnimation = false;
	}

	/**
	 * @description: 资源分析器
	 */
	protected get UdResFinder(): UdResFinder {
		return this._resBase;
	}

	/**
	 * @description: 当前是否属于焦点状态，主要用于处理弹出界面的黑底
	 */
	public get isFocus(): boolean {
		return this._isFocus;
	}
	public set isFocus(value: boolean) {
		this._isFocus = value;
		this.onFocusUpdate();
	}

	/**
	 * @description: 是否播放默认关闭音效
	 */
	public get isPlayDefaultCloseSound() {
		return this._isPlayDefaultCloseSound;
	}
	public set isPlayDefaultCloseSound(value: boolean) {
		this._isPlayDefaultCloseSound = value;
	}

	/**
	 * @description: 焦点发生变化时调用
	 */
	protected onFocusUpdate() { }

	/**
	 * @description: 获取View中的元素
	 * @param {type}
	 */
	public getElm(name: string): cc.Node | undefined {
		if (this._resBase) return this._resBase.getNode(name);
	}

	protected onOpenAnimationCompleted() { }

	/**
	 * @description: 窗口被关闭
	 */
	protected onClose() {
		this.clearFewTimeout();
		this.hide();
		this.parent = null;
	}

	/**
	 * @description: 界面被销毁
	 */
	protected onDestroy() {

	}

	/**
	 * @description: 销毁
	 */
	public destroy() {
		if (this._isPlayAnimation && this.isInit) {
			this.removeEvents();
		}

		this._parent = null;
		this._openArgs = null;
		this._closeAndDestroy = false;

		if (this._loadId > 0) {
			udRes.UdResHub.sInstance.stopLoad(this._loadId);
			this._loadId = 0;
		}

		if (this._resBase != null) {
			this._resBase.dispose();
			this._resBase = null;
		}

		if (this._resBase != undefined) {
			this._resBase.dispose();
		}

		if (this._animations) {
			this._animations.clear();
			this._animations = null;
		}

		this._isPlayAnimation = false;
		this._maxAnimation = 0;

		udRes.UdResHub.sInstance.uncacheAsset(this._prefab);
		this._prefab = undefined;

		if (this._root != null) {
			this._callOnCloseHierarchy(this._root);
			this._root.destroy();
			this._root = null;
		}

		this.log("销毁窗口:", this.name);
	}

	private _callOnCloseHierarchy(node: cc.Node) {
		if (node != null && node.isValid) {
			//先处理自身组件逻辑，后处理
			//@ts-ignore
			let cmpos = node._components;
			if (cmpos) {
				for (let i = 0; i < cmpos.length; i++) {
					const c = cmpos[i];
					if (c && c.onClose) {
						c.onClose();
					}
				}
			}
			//递归处理子节点
			for (let i = 0; i < node.children.length; i++) {
				let child = node.children[i];
				if (child) {
					this._callOnCloseHierarchy(child);
				}
			}
		}
	}
}

export enum UD_VIEW_CLASS {
	UdFullView,
	UdPopPanel,
}
