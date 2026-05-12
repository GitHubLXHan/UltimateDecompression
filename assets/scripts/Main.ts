import { UIMgr } from "./core/manager/UIMgr";
import { PopMgr } from "./core/popMessage/PopMgr";
import { ResPathUtils } from "./core/utils/ResPathUtils";
import { PopMsgView } from "./module/popMessage/PopMsgView";
import { AudioMgr } from "./extension/audio/AudioMgr";
import { resource } from "./extension/resources/ResourceManager";
import { UpdateMgr } from "./extension/update/UpdateMgr";
import { NodeUtils } from "./extension/utils/NodeUtils";
import { UILayerType } from "./extension/view/types/UILayerType";
import { WatermelonMinGameView } from "./module/watermelonMinGame/views/WatermelonMinGameView";

const { ccclass } = cc._decorator;

@ccclass
export class Main extends cc.Component {
	private _width = 720;
	private _height = 1280;

	private wxFirstSceneComponent: any;

	onLoad() {
		cc.debug.setDisplayStats(false);
		cc.dynamicAtlasManager.enabled = false;
		cc.assetManager.force = !CC_DEBUG;
		resource.ResourceManager.sInstance.init(CC_DEBUG ? 15 : 60, CC_DEBUG ? 1 : 5);

		let size = cc.view.getDesignResolutionSize();
		this._width = size.width;
		this._height = size.height;

		this.doHook();
	}

	start() {
		this.setDesignResolutionSize();
		let viewRoot = new cc.Node();
		viewRoot.name = "ViewRoot";
		this.node.addChild(viewRoot);
		let viewWidget = NodeUtils.addWidget(viewRoot, 0, 0, 0, 0);
		viewWidget.updateAlignment();

		UIMgr.Ins.init(viewRoot, ResPathUtils.ViewPrefabPath, this._width, viewRoot.height, CC_DEBUG ? 5 : 60);
		PopMgr.Ins.init(PopMsgView, UIMgr.Ins);
		AudioMgr.Ins.init(ResPathUtils.getBgmPath(""), ResPathUtils.getSoundPath(""), {
			bgmEnabled: true,
			soundEnabled: true,
			bgmVolume: 0.7,
			soundVolume: 1
		});
		this.openWatermelonGame();
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
		UpdateMgr.Ins.onUpdate(dt);
		// GameMgr.Ins.onUpdate(dt);
	}

	lateUpdate(dt: number) {
		UpdateMgr.Ins.onLateUpdate(dt);
	}

	private openWatermelonGame() {

		let openGame = () => {
			UIMgr.Ins.open(WatermelonMinGameView, UILayerType.View);
		}

		let loadMain = (<any>window).loadMain;
		if (loadMain !== undefined) {
			loadMain(() => {
				openGame();
			});
		} else if (this.wxFirstSceneComponent) {
			this.wxFirstSceneComponent.onLoginViewOpenDone();
			openGame();
		}

	}
}
