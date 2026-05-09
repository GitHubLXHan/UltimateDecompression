/*
 * @Author: your name
 * @Date: 2021-04-16 18:31:22
 * @LastEditTime: 2023-10-30 15:00:44
 * @LastEditors: yf
 * @Description: In User Settings Edit
 * @FilePath: /client/assets/scripts/core/manager/UIMgr.ts
 */
import { RefClass } from "../../extension/basecore/RefDecorator";
import { ClassUtils } from "../../extension/utils/ClassUtils";
import { BaseUIMgr } from "../../extension/view/BaseUIMgr";
import { View } from "../../extension/view/compoment/View";
import { ExclusiveGroup, UILayerType } from "../../extension/view/types/UILayerType";
import { BaseView } from "../view/compoment/BaseView";
import { ModuleViewEnums } from "../view/med/ModuleViewEnums";
import { ModuleViews } from "../view/med/ModuleViews";

/**
 * @description: 界面管理类 或者说策略层 比如打开关闭 缓存策略
 * @param {*}
 * @return {*}
 */



@RefClass
export class UIMgr extends BaseUIMgr {
	private static _Ins: UIMgr;

	/**
	 * static Instance:ViewMgr
	 */
	public static get Ins(): UIMgr {
		if (this._Ins == null) {
			this._Ins = new UIMgr();
		}
		return this._Ins;
	}


	private layerType2Component = {}
	public init(root: cc.Node, prefabPath: string, width: number = 720, height: number = 1280, destroyTime: number = 5) {
		super.init(root, prefabPath, width, height, destroyTime)

		for (let layerType in this.layerType2Component) {
			let compoment = this.layerType2Component[layerType]
			let node = this.getLayer(parseInt(layerType))
			node.addComponent(compoment)
		}
	}



	/**
	 * @description 打开窗口。 入栈 添加到界面上 会等到动画播放完（如果有）才执行
	 * @param classInfo
	 * @param layerType
	 * @param viewParams
	 * @param isPlayAnimation 是否播放打开动画
	 * @returns
	 */
	public open<T extends View>(classInfo: { new(): T } | string, layerType: UILayerType, viewParams?: any, isPlayAnimation: boolean = true): View | null {
		// 打开战斗界面时先隐藏其他界面
		// if (layerType === UILayerType.Battle) {
		// 	this.setDarkBgActive(false)
		// }
		// let view = super.open(classInfo, layerType, viewParams);
		// if (view && view.isPlayAnimation) {
		// 	this.setDarkBgActive(true)
		// }
		let className = ""
		if (typeof classInfo == "string") {
			className = classInfo
		} else {
			className = ClassUtils.getClassName(classInfo);
		}

		let allow = this._checkOpenAllow(className)
		if (!allow) {
			this._addAwaitOpenList({
				view: className,
				layer: layerType,
				viewParams: viewParams,
				isPlayAnimation: isPlayAnimation
			})
			return
		}
		return super.open(classInfo, layerType, viewParams, isPlayAnimation);
	}


	public close<T extends View>(classInfo: { new(): T } | string, isDestroy: boolean = false, closeAbove = false) {
		let className = ""
		if (typeof classInfo == "string") {
			className = classInfo
		} else {
			className = ClassUtils.getClassName(classInfo);
		}
		this._removeAwaitOpenList(className)
		super.close(classInfo, isDestroy, true, closeAbove);
	}

	/**
	 * @description: 关闭界面
	 * @param {type}
	 */
	protected closeByName(name: string, isDestroy: boolean = false) {
		let viewCache = super.closeByName(name, isDestroy);
		return viewCache;
	}

	/**
	 * @description: 窗口关闭动画播放完毕
	 * @param {string} name
	 */
	protected viewCloseDoneHandler(name: string) {
		super.viewCloseDoneHandler(name)
		this._onViewCloseDone(name)
	}

	public getTopView(layerType: UILayerType): View {
		if (this._instanceStore.length > 0) {
			let max = this._instanceStore.length - 1;
			for (let i = max; i >= 0; i--) {
				let cache = this._instanceStore.getValueByIndex(i);
				if (cache.layerType == layerType) {
					return cache.view;
				}
			}
		}

		return null;
	}

	/**
	 * @description: 关闭界面栈顶层
	 * @param {*}
	 */
	public closeTopView() {
		let view = this.getTopView(UILayerType.View);
		if (view != null) {
			this.closeByName(view.name);
		}
	}

	public updateView<T extends View>(classInfo: { new(): T } | string, args?: any) {
		let view = this.getView(classInfo);
		if (view) {
			view.updateView(args);
		}
	}

	/**
	 * @description: 调用界面的函数 会检查
	 * @param {*} viewName
	 * @param {*} funcName
	 * @param {array} args
	 */
	public callViewFunc(viewName: string, funcName: string, ...args: any) {
		let view: any = this.getView(viewName);
		if (view) {
			if (view[funcName]) {
				let func = view[funcName];
				if (typeof func == "function") {
					func.call(view, args);
				} else {
					console.warn(`界面${viewName}的${funcName}不是函数`);
				}
			} else {
				console.warn(`界面${viewName}不存在函数${funcName}`);
			}
		} else {
			console.warn(`界面${viewName}已关闭`);
		}
	}



	private _awaitOpenList: {
		view: string,
		layer: UILayerType,
		viewParams?: any,
		isPlayAnimation: boolean
	}[] = []
	//互斥界面配置
	private _mutuallyExclusiveConfig: { [key: number]: string[] } = {}
	//在互斥界面配置中出现的界面
	private _needToCareViews: { [key: string]: number[] } = {}
	private _viewOpenPriority: { [key: string]: number } = {}


	private _addAwaitOpenList(param: {
		view: string,
		layer: UILayerType,
		viewParams?: any,
		isPlayAnimation: boolean
	}) {
		let find = false
		this._awaitOpenList.forEach(e => {
			if (e.view == param.view) {
				e.layer = param.layer
				e.viewParams = param.viewParams
				e.isPlayAnimation = param.isPlayAnimation
				find = true
			}
		})
		if (!find) {
			this._awaitOpenList.push(param)
			this._awaitOpenList.sort((a, b) => {
				let a_priority = this._viewOpenPriority[a.view] || 0
				let b_priority = this._viewOpenPriority[b.view] || 0
				return b_priority - a_priority
			})
		}
	}

	private _removeAwaitOpenList(viewName: string) {
		this._awaitOpenList.forEach((e, index) => {
			if (e.view == viewName) {
				this._awaitOpenList.splice(index, 1)
			}
		})
	}

	private _checkOpenAllow(view: string) {
		let allow = true
		for (let groupId in this._mutuallyExclusiveConfig) {
			let list = this._mutuallyExclusiveConfig[groupId]
			if (list.indexOf(view) >= 0) {
				list.forEach(e => {
					if (allow && e != view && this.isOpen(e)) {
						allow = false
					}
				})
			}
		}
		return allow
	}

	private _onViewCloseDone(name: string) {
		if (this._needToCareViews[name]) {
			let hasOpenMap = {}
			let list: {
				view: string;
				layer: UILayerType;
				viewParams?: any;
				isPlayAnimation: boolean;
			}[] = []
			this._awaitOpenList.forEach((e, index) => {
				let ids = []
				let find = !!(ids.find(e => {
					return !!hasOpenMap[e]
				}))
				if (!find && this._checkOpenAllow(e.view)) {
					list.push(e)
					this._awaitOpenList.splice(index, 1)
					ids.forEach(e => {
						hasOpenMap[e] = true
					})
				}
			})
			list.forEach(e => {
				this.open(e.view, e.layer, e.viewParams, e.isPlayAnimation)
			})
		}
	}

	/**
	 * @description:  添加互斥的界面配置
	 * @param {object} groupId
	 * @param {function} exclusive  当exclusive中有任意界面打开时 不打开界面直到所有界面均关闭
	 * @param {number} priority  界面打开优先级 此优先级全局通用 数值大的优先级大
	 */
	public addMutuallyExclusive(groupId: ExclusiveGroup, exclusive: ({ new(): BaseView } | string)[], priority: number = 0) {
		if (!this._mutuallyExclusiveConfig[groupId]) {
			this._mutuallyExclusiveConfig[groupId] = []
		}
		exclusive.forEach(e => {
			let name = ""
			if (typeof e == "string") {
				name = e
			} else {
				name = ClassUtils.getClassName(e);
			}
			if (this._mutuallyExclusiveConfig[groupId].indexOf(name) < 0) {
				this._mutuallyExclusiveConfig[groupId].push(name)
				if (this._needToCareViews[name])
					this._needToCareViews[name].push(groupId)
				else
					this._needToCareViews[name] = [groupId]
			}
			this._viewOpenPriority[name] = priority
		})
	}
	/**
		 * @description:  添加互斥的界面配置
		 * @param {object} groupId
		 * @param {function} exclusive  当exclusive中有任意界面打开时 不打开界面直到所有界面均关闭
		 */
	public removeMutuallyExclusive(groupId: ExclusiveGroup, exclusive: ({ new(): BaseView } | string)[]) {
		if (!this._mutuallyExclusiveConfig[groupId]) {
			this._mutuallyExclusiveConfig[groupId] = []
		}
		exclusive.forEach(e => {
			let name = ""
			if (typeof e == "string") {
				name = e
			} else {
				name = ClassUtils.getClassName(e);
			}
			let index = this._mutuallyExclusiveConfig[groupId].indexOf(name)
			if (index >= 0) {
				this._mutuallyExclusiveConfig[groupId].splice(index, 1)
				if (this._needToCareViews[name]) {
					let idIndex = this._needToCareViews[name].indexOf(groupId)
					if (idIndex >= 0) {
						this._needToCareViews[name].splice(idIndex, 1)
						if (this._needToCareViews[name].length <= 0) {
							delete this._needToCareViews[name]
						}
					}
				}
			}
		})
	}


	public openViewById(moduleId: ModuleViewEnums, viewId: number, layerType: UILayerType, viewParams?: any, isPlayAnimation: boolean = true): View | null {
		let view = ModuleViews.get(moduleId, viewId)
		if (view) {
			return this.open(view, layerType, viewParams, isPlayAnimation)
		} else {
			console.warn("界面未注册", moduleId, viewId)
			return null
		}
	}
	public closeViewById(moduleId: ModuleViewEnums, viewId: number, isDestroy: boolean = false, closeAbove = false): void {
		let view = ModuleViews.get(moduleId, viewId)
		if (view) {
			this.close(view, isDestroy, closeAbove)
		} else {
			console.warn("界面未注册", moduleId, viewId)
		}
		return
	}
	public updateViewById(moduleId: ModuleViewEnums, viewId: number, args?: any): void {
		let view = ModuleViews.get(moduleId, viewId)
		if (view) {
			this.updateView(view, args)
		} else {
			console.warn("界面未注册", moduleId, viewId)
		}
		return
	}

	public isOpenById(moduleId: ModuleViewEnums, viewId: number) {
		let view = ModuleViews.get(moduleId, viewId)
		return this._instanceStore.contains(ClassUtils.getClassName(view));
	}
}



if (CC_DEBUG) {
	(<any>window).UIMgr = UIMgr;
}