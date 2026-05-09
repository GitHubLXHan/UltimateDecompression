/*
 * @Author: yf
 * @Date: 2021-07-23 13:56:33
 * @LastEditTime: 2022-11-08 14:22:46
 * @LastEditors: yf
 * @Description: In User Settings Edit
 * @FilePath: /client_v2_4/assets/scripts/module/common/component/GameSpine.ts
 */

import { AudioMgr } from "../audio/AudioMgr";
import { BtnEventType } from "../components/GameBtn/BtnEventType";
import { GrayEffect } from "../components/GrayEffect";
import { ComponentListener } from "../eventListener/ComponentListener";

const { ccclass, property, menu } = cc._decorator

@ccclass
@menu("UI/GameButton(缩放按钮)")
export class GameButton extends ComponentListener<BtnEventType, GameButton> {
    @property({ type: cc.Float, tooltip: "缩放值" })
    Scale: number = 0.95;

    @property({ tooltip: "点击音效" })
    ClickSound: string = "";

    @property({ tooltip: "按下音效" })
    PressSound: string = "UI_Click1";

    @property(GrayEffect)
    grayEffect: GrayEffect = undefined;

    @property({ tooltip: "震动效果" })
    shakeEnable: boolean = true

    private _originalScaleX: number;
    private _originalScaleY: number;
    private _tween: cc.Tween<cc.Node>;
    private _rect: cc.Rect;
    private isTheBeginTouchItem = false
    private _blockClickEvent: boolean = false;

    protected _nodeEnable: boolean = false;

    onLoad() {
        this.Scale = Math.max(0.1, this.Scale);

        this._originalScaleX = this.node.scaleX;
        this._originalScaleY = this.node.scaleY;
        let width = this.node.width * Math.abs(this._originalScaleX);
        let height = this.node.height * Math.abs(this._originalScaleY);
        this._rect = new cc.Rect(-width * this.node.anchorX, -height * this.node.anchorY, width, height);
    }

    onEnable() {
        this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchHandler, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.touchEndHandler, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.cancelHandler, this);
        this._nodeEnable = true;
    }

    onDisable() {
        this.node.off(cc.Node.EventType.TOUCH_START, this.onTouchHandler, this);
        this.node.off(cc.Node.EventType.TOUCH_END, this.touchEndHandler, this);
        this.node.off(cc.Node.EventType.TOUCH_CANCEL, this.cancelHandler, this);
        this.node.scaleX = this._originalScaleX;
        this.node.scaleY = this._originalScaleY;
        this.clearTween();
        this._nodeEnable = false;
    }

    private cancelHandler(event: cc.Event.EventTouch) {
        //由scrollerView触发的模拟cancel事件会设置simulate=true
        if (!(<any>event).simulate) {
            if (this._checkTouchIn(event) && this.isTheBeginTouchItem) {
                //在点击范围内
                this.dispatchEvent(BtnEventType.OnTouchTap, event);
            } else {
                //取消
                this.dispatchEvent(BtnEventType.OnTouchReleaseOutSide, event);
            }
        }
        if (this.isTheBeginTouchItem) {
            this.isTheBeginTouchItem = false
            this.playTween(this._originalScaleX, this._originalScaleY);
        }
    }

    private onTouchHandler(event: cc.Event.EventTouch) {
        let now = new Date().getTime();
        this.playTween(this.Scale * this._originalScaleX, this.Scale * this._originalScaleY);
        this.dispatchEvent(BtnEventType.OnTouchStart, event);
        this.isTheBeginTouchItem = true
        if (this.PressSound != null && this.PressSound.length > 0)
            AudioMgr.Ins.playSound(this.PressSound);
    }

    private touchEndHandler(event: cc.Event.EventTouch) {
        this.playTween(this._originalScaleX, this._originalScaleY);
        this.dispatchEvent(BtnEventType.OnTouchEnd, event);
        if (this.isTheBeginTouchItem) {
            if (this._checkTouchIn(event)) {
                //在点击范围内
                this.dispatchEvent(BtnEventType.OnTouchTap, event);
            }
            this.isTheBeginTouchItem = false
        }
        if (this.ClickSound != null && this.ClickSound.length > 0 && this.isTheBeginTouchItem)
            AudioMgr.Ins.playSound(this.ClickSound);

        if (this.shakeEnable) {
            AudioMgr.Ins.vibrateShort()
        }
    }

    private _checkTouchIn(event: cc.Event.EventTouch): boolean {
        //换算缩放后的点击位置
        let clickWorldPos = event.getLocation();
        let localPos = this.node.convertToNodeSpaceAR(clickWorldPos);
        localPos.x *= Math.abs(this.Scale * this._originalScaleX);
        localPos.y *= Math.abs(this.Scale * this._originalScaleY);
        return this._rect.contains(localPos);
    }

    private playTween(toScaleX: number, toScaleY: number) {
        this.clearTween();
        this._tween = cc.tween(this.node);
        this._tween.to(0.05, { scaleX: toScaleX, scaleY: toScaleY });
        this._tween.call(this.tweenDoneHandler.bind(this));
        this._tween.start();
    }

    private tweenDoneHandler() {
        this._tween = null;
    }

    private clearTween() {
        if (this._tween != null) {
            this._tween.stop();
            this._tween = null;
        }
    }

    public dispatchEvent(type: BtnEventType, ...args: any[]) {
        if (this._blockClickEvent) return
        super.dispatchEvent(type, ...args)
    }

    set isGrey(isGrey: boolean) {
        if (this.grayEffect) {
            this.grayEffect.enabled = isGrey;
        } else if (isGrey) {
            this.grayEffect = this.getComponent(GrayEffect)
            if (!this.grayEffect) this.grayEffect = this.addComponent(GrayEffect)
            this.grayEffect.enabled = true
        }
    }

    set blockClickEvent(block: boolean) {
        this._blockClickEvent = block;
    }

    get blockClickEvent() {
        return this._blockClickEvent;
    }
}
