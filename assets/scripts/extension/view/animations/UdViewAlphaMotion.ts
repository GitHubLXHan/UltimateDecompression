import { UdEaseKit } from "../utils/UdEaseKit";
import { UdViewMotion } from "./UdViewMotion";

const { ccclass, property, menu } = cc._decorator;

@ccclass
@menu("动画/UdViewAlphaMotion(淡入淡出动画)")
export default class UdViewAlphaMotion extends UdViewMotion {
	@property
	fromAlpha: number = 0;

	@property
	toAlpha: number = 1;

	private readonly Bit16: number = 0xFF;

	protected lateStartHandler() {
		this.node.opacity = this.fromAlpha * this.Bit16;
		this._tween = cc.tween(this.node);

		if (this.openDelay > 0)
			this._tween.delay(this.openDelay);

		this._tween.to(this.openDuration, { opacity: this.toAlpha * this.Bit16 }, { easing: UdEaseKit.GetEaseFun(this.openEase) });
		this._tween.call(this.onCompleteHandler.bind(this));
		this._tween.start();
	}

	public doClose(callback?: Function) {
		this.stop();
		this._callback = callback;

		if (!this.playCloseAnimation) {
			this.onCompleteHandler();
			return;
		}

		this.node.opacity = this.toAlpha * this.Bit16;
		this._tween = cc.tween(this.node);

		if (this.closeDelay > 0)
			this._tween.delay(this.closeDelay);

		this._tween.to(this.closeDuration, { opacity: this.fromAlpha * this.Bit16 }, { easing: UdEaseKit.GetEaseFun(this.closeEase) });
		this._tween.call(this.onCompleteHandler.bind(this));
		this._tween.start();
	}

	public doneOpenImmediately(callback?: Function) {
		this.stop();
		this.node.opacity = this.toAlpha * this.Bit16;
		callback && callback();
	}
}
