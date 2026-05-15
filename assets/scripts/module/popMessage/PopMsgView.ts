import { BasePopView } from "../../core/popMessage/BasePopView";
import { List } from "../../extension/basecore/List";
import { RefClass } from "../../extension/basecore/RefDecorator";
import { PoolMgr } from "../../extension/pool/PoolMgr";
import { PopMsgSubView } from "./PopMsgSubView";
import { PopViewEventType } from "./types/PopViewEventType";

@RefClass
export class PopMsgView extends BasePopView {
	private item_node?: cc.Node;
	private content_node?: cc.Node;
	private stackList: List<string> = new List<string>();
	private elmList: List<PopMsgSubView> = new List<PopMsgSubView>();

	private static readonly Distance: number = 30;

	public constructor() {
		super();
		this.prefabPath = "popMsg/prefabs/view/PopMsgView";
	}

	public init(root: cc.Node) {
		super.init(root);
		this.isBlockInputEvents = false;
		this.content_node = this.ResBase.getNode("content_node");
		this.item_node = this.ResBase.getNode("item_node");

		while (this.stackList.length > 0) {
			let pending = this.stackList.shift();
			if (pending != null) {
				this.playPop(pending);
			}
		}
	}

	public addEvents() {
	}

	public removeEvents() {
	}

	public updateView(info: string) {
		if (info != null) {
			this.showPop(info);
		}
	}

	public showPop(info: string) {
		if (this.root == null) {
			this.stackList.add(info);
			return;
		}

		this.playPop(info);
	}

	private playPop(info: string) {
		let elm = PoolMgr.Ins.impl(PopMsgSubView);
		if (!elm.isInit) {
			elm.init(cc.instantiate(this.item_node));
		}

		if (elm.root.parent == null) {
			this.content_node.addChild(elm.root);
		}

		elm.addListener(PopViewEventType.Complete, this.popCompleteHandler, this);
		elm.play(info, 0, 0);

		if (this.elmList.length > 0) {
			let offset = elm.height + PopMsgView.Distance;
			for (let i = this.elmList.length - 1; i >= 0; i--) {
				let other = this.elmList.get(i);
				other.moveOffset(offset);

				offset += other.height + PopMsgView.Distance;
			}
		}

		this.elmList.add(elm);
	}

	private popCompleteHandler(target: PopMsgSubView, args: any[]) {
		this.elmList.remove(target);
		this.content_node.removeChild(target.root);
		PoolMgr.Ins.recover(target);
	}

	public clearAll() {
		this.stackList.clear();

		if (this.elmList.length > 0) {
			for (let i = 0; i < this.elmList.length; i++) {
				let other = this.elmList.get(i);
				PoolMgr.Ins.recover(other);
			}

			this.elmList.clear();
		}
	}

	public onClose() {
		super.onClose();
	}
}
