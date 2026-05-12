import { EventSubView } from "../../core/view/compoment/EventSubView";
import { IPopRewardMsg } from "../../core/popMessage/IPopRewardMsg";
import { POP_MSG_COLOR_TO_HEX } from "../../core/popMessage/PopMsgColors";
import { RefClass } from "../../extension/basecore/RefDecorator";
import { GameSprite } from "../../extension/game/GameSprite";
import { IPoolInstance } from "../../extension/pool/IPoolInstance";
import { TimeMgr } from "../../extension/time/TimeMgr";
import { EaseType } from "../../extension/view/types/EaseType";
import { EaseUtils } from "../../extension/view/utils/EaseUtils";
import { PopViewEventType } from "./types/PopViewEventType";

@RefClass
export class PopMsgSubView extends EventSubView<PopViewEventType, PopMsgSubView> implements IPoolInstance {
	private _scaleRoot: cc.Node;
	private _label: cc.RichText;
	private _iconlabel: cc.Label;
	private _icon: GameSprite;
	private _iconNode: cc.Node;
	private bg: cc.Node;

	private _scaleTween: cc.Tween<cc.Node>;
	private _moveTween: cc.Tween<cc.Node>;

	private static readonly ScaleTo = 1;
	private static readonly ScaleTime: number = 0.2;
	private static readonly ScaleStayTime: number = 2;
	private static readonly MoveTime: number = 0.5;

	public init(root: cc.Node) {
		super.init(root);

		this._scaleRoot = root;
		this._label = this.ResBase.getComponent("Text", cc.RichText);
		this._iconlabel = this.ResBase.getComponent("iconText", cc.Label);
		this._icon = this.ResBase.getComponent("icon", GameSprite);
		this._iconNode = this.ResBase.getNode("MsgScaleRoot");
		this.bg = this.ResBase.getNode("bg");
	}

	public play(info: string | IPopRewardMsg, x: number, y: number) {
		this._root.active = true;

		if (typeof info == "string") {
			this._iconNode.active = false;
			this._label.node.active = true;
			this._label.string = info;
		} else {
			this._iconNode.active = false;
			this._label.node.active = false;
			this._iconlabel.string = `${info.name}x${info.num}`;
			const hex = POP_MSG_COLOR_TO_HEX[info.color] || "#ffffff";
			this._iconlabel.node.color = new cc.Color().fromHEX(hex);
			this._icon.source = info.icon;
			if (info.icon != "") {
				this._iconNode.active = true;
			}
		}

		this._scaleRoot.height = this.root.children[0].height;
		this.root.setPosition(x, y);
		this._scaleRoot.setScale(0, 0);

		if (this._scaleTween != null) {
			this._scaleTween.stop();
			this._scaleTween = null;
		}

		this._scaleTween = cc.tween(this._scaleRoot);
		this._scaleTween.to(PopMsgSubView.ScaleTime, { scale: PopMsgSubView.ScaleTo }, { easing: EaseUtils.GetEaseFun(EaseType.OutBack) });
		this._scaleTween.delay(PopMsgSubView.ScaleStayTime);
		this._scaleTween.call(this.scaleDoneHandler.bind(this));
		this._scaleTween.start();

		TimeMgr.Ins.callFew(() => {
			if (this.bg && this._iconNode && this._label) {
				if (typeof info == "string") {
					this.bg.height = this._label.node.height + 13;
				} else {
					this.bg.height = this._iconNode.height + 13;
				}
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
		return this._scaleRoot.height;
	}

	public get info(): string {
		return this._label.string;
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
		this._scaleRoot.setScale(1, 1);
	}
}
