import { UdBindMeta } from "../../../extension/basecore/UdDecoratorKit";
import { UdLogHub } from "../../../extension/log/UdLogHub";
import { UdComboPraiseView } from "./UdComboPraiseView";

/** 连击夸赞文字弹出（无背景，不依赖 prefab 加载） */
@UdBindMeta
export class UdComboPraiseHub {
    private static _ins: UdComboPraiseHub;

    public static get Ins(): UdComboPraiseHub {
        if (!this._ins) {
            this._ins = new UdComboPraiseHub();
        }
        return this._ins;
    }

    private _parent: cc.Node = null;
    private _view: UdComboPraiseView = null;

    public init(parent: cc.Node): void {
        this._parent = parent;
    }

    public show(count: number): void {
        if (count < 2) {
            return;
        }
        if (!this._parent || !cc.isValid(this._parent)) {
            UdLogHub.logWarning("[UdComboPraiseHub] show 失败：请先 init(parent)");
            return;
        }
        this._ensureView();
        if (this._view) {
            this._view.play(count);
        }
    }

    public hide(): void {
        if (this._view) {
            this._view.hideImmediate();
        }
    }

    public dispose(): void {
        if (this._view && this._view.node && cc.isValid(this._view.node)) {
            this._view.node.destroy();
        }
        this._view = null;
        this._parent = null;
    }

    private _ensureView(): void {
        if (this._view && cc.isValid(this._view.node)) {
            return;
        }
        const node = new cc.Node("UdComboPraise");
        node.zIndex = 999;
        this._parent.addChild(node);
        this._view = node.addComponent(UdComboPraiseView);
    }
}
