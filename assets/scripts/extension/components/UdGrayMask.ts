import { UdSeqList } from "../basecore/UdSeqList";
import { UdSpine } from "../game/UdSpine";
import { UdSprite } from "../game/UdSprite";
import { udRes } from "../resources/UdResHub";

const { ccclass, menu, executeInEditMode } = cc._decorator;

@ccclass
@menu("通用/UdGrayMask(灰度效果)")
@executeInEditMode
export class UdGrayMask extends cc.Component {

    private _spriteList: UdSeqList<cc.Sprite> = new UdSeqList<cc.Sprite>();
    private _labelList: UdSeqList<cc.Label> = new UdSeqList<cc.Label>();
    private _spineList: UdSeqList<sp.Skeleton> = new UdSeqList<sp.Skeleton>();

    private _graySpineMaterial: cc.Material = undefined;
    public get graySpineMaterial(): cc.Material {
        return this._graySpineMaterial;
    }
    public set graySpineMaterial(value: cc.Material) {
        if (this._graySpineMaterial) {
            udRes.UdResHub.sInstance.uncacheAsset(this._graySpineMaterial);
        }
        this._graySpineMaterial = value;
        if (this._graySpineMaterial) {
            udRes.UdResHub.sInstance.cacheAsset(this._graySpineMaterial);
        }
    }
    private _loader: number = 0;

    public onLoad() {
        {
            let sprites = this.node.getComponentsInChildren(cc.Sprite);
            if (sprites.length > 0) {
                for (let i = 0; i < sprites.length; i++) {
                    let sprite = sprites[i];
                    this._spriteList.add(sprite);
                }
            }
        }
        {
            let sprites = this.node.getComponentsInChildren(UdSprite);
            if (sprites.length > 0) {
                for (let i = 0; i < sprites.length; i++) {
                    let sprite = sprites[i];
                    this._spriteList.add(sprite);
                }
            }
        }
        {
            let spines = this.node.getComponentsInChildren(sp.Skeleton);
            if (spines.length > 0) {
                for (let i = 0; i < spines.length; i++) {
                    let spine = spines[i];
                    this._spineList.add(spine);
                }
            }
        }
        {
            let spines = this.node.getComponentsInChildren(UdSpine);
            if (spines.length > 0) {
                for (let i = 0; i < spines.length; i++) {
                    let spine = spines[i];
                    this._spineList.add(spine);
                }
            }
        }

        let labels = this.node.getComponentsInChildren(cc.Label);
        if (labels.length > 0) {
            for (let i = 0; i < labels.length; i++) {
                let label = labels[i];
                this._labelList.add(label);
            }
        }
    }

    public onEnable() {
        this.setSpritesGrayState(this._spriteList, true);
        this.setLabelsGrayState(this._labelList, true);
        if (this.graySpineMaterial) {
            this.setSpinesGrayState(this._spineList, true);
        } else {
            let rootPath = "resources/" + "materials/";
            let path = rootPath + ("gray-spine");
            if (CC_EDITOR) {
                Editor.log("加载 ", path);
                cc.resources.load(path, cc.Material, this.loadSpineMaterialFinish.bind(this));
            } else {
                this._loader = udRes.UdResHub.sInstance.load(path, cc.Material, this.loadSpineMaterialFinish.bind(this));
            }
        }
    }

    public onDisable() {
        if (this._loader) {
            udRes.UdResHub.sInstance.stopLoad(this._loader)
            this._loader = 0
        }
        this.setSpritesGrayState(this._spriteList, false);
        this.setLabelsGrayState(this._labelList, false);
        this.setSpinesGrayState(this._spineList, false);
    }

    public onDestroy() {
        this._spriteList.clear();
        this._labelList.clear();
        this.graySpineMaterial = undefined;
    }

    /**
     * @description: 设置精灵的材质
     * @param list 列表
     * @param isGray 灰度状态 
     */
    private setSpritesGrayState(list: UdSeqList<cc.Sprite>, isGray: boolean) {
        if (list && list.length > 0) {
            for (let i = 0; i < list.length; i++) {
                let sprite = list.get(i);
                if (isGray) {
                    sprite.setMaterial(0, cc.Material.getBuiltinMaterial('2d-gray-sprite'));
                } else {
                    sprite.setMaterial(0, cc.Material.getBuiltinMaterial('2d-sprite'));
                }
            }
        }
    }

    /**
     * @description: 设置文本的材质
     * @param list 列表
     * @param isGray 灰度状态 
     */
    private setLabelsGrayState(list: UdSeqList<cc.Label>, isGray: boolean) {
        if (list && list.length > 0) {
            for (let i = 0; i < list.length; i++) {
                let label = list.get(i);
                if (isGray) {
                    label.setMaterial(0, cc.Material.getBuiltinMaterial('2d-gray-sprite'));
                } else {
                    label.setMaterial(0, cc.Material.getBuiltinMaterial('2d-sprite'));
                }
            }
        }
    }
    /**
     * @description: 设置spine的材质
     * @param list 列表
     * @param isGray 灰度状态 
     */
    private setSpinesGrayState(list: UdSeqList<sp.Skeleton>, isGray: boolean) {
        if (list && list.length > 0) {
            for (let i = 0; i < list.length; i++) {
                let spine = list.get(i);
                if (isGray) {
                    spine.setMaterial(0, this.graySpineMaterial);
                } else {
                    spine.setMaterial(0, cc.Material.getBuiltinMaterial('2d-spine'));
                }
            }
        }
    }


    private loadSpineMaterialFinish(err: Error, data: cc.Material) {
        if (!err) {
            this.graySpineMaterial = data;
            if (this.enabled)
                this.setSpinesGrayState(this._spineList, this.enabled);
        } else {
            console.log("加载骨骼压灰材质失败", err);
        }
        this._loader = 0;
    }
}