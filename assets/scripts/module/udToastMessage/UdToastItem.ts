import { UdEventPanel } from "../../core/view/compoment/UdEventPanel";
import { UdBindMeta } from "../../extension/basecore/UdDecoratorKit";
import { IUdReusable } from "../../extension/pool/IUdReusable";
import { UdTimerHub } from "../../extension/time/UdTimerHub";
import { UdEaseKind } from "../../extension/view/types/UdEaseKind";
import { UdEaseKit } from "../../extension/view/utils/UdEaseKit";
import { UdToastSignal } from "./types/UdToastSignal";

@UdBindMeta
export class UdToastItem extends UdEventPanel<UdToastSignal, UdToastItem> implements IUdReusable {
	private item_node: cc.Node;
	private msg_lb: cc.RichText;
	private item_bg_node: cc.Node;

	private _scaleTween: cc.Tween<cc.Node>;
	private _moveTween: cc.Tween<cc.Node>;

	private static readonly ScaleTo = 1;
	private static readonly ScaleTime: number = 0.2;
	private static readonly ScaleStayTime: number = 2;
	private static readonly MoveTime: number = 0.5;

	public init(root: cc.Node) {
		super.init(root);

		this.item_node = root;
		this.msg_lb = this.UdResFinder.getComponent("msg_lb", cc.RichText);
		this.item_bg_node = this.UdResFinder.getNode("item_bg_node");
	}

	public play(info: string, x: number, y: number) {
		this._root.active = true;

		this.msg_lb.node.active = true;
		this.msg_lb.string = info;

		this.item_node.height = this.root.children[0].height;
		this.root.setPosition(x, y);
		this.item_node.setScale(0, 0);

		if (this._scaleTween != null) {
			this._scaleTween.stop();
			this._scaleTween = null;
		}

		this._scaleTween = cc.tween(this.item_node);
		this._scaleTween.to(UdToastItem.ScaleTime, { scale: UdToastItem.ScaleTo }, { easing: UdEaseKit.GetEaseFun(UdEaseKind.OutBack) });
		this._scaleTween.delay(UdToastItem.ScaleStayTime);
		this._scaleTween.call(this.scaleDoneHandler.bind(this));
		this._scaleTween.start();

		UdTimerHub.Ins.callFew(() => {
			if (this.item_bg_node && this.msg_lb) {
				this.item_bg_node.height = this.msg_lb.node.height + 13;
			}
		});
	}

	private scaleDoneHandler() {
		this._scaleTween = null;

		this.dispatchEvent(UdToastSignal.ItemDone);
	}

	public moveOffset(y: number) {
		if (this._moveTween != null) {
			this._moveTween.stop();
			this._moveTween = null;
		}

		this._moveTween = cc.tween(this._root);
		this._moveTween.to(UdToastItem.MoveTime, { y: y }, { easing: cc.easing.circOut });
		this._moveTween.call(this.moveDoneHandler.bind(this));
		this._moveTween.start();
	}

	private moveDoneHandler() {
		this._moveTween = null;
	}

	public get height(): number {
		return this.item_node.height;
	}

	public get info(): string {
		return this.msg_lb.string;
	}

	public impl() { }

	public recover() {
		this.clearListeners();

		if (this._scaleTween != null) {
			this._scaleTween.stop();
			this._scaleTween = null;
		}
		if (this._moveTween != null) {
			this._moveTween.stop();
			this._moveTween = null;
		}

		this._root.active = false;
		this.item_node.setScale(1, 1);
	}
}
