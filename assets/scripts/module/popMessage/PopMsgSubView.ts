import { EventSubView } from "../../core/view/compoment/EventSubView";
import { RefClass } from "../../extension/basecore/RefDecorator";
import { IPoolInstance } from "../../extension/pool/IPoolInstance";
import { TimeMgr } from "../../extension/time/TimeMgr";
import { EaseType } from "../../extension/view/types/EaseType";
import { EaseUtils } from "../../extension/view/utils/EaseUtils";
import { PopViewEventType } from "./types/PopViewEventType";

@RefClass
export class PopMsgSubView extends EventSubView<PopViewEventType, PopMsgSubView> implements IPoolInstance {
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
		this.msg_lb = this.ResBase.getComponent("msg_lb", cc.RichText);
		this.item_bg_node = this.ResBase.getNode("item_bg_node");
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
		this._scaleTween.to(PopMsgSubView.ScaleTime, { scale: PopMsgSubView.ScaleTo }, { easing: EaseUtils.GetEaseFun(EaseType.OutBack) });
		this._scaleTween.delay(PopMsgSubView.ScaleStayTime);
		this._scaleTween.call(this.scaleDoneHandler.bind(this));
		this._scaleTween.start();

		TimeMgr.Ins.callFew(() => {
			if (this.item_bg_node && this.msg_lb) {
				this.item_bg_node.height = this.msg_lb.node.height + 13;
			}
		});
	}

	private scaleDoneHandler() {
		this._scaleTween = null;

		this.dispatchEvent(PopViewEventType.Complete);
	}

	public moveOffset(y: number) {
		if (this._moveTween != null) {
			this._moveTween.stop();
			this._moveTween = null;
		}

		this._moveTween = cc.tween(this._root);
		this._moveTween.to(PopMsgSubView.MoveTime, { y: y }, { easing: cc.easing.circOut });
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
