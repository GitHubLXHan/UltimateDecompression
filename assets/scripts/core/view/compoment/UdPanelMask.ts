import { UdMathKit } from "../../../extension/basecore/UdMathKit";
import { UdBtnSignal } from "../../../extension/components/GameBtn/UdBtnSignal";
import { UdSignalBus } from "../../../extension/eventListener/UdSignalBus";
import { udRes } from "../../../extension/resources/UdResHub";
import { UdColorKit } from "../../../extension/utils/UdColorKit";
import { UdNodeKit } from "../../../extension/utils/UdNodeKit";
import UdViewAlphaMotion from "../../../extension/view/animations/UdViewAlphaMotion";
import { UdViewCore } from "../../../extension/view/compoment/UdViewCore";
import { UdEaseKind } from "../../../extension/view/types/UdEaseKind";

export class UdPanelMask extends UdSignalBus<UdBtnSignal, UdPanelMask> {

	private _view: UdViewCore;
	private _root: cc.Node;
	private _sprite: cc.Sprite;
	private _widget: cc.Widget;
	private _active: boolean;
	private _animation: UdViewAlphaMotion;
	private _alpha: number = 0.75;

	private _cacheTexture2D: cc.Texture2D;

	constructor(alpha?: number) {
		super();

		if (alpha != null) {
			this._alpha = UdMathKit.clamp(alpha, 0, 1);
		}
	}

	public init(view: UdViewCore) {
		this._view = view;

		this._root = new cc.Node("dark");
		this._animation = this._root.addComponent(UdViewAlphaMotion);
		this._animation.openEase = UdEaseKind.Linear;
		this._animation.closeEase = UdEaseKind.Linear;
		this._widget = UdNodeKit.addWidget(this._root, 0, 0, 0, 0);
		this._widget.top = -200;
		this._widget.bottom = -100;

		this._root.addComponent(cc.BlockInputEvents);
	}

	private updateGraphics(alpha: number) {
		if (this._root == null)
			return;

		if (this._sprite == null) {
			if (!this._cacheTexture2D) {
				this._cacheTexture2D = UdColorKit.generateTexture(1, 1, cc.color(0, 0, 0, UdMathKit.clamp(alpha, 0, 1) * 0xFF));
				udRes.UdResHub.sInstance.cacheAsset(this._cacheTexture2D);
			}

			this._sprite = this._root.addComponent(cc.Sprite);
			this._sprite.spriteFrame = new cc.SpriteFrame(this._cacheTexture2D);
		} else if (this._alpha != alpha) {
			if (this._sprite.spriteFrame != null) {
				this._sprite.spriteFrame.destroy();
				this._sprite.spriteFrame = null;
			}

			if (this._cacheTexture2D) {
				udRes.UdResHub.sInstance.uncacheAsset(this._cacheTexture2D);
				this._cacheTexture2D = undefined;
			}

			this._cacheTexture2D = UdColorKit.generateTexture(1, 1, cc.color(0, 0, 0, UdMathKit.clamp(alpha, 0, 1) * 0xFF));
			udRes.UdResHub.sInstance.cacheAsset(this._cacheTexture2D);

			this._sprite.spriteFrame = new cc.SpriteFrame(this._cacheTexture2D);
			this._widget.updateAlignment();
		}
	}

	public get active() {
		return this._active;
	}
	public set active(value: boolean) {
		if (this._active == value) {
			if (value && this._root && !this._root.parent) {
				this._root.off(cc.Node.EventType.TOUCH_START, this.onTouchHandler, this);
				this._root.off(cc.Node.EventType.TOUCH_END, this.touchEndHandler, this);
				this._root.off(cc.Node.EventType.TOUCH_CANCEL, this.cancelHandler, this);
				this.logWarning('黑底出现异常情况，执行特殊逻辑');
			} else {
				return;
			}
		}

		this._active = value;
		if (this._active) {
			this.onEnable();
		} else {
			this.onDisable();
		}
	}

	public get alpha() {
		return Math.floor(this._root.opacity / 0xFF);
	}
	public set alpha(value: number) {
		this.updateGraphics(value);
		this._animation.toAlpha = UdMathKit.clamp(value, 0, 1);
		this._alpha = value;
	}

	public get maskDuration() {
		if (this._animation != null) {
			return this._animation.openDuration;
		}
		return 0;
	}
	public set maskDuration(value: number) {
		if (this._animation != null) {
			this._animation.openDuration = value;
			this._animation.closeDuration = value;
		}
	}

	protected onEnable() {
		if (this._root == null)
			return;

		this._root.removeFromParent();
		if (this._view != null && this._view.parent != null) {
			if (this._view.root == null) {
				this._view.parent.addChild(this._root);
			} else {
				let index = Math.max(0, this._view.parent.children.indexOf(this._view.root));
				this._view.parent.insertChild(this._root, index);
			}
		}

		this._widget.updateAlignment();
		this.updateGraphics(this._alpha);

		this._root.on(cc.Node.EventType.TOUCH_START, this.onTouchHandler, this);
		this._root.on(cc.Node.EventType.TOUCH_END, this.touchEndHandler, this);
		this._root.on(cc.Node.EventType.TOUCH_CANCEL, this.cancelHandler, this);
		this._animation.doOpen(this.openAnimationHandler.bind(this));
	}

	protected onDisable() {
		if (this._root == null)
			return;

		this._root.off(cc.Node.EventType.TOUCH_START, this.onTouchHandler, this);
		this._root.off(cc.Node.EventType.TOUCH_END, this.touchEndHandler, this);
		this._root.off(cc.Node.EventType.TOUCH_CANCEL, this.cancelHandler, this);
		this._animation.doClose(this.closeAnimationHandler.bind(this));
	}

	private openAnimationHandler() {
		this.dispatchEvent(UdBtnSignal.ShadeInDone);
	}

	private closeAnimationHandler() {
		if (this._root != null)
			this._root.removeFromParent();

		this.dispatchEvent(UdBtnSignal.ShadeOutDone);
	}

	private cancelHandler(event: cc.Event.EventTouch) {
		this.dispatchEvent(UdBtnSignal.FingerCancel, event);
	}

	private onTouchHandler(event: cc.Event.EventTouch) {
		this.dispatchEvent(UdBtnSignal.FingerDown, event);
	}

	private touchEndHandler(event: cc.Event.EventTouch) {
		this.dispatchEvent(UdBtnSignal.FingerUp, event);
	}

	public dispose() {
		if (this._cacheTexture2D) {
			udRes.UdResHub.sInstance.uncacheAsset(this._cacheTexture2D);
			this._cacheTexture2D = undefined;
		}
		if (this._root != null) {
			this._root.destroy();
			this._root = null;
		}

		this._sprite = null;
		this._widget = null;
		this._view = null;
		this._animation = null;
		this.clearListeners();
	}
}
