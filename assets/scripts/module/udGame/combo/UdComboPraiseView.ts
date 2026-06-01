import { UdSpine } from "../../../extension/game/UdSpine";
import { UdTimerHub } from "../../../extension/time/UdTimerHub";

const { ccclass } = cc._decorator;

const HOLD_MS = 650;
const FADE_MS = 220;
const FONT_SIZE = 56;
const OUTLINE_WIDTH = 4;
const SPINE_SOURCE = "udGame/ui/spine/ui_mibao_changtai_01/ui_mibao_changtai_01.json";
const SPINE_ANIM = "ui_mibao_changtai_01";

function comboColor(count: number): cc.Color {
    if (count >= 5) {
        return cc.color(255, 193, 7);
    }
    if (count >= 4) {
        return cc.color(186, 104, 200);
    }
    if (count >= 3) {
        return cc.color(100, 181, 246);
    }
    return cc.color(255, 193, 7);
}


@ccclass
export class UdComboPraiseView extends cc.Component {
    private _built = false;
    private _playing = false;
    private _outroTimer = -1;

    private _textRoot: cc.Node = null;
    private _fx: UdSpine = null;
    private _label: cc.Label = null;
    private _outline: cc.LabelOutline = null;

    onLoad() {
        this._buildTree();
        this.node.active = false;
    }

    onDestroy() {
        this._clearTimers();
    }

    public play(count: number): void {
        if (!this._built) {
            this._buildTree();
        }
        const refresh = this._playing && this.node.active;
        this._clearTimers();
        cc.Tween.stopAllByTarget(this.node);
        if (this._textRoot) {
            cc.Tween.stopAllByTarget(this._textRoot);
        }

        const n = Math.max(2, Math.floor(count));
        this._label.string = n + "连合成";
        this._label.node.color = comboColor(n);
        if (this._outline) {
            this._outline.color = cc.color(255, 255, 255);
        }
        this._playFx();

        this.node.active = true;
        this.node.opacity = 255;
        this._textRoot.opacity = 255;

        if (refresh) {
            this._playRefreshPop();
        } else {
            this._playIntro();
        }
        this._scheduleOutro();
        this._playing = true;
    }

    public hideImmediate(): void {
        this._clearTimers();
        cc.Tween.stopAllByTarget(this.node);
        if (this._textRoot) {
            cc.Tween.stopAllByTarget(this._textRoot);
        }
        if (this._fx) {
            this._fx.clearTracks();
            this._fx.node.active = false;
        }
        this._playing = false;
        this.node.active = false;
        this.node.opacity = 255;
        if (this._textRoot) {
            this._textRoot.opacity = 255;
            this._textRoot.scale = 1;
        }
    }

    private _buildTree(): void {
        if (this._built) {
            return;
        }
        this._built = true;
        this.node.setContentSize(640, 140);
        this.node.setPosition(0, 200);
        this.node.setAnchorPoint(0.5, 0.5);

        this._textRoot = new cc.Node("text_root");
        this.node.addChild(this._textRoot);
        this._textRoot.setAnchorPoint(0.5, 0.5);

        const fxNode = new cc.Node("combo_fx");
        this._textRoot.addChild(fxNode);
        fxNode.setAnchorPoint(0.5, 0.5);
        fxNode.y = -150
        this._fx = fxNode.addComponent(UdSpine);
        this._fx.source = SPINE_SOURCE;

        const labelNode = new cc.Node("combo_label");
        this._textRoot.addChild(labelNode);
        labelNode.setAnchorPoint(0.5, 0.5);
        this._label = labelNode.addComponent(cc.Label);
        this._label.useSystemFont = true;
        this._label.fontFamily = "Arial";
        this._label.fontSize = FONT_SIZE;
        this._label.lineHeight = FONT_SIZE + 10;
        this._label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        this._label.verticalAlign = cc.Label.VerticalAlign.CENTER;
        this._label.enableBold = true;

        this._outline = labelNode.addComponent(cc.LabelOutline);
        this._outline.width = OUTLINE_WIDTH;
        this._outline.color = cc.color(255, 255, 255);
    }

    private _playFx(): void {
        if (!this._fx) {
            return;
        }
        this._fx.node.active = true;
        this._fx.play(SPINE_ANIM, false, true);
    }

    private _playIntro(): void {
        if (!this._textRoot) {
            return;
        }
        this._textRoot.scale = 0.25;
        cc.tween(this._textRoot)
            .to(0.24, { scale: 1.14 }, { easing: "backOut" })
            .to(0.1, { scale: 1 })
            .start();
    }

    private _playRefreshPop(): void {
        if (!this._textRoot) {
            return;
        }
        cc.tween(this._textRoot)
            .to(0.09, { scale: 1.1 }, { easing: "backOut" })
            .to(0.1, { scale: 1 })
            .start();
    }

    private _scheduleOutro(): void {
        if (this._outroTimer >= 0) {
            UdTimerHub.Ins.remove(this._outroTimer);
        }
        this._outroTimer = UdTimerHub.Ins.callLater((HOLD_MS + FADE_MS) / 1000, () => {
            this._outroTimer = -1;
            if (!this.node.active || !this._textRoot) {
                return;
            }
            cc.tween(this._textRoot)
                .to(FADE_MS / 1000, { opacity: 0, scale: 0.88 }, { easing: "quadIn" })
                .call(() => {
                    this._playing = false;
                    this.node.active = false;
                    this._textRoot.opacity = 255;
                    this._textRoot.scale = 1;
                })
                .start();
        });
    }

    private _clearTimers(): void {
        if (this._outroTimer >= 0) {
            UdTimerHub.Ins.remove(this._outroTimer);
            this._outroTimer = -1;
        }
    }
}
