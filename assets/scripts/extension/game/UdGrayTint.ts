import { udRes } from "../resources/UdResHub";
import { UdSprite } from "./UdSprite";

const { ccclass, property, menu, requireComponent, executeInEditMode } = cc._decorator;

const MT_PATH = "resources/materials/gray-tint.mtl";

/**
 * 灰度图设置颜色亮度
 */
@ccclass
@menu("游戏/UdGrayTint(灰度图增效)")
@requireComponent(UdSprite)
@executeInEditMode
export class UdGrayTint extends cc.Component {

    // ============ 红色 ============
    @property({ type: cc.String, tooltip: "颜色值", range: [0, 0xffffff, 1] })
    private _color = "0x7f7f7f";
    @property({ type: cc.String, tooltip: "颜色值", range: [0, 0xffffff, 1] })
    get color(): string {
        return this._color;
    }
    set color(v: string) {
        this._color = v;
        this._syncAll();
    }

    // // ============ 红色 ============
    // @property({ type: cc.Float, tooltip: "红色", range: [0, 1, 0.05] })
    // private _red = 0.5
    // @property({ type: cc.Float, tooltip: "红色", range: [0, 1, 0.05] })
    // get red(): number {
    //     return this._red;
    // }
    // set red(v: number) {
    //     this._red = v;
    //     this._syncAll();
    // }

    // // ============ 绿色 ============
    // @property({ type: cc.Float, tooltip: "绿色", range: [0, 1, 0.05] })
    // _green: number = 0.5;
    // @property({ type: cc.Float, tooltip: "绿色", range: [0, 1, 0.05] })
    // get green(): number {
    //     return this._green;
    // }
    // set green(v: number) {
    //     this._green = v;
    //     this._syncAll();
    // }


    // // ============ 蓝色 ============
    // @property({ type: cc.Float, tooltip: "蓝色", range: [0, 1, 0.05] })
    // _blue: number = 0.5;
    // @property({ type: cc.Float, tooltip: "蓝色", range: [0, 1, 0.05] })
    // get blue(): number {
    //     return this._blue;
    // }
    // set blue(v: number) {
    //     this._blue = v;
    //     this._syncAll();
    // }

    // ============ 亮度 ============
    @property({ type: cc.Float, tooltip: "亮度", range: [0, 1, 0.05] })
    _brightness: number = 0.1;
    @property({ type: cc.Float, tooltip: "亮度", range: [0, 1, 0.05] })
    get brightness(): number {
        return this._brightness;
    }
    set brightness(v: number) {
        this._brightness = v;
        this._syncAll();
    }



    // ============ 内部 ============

    private _sprite: cc.Sprite = null;
    private _originMaterial: cc.Material = null;
    private _material: any = null;
    private _loadId: number = 0;

    onLoad(): void {
        this._sprite = this.getComponent(cc.Sprite);

        if (!this._sprite) { cc.warn("[UdGrayTint] 缺少 cc.Sprite"); return; }

        this._loadId = udRes.UdResHub.sInstance.load(
            MT_PATH, cc.Material,
            (err: Error, asset: cc.Material) => {
                this._loadId = 0;
                if (err) { cc.warn("[UdGrayTint] 材质加载失败:", err.message); return; }
                this._originMaterial = asset;
                // udRes.UdResHub.sInstance.cacheAsset(this._originMaterial);

                this._material = (cc as any).MaterialVariant
                    ? (cc as any).MaterialVariant.create(asset, this._sprite)
                    : asset;
                this._sprite.setMaterial(0, this._material);

                this._syncAll();
            },
        );
    }

    onEnable(): void {
        if (this._material) this._syncAll();
    }

    update(dt: number): void {
    }

    private _syncAll(): void {
        this._applyBrightness();
        this._applyColor();
    }

    private _applyBrightness(): void {
        //@ts-ignore
        this._setProp("effectParams", cc.v4(this.brightness, 0, 0, 0));
    }

    private _applyColor(): void {
        //@ts-ignore
        // this._setProp("tintColor", cc.v4(this.red, this.green, this.blue, 0));

        let color = Number(this._color);
        const r = ((color >> 16) & 0xff) / 255;
        const g = ((color >> 8) & 0xff) / 255;
        const b = (color & 0xff) / 255;

        //@ts-ignore
        this._setProp("tintColor", cc.v4(r, g, b, 0));
    }

    private _setProp(name: string, value: any): void {
        if (this._material?.setProperty) this._material.setProperty(name, value);
    }

    onDestroy(): void {
        if (this._loadId > 0) { udRes.UdResHub.sInstance.stopLoad(this._loadId); this._loadId = 0; }
        // if (this._sprite) {
        //     this._sprite.setMaterial(0, cc.Material.getBuiltinMaterial("2d-sprite"));
        //     this._sprite = null;
        // }
        if (this._originMaterial) {
            // udRes.UdResHub.sInstance.uncacheAsset(this._originMaterial);
            this._originMaterial = null;
        }
        this._material = null;
    }
}
