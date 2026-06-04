import { udRes } from "../../../extension/resources/UdResHub";

const { ccclass, property, menu } = cc._decorator;

const MT_PATH = "udGame/materials/uv_repeat";

/**
 * 背景循环滚动。
 * 挂在 bg_img 上（节点需有 cc.Sprite），加载 uv_repeat 材质。
 */
@ccclass
@menu("游戏/UdBgScroll(背景滚动)")
export class UdBgScroll extends cc.Component {

    // ============ 细节纹理 ============
    @property({ type: cc.Texture2D, tooltip: "细节纹理（背景图）" })
    detailTexture: cc.Texture2D = null;

    // ============ 缩放 & 间距 ============
    @property({ type: cc.Vec2, tooltip: "细节图缩放" })
    detailImgScale: cc.Vec2 = cc.v2(1, 1);

    @property({ type: cc.Vec2, tooltip: "行间距，列间距" })
    detailImgGap: cc.Vec2 = cc.v2(0, 0);

    // ============ 行偏移 ============
    @property({ type: cc.Vec2, tooltip: "奇数行x偏移，偶数行x偏移（像素）" })
    detailImgOffset: cc.Vec2 = cc.v2(0, 0);

    // ============ 滚动 ============
    @property({ type: cc.Vec2, tooltip: "UV 滚动速度（x=水平, y=垂直, px/s）" })
    detailImgMoveSpeed: cc.Vec2 = cc.v2(0, 0);

    // ============ 亮度 ============
    @property({ type: cc.Float, tooltip: "亮度", range: [0, 5, 0.1] })
    brightness: number = 1;

    // ============ 显示区域裁剪 ============
    @property({ type: cc.Vec4, tooltip: "纹理显示范围（左、右、上、下边距，像素）" })
    //@ts-ignore
    showTextureRange: cc.Vec4 = cc.v4(0, 0, 0, 0);

    // ============ 内部 ============

    private _sprite: cc.Sprite = null;
    private _originMaterial: cc.Material = null;
    private _material: any = null;
    private _loadId: number = 0;

    onLoad(): void {
        this._sprite = this.getComponent(cc.Sprite);
        if (!this._sprite) { cc.warn("[UdBgScroll] 缺少 cc.Sprite"); return; }

        this._loadId = udRes.UdResHub.sInstance.load(
            MT_PATH, cc.Material,
            (err: Error, asset: cc.Material) => {
                this._loadId = 0;
                if (err) { cc.warn("[UdBgScroll] 材质加载失败:", err.message); return; }
                this._originMaterial = asset;
                udRes.UdResHub.sInstance.cacheAsset(this._originMaterial);

                this._material = (cc as any).MaterialVariant
                    ? (cc as any).MaterialVariant.create(asset, this._sprite)
                    : asset;
                this._sprite.setMaterial(0, this._material);

                this._syncAll();
            },
        );
    }

    onEnable(): void { if (this._material) this._syncAll(); }

    update(dt: number): void {
        if (!this._material) return;
        this._applyUvMoveSpeed();
    }

    private _syncAll(): void {
        this._applyTexture();
        this._applyUvRange();
        this._applyShowUvRange();
        this._applyRowUvOffset();
        this._applyUvMoveSpeed();
        this._applyBrightness();
        this._applyShowTextureRange();
    }

    private _applyTexture(): void {
        this._setProp("detailTexture", this.detailTexture);
    }

    private _applyUvRange(): void {
        if (!this._sprite || !this.detailTexture) return;
        const uw = (this.detailTexture.width * this.detailImgScale.x + this.detailImgGap.x)
            / this._sprite.node.width;
        const uh = (this.detailTexture.height * this.detailImgScale.y + this.detailImgGap.y)
            / this._sprite.node.height;
        this._setProp("uvRange", cc.v2(uw, uh));
    }

    private _applyShowUvRange(): void {
        if (!this._sprite || !this.detailTexture) return;
        const uw = (this.detailTexture.width * this.detailImgScale.x)
            / this._sprite.node.width;
        const uh = (this.detailTexture.height * this.detailImgScale.y)
            / this._sprite.node.height;
        this._setProp("showUvRange", cc.v2(uw, uh));
    }

    private _applyRowUvOffset(): void {
        if (!this._sprite) return;
        this._setProp("rowUvOffset", cc.v2(
            this.detailImgOffset.x / this._sprite.node.width,
            this.detailImgOffset.y / this._sprite.node.width,
        ));
    }

    private _applyUvMoveSpeed(): void {
        if (!this._sprite) return;
        this._setProp("uvMoveSpeed", cc.v2(
            -this.detailImgMoveSpeed.x / this._sprite.node.width,
            this.detailImgMoveSpeed.y / this._sprite.node.height,
        ));
    }

    private _applyBrightness(): void {
        this._setProp("brightness", this.brightness);
    }

    private _applyShowTextureRange(): void {
        if (!this._sprite) return;
        const r = this.showTextureRange;
        //@ts-ignore
        this._setProp("showTextureRange", cc.v4(
            r.x / this._sprite.node.width,
            1 - r.y / this._sprite.node.width,
            r.z / this._sprite.node.height,
            1 - r.w / this._sprite.node.height,
        ));
    }

    private _setProp(name: string, value: any): void {
        if (this._material?.setProperty) this._material.setProperty(name, value);
    }

    onDestroy(): void {
        if (this._loadId > 0) { udRes.UdResHub.sInstance.stopLoad(this._loadId); this._loadId = 0; }
        if (this._sprite) {
            this._sprite.setMaterial(0, cc.Material.getBuiltinMaterial("2d-sprite"));
            this._sprite = null;
        }
        if (this._originMaterial) { udRes.UdResHub.sInstance.uncacheAsset(this._originMaterial); this._originMaterial = null; }
        this._material = null;
    }
}
