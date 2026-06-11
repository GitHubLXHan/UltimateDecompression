import { IUdHintGroup } from "../types/UdHintTypes";

/**
 * 游戏主界面新手指引。
 * 组级：未完成 + 展示次数/冷却；各步骤独立 appearWhen，由业务事件分别触发。
 */
export const UD_GAME_INTRO_GROUP: IUdHintGroup = {
	id: "ud_game_intro",
	once: true,
	forceGuide: true,
	appearWhen: [
		{ type: "notDone" },
		{ type: "showCountBelow", max: 6 },
		// { type: "cooldownSec", sec: 10 },
	],
	steps: [
		{
			id: "tap_start",
			appearWhen: [
				{ type: "onEvent", event: "gameIdle" },
				{ type: "gamePhase", phase: "idle" },
				{ type: "viewReady", view: "UdGameMain" },
				{ type: "stepNotDone" },
			],
			tip: "点击这里开始游戏喔！",
			target: { view: "UdGameMain", node: "start_btn" },
			tipPlacement: "top",
			fingerOffset: { x: 0, y: -50 },
			tipsNodeOffset: { x: 100, y: 0 },
			complete: "clickTarget",
			highlight: { view: "UdGameMain", node: "start_btn" },
			highlightScale: 3,
			highlightRadius: 100,   // 镂空圆半径 180px
			showHalo: false,
		},
		{
			id: "intro_game",
			forceGuide: false,
			appearWhen: [
				{ type: "onEvent", event: "gameRunning" },
				{ type: "gamePhase", phase: "running" },
				{ type: "cooldownSec", sec: 0 },
				{ type: "stepNotDone" },
			],
			tip: "点击任意区域掉落水果，相同水果可合成更高级的水果",
			target: { view: "UdGameMain", node: "game_root" },
			complete: "clickTarget",
			nextLabel: "",
			fingerOffset: { x: 0, y: 0 },
			tipsNodeOffset: { x: 0, y: 0 },
		},
		{
			id: "intro_score",
			forceGuide: true,
			appearWhen: [
				{ type: "onEvent", event: "gameScore" },
				{ type: "gamePhase", phase: "running" },
				{ type: "minScore", min: 1 },
				{ type: "maxScore", max: 19 },
				// { type: "cooldownSec", sec: 20 },
				{ type: "stepNotDone" },
			],
			tip: "合成水果获得分数，到达一定分数可通关喔！",
			complete: "tapContinue",
			showHalo: false,
			showFinger: false,
			nextLabel: "",
			highlight: { view: "UdGameMain", node: "score_node" },
			highlightScale: 3,
			highlightRadius: 120,   // 镂空圆半径 180px
			// highlight: { x: 0, y: 0, width: 200, height: 100 }
		},
		{
			id: "guide_record",
			forceGuide: true,
			appearWhen: [
				{ type: "onEvent", event: "gameScore" },
				{ type: "gamePhase", phase: "running" },
				// { type: "viewReady", view: "UdGameMain" },
				{ type: "minScore", min: 20 },
				{ type: "stepNotDone" },
			],
			tip: "点击这里可将本局游戏存档喔！",
			// target: { view: "UdGameMain", node: "record_btn" },
			tipPlacement: "bottom",
			// fingerOffset: { x: 0, y: -50 },
			tipsNodeOffset: { x: 100, y: 0 },
			complete: "tapContinue",
			highlight: { view: "UdGameMain", node: "record_btn" },
			highlightScale: 3,
			highlightRadius: 100,   // 镂空圆半径 180px
			showHalo: false,
			showFinger: false,
			nextLabel: "",
		},
		// {
		// 	id: "tap_setting",
		// 	appearWhen: [
		// 		{ type: "onEvent", event: "gameIdle" },
		// 		{ type: "gamePhase", phase: "idle" },
		// 		{ type: "viewReady", view: "UdGameMain" },
		// 		{ type: "stepNotDone" },
		// 	],
		// 	tip: "点击这里打开设置",
		// 	target: { view: "UdGameMain", node: "setting_btn" },
		// 	tipPlacement: "right",
		// 	fingerOffset: { x: 0, y: -40 },
		// 	tipsNodeOffset: { x: 100, y: 0 },
		// 	complete: "clickTarget",
		// },
		// {
		// 	id: "tap_record",
		// 	appearWhen: [
		// 		{ type: "onEvent", event: "gameIdle" },
		// 		{ type: "gamePhase", phase: "idle" },
		// 		{ type: "viewReady", view: "UdGameMain" },
		// 		{ type: "stepNotDone" },
		// 	],
		// 	tip: "点击这里存档",
		// 	target: { view: "UdGameMain", node: "record_btn" },
		// 	tipPlacement: "right",
		// 	fingerOffset: { x: 0, y: -40 },
		// 	tipsNodeOffset: { x: 100, y: 0 },
		// 	complete: "clickTarget",
		// },
	],
};

/** 注册到 Hub 的全部指引组 */
export const UD_HINT_GROUPS: IUdHintGroup[] = [
	UD_GAME_INTRO_GROUP,
];
