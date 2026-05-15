import { BaseView } from "../../../core/view/compoment/BaseView";
import { AudioConfig } from "../../../extension/audio/AudioConfig";
import { AudioMgr } from "../../../extension/audio/AudioMgr";
import { List } from "../../../extension/basecore/List";
import { RefClass } from "../../../extension/basecore/RefDecorator";
import { BtnEventType } from "../../../extension/components/GameBtn/BtnEventType";
import { GameButton } from "../../../extension/game/GameButton";
import { TimeMgr } from "../../../extension/time/TimeMgr";

export interface IMainGameResultViewData {
    num?: number;
    enterMainGame: boolean;
}

@RefClass
export class MainGameResultView extends BaseView {
    private bg_node: cc.Node;
    private content: cc.Node;


    // 输出总伤害
    private content_lb: cc.Label;

    private mask_node: cc.Node;
    private twList: List<cc.Tween> = new List<cc.Tween>();

    private _timeId: number = -1;

    private _param: IMainGameResultViewData;

    public constructor() {
        super();
        this.prefabPath = "mainGame/prefabs/MainGameResultView";
        this.ignoreWidgetTopAdjust = true;
        this.ignoreWidgetBottomAdjust = true;
    }

    public init(root: cc.Node): void {
        super.init(root);
        this.bg_node = this.ResBase.getNode("bg_node");
        this.content = this.ResBase.getNode("content");
        // 输出总伤害
        this.content_lb = this.ResBase.getComponent("content_lb", cc.Label);
        this.mask_node = this.ResBase.getNode("mask_node");
        // this._node_bg_root = this.ResBase.getNode("node_bg_root");
        // this.win_eff = this.ResBase.getComponent("win_eff", GameSpine);
        // this.win_add_eff = this.ResBase.getComponent("win_add_eff", GameSpine);
    }

    protected addEvents(): void {
        super.addEvents();
        this.bg_node.getComponent(GameButton).addListener(BtnEventType.OnTouchEnd, this.close, this);
    }

    protected removeEvents(): void {
        super.removeEvents();
        this.bg_node.getComponent(GameButton).removeListener(BtnEventType.OnTouchEnd, this.close, this);
    }

    public updateView(arg1?: IMainGameResultViewData): void {
        super.updateView(arg1);
        this._param = arg1;


        //战斗胜利
        AudioMgr.Ins.playSound(AudioConfig.Battle_Win);

        //############################################

        //-------------------奖励-------------------//
        this.content_lb.string = `恭喜达到${arg1.num}分`;

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
                    this.mask_node.y = centerY;
                    // this._node_bg_root.y = centerY + 160;

                } else {
                    // 固定值
                    centerY = -120;
                    this.mask_node.y = centerY;
                    // this._node_bg_root.y = 120;

                }

                this.playMask();
            });
        });
    }

    /**
     * 播放内容展示动画
     */
    public playMask() {
        while (this.twList.length > 0) {
            this.twList.shift().stop();
        }

        let maskTw = cc
            .tween(this.mask_node)
            .set({ scaleY: 0 })
            .delay(0.2)
            .to(0.3, { scaleY: 1 })
            .call(() => {
                this.twList.remove(maskTw);
            })
            .start();
        this.twList.add(maskTw);
    }


    public onClose() {

        if (this._timeId > 0) {
            TimeMgr.Ins.remove(this._timeId);
        }

        while (this.twList.length > 0) {
            this.twList.shift().stop();
        }

        super.onClose();
    }
}