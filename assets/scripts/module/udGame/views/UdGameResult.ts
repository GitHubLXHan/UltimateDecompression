import { UdFullView } from "../../../core/view/compoment/UdFullView";
import { UdAudioDef } from "../../../extension/audio/UdAudioDef";
import { UdAudioHub } from "../../../extension/audio/UdAudioHub";
import { UdSeqList } from "../../../extension/basecore/UdSeqList";
import { UdBindMeta } from "../../../extension/basecore/UdDecoratorKit";
import { UdBtnSignal } from "../../../extension/components/GameBtn/UdBtnSignal";
import { UdButton } from "../../../extension/game/UdButton";
import { UdTimerHub } from "../../../extension/time/UdTimerHub";

export interface IUdGameScore {
    num?: number;
    enterMainGame: boolean;
}

@UdBindMeta
export class UdGameResult extends UdFullView {
    private __bgRoot: cc.Node;
    private __contentRoot: cc.Node;
    private __scoreLabel: cc.Label;
    private __maskNode: cc.Node;

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
        this.__bgRoot = this.UdResFinder.getNode("bg_node");
        this.__contentRoot = this.UdResFinder.getNode("content");
        this.__scoreLabel = this.UdResFinder.getComponent("content_lb", cc.Label);
        this.__maskNode = this.UdResFinder.getNode("mask_node");
    }

    protected addEvents(): void {
        super.addEvents();
        this.__bgRoot.getComponent(UdButton).addListener(UdBtnSignal.FingerUp, this.close, this);
    }

    protected removeEvents(): void {
        super.removeEvents();
        this.__bgRoot.getComponent(UdButton).removeListener(UdBtnSignal.FingerUp, this.close, this);
    }

    // ---- data binding ----

    public updateView(data?: IUdGameScore): void {
        super.updateView(data);
        this.__resultData = data;

        // Victory sfx
        UdAudioHub.Ins.playSound(UdAudioDef.CombatWinSfx);

        // Score display
        this.__scoreLabel.string = `恭喜达到${data.num}分`;

        // Deferred layout update
        this.__deferredId = UdTimerHub.Ins.callFew(() => {
            this.__contentRoot.getComponent(cc.Layout).updateLayout();
            this.__deferredId = UdTimerHub.Ins.callFew(() => {
                this.__deferredId = -1;
                this.__repositionContent();
            });
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
