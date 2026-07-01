import { UdBindMeta } from "../basecore/UdDecoratorKit";

@UdBindMeta
export class UdDeviceKit {


    private static _ins: UdDeviceKit;
    public static get Ins(): UdDeviceKit {
        if (!this._ins) {
            this._ins = new UdDeviceKit();
        }
        return this._ins;
    }


    private _statusBarHeight = undefined
    private _statusBottomHeight = undefined

    /**
     * 构造函数
     */
    private constructor() {
    }

    /**
     * 当前是否Html5版本
     * @returns {boolean}
     * @constructor
     */
    public get IsHtml5(): boolean {
        return cc.sys.isNative
    }

    /**
     * 当前是否是Native版本（mic不属于native）
     * @returns {boolean}
     * @constructor
     */
    public get IsNative(): boolean {
        return cc.sys.isNative
    }

    /**
     * 是否是在手机上且不是H5
     * @returns {boolean}
     * @constructor
     */
    public get IsMobile(): boolean {
        return cc.sys.isMobile && cc.sys.platform != cc.sys.MOBILE_BROWSER
    }

    // public needDownMic(): boolean {
    //     return false;
    // }

    /**
     * 是否是在PC上
     * @returns {boolean}
     * @constructor
     */
    public get IsPC(): boolean {
        return !cc.sys.isMobile;
    }

    public get IsXyx(): boolean {
        var miniGamePlatforms = [cc.sys.WECHAT_GAME, cc.sys.ALIPAY_GAME, cc.sys.QTT_GAME,
        cc.sys.BYTEDANCE_GAME, cc.sys.HUAWEI_GAME, cc.sys.OPPO_GAME,
        cc.sys.VIVO_GAME, cc.sys.XIAOMI_GAME, cc.sys.BAIDU_GAME,
        cc.sys.JKW_GAME, cc.sys.LINKSURE, cc.sys.TAOBAO_MINIGAME];
        return miniGamePlatforms.indexOf(cc.sys.platform) >= 0
    }

    public getOs(): string {
        return cc.sys.os;
    }

    // 解引用  直接调sdk那边
    // public getOsCode(): number {
    //     return SDKMgr.Ins.sdk.getOsCode()
    // }


    public getBrowser(): string | void {
        cc.sys.os
        return cc.sys.browserType
    }

    //当前游戏宽度
    public curWidth(): number {
        return cc.sys.windowPixelResolution.width;
    }

    //当前游戏宽度
    public curHeight(): number {
        return cc.sys.windowPixelResolution.height;
    }

    //适配后多出来的高度（可正可负）
    public additionWidth(): number {
        return cc.sys.windowPixelResolution.width * (1 - this.additionScale());
    }

    // 刘海头部适配
    public get statusBarHeight(): number {
        if (this._statusBarHeight == undefined) {
            let _window: any = window
            if (_window.urlKV && _window.urlKV.statusBarHeight != undefined) {
                this._statusBarHeight = _window.urlKV.statusBarHeight
            } else {
                //此接口只包含机型安全区域    没有考虑微信胶囊按钮
                this._statusBarHeight = this.statusBarHeight02;
            }
        }
        return this._statusBarHeight;
    }

    // 此接口只包含机型安全区域    没有考虑微信胶囊按钮
    public get statusBarHeight02(): number {
        //此接口只包含机型安全区域    没有考虑微信胶囊按钮
        let rect = cc.sys.getSafeAreaRect();
        let viewSize = cc.view.getCanvasSize();
        let maxHeight = 720 / viewSize.width * viewSize.height;
        let height = maxHeight - rect.y - rect.height;
        if (height < 0) height = 0;

        return height;
    }

    public get xyxBarHeight(): number {
        return 80;
    }

    // 当前尺寸下，根gp的缩放值（小于1）
    public additionScale(): number {
        if (this.curHeight() < 1280)
            return this.curHeight() / 1280
        else
            return 1
    }

    // iPhoneX机子底部白条适配
    public get statusBottomHeight(): number {
        if (this._statusBottomHeight == undefined) {
            let _window: any = window
            if (_window.urlKV && _window.urlKV.statusBottomHeight != undefined) {
                this._statusBottomHeight = _window.urlKV.statusBottomHeight
            } else {
                let rect = cc.sys.getSafeAreaRect();
                this._statusBottomHeight = rect.y
                if (this._statusBottomHeight < 0)
                    this._statusBottomHeight = 0
            }
        }
        return this._statusBottomHeight;
    }

    // 解引用  直接调sdk那边
    // public deviceId(): string {
    //     return SDKMgr.Ins.sdk.getDeviceId();
    // }

}