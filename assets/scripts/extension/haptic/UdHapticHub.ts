import { UdBindMeta } from "../basecore/UdDecoratorKit";
import { UdSignalBus } from "../eventListener/UdSignalBus";
import { UdHapticSignal } from "./UdHapticSignal";

export interface IUdHapticPrefs {
	enabled: boolean;
}

@UdBindMeta
export class UdHapticHub extends UdSignalBus<UdHapticSignal, UdHapticHub> {
	private static readonly STORAGE_KEY = "ud_haptic_enabled";
	private static _ins: UdHapticHub;

	private _enabled: boolean = true;

	public static get Ins(): UdHapticHub {
		if (this._ins == null) {
			this._ins = new UdHapticHub();
			this._ins.loadPrefs();
		}
		return this._ins;
	}

	public static loadPrefs(): IUdHapticPrefs {
		const defaults: IUdHapticPrefs = { enabled: true };
		try {
			const raw = cc.sys.localStorage.getItem(UdHapticHub.STORAGE_KEY);
			if (raw == null || raw === "") {
				return defaults;
			}
			return { enabled: raw === "1" || raw === "true" };
		} catch {
			return defaults;
		}
	}

	public loadPrefs(): void {
		this._enabled = UdHapticHub.loadPrefs().enabled;
	}

	public savePrefs(): void {
		cc.sys.localStorage.setItem(UdHapticHub.STORAGE_KEY, this._enabled ? "1" : "0");
	}

	public get enabled(): boolean {
		return this._enabled;
	}

	public set enabled(value: boolean) {
		if (this._enabled === value) {
			return;
		}
		this._enabled = value;
		this.savePrefs();
		this.dispatchEvent(UdHapticSignal.Toggle);
	}

	/** 短震动，设置关闭时不执行 */
	public vibrateShort(): void {
		if (!this._enabled) {
			return;
		}
		this._runShortVibrate();
	}

	/** 长震动，设置关闭时不执行 */
	public vibrateLong(): void {
		if (!this._enabled) {
			return;
		}
		this._runLongVibrate();
	}

	private _runShortVibrate(): void {
		const wxApi = (window as any).wx;
		if (wxApi != null && typeof wxApi.vibrateShort === "function") {
			try {
				wxApi.vibrateShort({ type: "heavy" });
			} catch {
				wxApi.vibrateShort();
			}
			return;
		}
		if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
			navigator.vibrate(15);
		}
	}

	private _runLongVibrate(): void {
		const wxApi = (window as any).wx;
		if (wxApi != null && typeof wxApi.vibrateLong === "function") {
			wxApi.vibrateLong();
			return;
		}
		if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
			navigator.vibrate(400);
		}
	}
}
