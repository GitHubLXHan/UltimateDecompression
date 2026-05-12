import { Dictionary } from "../../../extension/basecore/Dictionary";
import { List } from "../../../extension/basecore/List";
import { IListener } from "../../../extension/eventListener/IListener";
import { ListenerHandlerVo } from "../../../extension/eventListener/ListenerHandlerVo";
import { PoolMgr } from "../../../extension/pool/PoolMgr";
import { SubView } from "./SubView";

export abstract class EventSubView<T extends string | number, U> extends SubView implements IListener<T, U> {
	private _eventStore: Dictionary<T, List<ListenerHandlerVo>> = new Dictionary<T, List<ListenerHandlerVo>>();

	public addListener(type: T, handler: (target: any, args: any[]) => void, target: any) {
		if (handler == null || target == null) {
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
				return;
			}
		}

		let vo = PoolMgr.Ins.impl(ListenerHandlerVo);
		vo.handler = handler;
		vo.target = target;
		list.add(vo);
	}

	public removeListener(type: T, handler: (target: any, args: any[]) => void, target: any) {
		if (handler == null || target == null) {
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
				let vo = list.removeAt(i);
				PoolMgr.Ins.recover(vo);
				return;
			}
		}
	}

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

	public dispatchEvent(type: T, ...args: any[]) {
		let list = this._eventStore.getValue(type);
		if (list != null && list.length > 0) {
			let once = new List<ListenerHandlerVo>();
			for (let i = 0; i < list.length; i++) {
				once.add(list[i].clone());
			}
			while (once.length > 0) {
				let vo = once.removeAt(0);
				vo.handler.call(vo.target, this, args);
			}
		}
	}

	public hasListener(type: T, handler?: (target: any, args: any[]) => void, target?: any): boolean {
		let list = this._eventStore.getValue(type);
		if (list == null || list.length <= 0) {
			return false;
		}

		if (handler && target) {
			for (let i = list.length - 1; i >= 0; i--) {
				let vo = list[i];
				if (vo.handler == handler && vo.target == target) {
					return true;
				}
			}
		} else {
			return true;
		}

		return false;
	}
}
