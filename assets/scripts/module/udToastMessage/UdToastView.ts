import { UdToastBase } from "../../core/toastMessage/UdToastBase";
import { UdSeqList } from "../../extension/basecore/UdSeqList";
import { UdBindMeta } from "../../extension/basecore/UdDecoratorKit";
import { UdObjCache } from "../../extension/pool/UdObjCache";
import { UdToastItem } from "./UdToastItem";
import { UdToastSignal } from "./types/UdToastSignal";

@UdBindMeta
export class UdToastView extends UdToastBase {
	private item_node?: cc.Node;
	private content_node?: cc.Node;
	private stackList: UdSeqList<string> = new UdSeqList<string>();
	private elmList: UdSeqList<UdToastItem> = new UdSeqList<UdToastItem>();

	private static readonly Distance: number = 30;

	public constructor() {
		super();
		this.prefabPath = "udToastMessage/prefabs/view/UdToastView.prefab";
	}

	public init(root: cc.Node) {
		super.init(root);
		this.isBlockInputEvents = false;
		this.content_node = this.UdResFinder.getNode("content_node");
		this.item_node = this.UdResFinder.getNode("item_node");

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
		let elm = UdObjCache.Ins.impl(UdToastItem);
		if (!elm.isInit) {
			elm.init(cc.instantiate(this.item_node));
		}

		if (elm.root.parent == null) {
			this.content_node.addChild(elm.root);
		}

		elm.addListener(UdToastSignal.ItemDone, this.popCompleteHandler, this);
		elm.play(info, 0, 0);

		if (this.elmList.length > 0) {
			let offset = elm.height + UdToastView.Distance;
			for (let i = this.elmList.length - 1; i >= 0; i--) {
				let other = this.elmList.get(i);
				other.moveOffset(offset);

				offset += other.height + UdToastView.Distance;
			}
		}

		this.elmList.add(elm);
	}

	private popCompleteHandler(target: UdToastItem, args: any[]) {
		this.elmList.remove(target);
		this.content_node.removeChild(target.root);
		UdObjCache.Ins.recover(target);
	}

	public clearAll() {
		this.stackList.clear();

		if (this.elmList.length > 0) {
			for (let i = 0; i < this.elmList.length; i++) {
				let other = this.elmList.get(i);
				UdObjCache.Ins.recover(other);
			}

			this.elmList.clear();
		}
	}

	public onClose() {
		super.onClose();
	}
}
