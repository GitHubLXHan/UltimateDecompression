/*
 * 离线精简版：保留预制体上的 source / 字体加载能力，不依赖 LangParser、SettingModule。
 */
import { udRes } from "../resources/UdResHub";

const { ccclass, executeInEditMode, property, menu, inspector } = cc._decorator;

@ccclass
@executeInEditMode
@inspector("packages://inspector/inspectors/comps/label.js")
@menu("通用/UdLabel(通用文本)")
export class UdLabel extends cc.Label {
	private _dirtyFlag = false;
	private _loaderId = 0;

	@property
	private _source = "";

	@property
	set source(source: string) {
		if (source != this._source) {
			this._source = source;
			this._dirtyFlag = true;
		}
	}
	get source(): string {
		return this._source;
	}

	protected onLoad(): void {
		if (this.font) {
			udRes.UdResHub.sInstance.cacheAsset(this.font);
		}
		if (this.source) {
			this._dirtyFlag = true;
		}
	}

	update(dt: number) {
		if (this._dirtyFlag) {
			this._dirtyFlag = false;
			if (!this._source) return;

			if (CC_EDITOR) {
				let fontType: typeof cc.TTFFont | typeof cc.BitmapFont = cc.TTFFont;
				if (this.source.indexOf(".fnt") >= 0) {
					fontType = cc.BitmapFont;
				}
				if (udRes.UdResHub.sInstance.isExtRes(this._source)) {
					Editor.log(`远程加载字体`);
					cc.assetManager.loadRemote(`http://localhost:7456/ext-res/${this._source}`, fontType, (error: Error, assets: cc.Font) => {
						if (error) {
							Editor.log(`-------加载字体 ${this._source} 失败`);
						} else {
							Editor.log(`-------加载字体 ${this._source} 成功`);
						}
						this.font = undefined;
						this.font = assets;
					});
				} else {
					Editor.log(`本地加载字体`);

					let res: { bundleName: string; resPath: string } = udRes.UdResHub.sInstance.parseResPath(this._source);
					if (res.resPath.indexOf(".ttf") == -1 && res.resPath.indexOf(".fnt") == -1) {
						res.resPath += ".ttf";
					}

					if (res.bundleName == "resources") {
						res.resPath = udRes.UdResHub.resourcesPrefix + res.resPath;
					} else {
						res.resPath = udRes.UdResHub.bundlesPrefix + res.bundleName + "/" + res.resPath;
					}

					const uuid = Editor.assetdb.remote.urlToUuid(res.resPath);
					Editor.log(`本地加载字体uuid`, uuid, res.resPath);
					cc.assetManager.loadAny(`${uuid}`, { type: fontType, bundle: res.bundleName, requestType__: "uuid" }, (error: Error, assets: cc.Font) => {
						if (error) {
							Editor.log(`-------加载字体 ${this._source} 失败`, error.message);
						} else {
							Editor.log(`-------加载字体 ${this._source} 成功`);
						}

						this.font = undefined;
						this.font = assets;
					});
				}
			} else {
				this.stopLoad();
				if (!this._source) {
					this._updateFontAndRefCount(undefined);
				} else {
					let index = this._source.indexOf(".ttf");
					if (index < 0) index = this._source.indexOf(".fnt");
					let source = index >= 0 ? this._source.slice(0, index) : this._source;
					this._loaderId = udRes.UdResHub.sInstance.load(source, cc.Font, this._onLoadComplete.bind(this));
				}
			}
		}
	}

	private _onLoadComplete(err: Error, font: cc.Font): void {
		if (!err) {
			this._updateFontAndRefCount(font);
		}
		this._loaderId = 0;
	}

	private _updateFontAndRefCount(font?: cc.Font): void {
		if (this.font) udRes.UdResHub.sInstance.uncacheAsset(this.font);
		this.font = font;
		if (this.font) udRes.UdResHub.sInstance.cacheAsset(this.font);
	}

	private stopLoad() {
		if (this._loaderId > 0) {
			udRes.UdResHub.sInstance.stopLoad(this._loaderId);
			this._loaderId = 0;
		}
	}

	protected onDestroy(): void {
		this.stopLoad();
		this._updateFontAndRefCount(undefined);
		this._source = "";
		super.onDestroy();
	}
}
