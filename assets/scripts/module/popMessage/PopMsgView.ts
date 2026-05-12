import { BasePopView } from "../../core/popMessage/BasePopView";
import { IPopRewardMsg } from "../../core/popMessage/IPopRewardMsg";
import { List } from "../../extension/basecore/List";
import { RefClass } from "../../extension/basecore/RefDecorator";
import { PoolMgr } from "../../extension/pool/PoolMgr";
import { PopMsgSubView } from "./PopMsgSubView";
import { PopViewEventType } from "./types/PopViewEventType";

@RefClass
export class PopMsgView extends BasePopView {
	private m_SourceElm?: cc.Node;
	private m_content?: cc.Node;
	private m_Stack: List<string | IPopRewardMsg> = new List<string | IPopRewardMsg>();
	private m_ElmStore: List<PopMsgSubView> = new List<PopMsgSubView>();

	private static readonly Distance: number = 30;

	public constructor() {
		super();
		this.skinName = "login/prefabs/view/popMsgView";
	}

	public init(root: cc.Node) {
		super.init(root);
		this.isBlockInputEvents = false;
		this.m_content = this.ResBase.getNode("root");
		this.m_SourceElm = this.ResBase.getNode("ScaleRoot");

		while (this.m_Stack.length > 0) {
			let pending = this.m_Stack.shift();
			if (pending != null) {
				this.playPop(pending);
			}
		}
	}

	public addEvents() {
	}

	public removeEvents() {
	}

	public updateView(info: string | IPopRewardMsg) {
		if (info != null) {
			this.showPop(info);
		}
	}

	public showPop(info: string | IPopRewardMsg) {
		if (this.root == null) {
			this.m_Stack.add(info);
			return;
		}

		this.playPop(info);
	}

	private playPop(info: string | IPopRewardMsg) {
		let elm = PoolMgr.Ins.impl(PopMsgSubView);
		if (!elm.isInit) {
			elm.init(cc.instantiate(this.m_SourceElm));
		}

		if (elm.root.parent == null) {
			this.m_content.addChild(elm.root);
		}

		elm.addListener(PopViewEventType.Complete, this.popCompleteHandler, this);
		elm.play(info, 0, 0);

		if (this.m_ElmStore.length > 0) {
			let offset = elm.height + PopMsgView.Distance;
			for (let i = this.m_ElmStore.length - 1; i >= 0; i--) {
				let other = this.m_ElmStore.get(i);
				other.moveOffset(offset);

				offset += other.height + PopMsgView.Distance;
			}
		}

		this.m_ElmStore.add(elm);
	}

	private popCompleteHandler(target: PopMsgSubView, args: any[]) {
		this.m_ElmStore.remove(target);
		this.m_content.removeChild(target.root);
		PoolMgr.Ins.recover(target);
	}

	public clearAll() {
		this.m_Stack.clear();

		if (this.m_ElmStore.length > 0) {
			for (let i = 0; i < this.m_ElmStore.length; i++) {
				let other = this.m_ElmStore.get(i);
				PoolMgr.Ins.recover(other);
			}

			this.m_ElmStore.clear();
		}
	}

	public onClose() {
		super.onClose();
	}
}
