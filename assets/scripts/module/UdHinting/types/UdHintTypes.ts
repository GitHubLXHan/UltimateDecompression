/**
 * 指引系统类型定义。
 *
 * 触发流程：
 * 1. 业务在合适时机调用 UdHintingHub.onTrigger(type, ctx)；
 * 2. 组级 appearWhen 与步骤级 appearWhen 均满足（AND）时，展示该步骤；
 * 3. 步骤完成后标记完成并关闭界面，等待下一次 onTrigger，不自动播放下一步。
 *
 * 扩展新条件类型：
 * 1. UdHintConditionKind 增加枚举值，IUdHintAppearCondition 补充字段；
 * 2. UdHintingHub._matchOneCondition 增加 case；
 * 3. 在 UdHintConfig 的 appearWhen 中使用，并在业务侧 onTrigger 时传入 ctx。
 */

/**
 * 业务派发的事件类型，表示「此刻发生了什么」。
 * 与 appearWhen 中 { type: "onEvent", event: "..." } 配对使用。
 */
export type UdHintTriggerType =
	| "appStart"          // 应用/首屏就绪（UdAppEntry）
	| "viewReady"         // 某界面已 open 且 isInit（各 View updateView 末尾）
	| "gameIdle"          // 主玩法进入未开始 UI（UdGameMain 空闲态）
	| "gameRunning"       // 主玩法开始对局
	| "gameScore"         // 本局积分变化（需 ctx.score）
	| "gameResultClosed"; // 结算关闭回到主界面

/**
 * appearWhen 条件类型（组级 / 步骤级通用）。
 * 单条条件不通过则整条 appearWhen 不通过；数组内多条为 AND 关系。
 */
export type UdHintConditionKind =
	| "onEvent"         // 必须匹配本次 onTrigger 的 event，字段：event
	| "viewReady"       // 指定界面已打开且初始化完成，字段：view
	| "gamePhase"       // 玩法阶段，字段：phase，需 ctx.gamePhase
	| "minPlayCount"    // 累计开局次数 ≥ min，字段：min，需 ctx.playCount
	| "maxPlayCount"    // 累计开局次数 ≤ max，字段：max，需 ctx.playCount
	| "minScore"        // 本局积分 ≥ min，字段：min，需 ctx.score
	| "maxScore"        // 本局积分 ≤ max，字段：max，需 ctx.score
	| "showCountBelow"  // 本组已展示次数 < max，字段：max（Hub 持久化）
	| "cooldownSec"     // 距本组上次展示 ≥ sec 秒，字段：sec（Hub 持久化；0 表示不冷却）
	| "storageFlag"     // localStorage 标记，字段：key、equals（默认 "1"）
	| "notDone"         // 本指引组未完成（once 语义，读 ud_hint_done_v1）
	| "stepNotDone";    // 本步骤未完成（读 ud_hint_step_done_v1，步骤 appearWhen 常用）

/** onTrigger(type, ctx) 时传入的上下文，供条件校验使用 */
export interface IUdHintTriggerContext {
	/** 当前相关界面类名（如 "UdGameMain"） */
	view?: string;
	/** 玩法阶段，由 UdGameMain 等传入 */
	gamePhase?: "idle" | "running" | "finished";
	/** 累计开局次数 */
	playCount?: number;
	/** 本局当前积分（gameScore 事件时传入） */
	score?: number;
}

/** appearWhen 单条条件配置 */
export interface IUdHintAppearCondition {
	type: UdHintConditionKind;
	/** onEvent：须与本次 onTrigger 的 type 一致 */
	event?: UdHintTriggerType;
	/** viewReady：界面类名 */
	view?: string;
	/** gamePhase：须与 ctx.gamePhase 一致 */
	phase?: "idle" | "running" | "finished";
	/** minPlayCount / minScore：下限 */
	min?: number;
	/** maxPlayCount / showCountBelow：上限 */
	max?: number;
	/** cooldownSec：冷却秒数 */
	sec?: number;
	/** storageFlag：localStorage 键名 */
	key?: string;
	/** storageFlag：期望值，缺省为 "1" */
	equals?: string;
}

/** 提示气泡相对手指锚点的方位 */
export type UdHintTipPlacement = "top" | "bottom" | "left" | "right";

/** 二维偏移（世界/布局坐标） */
export interface IUdHintOffset {
	x: number;
	y: number;
}

/** 高亮区域：用可视窗口坐标矩形定义（0,0 为屏幕中心，后续可替换为自定义特效） */
export interface IUdHintHighlightRect {
	x: number;
	y: number;
	width: number;
	height: number;
}

/** 指引点击目标：业务 View 类名 + 节点名（与 getElm 一致） */
export interface IUdHintTarget {
	view: string;
	node: string;
}

/**
 * 步骤完成方式。
 * - clickTarget：须点击 target 指定节点；
 * - tapContinue：tips_node 居中 + 全屏点击继续；
 * - manual：由外部调用 Hub 推进（预留）。
 */
export type UdHintCompleteKind = "clickTarget" | "tapContinue" | "manual";

/** 指引组内单步配置 */
export interface IUdHintStep {
	/** 步骤唯一 id，用于步骤完成持久化 */
	id: string;
	/** 步骤级触发条件（AND），须与组级 appearWhen 同时满足 */
	appearWhen: IUdHintAppearCondition[];
	/** 高亮区域：target 节点包围盒 或 自定义矩形，不传则无高亮 */
	highlight?: IUdHintTarget | IUdHintHighlightRect;
	/** 高亮区域相对锚点的偏移量（类似 fingerOffset） */
	highlightOffset?: IUdHintOffset;
	/** 高亮区域尺寸缩放系数，默认 1.0（仅 highlight 为 IUdHintTarget 时生效，对包围盒宽高缩放） */
	highlightScale?: number;
	/** 高亮镂空圆半径（像素），不传则由区域尺寸自动计算。控制遮罩镂空大小 */
	highlightRadius?: number;
	/** 提示文案（tip_lb） */
	tip?: string;
	/** 手指/光圈锚点目标（clickTarget 必填） */
	target?: IUdHintTarget;
	/** 无 target 时的固定世界坐标锚点 */
	fixedPos?: IUdHintOffset;
	/** 是否显示指引光圈，默认 true；tapContinue 常设为 false */
	showHalo?: boolean;
	/** 是否显示手指，默认 true */
	showFinger?: boolean;
	/** 是否显示 tips_node，默认 true（有 tip 文案时） */
	showTip?: boolean;
	/** 文案相对手指锚点的方位 */
	tipPlacement?: UdHintTipPlacement;
	/** 文案布局额外偏移 */
	tipOffset?: IUdHintOffset;
	/** tips_node 在布局完成后的额外偏移 */
	tipsNodeOffset?: IUdHintOffset;
	/** 手指相对锚点偏移 */
	fingerOffset?: IUdHintOffset;
	/** 光圈相对锚点偏移 */
	haloOffset?: IUdHintOffset;
	/** 完成方式，默认 clickTarget */
	complete?: UdHintCompleteKind;
	/** tapContinue 时 next_lb 文案，默认「点击继续」 */
	nextLabel?: string;
	/** 步骤级强制指引（半透明遮罩 + 仅目标可点），覆盖组级 forceGuide */
	forceGuide?: boolean;
}

/** 指引组配置（在 UdHintConfig 中注册到 Hub） */
export interface IUdHintGroup {
	/** 组唯一 id */
	id: string;
	/** 完成后不再自动弹出（整组标记 ud_hint_done_v1），默认 true */
	once?: boolean;
	/** 组内默认强制指引 */
	forceGuide?: boolean;
	/** 组级触发门槛（AND），须先满足才匹配组内步骤 */
	appearWhen: IUdHintAppearCondition[];
	/** 步骤列表，各步骤独立 appearWhen，互不自动串联 */
	steps: IUdHintStep[];
}
