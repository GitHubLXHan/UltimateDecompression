/**
 * 指引纯展示层：光圈、手指、文案布局与强制遮罩。
 * Hub 调用 applyStep(step, forceGuide)；tipsNodeOffset 独立偏移 tips_node；
 * complete=tapContinue 时 tips_node 居中并显示 next_lb，由 Hub 绑定全屏点击继续。
 */
import { UdPanelHub } from "../../../core/manager/UdPanelHub";
import { UdFullView } from "../../../core/view/compoment/UdFullView";
import { UdBindMeta } from "../../../extension/basecore/UdDecoratorKit";
import { UdLabel } from "../../../extension/game/UdLabel";
import { UdSpine } from "../../../extension/game/UdSpine";
import { UdSprite } from "../../../extension/game/UdSprite";
import { UdTimerHub } from "../../../extension/time/UdTimerHub";
import { IUdHintOffset, IUdHintStep, UdHintTipPlacement } from "../types/UdHintTypes";

@UdBindMeta
export class UdHintingView extends UdFullView {

	private static readonly HALO_ANIM = "common_zhiyinquan";
	private static readonly TIP_GAP = 215;
	private static readonly FORCE_DIM_OPACITY = 180;
	private static readonly DEFAULT_NEXT_LABEL = "点击继续";

	private halo_eff: UdSpine = undefined;
	private finger_node: cc.Node = undefined;
	private tips_node: cc.Node = undefined;
	private tip_lb: UdLabel = undefined;
	private tip_bg: UdSprite = undefined;
	private shell_node: cc.Node = undefined;
	private bg_shell_node: cc.Node = undefined;
	/** 「点击继续」文案 */
	private next_lb: UdLabel = undefined;

	private _fingerTween: cc.Tween<cc.Node> = undefined;
	private _layoutTimer: number = 0;
	private _tapContinueCb: (() => void) | undefined;

	public constructor() {
		super();
		this.prefabPath = "udHinting/prefabs/udHintingVIew";
	}

	public init(root: cc.Node) {
		this.isBlockInputEvents = false;
		super.init(root);

		const R = this.UdResFinder;
		this.halo_eff = R.getComponent("halo_eff", UdSpine);
		this.finger_node = R.getNode("finger_node");
		this.tips_node = R.getNode("tips_node");
		this.tip_lb = R.getComponent("tip_lb", UdLabel);
		this.tip_bg = R.getComponent("tip_bg", UdSprite);
		this.shell_node = R.getNode("shell");
		this.bg_shell_node = R.getNode("bg_shell");
		this.next_lb = R.getComponent("next_lb", UdLabel);

		this._hideOptionalNodes(R);
		this.applyStep(null, false);
	}

	/** 隐藏预制体中未使用的调试节点 */
	private _hideOptionalNodes(R: { getNode(name: string): cc.Node | undefined }): void {
		const names = ["skip_btn", "node_touch_debug", "node_guangquan2"];
		for (let i = 0; i < names.length; i++) {
			const n = R.getNode(names[i]);
			if (n != null) {
				n.active = false;
			}
		}
	}

	public static isTapContinueStep(step: IUdHintStep | null): boolean {
		return step != null && step.complete === "tapContinue";
	}

	public addEvents() {
	}

	public removeEvents() {
	}

	public updateView(arg?: IUdHintStep | { step?: IUdHintStep | null; forceGuide?: boolean } | null) {
		if (arg == null) {
			this.applyStep(null, false);
			return;
		}
		if ((arg as IUdHintStep).complete != null) {
			this.applyStep(arg as IUdHintStep, false);
			return;
		}
		const payload = arg as { step?: IUdHintStep | null; forceGuide?: boolean };
		this.applyStep(payload.step ?? null, payload.forceGuide ?? false);
	}

	/** Hub：绑定点击屏幕继续（tapContinue 步骤） */
	public bindTapContinue(cb: () => void): void {
		this.unbindTapContinue();
		this._tapContinueCb = cb;
		if (this.root != null) {
			this.root.on(cc.Node.EventType.TOUCH_END, this._onTapContinueTouch, this);
		}
	}

	/** Hub：解除点击继续监听 */
	public unbindTapContinue(): void {
		if (this.root != null) {
			this.root.off(cc.Node.EventType.TOUCH_END, this._onTapContinueTouch, this);
		}
		this._tapContinueCb = undefined;
	}

	private _onTapContinueTouch(): void {
		if (this._tapContinueCb != null) {
			this._tapContinueCb();
		}
	}

	/** 展示或隐藏当前指引步骤（Hub 调用） */
	public applyStep(step: IUdHintStep | null, forceGuide: boolean = false): void {
		this._stopLayoutTimer();
		this._stopFingerTween();

		if (step == null) {
			this.unbindTapContinue();
			this.isBlockInputEvents = false;
			this._setForceDim(false);
			this._setGuideVisible(false);
			if (this.next_lb != null) {
				this.next_lb.node.active = false;
			}
			return;
		}

		const isTapContinue = UdHintingView.isTapContinueStep(step);
		this.isBlockInputEvents = isTapContinue;

		this._setForceDim(forceGuide);
		this._setGuideVisible(true);

		const showHalo = isTapContinue ? false : step.showHalo !== false;
		const showFinger = isTapContinue ? false : step.showFinger !== false;
		const showTip = step.showTip !== false && step.tip != null && step.tip.length > 0;

		if (this.halo_eff != null) {
			this.halo_eff.node.active = showHalo;
			if (showHalo) {
				this.halo_eff.play(UdHintingView.HALO_ANIM, true);
			}
		}
		if (this.finger_node != null) {
			this.finger_node.active = showFinger;
			if (showFinger) {
				this._playFingerPulse();
			}
		}
		if (this.tips_node != null) {
			this.tips_node.active = showTip;
		}
		if (this.tip_lb != null && showTip) {
			this.tip_lb.string = step.tip;
		}
		if (this.next_lb != null) {
			this.next_lb.node.active = isTapContinue;
			if (isTapContinue) {
				this.next_lb.string = step.nextLabel ?? UdHintingView.DEFAULT_NEXT_LABEL;
			}
		}

		if (isTapContinue) {
			this._layoutTapContinue(step);
			this._layoutTimer = UdTimerHub.Ins.callLater(0.05, () => this._layoutTapContinue(step));
		} else {
			this._layoutStep(step);
			this._layoutTimer = UdTimerHub.Ins.callLater(0.05, () => this._layoutStep(step));
		}
	}

	/** tapContinue：tips_node 居中显示 */
	private _layoutTapContinue(step: IUdHintStep): void {
		if (this.tips_node == null) return;
		this.tips_node.setPosition(0, 0);
		const nodeOff = step.tipsNodeOffset ?? { x: 0, y: 0 };
		this.tips_node.x += nodeOff.x;
		this.tips_node.y += nodeOff.y;
	}

	/** 强制指引半透明遮罩；tapContinue 时拦截全屏点击 */
	private _setForceDim(force: boolean): void {
		if (this.shell_node != null) {
			this.shell_node.active = force;
			if (force) {
				this.shell_node.opacity = UdHintingView.FORCE_DIM_OPACITY;
			}
		}
		if (this.bg_shell_node != null) {
			this.bg_shell_node.active = force;
			if (force) {
				this.bg_shell_node.opacity = UdHintingView.FORCE_DIM_OPACITY;
			}
		}
	}

	/** 根据目标节点或 fixedPos 布局光圈、手指与文案 */
	private _layoutStep(step: IUdHintStep): void {
		if (this.root == null) return;

		const anchor = this._resolveAnchorWorld(step);
		if (anchor == null) return;

		const fingerOff = step.fingerOffset ?? { x: 0, y: 0 };
		const haloOff = step.haloOffset ?? { x: 0, y: 0 };

		const fingerWorld = cc.v2(anchor.x + fingerOff.x, anchor.y + fingerOff.y);
		const haloWorld = cc.v2(anchor.x + haloOff.x, anchor.y + haloOff.y);

		if (this.finger_node != null && this.finger_node.active) {
			const local = this.root.convertToNodeSpaceAR(fingerWorld);
			this.finger_node.setPosition(local);
		}
		if (this.halo_eff != null && this.halo_eff.node.active) {
			const local = this.root.convertToNodeSpaceAR(haloWorld);
			this.halo_eff.node.setPosition(local);
		}
		if (this.tips_node != null && this.tips_node.active) {
			const tipOff = step.tipOffset ?? { x: 0, y: 0 };
			const placement = step.tipPlacement ?? "top";
			const tipWorld = this._tipWorldPos(fingerWorld, placement, tipOff);
			const local = this.root.convertToNodeSpaceAR(tipWorld);
			this.tips_node.setPosition(local);

			const nodeOff = step.tipsNodeOffset ?? { x: 0, y: 0 };
			this.tips_node.x += nodeOff.x;
			this.tips_node.y += nodeOff.y;
		}
	}

	private _resolveAnchorWorld(step: IUdHintStep): cc.Vec2 | null {
		if (step.target != null) {
			const view = UdPanelHub.Ins.getView(step.target.view);
			if (view == null || !view.isInit) return null;
			const node = view.getElm(step.target.node);
			if (node == null || !node.activeInHierarchy) return null;
			const box = node.getBoundingBoxToWorld();
			return cc.v2(box.x + box.width * 0.5, box.y + box.height * 0.5);
		}
		if (step.fixedPos != null) {
			return cc.v2(step.fixedPos.x, step.fixedPos.y);
		}
		return null;
	}

	private _tipWorldPos(
		fingerWorld: cc.Vec2,
		placement: UdHintTipPlacement,
		offset: IUdHintOffset
	): cc.Vec2 {
		const gap = UdHintingView.TIP_GAP;
		let x = fingerWorld.x + offset.x;
		let y = fingerWorld.y + offset.y;
		switch (placement) {
			case "bottom":
				y -= gap;
				break;
			case "left":
				x -= gap;
				break;
			case "right":
				x += gap;
				break;
			case "top":
			default:
				y += gap;
				break;
		}
		return cc.v2(x, y);
	}

	private _setGuideVisible(visible: boolean): void {
		if (this.halo_eff != null) this.halo_eff.node.active = visible;
		if (this.finger_node != null) this.finger_node.active = visible;
		if (this.tips_node != null) this.tips_node.active = visible;
	}

	private _playFingerPulse(): void {
		if (this.finger_node == null) return;
		this._stopFingerTween();
		this.finger_node.scale = 1;
		this._fingerTween = cc.tween(this.finger_node)
			.to(0.5, { scale: 1.08 })
			.to(0.5, { scale: 1 })
			.repeatForever()
			.start();
	}

	private _stopFingerTween(): void {
		if (this._fingerTween != null) {
			this._fingerTween.stop();
			this._fingerTween = undefined;
		}
	}

	private _stopLayoutTimer(): void {
		if (this._layoutTimer > 0) {
			UdTimerHub.Ins.remove(this._layoutTimer);
			this._layoutTimer = 0;
		}
	}

	public onClose() {
		this.unbindTapContinue();
		this._stopLayoutTimer();
		this._stopFingerTween();
		super.onClose();
	}
}
