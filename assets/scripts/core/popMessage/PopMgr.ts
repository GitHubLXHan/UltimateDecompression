import { BaseUIMgr } from "../../extension/view/BaseUIMgr";
import { UILayerType } from "../../extension/view/types/UILayerType";
import { BasePopView } from "./BasePopView";
import { IPopRewardMsg } from "./IPopRewardMsg";

export class PopMgr {
	private static _Ins: PopMgr;

	public static get Ins(): PopMgr {
		if (this._Ins == null) {
			this._Ins = new PopMgr();
		}

		return this._Ins;
	}

	private constructor() { }

	private _viewCls!: { new(): BasePopView };
	private _uiMgr!: BaseUIMgr;

	public init<T extends BasePopView>(viewCls: { new(): T }, uiMgr: BaseUIMgr) {
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
			this._uiMgr.open(this._viewCls, UILayerType.PopTip, info);
		}
	}

	public addMidMsg(msg: string) {
		this.show(msg);
	}

	public addRewardMsg(msg: IPopRewardMsg) {
		if (this._viewCls == undefined)
			return;

		this._uiMgr.open(this._viewCls, UILayerType.PopTip, msg);
	}

	public showOnSpecialLayer(info: string, layer: UILayerType = UILayerType.PopTip) {
		if (this._viewCls == undefined)
			return;

		this._uiMgr.open(this._viewCls, layer, info);
	}

	public hide() {
		this._uiMgr.close(this._viewCls);
	}
}
