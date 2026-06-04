/**
 * 指引调度中心：组级 + 步骤级 appearWhen，onTrigger 匹配后展示对应步骤。
 * 步骤完成后等待下一次触发，不自动播放后续步骤。
 */
import { UdBtnSignal } from "../../extension/components/GameBtn/UdBtnSignal";
import { UdButton } from "../../extension/game/UdButton";
import { UdTimerHub } from "../../extension/time/UdTimerHub";
import { UdPanelHubCore } from "../../extension/view/UdPanelHubCore";
import { UdLayerKind } from "../../extension/view/types/UdLayerKind";
import { UD_HINT_GROUPS } from "./config/UdHintConfig";
import {
	IUdHintAppearCondition,
	IUdHintGroup,
	IUdHintStep,
	IUdHintTriggerContext,
	UdHintTriggerType,
} from "./types/UdHintTypes";
import { UdHintingView } from "./views/UdHintingView";

export class UdHintingHub {
	private static _ins: UdHintingHub;

	public static get Ins(): UdHintingHub {
		if (this._ins == null) {
			this._ins = new UdHintingHub();
		}
		return this._ins;
	}

	private static readonly STORAGE_KEY = "ud_hint_done_v1";
	private static readonly STORAGE_STEP_KEY = "ud_hint_step_done_v1";
	private static readonly RESOLVE_RETRY_MAX = 30;

	private constructor() { }

	private _viewCls!: { new(): UdHintingView };
	private _uiMgr!: UdPanelHubCore;
	private _groups: Map<string, IUdHintGroup> = new Map();

	private _activeGroupId: string = "";
	private _stepIndex: number = -1;
	private _resolveRetry: number = 0;
	private _resolveTimer: number = 0;

	private _listenBtn: UdButton = undefined;
	private _listenHandler: (target: UdButton, args: any[]) => void = undefined;
	private _listenNode: cc.Node = undefined;
	private _tapContinueBound: boolean = false;

	/** 初始化并注册配置中的全部指引组 */
	public init<T extends UdHintingView>(viewCls: { new(): T }, uiMgr: UdPanelHubCore): void {
		this._viewCls = viewCls;
		this._uiMgr = uiMgr;
		for (let i = 0; i < UD_HINT_GROUPS.length; i++) {
			this.registerGroup(UD_HINT_GROUPS[i]);
		}
	}

	public registerGroup(group: IUdHintGroup): void {
		this._groups.set(group.id, group);
	}

	/**
	 * 【测试用】清除全部指引 localStorage（组完成、步骤完成、展示次数、冷却）。
	 * 上线前在 UdAppEntry 注释掉调用即可。
	 */
	public clearTestPersistence(): void {
		cc.sys.localStorage.removeItem(UdHintingHub.STORAGE_KEY);
		cc.sys.localStorage.removeItem(UdHintingHub.STORAGE_STEP_KEY);
		this._groups.forEach((group) => {
			cc.sys.localStorage.removeItem(this._showCountKey(group.id));
			cc.sys.localStorage.removeItem(this._lastShowKey(group.id));
		});
	}

	public isGroupDone(groupId: string): boolean {
		return this._loadDoneSet().has(groupId);
	}

	public isStepDone(groupId: string, stepId: string): boolean {
		return this._loadStepDoneSet(groupId).has(stepId);
	}

	public getCurrentStep(): IUdHintStep | null {
		const group = this._groups.get(this._activeGroupId);
		if (group == null || this._stepIndex < 0) return null;
		return group.steps[this._stepIndex] ?? null;
	}

	public isGuiding(): boolean {
		return this._activeGroupId !== "" && this._stepIndex >= 0;
	}

	public getActiveGroupId(): string {
		return this._activeGroupId;
	}

	public isForceGuiding(): boolean {
		const step = this.getCurrentStep();
		return step != null && this._isStepForce(step);
	}

	public isCurrentTarget(viewName: string, nodeName: string): boolean {
		const step = this.getCurrentStep();
		if (step == null || step.target == null) return false;
		return step.target.view === viewName && step.target.node === nodeName;
	}

	public isCurrentTargetNode(node: cc.Node): boolean {
		if (node == null) return false;
		const step = this.getCurrentStep();
		if (step == null || step.target == null) return false;
		const target = this._resolveTargetNode(step);
		if (target == null) return false;
		return target === node || target === node.parent;
	}

	/**
	 * 业务事件入口：组级 + 步骤级 appearWhen 均满足时展示该步骤（每次触发最多展示一个步骤）。
	 */
	public onTrigger(type: UdHintTriggerType, ctx?: IUdHintTriggerContext): void {
		console.log("[UdHinting] onTrigger type=", type, "isGuiding=", this.isGuiding());
		if (this.isGuiding()) {
			console.log("[UdHinting] blocked - already guiding");
			return;
		}
		const groups = Array.from(this._groups.values());
		for (let g = 0; g < groups.length; g++) {
			const group = groups[g];
			const groupCondMatch = this._matchConditions(group.appearWhen, type, ctx, group.id);
			console.log("[UdHinting] group", group.id, "groupCondMatch=", groupCondMatch, "isGroupDone=", this.isGroupDone(group.id));
			if (!groupCondMatch) {
				continue;
			}
			if (group.once !== false && this.isGroupDone(group.id)) {
				continue;
			}
			const stepIndex = this._findMatchingStepIndex(group, type, ctx);
			if (stepIndex < 0) {
				continue;
			}
			if (this._tryStartStepAt(group.id, stepIndex)) {
				return;
			}
		}
	}

	/**
	 * 校验组级条件后，启动组内第一个满足步骤级条件的步骤。
	 */
	public tryStartGroup(
		groupId: string,
		trigger?: UdHintTriggerType,
		ctx?: IUdHintTriggerContext
	): boolean {
		const group = this._groups.get(groupId);
		if (group == null) {
			return false;
		}
		if (group.once !== false && this.isGroupDone(groupId)) {
			return false;
		}
		if (this.isGuiding()) {
			return false;
		}
		if (!this._matchConditions(group.appearWhen, trigger, ctx, groupId)) {
			return false;
		}
		const stepIndex = this._findMatchingStepIndex(group, trigger, ctx);
		if (stepIndex < 0) {
			return false;
		}
		return this._tryStartStepAt(groupId, stepIndex);
	}

	/** 是否满足自动展示（组级 + 至少一个未完成步骤的条件） */
	public canAutoStart(
		groupId: string,
		trigger?: UdHintTriggerType,
		ctx?: IUdHintTriggerContext
	): boolean {
		const group = this._groups.get(groupId);
		if (group == null) {
			return false;
		}
		if (group.once !== false && this.isGroupDone(groupId)) {
			return false;
		}
		if (this.isGuiding()) {
			return false;
		}
		if (!this._matchConditions(group.appearWhen, trigger, ctx, groupId)) {
			return false;
		}
		return this._findMatchingStepIndex(group, trigger, ctx) >= 0;
	}

	/** 是否满足指定步骤的自动展示（组级 + 该步骤条件） */
	public canAutoStartStep(
		groupId: string,
		stepId: string,
		trigger?: UdHintTriggerType,
		ctx?: IUdHintTriggerContext
	): boolean {
		const group = this._groups.get(groupId);
		if (group == null) {
			return false;
		}
		if (group.once !== false && this.isGroupDone(groupId)) {
			return false;
		}
		if (this.isGuiding()) {
			return false;
		}
		if (!this._matchConditions(group.appearWhen, trigger, ctx, groupId)) {
			return false;
		}
		const step = group.steps.find((s) => s.id === stepId);
		if (step == null || this.isStepDone(groupId, stepId)) {
			return false;
		}
		return this._matchConditions(step.appearWhen, trigger, ctx, groupId, stepId);
	}

	/** 强制展示组内第一个未完成步骤（跳过 appearWhen，调试用） */
	public startGroup(groupId: string): void {
		const group = this._groups.get(groupId);
		if (group == null) {
			return;
		}
		for (let i = 0; i < group.steps.length; i++) {
			if (!this.isStepDone(groupId, group.steps[i].id)) {
				this._tryStartStepAt(groupId, i, true);
				return;
			}
		}
	}

	/** 强制展示指定步骤（跳过 appearWhen） */
	public startStep(groupId: string, stepId: string): void {
		const group = this._groups.get(groupId);
		if (group == null) return;

		let idx = -1;
		for (let i = 0; i < group.steps.length; i++) {
			if (group.steps[i].id === stepId) {
				idx = i;
				break;
			}
		}
		if (idx < 0) return;

		this._tryStartStepAt(groupId, idx, true);
	}

	public skipGroup(): void {
		const group = this._groups.get(this._activeGroupId);
		if (group != null) {
			for (let i = 0; i < group.steps.length; i++) {
				this._markStepDone(group.id, group.steps[i].id);
			}
			this._markGroupDone(group.id);
		}
		this._finishStep();
	}

	/** 条件列表 AND 校验（组级或步骤级） */
	private _matchConditions(
		conditions: IUdHintAppearCondition[] | undefined,
		trigger: UdHintTriggerType | undefined,
		ctx: IUdHintTriggerContext | undefined,
		groupId: string,
		stepId?: string
	): boolean {
		if (conditions == null || conditions.length === 0) {
			return false;
		}
		for (let i = 0; i < conditions.length; i++) {
			if (!this._matchOneCondition(conditions[i], trigger, ctx, groupId, stepId)) {
			console.log("[UdHinting] cond", i, JSON.stringify(conditions[i]), "->","...");
				return false;
			}
		}
		return true;
	}

	/** 在组内查找第一个满足步骤级条件且未完成的步骤下标 */
	private _findMatchingStepIndex(
		group: IUdHintGroup,
		trigger: UdHintTriggerType | undefined,
		ctx: IUdHintTriggerContext | undefined
	): number {
		for (let i = 0; i < group.steps.length; i++) {
			const step = group.steps[i];
			const isDone = this.isStepDone(group.id, step.id);
			console.log("[UdHinting] step", i, step.id, "isDone=", isDone);
			if (isDone) {
				continue;
			}
			const matched = this._matchConditions(step.appearWhen, trigger, ctx, group.id, step.id);
			console.log("[UdHinting] step", i, step.id, "matched=", matched);
			if (matched) {
				return i;
			}
		}
		return -1;
	}

	/** 单条 appearWhen 条件分发 */
	private _matchOneCondition(
		cond: IUdHintAppearCondition,
		trigger: UdHintTriggerType | undefined,
		ctx: IUdHintTriggerContext | undefined,
		groupId: string,
		stepId?: string
	): boolean {
		switch (cond.type) {
			case "onEvent":
				return trigger != null && cond.event === trigger;
			case "viewReady": {
				if (cond.view == null || cond.view === "") return false;
				const view = this._uiMgr.getView(cond.view);
				return view != null && view.isInit === true;
			}
			case "gamePhase":
				return ctx != null && ctx.gamePhase === cond.phase;
			case "minPlayCount": {
				const count = ctx?.playCount;
				if (count == null || cond.min == null) return false;
				return count >= cond.min;
			}
			case "minScore": {
				const score = ctx?.score;
				if (score == null || cond.min == null) return false;
				return score >= cond.min;
			}
			case "maxPlayCount": {
				const count = ctx?.playCount;
				if (count == null || cond.max == null) return false;
				return count <= cond.max;
			}
			case "showCountBelow":
				if (cond.max == null) return false;
				return this._getGroupShowCount(groupId) < cond.max;
			case "cooldownSec": {
				if (cond.sec == null || cond.sec <= 0) return true;
				const last = this._getLastShowTime(groupId);
				if (last <= 0) return true;
				const now = Math.floor(Date.now() / 1000);
				return now - last >= cond.sec;
			}
			case "storageFlag": {
				if (cond.key == null || cond.key === "") return false;
				const val = cc.sys.localStorage.getItem(cond.key);
				return val === (cond.equals ?? "1");
			}
			case "notDone":
				return !this.isGroupDone(groupId);
			case "stepNotDone":
				if (stepId == null || stepId === "") return false;
				return !this.isStepDone(groupId, stepId);
			default:
				return false;
		}
	}

	private _showCountKey(groupId: string): string {
		return `ud_hint_show_${groupId}`;
	}

	private _lastShowKey(groupId: string): string {
		return `ud_hint_last_${groupId}`;
	}

	private _getGroupShowCount(groupId: string): number {
		const raw = cc.sys.localStorage.getItem(this._showCountKey(groupId));
		const n = Number(raw);
		return raw != null && !isNaN(n) ? n : 0;
	}

	private _incGroupShowCount(groupId: string): void {
		const next = this._getGroupShowCount(groupId) + 1;
		cc.sys.localStorage.setItem(this._showCountKey(groupId), next.toString());
	}

	private _getLastShowTime(groupId: string): number {
		const raw = cc.sys.localStorage.getItem(this._lastShowKey(groupId));
		const n = Number(raw);
		return raw != null && !isNaN(n) ? n : 0;
	}

	private _setLastShowTime(groupId: string): void {
		const now = Math.floor(Date.now() / 1000);
		cc.sys.localStorage.setItem(this._lastShowKey(groupId), now.toString());
	}

	/** 启动并展示指定下标的步骤 */
	private _tryStartStepAt(groupId: string, stepIndex: number, force: boolean = false): boolean {
		if (this.isGuiding()) {
			return false;
		}
		const group = this._groups.get(groupId);
		if (group == null || stepIndex < 0 || stepIndex >= group.steps.length) {
			return false;
		}
		const step = group.steps[stepIndex];
		if (!force) {
			if (group.once !== false && this.isGroupDone(groupId)) {
				return false;
			}
			if (this.isStepDone(groupId, step.id)) {
				return false;
			}
		}
		this._incGroupShowCount(groupId);
		this._setLastShowTime(groupId);
		this._ensureViewOpen();
		this._activeGroupId = groupId;
		this._stepIndex = stepIndex;
		this._showCurrentStep();
		return true;
	}

	private _ensureViewOpen(): void {
		let view = this._uiMgr.getView(this._viewCls);
		if (view == null || !view.isInit) {
			this._uiMgr.open(this._viewCls, UdLayerKind.Hint, null, false);
		}
	}

	private _showCurrentStep(): void {
		this._clearStepListeners();
		this._stopResolveTimer();

		const step = this.getCurrentStep();
		if (step == null) {
			this._finishStep();
			return;
		}

		this._resolveRetry = 0;
		this._applyStepToView(step);
		if (step.complete === "tapContinue") {
			this._tryBindTapContinue();
		} else {
			this._tryBindTarget(step);
		}
	}

	private _isStepForce(step: IUdHintStep): boolean {
		if (step.forceGuide != null) {
			return step.forceGuide;
		}
		const group = this._groups.get(this._activeGroupId);
		return group != null && group.forceGuide === true;
	}

	private _applyStepToView(step: IUdHintStep | null): void {
		const forceGuide = step != null ? this._isStepForce(step) : false;
		const view = this._uiMgr.getView(this._viewCls) as UdHintingView;
		if (view != null && view.isInit) {
			view.applyStep(step, forceGuide);
			return;
		}
		const params = step == null ? null : { step, forceGuide };
		this._uiMgr.open(this._viewCls, UdLayerKind.Hint, params, false);
	}

	private _tryBindTarget(step: IUdHintStep): void {
		if (step.complete !== "clickTarget" || step.target == null) {
			return;
		}

		const node = this._resolveTargetNode(step);
		if (node == null || !node.activeInHierarchy) {
			this._resolveRetry++;
			if (this._resolveRetry >= UdHintingHub.RESOLVE_RETRY_MAX) {
				this._onStepCompleted();
				return;
			}
			this._resolveTimer = UdTimerHub.Ins.callLater(0.2, () => {
				this._tryBindTarget(step);
			});
			return;
		}

		const btn = node.getComponent(UdButton);
		if (btn != null) {
			this._listenBtn = btn;
			this._listenHandler = this._onTargetTapped.bind(this);
			btn.addListener(UdBtnSignal.FingerTap, this._listenHandler, this);
		} else {
			this._listenNode = node;
			node.on(cc.Node.EventType.TOUCH_END, this._onTargetTapped, this);
		}
	}

	private _resolveTargetNode(step: IUdHintStep): cc.Node | null {
		if (step.target == null) return null;
		const view = this._uiMgr.getView(step.target.view);
		if (view == null || !view.isInit) return null;
		return view.getElm(step.target.node) ?? null;
	}

	private _tryBindTapContinue(): void {
		const view = this._uiMgr.getView(this._viewCls) as UdHintingView;
		if (view == null || !view.isInit) {
			this._resolveRetry++;
			if (this._resolveRetry >= UdHintingHub.RESOLVE_RETRY_MAX) {
				this._onStepCompleted();
				return;
			}
			this._resolveTimer = UdTimerHub.Ins.callLater(0.2, () => {
				this._tryBindTapContinue();
			});
			return;
		}
		this._tapContinueBound = true;
		view.bindTapContinue(this._onTapContinue.bind(this));
	}

	private _onTargetTapped(): void {
		this._clearStepListeners();
		this._onStepCompleted();
	}

	private _onTapContinue(): void {
		this._clearStepListeners();
		this._onStepCompleted();
	}

	/** 当前步骤完成：标记步骤完成，组内全部完成后标记组完成，关闭界面等待下次触发 */
	private _onStepCompleted(): void {
		const group = this._groups.get(this._activeGroupId);
		const step = this.getCurrentStep();
		if (group != null && step != null) {
			this._markStepDone(group.id, step.id);
			if (this._isAllStepsDone(group)) {
				this._markGroupDone(group.id);
			}
		}
		this._finishStep();
	}

	private _isAllStepsDone(group: IUdHintGroup): boolean {
		for (let i = 0; i < group.steps.length; i++) {
			if (!this.isStepDone(group.id, group.steps[i].id)) {
				return false;
			}
		}
		return true;
	}

	private _finishStep(): void {
		this._clearStepListeners();
		this._stopResolveTimer();
		this._activeGroupId = "";
		this._stepIndex = -1;
		this._applyStepToView(null);
		this._closeHintViewIfOpen();
	}

	private _closeHintViewIfOpen(): void {
		const view = this._uiMgr.getView(this._viewCls);
		if (view != null && view.isInit) {
			this._uiMgr.close(this._viewCls, false);
		}
	}

	private _clearStepListeners(): void {
		if (this._listenBtn != null && this._listenHandler != null) {
			this._listenBtn.removeListener(UdBtnSignal.FingerTap, this._listenHandler, this);
		}
		this._listenBtn = undefined;
		this._listenHandler = undefined;
		if (this._listenNode != null) {
			this._listenNode.off(cc.Node.EventType.TOUCH_END, this._onTargetTapped, this);
		}
		this._listenNode = undefined;
		if (this._tapContinueBound) {
			const view = this._uiMgr.getView(this._viewCls) as UdHintingView;
			if (view != null && view.isInit) {
				view.unbindTapContinue();
			}
			this._tapContinueBound = false;
		}
	}

	private _stopResolveTimer(): void {
		if (this._resolveTimer > 0) {
			UdTimerHub.Ins.remove(this._resolveTimer);
			this._resolveTimer = 0;
		}
	}

	private _loadDoneSet(): Set<string> {
		try {
			const raw = cc.sys.localStorage.getItem(UdHintingHub.STORAGE_KEY);
			if (raw == null || raw === "") {
				return new Set();
			}
			const list = JSON.parse(raw) as string[];
			return new Set(Array.isArray(list) ? list : []);
		} catch {
			return new Set();
		}
	}

	private _markGroupDone(groupId: string): void {
		const set = this._loadDoneSet();
		set.add(groupId);
		cc.sys.localStorage.setItem(UdHintingHub.STORAGE_KEY, JSON.stringify(Array.from(set)));
	}

	private _loadStepDoneMap(): Record<string, string[]> {
		try {
			const raw = cc.sys.localStorage.getItem(UdHintingHub.STORAGE_STEP_KEY);
			if (raw == null || raw === "") {
				return {};
			}
			const map = JSON.parse(raw) as Record<string, string[]>;
			return map != null && typeof map === "object" ? map : {};
		} catch {
			return {};
		}
	}

	private _loadStepDoneSet(groupId: string): Set<string> {
		const map = this._loadStepDoneMap();
		const list = map[groupId];
		return new Set(Array.isArray(list) ? list : []);
	}

	private _markStepDone(groupId: string, stepId: string): void {
		const map = this._loadStepDoneMap();
		let set = map[groupId];
		if (set == null) {
			set = [];
			map[groupId] = set;
		}
		if (set.indexOf(stepId) < 0) {
			set.push(stepId);
		}
		cc.sys.localStorage.setItem(UdHintingHub.STORAGE_STEP_KEY, JSON.stringify(map));
	}
}
