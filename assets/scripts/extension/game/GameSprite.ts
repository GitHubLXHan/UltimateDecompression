import { resource } from "../resources/ResourceManager";
import { Mathf } from "../basecore/Mathf";
import { LogMgr } from "../log/LogMgr";
import { PathUtils } from "../../core/utils/PathUtils";

const { ccclass, property, inspector, executeInEditMode, menu } = cc._decorator;

@ccclass
// @inspector("packages://inspector/inspectors/comps/sprite.js")   //这行代码可以让inspector变成sprite那种样式  但是是全覆盖的 会覆盖掉自定义变量source
@executeInEditMode
@menu("UI/GameSprite(拓展精灵)")
export class GameSprite extends cc.Sprite {


	@property
	private _source = ""

	@property({ type: cc.String })
	set source(source: string) {
		// source为空是想要置空图片，直接通过判定，在下一帧置空
		if (source && source == this._source) {
			return;
		}

		this._source = source;
		this._dirtyFlag = true;
	}

	get source(): string {
		return this._source;
	}

	@property
	private _scale: number = 1;
	@property({ tooltip: "缩放" })
	get scale(): number {
		return this._scale;
	}
	set scale(value: number) {
		this._scale = value;
		this.node.scale = this._scale;
		let scaleX = this._isFlipX ? -this._scale : this._scale;
		this.node.setScale(scaleX, this._scale);
	}

	@property
	private _isFlipX: boolean = false;
	@property({ tooltip: "反转X" })
	get isFlipX(): boolean {
		return this._isFlipX;
	}
	set isFlipX(value: boolean) {
		this._isFlipX = value;
		this.scale = this.scale;
	}

	@property
	private _pathMap: boolean = true;
	// @property({ tooltip: "spriteFrame 转换为路径" })
	// get pathMap(): boolean {
	// 	return this._pathMap;
	// }
	// set pathMap(value: boolean) {
	// 	this._pathMap = value;
	// 	if (value) {
	// 		this._onSpriteframeChanged(this);
	// 	}
	// }

	// 记录资源的uuid
	@property
	private _resUuid: string = "";

	// 为了在编辑器上可直接链接到图片位置
	@property({ type: cc.SpriteFrame, editorOnly: true, serializable: false, readonly: true, tooltip: "仅编辑器有效，可链接到资源位置" })
	curSp: cc.SpriteFrame = null;

	// 数据脏标记
	private _dirtyFlag: boolean = false;
	private _loaderId: number = 0;
	private _genMipmaps: boolean = false;

	onLoad(): void {
		if (super.onLoad) {
			super.onLoad();
		}
		if (this.spriteFrame) {
			resource.ResourceManager.sInstance.cacheAsset(this.spriteFrame);
		}

		let sourceTmp = this._source;
		if (sourceTmp) {
			this._source = "";
			this.source = sourceTmp;
		}

		if (CC_EDITOR && this.spriteFrame) {
			// this.pathMap = false;
			this._onSpriteframeChanged()
		}
	}

	protected onEnable(): void {
		if (CC_EDITOR) {
			this.node.on("spriteframe-changed", this._onSpriteframeChanged, this);
		}
		super.onEnable();
	}


	update() {
		if (this._dirtyFlag) {
			this._dirtyFlag = false;

			if (CC_EDITOR) {
				if (!this._source) {
					return;
				}
				// 设置 _bundleName 和 _source
				if (resource.ResourceManager.sInstance.isExtRes(this._source)) {
					Editor.log(`远程加载`);

					let pathArr = PathUtils.splitext(this._source);
					let pathTmp = pathArr[1] ? this._source : PathUtils.changeExtname(this._source, ".png");

					cc.assetManager.loadRemote(`http://localhost:7456/ext-res/${pathTmp}`, cc.Texture2D, (error: Error, assets: cc.Texture2D) => {
						if (error) {
							Editor.log(`-------加载图片 ${pathTmp} 失败`);
							return;
						}
						let sp = new cc.SpriteFrame(assets);
						this.spriteFrame = undefined;
						this.spriteFrame = sp;
					});
				} else {
					Editor.log(`本地加载`);

					// 组织路径
					let res: { bundleName: string; resPath: string; ext: string } = resource.ResourceManager.sInstance.parseResPath(this._source);

					let pathArr = PathUtils.splitext(this._source);
					res.resPath = pathArr[1] ? PathUtils.changeExtname(res.resPath, pathArr[1]) : PathUtils.changeExtname(res.resPath, ".png");

					if (res.bundleName == "resources") {
						res.resPath = resource.ResourceManager.resourcesPrefix + res.resPath;
					} else {
						res.resPath = resource.ResourceManager.bundlesPrefix + res.bundleName + "/" + res.resPath;
					}

					// 拿到资源uuid
					const uuid = Editor.assetdb.remote.urlToUuid(res.resPath);
					cc.assetManager.loadAny(`${uuid}`, { type: cc.Texture2D, bundle: res.bundleName, requestType__: "uuid" }, (error: Error, assets: cc.Texture2D) => {
						if (error) {
							Editor.log(`-------${this._source}`);
							Editor.log(`-------加载图片 ${res.resPath}${res.ext} ${uuid} 失败`);
							if (this._resUuid) {
								let resUrl = Editor.assetdb.remote.uuidToUrl(this._resUuid);
								Editor.log(`-------加载原先记录的资源 ${this._resUuid} ${resUrl}`);
								resUrl = resUrl.replace(resource.ResourceManager.resourcesPrefix, "").replace(resource.ResourceManager.bundlesPrefix, "")
								this.source = resUrl;
								this._resUuid = "";
							}
							return;
						}
						// 创建并设置spriteFrame
						let sp = new cc.SpriteFrame(assets);
						this.spriteFrame = undefined;
						this.spriteFrame = sp;
						// 创建spriteFrame备份，仅为了在编辑器上可直接链接到图片位置
						let subAssetInfo: AssetInfo[] = Editor.assetdb.remote.subAssetInfosByUuid(uuid);
						if (subAssetInfo?.length > 0) {
							let spTmp = new cc.SpriteFrame(this.spriteFrame.getTexture());
							spTmp[resource.ResourceManager.UuidKey] = subAssetInfo[0].uuid;
							this.curSp = spTmp;
						}
						// 设置九宫格数据
						this._manualSliced(uuid, cc.path.basename(pathArr[0]))
						// 记录当前图片uuid
						this._resUuid = uuid;
					});
				}
			} else {
				this._source = this._parseSource(this._source);

				this.stopLoad();
				//不需要置空
				// this.updateSpriteFrameAndRefCount(undefined);

				if (!this._source) {
					// 置空
					this.updateSpriteFrameAndRefCount(undefined);
				} else {
					//内网没有s
					if (this._source.indexOf("https://") >= 0 || this._source.indexOf("http://") >= 0 || this._source.indexOf("data:image/") >= 0) {
						//php返回Content-Type: image/png
						if (this._source.indexOf(".php") >= 0 || this._source.indexOf("data:image/") >= 0) {
							let domImage = cc.loader.downloader.downloadDomImage()
							//相关的加载回调和报错 cocos都有实现了(个鬼）

							let texture = new cc.Texture2D()
							texture.initWithElement(domImage)

							let sp = new cc.SpriteFrame()
							sp.setTexture(texture)
							domImage.addEventListener("load", this.onComplete.bind(this, undefined, sp))
							//必须写在最后 先加载完成不会触发load事件
							domImage.src = this._source
						} else {
							this._loaderId = resource.ResourceManager.sInstance.loadRemote(this._source, { ext: ".png" }, this.onComplete.bind(this));
						}
					} else {
						this._loaderId = resource.ResourceManager.sInstance.loadSpriteFrame(this._source, this.onComplete.bind(this));
					}
				}
			}
		}
	}

	/**强制清理图片资源 */
	public forceClearImg(): void {
		// 资源减引用在下一帧，但有些情况下update可能已经不会调用，导致资源引用一直在，这里强制调用下以处理该情况
		this.source = '';
		this.updateSpriteFrameAndRefCount(undefined);
	}

	/**
	 * 手动九宫格
	 * @param uuid
	 * @param fileName
	 */
	private _manualSliced(uuid: string, fileName: string) {
		Editor.assetdb.queryMetaInfoByUuid(uuid, (err: any, info: any) => {
			if (err) {
				Editor.log(`meta信息加载失败 ${err}`)
				return;
			}

			if (!this.spriteFrame) {
				return;
			}

			let metaObj = JSON.parse(info.json);
			//@ts-ignore
			this.spriteFrame._capInsets[0] = metaObj["subMetas"][fileName]["borderLeft"];
			//@ts-ignore
			this.spriteFrame._capInsets[1] = metaObj["subMetas"][fileName]["borderTop"];
			//@ts-ignore
			this.spriteFrame._capInsets[2] = metaObj["subMetas"][fileName]["borderRight"];
			//@ts-ignore
			this.spriteFrame._capInsets[3] = metaObj["subMetas"][fileName]["borderBottom"];
			//@ts-ignore
			this.spriteFrame._calculateUV();
			//@ts-ignore
			// Editor.log(`手动九宫格设置成功 ${this.node.name}  ${this.spriteFrame._capInsets}`)
		});
	}

	private onComplete(err: Error, sp: cc.SpriteFrame) {
		if (!err) {
			this.updateSpriteFrameAndRefCount(sp);
		}
		let texture = sp && sp.getTexture()
		if (texture && !texture.loaded) {
			texture.handleLoadedTexture()
		}
		this._loaderId = 0;
		this.genMipmaps = this.genMipmaps;

		if (!sp) {
			// 置空
			this.updateSpriteFrameAndRefCount(undefined);
		}
	}

	private stopLoad() {
		if (this._loaderId > 0) {
			resource.ResourceManager.sInstance.stopLoad(this._loaderId);
			this._loaderId = 0;
		}
	}

	public get genMipmaps(): boolean {
		return this._genMipmaps;
	}
	public set genMipmaps(value: boolean) {
		this._genMipmaps = value;
		if (this.spriteFrame == null) {
			return;
		}
		let t2d = this.spriteFrame.getTexture();
		if (t2d == null || !t2d.loaded) {
			return;
		}

		if (this._genMipmaps) {
			if (t2d["_texture"] != null) {
				let w = t2d["_texture"]._width;
				let h = t2d["_texture"]._height;

				if (!Mathf.isPow2(w) || !Mathf.isPow2(h)) {
					LogMgr.logWarning("[GameSprite] 当贴图宽高不是2次幂的时候，设置genMipmaps无效!", w, h);
					return;
				}
			}
		}

		if (t2d.genMipmaps == this._genMipmaps) {
			return;
		}

		t2d.genMipmaps = this._genMipmaps;
	}

	// 注意该函数需要在组件本身挂载的spriteFrame可以获取后再调用
	private updateSpriteFrameAndRefCount(newSp?: cc.SpriteFrame) {
		if (this.spriteFrame) resource.ResourceManager.sInstance.uncacheAsset(this.spriteFrame);
		this.spriteFrame = newSp;
		if (this.spriteFrame) resource.ResourceManager.sInstance.cacheAsset(this.spriteFrame);
	}

	private _onSpriteframeChanged() {
		if (!CC_EDITOR || !this._pathMap) {
			return;
		}
		// Editor.log("========", !!this.spriteFrame, this.node.name)
		// if (this.spriteFrame && this.spriteFrame.getTexture()) {
		// 	Editor.log(aa.name)
		// }
		// if (this.spriteFrame) {
		// 	Editor.log(this.spriteFrame["_uuid"]);
		// 	Editor.log(this.spriteFrame.getTexture()["_uuid"]);
		// 	Editor.log(Editor.remote.assetdb.uuidToUrl(this.spriteFrame["_uuid"]));
		// 	Editor.log(Editor.remote.assetdb.uuidToUrl(this.spriteFrame.getTexture()["_uuid"]));
		// }



		if (this.spriteFrame && this.spriteFrame.getTexture()) {
			let texturePath = Editor.remote.assetdb.uuidToUrl(this.spriteFrame.getTexture()["_uuid"]);
			if (texturePath && texturePath.startsWith(resource.ResourceManager.bundlesPrefix)) {
				texturePath = texturePath.replace(resource.ResourceManager.bundlesPrefix, "");
			}
			if (texturePath && texturePath.startsWith(resource.ResourceManager.resourcesPrefix)) {
				texturePath = texturePath.replace("db://assets/", "");
			}


			if (texturePath && this._source != texturePath) {
				Editor.log(`${this.node.name} 路径转换: ${this.spriteFrame.name} -> ${texturePath}`);
				this.source = texturePath;
			}
		}

	}

	private _parseSource(source: string) {
		return source;
	}

	protected onDisable(): void {
		if (CC_EDITOR) {
			this.node.off("spriteframe-changed", this._onSpriteframeChanged, this);
		}
		super.onDisable();
	}

	public onDestroy() {
		this.stopLoad();
		this.updateSpriteFrameAndRefCount(undefined);
		this._source = "";
		super.onDestroy();
	}
}