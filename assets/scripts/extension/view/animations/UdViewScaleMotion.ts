import { UdEaseKit } from "../utils/UdEaseKit";
import { UdViewMotion } from "./UdViewMotion";

const { ccclass, property, menu } = cc._decorator;

@ccclass
@menu("动画/UdViewScaleMotion(缩放动画)")
export default class UdViewScaleMotion extends UdViewMotion {
	@property
	fromScale: number = 0.5;

	@property
	toScale: number = 1;

	protected lateStartHandler() {
		this.node.scale = this.fromScale;
		this._tween = cc.tween(this.node);

		if (this.openDelay > 0)
			this._tween.delay(this.openDelay);

		this._tween.to(this.openDuration, { scale: this.toScale }, { easing: UdEaseKit.GetEaseFun(this.openEase) });
		this._tween.call(this.onCompleteHandler.bind(this));
		this._tween.start();
	}

	public doClose(callback: Function) {
		this.stop();
		this._callback = callback;

		if (!this.playCloseAnimation) {
			this.onCompleteHandler();
			return;
		}

		this.node.scale = this.toScale;
		this._tween = cc.tween(this.node);

		if (this.closeDelay > 0)
			this._tween.delay(this.closeDelay);

		this._tween.to(this.closeDuration, { scale: this.fromScale }, { easing: UdEaseKit.GetEaseFun(this.closeEase) });
		this._tween.call(this.onCompleteHandler.bind(this));
		this._tween.start();
	}

	public doneOpenImmediately(callback?: Function) {
		this.stop();
		this.node.scale = this.toScale;
		callback && callback();
	}
}
