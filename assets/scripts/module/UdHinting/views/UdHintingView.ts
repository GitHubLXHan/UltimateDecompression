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
import { IUdHintHighlightRect, IUdHintOffset, IUdHintStep, IUdHintTarget, UdHintTipPlacement } from "../types/UdHintTypes";

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
	/**西瓜人 */
	private watermelon_human: cc.Node = undefined;
	/** 「点击继续」文案 */
	private next_lb: UdLabel = undefined;
	/** 高亮光圈克隆节点列表 */
	private _highlightClones: cc.Node[] = [];
	/** 遮罩镂空 Graphics 组件（复用 bg_shell 或 shell） */
	private _maskGfx: cc.Graphics | null = null;
	/** 专用于遮罩的独立节点（挂在 root 下，不受 shell 影响） */
	private _maskNode: cc.Node | null = null;

	private _fingerTween: cc.Tween<cc.Node> = undefined;
	private _layoutTimer: number = 0;
	private _tapContinueCb: (() => void) | undefined;

	/** 打字机效果相关 */
	private _typewriterTimer: number = 0;
	private _typewriterText: string = "";
	private _typewriterIndex: number = 0;
	private _isTypewriting: boolean = false;

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
		this.watermelon_human = R.getNode("watermelon_human");

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
		if (this._isTypewriting) {
			this._finishTypewriter();
			return;
		}
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
			this._clearHighlight();
			this._stopTypewriter();
			if (this.next_lb != null) {
				this.next_lb.node.active = false;
			}
			return;
		}

		/** 高亮管理 */
		this._clearHighlight();
		const hlRegion = this._resolveHighlightRegion(step);
		if (hlRegion != null) {
			this._createHighlight(hlRegion);
		}

		const isTapContinue = UdHintingView.isTapContinueStep(step);
		this.isBlockInputEvents = isTapContinue;

		/** 有高亮区域时跳过 shell 遮罩，由 _applyMaskCutout 统一处理 */
		this._setForceDim(forceGuide && hlRegion == null);
		const hlRadius = (step.highlightRadius != null && !isNaN(step.highlightRadius)) ? step.highlightRadius : -1;
		this._applyMaskCutout(hlRegion, forceGuide, hlRadius);
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
			this._startTypewriter(step.tip ?? "");
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
	/** 停止打字机效果 */
	private _stopTypewriter(): void {
		if (this._typewriterTimer > 0) {
			UdTimerHub.Ins.remove(this._typewriterTimer);
			this._typewriterTimer = 0;
		}
		this._isTypewriting = false;
		this._typewriterText = "";
		this._typewriterIndex = 0;
	}

	/** 西瓜人从下往上跳跃出现动画（300ms） */
	private _playWatermelonEnter(): void {
		if (this.watermelon_human == null) return;
		const node = this.watermelon_human;
		node.active = true;
		const targetY = node.y;
		const startY = targetY - 120;
		node.opacity = 0;
		node.y = startY;
		cc.tween(node)
			.to(0.15, { opacity: 255, y: targetY + 20 })
			.to(0.08, { y: targetY - 8 })
			.to(0.07, { y: targetY })
			.start();
	}

	/** 打字机逐字显示 */
	private _typewriterTick(): void {
		if (!this._isTypewriting) return;
		this._typewriterIndex++;
		if (this._typewriterIndex <= this._typewriterText.length) {
			if (this.tip_lb != null) {
				this.tip_lb.string = this._typewriterText.slice(0, this._typewriterIndex);
			}
		}
		if (this._typewriterIndex < this._typewriterText.length) {
			this._typewriterTimer = UdTimerHub.Ins.callLater(0.06, () => this._typewriterTick());
		} else {
			this._typewriterTimer = 0;
			this._isTypewriting = false;
		}
	}

	/** 立即完成打字机效果 */
	private _finishTypewriter(): void {
		if (!this._isTypewriting) return;
		const fullText = this._typewriterText;
		this._stopTypewriter();
		if (this.tip_lb != null && fullText.length > 0) {
			this.tip_lb.string = fullText;
		}
	}


	/** 启动打字机效果 + 西瓜人动画 */
	private _startTypewriter(text: string): void {
		this._stopTypewriter();
		if (text == null || text.length === 0) return;
		this._typewriterText = text;
		this._typewriterIndex = 0;
		this._isTypewriting = true;
		if (this.tip_lb != null) {
			this.tip_lb.string = "";
		}
		this._playWatermelonEnter();
		this._typewriterTimer = UdTimerHub.Ins.callLater(0.06, () => this._typewriterTick());
	}

	// ==================== 高亮区域 ====================

	/** 从 step.highlight 解析世界坐标高亮矩形；无配置返回 null */
	private _resolveHighlightRegion(step: IUdHintStep): { x: number; y: number; width: number; height: number } | null {
		const hl = step.highlight;
		if (hl == null) return null;

		let rect: { x: number; y: number; width: number; height: number } | null = null;

		if ((hl as IUdHintTarget).view != null) {
			// IUdHintTarget: 取目标节点的世界包围盒，应用 highlightScale 缩放
			const target = hl as IUdHintTarget;
			const view = UdPanelHub.Ins.getView(target.view);
			if (view == null || !view.isInit) return null;
			const node = view.getElm(target.node);
			if (node == null || !node.activeInHierarchy) return null;
			const box = node.getBoundingBoxToWorld();
			const scale = step.highlightScale ?? 1;
			const cx = box.x + box.width * 0.5;
			const cy = box.y + box.height * 0.5;
			const hw = box.width * 0.5 * scale;
			const hh = box.height * 0.5 * scale;
			rect = { x: cx - hw, y: cy - hh, width: hw * 2, height: hh * 2 };
		} else {
			// IUdHintHighlightRect: 可视窗口坐标 → 世界坐标（以屏幕中心为原点）
			const r = hl as IUdHintHighlightRect;
			const winSize = cc.view.getVisibleSize();
			const worldX = r.x + winSize.width * 0.5;
			const worldY = r.y + winSize.height * 0.5;
			rect = { x: worldX, y: worldY, width: r.width, height: r.height };
		}

		if (rect == null) return null;

		// 应用 offset
		const off = step.highlightOffset;
		if (off != null) {
			rect.x += off.x;
			rect.y += off.y;
		}
		return rect;
	}

	/** 在高亮区域创建/定位光圈克隆 */
	private _createHighlight(region: { x: number; y: number; width: number; height: number }): void {
		if (this.root == null || this.halo_eff == null || this.halo_eff.node == null) return;

		const cx = region.x + region.width * 0.5;
		const cy = region.y + region.height * 0.5;
		const worldPos = cc.v2(cx, cy);
		const localPos = this.root.convertToNodeSpaceAR(worldPos);

		const clone = cc.instantiate(this.halo_eff.node);
		clone.parent = this.root;
		clone.setPosition(localPos);
		clone.active = true;

		// 根据区域尺寸缩放光环（取原始光圈尺寸作基准）
		const baseW = this.halo_eff.node.width || 200;
		const baseH = this.halo_eff.node.height || 200;
		const scaleX = baseW > 0 ? region.width / baseW : 1;
		const scaleY = baseH > 0 ? region.height / baseH : 1;
		clone.scaleX = scaleX;
		clone.scaleY = scaleY;

		const spine = clone.getComponent(UdSpine);
		if (spine != null) {
			spine.play(UdHintingView.HALO_ANIM, true);
		}

		this._highlightClones.push(clone);
	}

	/** 清除所有高亮克隆节点 */
	private _clearHighlight(): void {
		for (let i = 0; i < this._highlightClones.length; i++) {
			const node = this._highlightClones[i];
			if (node != null && node.isValid) {
				node.destroy();
			}
		}
		this._highlightClones.length = 0;
		this._clearMaskCutout();
	}

	// ==================== 遮罩镂空 ====================

	/** 扫描线逼近圆形镂空：每行画左右两条，圆形区域自然留空 */
	private _applyMaskCutout(
		region: { x: number; y: number; width: number; height: number } | null,
		forceGuide: boolean,
		customRadius: number = -1
	): void {
		this._clearMaskCutout();
		if (this.root == null) return;
		if (!forceGuide || region == null) return;

		try {
			const r0 = this.root.convertToNodeSpaceAR(cc.v2(region.x, region.y));
			const r1 = this.root.convertToNodeSpaceAR(cc.v2(region.x + region.width, region.y + region.height));
			const cx = (r0.x + r1.x) * 0.5;
			const cy = (r0.y + r1.y) * 0.5;
			const rw = Math.abs(r1.x - r0.x);
			const rh = Math.abs(r1.y - r0.y);
			const radius = customRadius > 0 ? customRadius : Math.sqrt(rw * rw + rh * rh) * 0.5;

			const vs = cc.view.getVisibleSize();
			const s0 = this.root.convertToNodeSpaceAR(cc.v2(0, 0));
			const s1 = this.root.convertToNodeSpaceAR(cc.v2(vs.width, vs.height));
			const sx = Math.min(s0.x, s1.x);
			const sy = Math.min(s0.y, s1.y);
			const sw = Math.abs(s1.x - s0.x);
			const sh = Math.abs(s1.y - s0.y);

			const DIM = UdHintingView.FORCE_DIM_OPACITY;
			const dimColor = cc.color(0, 0, 0, DIM);

			const wrap = new cc.Node("__hint_mask_wrap__");
			wrap.parent = this.root;
			wrap.setPosition(0, 0);
			wrap.zIndex = -999;
			wrap.active = true;

			// 扫描线步长（越小越圆，越大性能越好）
			const STEP = 4;
			const r2 = radius * radius;

			for (let y = sy; y < sy + sh; y += STEP) {
				const dy = y - cy;
				// 该扫描线在圆内部的部分
				if (Math.abs(dy) <= radius) {
					const dx = Math.sqrt(r2 - dy * dy);
					const innerLeft = cx - dx;
					const innerRight = cx + dx;

					// 左遮罩
					if (innerLeft > sx) {
						this._addMaskRect(wrap, dimColor, sx, y, innerLeft - sx, STEP);
					}
					// 右遮罩
					if (innerRight < sx + sw) {
						this._addMaskRect(wrap, dimColor, innerRight, y, sx + sw - innerRight, STEP);
					}
				} else {
					// 扫描线完全在圆外，整行填充
					this._addMaskRect(wrap, dimColor, sx, y, sw, STEP);
				}
			}

			this._maskNode = wrap;
		} catch (e) {
			// fallback
		}
	}

	/** 在指定父节点创建一块填充矩形遮罩 */
	private _addMaskRect(parent: cc.Node, color: cc.Color, x: number, y: number, w: number, h: number): void {
		if (w <= 0 || h <= 0) return;
		const node = new cc.Node();
		node.parent = parent;
		node.setPosition(0, 0);
		node.zIndex = -999;
		node.active = true;
		const gfx = node.addComponent(cc.Graphics);
		gfx.fillColor = color;
		gfx.rect(x, y, w, h);
		gfx.fill();
	}

	/** 清除遮罩镂空 Graphics 和独立节点 */
	private _clearMaskCutout(): void {
		if (this._maskGfx != null) {
			this._maskGfx.clear();
			this._maskGfx = null;
		}
		if (this._maskNode != null && this._maskNode.isValid) {
			this._maskNode.destroy();
			this._maskNode = null;
		}
	}

	public onClose() {
		this.unbindTapContinue();
		this._stopLayoutTimer();
		this._stopFingerTween();
		this._stopTypewriter();
		this._clearHighlight();
		super.onClose();
	}
}
