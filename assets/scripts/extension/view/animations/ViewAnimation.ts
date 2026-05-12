import { EaseType } from "../types/EaseType";

const { ccclass, property } = cc._decorator
@ccclass
export abstract class ViewAnimation extends cc.Component {

    @property({ type: cc.Enum(EaseType) })
    openEase: EaseType = EaseType.OutCirc;

    @property
    openDuration: number = 0.3;

    @property
    openDelay: number = 0;

    @property({ type: cc.Enum(EaseType) })
    closeEase: EaseType = EaseType.InCirc;

    @property
    closeDuration: number = 0.2;

    @property
    closeDelay: number = 0;

    @property
    playOpenAnimation: boolean = true;

    @property
    playCloseAnimation: boolean = true;

    //由于View.ts会递归查找并控制根节点下所有子节点 添加此字段规避控制
    @property({ tooltip: "是否受到View.ts的控制" })
    effectByView: boolean = true;

    //是否已初始化
    private _isInit: boolean = false;
    //动画回调
    protected _callback: Function;
    //是否自动开始播放
    private _isAutoStart: boolean = true;
    //动画对象
    protected _tween: cc.Tween<cc.Node>;

    public onLoad() {
        let widget = this.getComponent(cc.Widget);
        if (widget != null)
            widget.updateAlignment();
    }

    public start() {
        this.setArgs()
        this._isInit = true;
        if (this._isAutoStart) {
            this.doOpen(this._callback);
        }
    }

    public setArgs() {

    }

    /**
     * @description: 开始播放打开界面动画
     * @param callback 动画完成的回调函数
     */
    public doOpen(callback: Function) {    
        this.stop();
        this._isAutoStart = true;
        this._callback = callback;

        if (!this._isInit)
            return;

        if (!this.playOpenAnimation) {
            this.onCompleteHandler();
            return;
        }

        cc.director.once(cc.Director.EVENT_AFTER_UPDATE, this.lateStartHandler, this);
    }

    /**
    * @description: 延迟开始动画，主要解决widget的更新居然在start之后的问题
    */
    protected abstract lateStartHandler();

    /**
     * @description: 动画结束
     */
    protected onCompleteHandler() {
        this._tween = null;
        let callback = this._callback;
        this._callback = null;
        if (callback != null)
            callback();
    }



    /**
     * @description: 开始播放关闭界面动画
     * @param callback 动画完成的回调函数
     */
    public abstract doClose(callback: Function): void;


    /**
     * 立即结束open动画
     * @param callback 
     */
    public abstract doneOpenImmediately(callback?: Function): void;


    /**
     * @description: 停止播放动画
     */
    public stop() {
        cc.director.off(cc.Director.EVENT_AFTER_UPDATE, this.lateStartHandler, this);

        if (this._tween != null) {
            this._tween.stop();
            this._tween = null;
        }
        this._callback = null;     
    }

    /**
     * @description: 动画是否启用
     */
    public get nodeActive(): boolean {
        return !!this.node?.activeInHierarchy;
    }

    /**
     * @description: 是否自动开始播放
     */
    public get isAutoStart(): boolean {
        return this._isAutoStart;
    }
    public set isAutoStart(value: boolean) {
        this._isAutoStart = value;
    }

    public onDestroy() {
        this.stop();
    }

    onDisable() {
        this.stop();
    }

}