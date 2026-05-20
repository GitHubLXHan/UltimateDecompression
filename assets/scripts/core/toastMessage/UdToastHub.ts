import { UdPanelHubCore } from "../../extension/view/UdPanelHubCore";
import { UdLayerKind } from "../../extension/view/types/UdLayerKind";
import { UdToastBase } from "./UdToastBase";
import { IUdRewardItem } from "./IUdRewardItem";

export class UdToastHub {
	private static _Ins: UdToastHub;

	public static get Ins(): UdToastHub {
		if (this._Ins == null) {
			this._Ins = new UdToastHub();
		}

		return this._Ins;
	}

	private constructor() { }

	private _viewCls!: { new(): UdToastBase };
	private _uiMgr!: UdPanelHubCore;

	public init<T extends UdToastBase>(viewCls: { new(): T }, uiMgr: UdPanelHubCore) {
		this._viewCls = viewCls;
		this._uiMgr = uiMgr;
	}

	public show(...args: any[]) {
		if (this._viewCls == undefined)
			return;

		if (args != null && args.length > 0) {
			let info = "";
			for (let i = 0; i < args.length; i++) {
				info += String(args[i]);
			}
			this._uiMgr.open(this._viewCls, UdLayerKind.Toast, info);
		}
	}

	public addMidMsg(msg: string) {
		this.show(msg);
	}

	public addRewardMsg(msg: IUdRewardItem) {
		if (this._viewCls == undefined)
			return;

		this._uiMgr.open(this._viewCls, UdLayerKind.Toast, msg);
	}

	public showOnSpecialLayer(info: string, layer: UdLayerKind = UdLayerKind.Toast) {
		if (this._viewCls == undefined)
			return;

		this._uiMgr.open(this._viewCls, layer, info);
	}

	public hide() {
		this._uiMgr.close(this._viewCls);
	}
}
