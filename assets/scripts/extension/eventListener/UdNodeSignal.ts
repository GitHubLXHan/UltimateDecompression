import { IUdSignalBus } from "./IUdSignalBus";
import { UdKeyMap } from "../basecore/UdKeyMap";
import { UdSeqList } from "../basecore/UdSeqList";
import { UdSignalSlot } from "./UdSignalSlot";
import { UdObjCache } from "../pool/UdObjCache";
import { UdLogHub } from "../log/UdLogHub";
import { UdBehavior } from "../components/UdBehavior";

export abstract class UdNodeSignal<T extends string | number, UdSignalBus> extends UdBehavior implements IUdSignalBus<T, UdSignalBus> {
	private _eventStore: UdKeyMap<T, UdSeqList<UdSignalSlot>> = new UdKeyMap<T, UdSeqList<UdSignalSlot>>();

	/**
	 * @description: 添加事件侦听
	 * @param type 事件类型
	 * @param handler 回调函数，参数1：发生时间的目标，参数2：自定义事件参数
	 * @param target 作用域
	 */
	public addListener(type: T, handler: (target: any, args: any[]) => void, target: any) {
		if (handler== null || target == null) {
			UdLogHub.logError("addListener 回调函数和域不能为空!");
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
				//已添加相同事件侦听，忽略处理
				return;
			}
		}

		let vo = UdObjCache.Ins.impl(UdSignalSlot);
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
			UdLogHub.logError("removeListener 回调函数和域不能为空!");
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
				UdObjCache.Ins.recover(vo);
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
					UdObjCache.Ins.recover(handlers.removeAt(0));
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
			let once = new UdSeqList<UdSignalSlot>();
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


	protected onDestroy(): void {
		this.clearListeners();
		this._eventStore = null;

		super.onDestroy && super.onDestroy();
	}
}
