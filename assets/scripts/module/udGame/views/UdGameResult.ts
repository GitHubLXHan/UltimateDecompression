import { UdAudioDef } from "../../../extension/audio/UdAudioDef";
import { UdAudioHub } from "../../../extension/audio/UdAudioHub";
import { UdSeqList } from "../../../extension/basecore/UdSeqList";
import { UdBindMeta } from "../../../extension/basecore/UdDecoratorKit";
import { UdBtnSignal } from "../../../extension/components/GameBtn/UdBtnSignal";
import { UdButton } from "../../../extension/game/UdButton";
import { UdTimerHub } from "../../../extension/time/UdTimerHub";
import { UdMathLabel } from "../../../extension/game/UdMathLabel";
import { UdPopPanel } from "../../../core/view/compoment/UdPopPanel";

export interface IUdGameScore {
    num?: number;
    enterMainGame: boolean;
    result: number; // 1表示通关
    /** 是否还有下一关可继续 */
    hasNextStage?: boolean;
    /** 点击"下一关"回调 */
    onNextStage?: () => void;
}

@UdBindMeta
export class UdGameResult extends UdPopPanel {
    private __contentRoot: cc.Node;
    private __scoreLabel: UdMathLabel;
    private __maskNode: cc.Node;
    private next_stage_btn: UdButton;

    private __tweenPool: UdSeqList<cc.Tween<cc.Node>> = new UdSeqList<cc.Tween<cc.Node>>();
    private __deferredId: number = -1;
    private __resultData: IUdGameScore;

    // ---- lifecycle ----


    public constructor() {
        super();
        this.prefabPath = "udGame/prefabs/UdGameResult";
        this.ignoreWidgetTopAdjust = true;
        this.ignoreWidgetBottomAdjust = true;
    }

    public init(root: cc.Node): void {
        super.init(root);
        this.__contentRoot = this.UdResFinder.getNode("content");
        this.__scoreLabel = this.UdResFinder.getComponent("content_lb", UdMathLabel);
        this.__maskNode = this.UdResFinder.getNode("mask_node");
        this.next_stage_btn = this.UdResFinder.getComponent("next_stage_btn", UdButton);

        this.isClickMaskerToClose = false;
    }

    protected addEvents(): void {
        super.addEvents();
        this.next_stage_btn.addListener(UdBtnSignal.FingerTap, this.__onNextStageTap, this);
    }

    protected removeEvents(): void {
        super.removeEvents();
        this.next_stage_btn.removeListener(UdBtnSignal.FingerTap, this.__onNextStageTap, this);
    }

    // ---- data binding ----

    public updateView(data?: IUdGameScore): void {
        super.updateView(data);
        this.__resultData = data;

        // Victory sfx
        UdAudioHub.Ins.playSound(UdAudioDef.CombatWinSfx);

        this.__scoreLabel.prefix = `${data.result ? "通关成功\n" : "通关失败\n"}本局达到`;
        this.__scoreLabel.suffix = "分";
        this.__scoreLabel.value = 0;

        // "下一关"按钮：通关且有下一关时显示
        this.next_stage_btn.node.active = data.result === 1 && data.hasNextStage === true;

        // Score display
        UdTimerHub.Ins.callLater(0.6, () => {
            this.__scoreLabel.value = data.num;
        });

        // Deferred layout update
        this.__deferredId = UdTimerHub.Ins.callFew(() => {
            this.__contentRoot.getComponent(cc.Layout).updateLayout();
            this.__deferredId = UdTimerHub.Ins.callFew(() => {
                this.__deferredId = -1;
                this.__repositionContent();
            });
        });

        UdTimerHub.Ins.callLater(2, () => {
            this.isClickMaskerToClose = true;
        });
    }

    // ---- layout logic ----

    private __repositionContent(): void {
        let pivotY = 0;
        let hasVisible = false;

        const children = this.__contentRoot.children;
        for (let i = 0; i < children.length; i++) {
            if (children[i].active) {
                hasVisible = true;
                break;
            }
        }

        this.__contentRoot.active = false;

        if (hasVisible) {
            this.__contentRoot.active = true;
            pivotY = this.__contentRoot.height * 0.5;
            this.__maskNode.y = pivotY;
        } else {
            pivotY = -120;
            this.__maskNode.y = pivotY;
        }

        this.__animateReveal();
    }

    // ---- reveal animation ----

    private __animateReveal(): void {
        // Cancel any running tweens
        while (this.__tweenPool.length > 0) {
            this.__tweenPool.shift().stop();
        }

        const tw = cc.tween(this.__maskNode)
            .set({ scaleY: 0 })
            .delay(0.2)
            .to(0.3, { scaleY: 1 })
            .call(() => { this.__tweenPool.remove(tw); })
            .start();

        this.__tweenPool.add(tw);
    }

    // ---- next stage ----

    private __onNextStageTap(): void {
        if (this.__resultData && this.__resultData.onNextStage) {
            this.__resultData.onNextStage();
        }
    }

    // ---- teardown ----

    public onClose(): void {
        if (this.__deferredId > 0) {
            UdTimerHub.Ins.remove(this.__deferredId);
        }
        while (this.__tweenPool.length > 0) {
            this.__tweenPool.shift().stop();
        }
        super.onClose();
    }
}
