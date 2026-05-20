import { UdKeyMap } from "../../../extension/basecore/UdKeyMap";
import { UdSeqList } from "../../../extension/basecore/UdSeqList";
import { IUdSignalBus } from "../../../extension/eventListener/IUdSignalBus";
import { UdSignalSlot } from "../../../extension/eventListener/UdSignalSlot";
import { UdObjCache } from "../../../extension/pool/UdObjCache";
import { UdSubPanel } from "./UdSubPanel";

export abstract class UdEventPanel<T extends string | number, U> extends UdSubPanel implements IUdSignalBus<T, U> {
	private _eventStore: UdKeyMap<T, UdSeqList<UdSignalSlot>> = new UdKeyMap<T, UdSeqList<UdSignalSlot>>();

	public addListener(type: T, handler: (target: any, args: any[]) => void, target: any) {
		if (handler == null || target == null) {
			this.logError("addListener 回调函数和域不能为空!");
			return;
		}

		let list = this._eventStore.getValue(type);
		if (list == null) {
			list = new UdSeqList<UdSignalSlot>();
			this._eventStore.add(type, list);
		}

		for (let i = 0; i < list.length; i++) {
			let vo = list[i];
			if (vo.handler == handler && vo.target == target) {
				return;
			}
		}

		let vo = UdObjCache.Ins.impl(UdSignalSlot);
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
				UdObjCache.Ins.recover(vo);
				return;
			}
		}
	}

	public clearListeners() {
		if (this._eventStore != null) {
			for (let i = 0; i < this._eventStore.length; i++) {
				let handlers = this._eventStore.getValueByIndex(i);
				while (handlers.length > 0) {
					UdObjCache.Ins.recover(handlers.removeAt(0));
				}
			}
			this._eventStore.clear();
		}
	}

	public dispatchEvent(type: T, ...args: any[]) {
		let list = this._eventStore.getValue(type);
		if (list != null && list.length > 0) {
			let once = new UdSeqList<UdSignalSlot>();
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
