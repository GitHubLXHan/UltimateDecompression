import { IListener } from "./IListener";
import { Dictionary } from "../basecore/Dictionary";
import { List } from "../basecore/List";
import { ListenerHandlerVo } from "./ListenerHandlerVo";
import { PoolMgr } from "../pool/PoolMgr";
import { BaseLog } from "../log/BaseLog";

/**
 * @description:
 * @author: Zeros
 */
export abstract class Listener<T extends string | number, Listener> extends BaseLog implements IListener<T, Listener> {
	private _eventStore: Dictionary<T, List<ListenerHandlerVo>> = new Dictionary<T, List<ListenerHandlerVo>>();

	/**
	 * @description: 添加事件侦听
	 * @param type 事件类型
	 * @param handler 回调函数，参数1：发生时间的目标，参数2：自定义事件参数
	 * @param target 作用域
	 */
	public addListener(type: T, handler: (target: any, args: any[]) => void, target: any) {
		if (handler== null || target == null) {
			this.logError("addListener 回调函数和域不能为空!");
			return;
		}

		let list = this._eventStore.getValue(type);
		if (list == null) {
			list = new List<ListenerHandlerVo>();
			this._eventStore.add(type, list);
		}

		for (let i = 0; i < list.length; i++) {
			let vo = list[i];
			if (vo.handler == handler && vo.target == target) {
				//已添加相同事件侦听，忽略处理
				return;
			}
		}

		let vo = PoolMgr.Ins.impl(ListenerHandlerVo);
		vo.handler = handler;
		vo.target = target;
		list.add(vo);
	}

	

	/**
	 * @description: 移除事件侦听
	 * @param type 事件类型
	 * @param handler 回调函数
	 * @param target 作用域
	 */
	public removeListener(type: T, handler: (target: any, args: any[]) => void, target: any) {
		if (handler== null || target == null) {
			this.logError("removeListener 回调函数和域不能为空!")
			return;
		}

		let list = this._eventStore.getValue(type);
		if (list == null || list.length <= 0) {
			return;
		}

		for (let i = list.length - 1; i >= 0; i--) {
			let vo = list[i];
			if (vo.handler == handler && vo.target == target) {
				//找到需要移除的回调
				let vo = list.removeAt(i);
				PoolMgr.Ins.recover(vo);
				return;
			}
		}
	}

	/**
	 * @description: 清空事件侦听
	 */
	public clearListeners() {
		if (this._eventStore != null) {
			for (let i = 0; i < this._eventStore.length; i++) {
				let handlers = this._eventStore.getValueByIndex(i);
				while (handlers.length > 0) {
					PoolMgr.Ins.recover(handlers.removeAt(0));
				}
			}
			this._eventStore.clear();
		}
	}

	/**
	 * @description: 派发事件
	 * @param type 事件类型
	 * @param args 自定义参数
	 */
	public dispatchEvent(type: T, ...args: any[]) {
		let list = this._eventStore.getValue(type);
		if (list != null && list.length > 0) {
			//需要派发的时间要放到临时库中，避免受到遍历过程中数组被修改的问题
			let once = new List<ListenerHandlerVo>();
			for (let i = 0; i < list.length; i++) {
				//考虑到派发事件的频度，不使用对象池
				once.add(list[i].clone());
			}
			while (once.length > 0) {
				let vo = once.removeAt(0);
				vo.handler.call(vo.target, this, args);
			}
		}
	}

	/**
	 * @description: 判断是否存在对应事件侦听
	 * @param type 事件类型
	 * @param handler 回调函数
	 * @param target 作用域
	 */
	public hasListener(type: T, handler?: (target: any, args: any[]) => void, target?: any): boolean {
		let list = this._eventStore.getValue(type);
		if (list == null || list.length <= 0) {
			return false;
		}

		if (handler && target) {
			// 同时判断函数和作用域
			for (let i = list.length - 1; i >= 0; i--) {
				let vo = list[i];
				if (vo.handler == handler && vo.target == target) {
					return true;
				}
			}
		} else {
			// 只判断对应类型是否存在侦听
			return true;
		}

		return false;
	}
}
