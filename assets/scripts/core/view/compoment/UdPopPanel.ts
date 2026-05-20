import { UdBindMeta } from "../../../extension/basecore/UdDecoratorKit";
import { UdBtnSignal } from "../../../extension/components/GameBtn/UdBtnSignal";
import UdViewScaleMotion from "../../../extension/view/animations/UdViewScaleMotion";
import { UdFullView } from "./UdFullView";
import { UdPanelMask } from "./UdPanelMask";

@UdBindMeta
export class UdPopPanel extends UdFullView {
	private _masker: UdPanelMask;
	private _useDefaultAnimation: boolean = true;
	private _isClickMaskerToClose: boolean = true;

	public constructor() {
		super();

		this._masker = new UdPanelMask();
		this._masker.init(this);
		this._masker.addListener(UdBtnSignal.FingerUp, this.onTouchDarkHandler, this);
	}

	protected get darkAlpha(): number {
		return this._masker.alpha;
	}
	protected set darkAlpha(value: number) {
		this._masker.alpha = value;
	}

	protected get useDefaultAnimation(): boolean {
		return this._useDefaultAnimation;
	}
	protected set useDefaultAnimation(value: boolean) {
		this._useDefaultAnimation = value;
	}

	protected get isClickMaskerToClose(): boolean {
		return this._isClickMaskerToClose;
	}
	protected set isClickMaskerToClose(value: boolean) {
		this._isClickMaskerToClose = value;
	}

	public get maskDuration() {
		return this._masker.maskDuration;
	}
	public set maskDuration(value: number) {
		this._masker.maskDuration = value;
	}

	protected init(root: cc.Node) {
		if (this.useDefaultAnimation) {
			let scaleMotion = root.addComponent(UdViewScaleMotion);
			scaleMotion.toScale = root.scaleX;
		}

		super.init(root, false);
	}

	private onTouchDarkHandler(target: UdPanelMask, args: any[]) {
		if (this.root == null || this.isLoadError || !this.isClickMaskerToClose || this.isPlayAnimation) return;

		this.close();
	}

	protected onFocusUpdate() {
		super.onFocusUpdate();

		if (this._masker != null) {
			this._masker.active = this.isFocus && (this.root == null || this.root.activeInHierarchy);
		}
	}

	public playCloseAnimation(callback: (name: string) => void, isSkip: boolean, isDestroy: boolean = false) {
		super.playCloseAnimation(callback, isSkip, isDestroy);
		if (this._masker != null) {
			this._masker.active = false;
		}
	}

	public destroy() {
		if (this._masker != null) {
			this._masker.dispose();
			this._masker = null;
		}

		super.destroy();
	}
}
