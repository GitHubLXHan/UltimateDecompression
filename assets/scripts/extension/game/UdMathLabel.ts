import { UdEaseKit } from "../view/utils/UdEaseKit";
import { UdEaseKind } from "../view/types/UdEaseKind";
import { UdLabel } from "./UdLabel";

const { ccclass, executeInEditMode, property, menu } = cc._decorator;

@ccclass
@executeInEditMode
@menu("通用/UdMathLabel(数字动画)")
export class UdMathLabel extends UdLabel {

    private _value: number = 0;
    private _tempValue: number = 0;
    private _valueTween: cc.Tween;
    private _isInit: boolean = false;
    private _isInteger: boolean = true;

    @property
    private _prefix: string = "";
    @property({ type: cc.String, tooltip: "前缀" })
    public get prefix(): string {
        return this._prefix;
    }
    public set prefix(value: string) {
        if (this._prefix === value) return;
        this._prefix = value;
        this.updateLabel();
    }

    @property
    private _suffix: string = "";
    @property({ type: cc.String, tooltip: "后缀" })
    public get suffix(): string {
        return this._suffix;
    }
    public set suffix(value: string) {
        if (this._suffix === value) return;
        this._suffix = value;
        this.updateLabel();
    }

    @property
    private _delay: number = 0;
    @property({ type: cc.Float, tooltip: "动画延迟" })
    public get delay(): number {
        return this._delay;
    }
    public set delay(value: number) {
        this._delay = value;
    }

    @property
    private _duration: number = 0.2;
    @property({ type: cc.Float, tooltip: "动画时间" })
    public get duration(): number {
        return this._duration;
    }
    public set duration(value: number) {
        this._duration = value;
    }

    @property
    private _decimalLen: number = 2;
    @property({ type: cc.Float, tooltip: "浮点数精度(保留小数)" })
    public get decimalLen(): number {
        return this._decimalLen;
    }
    public set decimalLen(value: number) {
        this._decimalLen = value;
    }

    // ---- public API ----

    public get value(): number {
        return this._value;
    }
    public set value(value: number) {
        if (!this._isInit) {
            this._isInit = true;
            this._value = value;
            this._tempValue = this._value;
            this._isInteger = this.mathfIsInteger(this._value) && this.mathfIsInteger(value);
            this.updateLabel();
            return;
        }

        if (this._value !== value) {
            this._isInteger = this.mathfIsInteger(this._value) && this.mathfIsInteger(value);
            this._value = value;
            this.startValueTween();
        }
    }

    // ---- internal ----

    private get tempValue(): number {
        return this._tempValue;
    }
    private set tempValue(value: number) {
        this._tempValue = value;
        this.updateLabel();
    }

    private updateLabel(): void {
        let display: number;
        if (this.decimalLen <= 0) {
            display = Math.floor(this._tempValue);
        } else {
            display = this._isInteger
                ? this.mathfRound(this._tempValue, 0)
                : this.mathfRound(this._tempValue, this.decimalLen);
        }

        const str = this._prefix + display + this._suffix;
        if (this.string !== str) {
            this.string = str;
        }
    }

    private startValueTween(): void {
        this.stopValueTween();

        this._valueTween = cc.tween<UdMathLabel>(this);
        if (this.delay > 0) {
            this._valueTween.delay(this.delay);
        }
        this._valueTween.to(
            this.duration,
            { tempValue: this._value },
            UdEaseKit.GetEaseData(UdEaseKind.OutCirc),
        );
        this._valueTween.start();
    }

    private stopValueTween(): void {
        if (this._valueTween != null) {
            this._valueTween.stop();
            this._valueTween = null;
        }
    }

    public onEnable(): void {
        super.onEnable();
    }

    public onDisable(): void {
        this.stopValueTween();
        this._tempValue = this._value;
        this.updateLabel();
        super.onDisable();
    }


    /** Inlined math helpers — avoids pulling in an external Mathf dependency. */
    private mathfRound(value: number, precision: number): number {
        const mult = Math.pow(10, precision);
        return Math.round(value * mult) / mult;
    }

    private mathfIsInteger(value: number): boolean {
        return Number.isFinite(value) && value % 1 === 0;
    }
}
