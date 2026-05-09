/*
 * @Author: yg
 * @Date: 2022/11/24
 * @Description: 合成西瓜小游戏结算界面
 */

import { UIMgr } from "../../../core/manager/UIMgr";
import { BaseView } from "../../../core/view/compoment/BaseView";
import { AudioConfig } from "../../../extension/audio/AudioConfig";
import { AudioMgr } from "../../../extension/audio/AudioMgr";
import { List } from "../../../extension/basecore/List";
import { RefClass } from "../../../extension/basecore/RefDecorator";
import { BtnEventType } from "../../../extension/components/GameBtn/BtnEventType";
import { GameButton } from "../../../extension/game/GameButton";
import { GameSpine } from "../../../extension/game/GameSpine";
import { TimeMgr } from "../../../extension/time/TimeMgr";
import { WatermelonMinGameView } from "./WatermelonMinGameView";

export interface IWatermelonMinGameEndViewData {
    num?: number;
    enterMainGame: boolean;
    tipsLabel?: string;
}

@RefClass
export class WatermelonMinGameEndView extends BaseView {
    private black_bg_node: cc.Node;
    private content: cc.Node;


    // 输出总伤害
    private all_damage_gp: cc.Node;
    private all_damage_lb: cc.Label;

    private _mask: cc.Node;
    private twList: List<cc.Tween> = new List<cc.Tween>();
    private _node_bg_root: cc.Node;
    private win_eff: GameSpine;
    private win_add_eff: GameSpine;


    private _starTween: List<cc.Tween> = new List<cc.Tween>();

    private _timeId: number = -1;

    private _param: IWatermelonMinGameEndViewData;

    public constructor() {
        super();
        this.skinName = "watermelonMinGame/prefabs/watermelonMinGameEndView";
        this.ignoreWidgetTopAdjust = true;
        this.ignoreWidgetBottomAdjust = true;
    }

    public init(root: cc.Node): void {
        super.init(root);
        this.black_bg_node = this.ResBase.getNode("black_bg_node");
        this.content = this.ResBase.getNode("content");
        // 输出总伤害
        this.all_damage_gp = this.ResBase.getNode("all_damage_gp");
        this.all_damage_lb = this.ResBase.getComponent("all_damage_lb", cc.Label);
        this._mask = this.ResBase.getNode("mask");
        this._node_bg_root = this.ResBase.getNode("node_bg_root");
        this.win_eff = this.ResBase.getComponent("win_eff", GameSpine);
        this.win_add_eff = this.ResBase.getComponent("win_add_eff", GameSpine);
    }

    protected addEvents(): void {
        super.addEvents();
        this.black_bg_node.getComponent(GameButton).addListener(BtnEventType.OnTouchEnd, this.close, this);
    }

    protected removeEvents(): void {
        super.removeEvents();
        this.black_bg_node.getComponent(GameButton).removeListener(BtnEventType.OnTouchEnd, this.close, this);
    }

    public updateView(arg1?: IWatermelonMinGameEndViewData): void {
        super.updateView(arg1);
        this._param = arg1;

        this.win_eff.node.active = true;
        this.win_add_eff.node.active = true;

        //战斗胜利
        AudioMgr.Ins.playSound(AudioConfig.Battle_Win);

        //############################################

        //-------------------奖励-------------------//
        this.all_damage_gp.active = true;
        if (arg1.tipsLabel) {
            this.all_damage_lb.string = arg1.tipsLabel;
        } else {
            this.all_damage_lb.string = `恭喜达到${arg1.num}分`;
        }

        // 延迟更新位置
        this._timeId = TimeMgr.Ins.callFew(() => {
            this.content.getComponent(cc.Layout).updateLayout();
            this._timeId = TimeMgr.Ins.callFew(() => {
                this._timeId = -1;

                // 以 this.content.height * 1/2 为居中点
                /**
                 * 当 content 显示时，以 this.content.height * 1/2 为居中点
                 * 当 content 隐藏且 gp_strong 显示时，this.gp_strong.height * 1/2 为居中点
                 * 当 content 和 gp_strong 同时隐藏时，以 某个固定值 为居中点
                 */
                let centerY = 0;

                let isContentShow = false;
                let isStrongShow = false;

                for (let i = 0, len = this.content.children.length; i < len; i++) {
                    let chi = this.content.children[i];
                    if (chi.active) {
                        isContentShow = true;
                        break;
                    }
                }

                this.content.active = false;

                if (isContentShow) {
                    this.content.active = true;
                    centerY = this.content.height / 2;
                    this._mask.y = centerY;
                    this._node_bg_root.y = centerY + 160;

                } else {
                    // 固定值
                    centerY = -120;
                    this._mask.y = centerY;
                    this._node_bg_root.y = 120;

                }

                this.playMask();
            });
        });
    }

    /**
     * 播放内容展示动画
     */
    public playMask() {
        let playWinEff = () => {
            this.win_eff.setCompleteListener(() => {
                this.win_eff.setCompleteListener(null);

                if (this.win_add_eff.isLoaded) {
                    this.win_add_eff.play(this.win_add_eff.animation, true, true);
                } else {
                    this.win_add_eff.setLoadCompletedHandle(() => {
                        this.win_add_eff.setLoadCompletedHandle(null);
                        this.win_add_eff.play(this.win_add_eff.animation, true, true);
                    });
                }

            });
            this.win_eff.play(this.win_eff.animation, false, true);
        }

        if (this.win_eff.isLoaded) {
            playWinEff();
        } else {
            this.win_eff.setLoadCompletedHandle(() => {
                this.win_eff.setLoadCompletedHandle(null);
                playWinEff();
            });
        }

        while (this.twList.length > 0) {
            this.twList.shift().stop();
        }

        let maskTw = cc
            .tween(this._mask)
            .set({ scaleY: 0 })
            .delay(0.2)
            .to(0.3, { scaleY: 1 })
            .call(() => {
                this.twList.remove(maskTw);
            })
            .start();
        this.twList.add(maskTw);
    }

    private _clearStarTw() {
        while (this._starTween?.length) {
            this._starTween.shift().stop();
        }
    }

    public onClose() {
        this._clearStarTw();

        if (this._timeId > 0) {
            TimeMgr.Ins.remove(this._timeId);
        }

        while (this.twList.length > 0) {
            this.twList.shift().stop();
        }

        if (this._param?.enterMainGame) {
            UIMgr.Ins.close(WatermelonMinGameView);
        }

        super.onClose();
    }
}