import { UdBindMeta } from "../../extension/basecore/UdDecoratorKit";
import { UdPopPanel } from "../../core/view/compoment/UdPopPanel";
import { UdAudioHub } from "../../extension/audio/UdAudioHub";
import { UdHapticHub } from "../../extension/haptic/UdHapticHub";

@UdBindMeta
export class UdSettingView extends UdPopPanel {

	private music_tgl: cc.Toggle = undefined;
	private sound_tgl: cc.Toggle = undefined;
	private shake_tgl: cc.Toggle = undefined;

	public constructor() {
		super();
		this.prefabPath = "udSetting/prefabs/view/UdSettingView";
	}

	public init(root: cc.Node) {
		super.init(root);

		const R = this.UdResFinder;
		this.music_tgl = R.getComponent("music_tgl", cc.Toggle);
		this.sound_tgl = R.getComponent("sound_tgl", cc.Toggle);
		this.shake_tgl = R.getComponent("shake_tgl", cc.Toggle);

		this.__syncToggleStates();
	}

	public addEvents() {
		this.music_tgl.node.on("toggle", this.__onMusicToggle, this);
		this.sound_tgl.node.on("toggle", this.__onSoundToggle, this);
		this.shake_tgl.node.on("toggle", this.__onShakeToggle, this);
	}

	public removeEvents() {
		this.music_tgl.node.off("toggle", this.__onMusicToggle, this);
		this.sound_tgl.node.off("toggle", this.__onSoundToggle, this);
		this.shake_tgl.node.off("toggle", this.__onShakeToggle, this);
	}

	public updateView(...args: any[]) {
		this.__syncToggleStates();
	}

	private __syncToggleStates(): void {
		if (this.music_tgl != null) {
			this.music_tgl.isChecked = UdAudioHub.Ins.bgmEnabled;
		}
		if (this.sound_tgl != null) {
			this.sound_tgl.isChecked = UdAudioHub.Ins.soundEnabled;
		}
		if (this.shake_tgl != null) {
			this.shake_tgl.isChecked = UdHapticHub.Ins.enabled;
		}
	}

	private __onMusicToggle(toggle: cc.Toggle): void {
		UdAudioHub.Ins.bgmEnabled = toggle.isChecked;
	}

	private __onSoundToggle(toggle: cc.Toggle): void {
		UdAudioHub.Ins.soundEnabled = toggle.isChecked;
	}

	private __onShakeToggle(toggle: cc.Toggle): void {
		UdHapticHub.Ins.enabled = toggle.isChecked;
	}

	public onClose() {
		super.onClose();
	}
}
