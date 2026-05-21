import { UdPanelHub } from "./core/manager/UdPanelHub";
import { UdToastHub } from "./core/toastMessage/UdToastHub";
import { UdAssetPathKit } from "./core/utils/UdAssetPathKit";
import { UdAudioHub } from "./extension/audio/UdAudioHub";
import { udRes } from "./extension/resources/UdResHub";
import { UdTickHub } from "./extension/update/UdTickHub";
import { UdNodeKit } from "./extension/utils/UdNodeKit";
import { UdLayerKind } from "./extension/view/types/UdLayerKind";
import { UdGameMain } from "./module/udGame/views/UdGameMain";
import { UdCoreKit } from "./extension/utils/UdCoreKit";
import { UdTimerHub } from "./extension/time/UdTimerHub";
import { UdToastView } from "./module/udToastMessage/UdToastView";
import { UdReflectKit } from "./extension/utils/UdReflectKit";

const { ccclass } = cc._decorator;

@ccclass
export class UdAppEntry extends cc.Component {
	private _width = 720;
	private _height = 1280;

	onLoad() {
		cc.debug.setDisplayStats(false);
		cc.dynamicAtlasManager.enabled = false;
		cc.assetManager.force = !CC_DEBUG;
		udRes.UdResHub.sInstance.init(CC_DEBUG ? 15 : 60, CC_DEBUG ? 1 : 5);

		let size = cc.view.getDesignResolutionSize();
		this._width = size.width;
		this._height = size.height;

		this.doHook();
	}

	start() {
		UdCoreKit.setSeed(Date.now() & 0xffffffff);
		this.setDesignResolutionSize();
		let viewRoot = new cc.Node();
		viewRoot.name = "UiStageRoot";
		this.node.addChild(viewRoot);
		let viewWidget = UdNodeKit.addWidget(viewRoot, 0, 0, 0, 0);
		viewWidget.updateAlignment();

		UdPanelHub.Ins.init(viewRoot, UdAssetPathKit.ViewPrefabPath, this._width, viewRoot.height, CC_DEBUG ? 5 : 60);
		UdToastHub.Ins.init(UdToastView, UdPanelHub.Ins);
		UdAudioHub.Ins.init(
			UdAssetPathKit.getBgmPath(""),
			UdAssetPathKit.getSoundPath(""),
			UdAudioHub.loadPrefs()
		);

		UdTimerHub.Ins.callLater(1, () => {
			UdAudioHub.Ins.playBgm("store.mp3");
		});

		this.openUdGame();
	}

	private setDesignResolutionSize() {
		let width = 720;
		let height = 1280;
		let frameSize = cc.view.getFrameSize();
		if (frameSize.width / frameSize.height <= width / height) {
			cc.view.setDesignResolutionSize(width, height, cc.ResolutionPolicy.FIXED_WIDTH);
		} else {
			cc.view.setDesignResolutionSize(width, height, cc.ResolutionPolicy.FIXED_HEIGHT);
		}
	}

	private doHook() {
		// hook JSON.parse

		if (JSON["_parse"] == undefined) {
			JSON["_parse"] = JSON.parse;
			JSON.parse = function (t: string, r?: Function) {
				if (typeof t === "object" || Array.isArray(t)) {
					return t;
				} else if (t == undefined) {
					// console.warn('Json解析undefined');
					return [];
				} else if (t == "") {
					return [];
				} else {
					return JSON["_parse"]((t.trim && t.trim()) || t, r);
				}
			};
		}
	}

	update(dt: number) {
		UdTickHub.Ins.onUpdate(dt);
		// GameMgr.Ins.onUpdate(dt);
	}

	lateUpdate(dt: number) {
		UdTickHub.Ins.onLateUpdate(dt);
	}

	private openUdGame() {

		let openGame = () => {
			UdPanelHub.Ins.open(UdGameMain, UdLayerKind.Panel);
		}

		let loadMain = (<any>window).loadMain;
		if (loadMain !== undefined) {
			loadMain(() => {
				openGame();
			});
		} else {

			cc.assetManager.loadBundle(cc.AssetManager.BuiltinBundleName.MAIN + "", () => {
				openGame();
			});

		}

	}


	public initDebug() {
			this.addDebug(UdReflectKit.getClassName(UdPanelHub), UdPanelHub.Ins);
	}

	private addDebug(name: string, fun: any) {
		(<any>window)[name] = fun;
	}

}
