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
		{ type: "showCountBelow", max: 3 },
		{ type: "cooldownSec", sec: 0 },
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
			tip: "点击这里开始游戏",
			target: { view: "UdGameMain", node: "start_btn" },
			tipPlacement: "top",
			fingerOffset: { x: 0, y: -50 },
			tipsNodeOffset: { x: 0, y: -60 },
			complete: "clickTarget",
		},
		{
			id: "intro_tip_button_touch",
			appearWhen: [
				{ type: "onEvent", event: "gameRunning" },
				{ type: "gamePhase", phase: "running" },
				{ type: "cooldownSec", sec: 0 },
				{ type: "stepNotDone" },
			],
			tip: "点击任意区域掉落水果",
			complete: "tapContinue",
			nextLabel: "",
			showHalo: false,
			showFinger: false,
		},
		{
			id: "intro_tip",
			appearWhen: [
				{ type: "onEvent", event: "gameScore" },
				{ type: "gamePhase", phase: "running" },
				{ type: "minScore", min: 1 },
				// { type: "cooldownSec", sec: 20 },
				{ type: "stepNotDone" },
			],
			tip: "合成相同水果可获得分数",
			complete: "tapContinue",
			showHalo: false,
			showFinger: false,
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
		{
			id: "tap_record",
			appearWhen: [
				{ type: "onEvent", event: "gameIdle" },
				{ type: "gamePhase", phase: "idle" },
				{ type: "viewReady", view: "UdGameMain" },
				{ type: "stepNotDone" },
			],
			tip: "点击这里存档",
			target: { view: "UdGameMain", node: "record_btn" },
			tipPlacement: "right",
			fingerOffset: { x: 0, y: -40 },
			tipsNodeOffset: { x: 100, y: 0 },
			complete: "clickTarget",
		},
	],
};

/** 注册到 Hub 的全部指引组 */
export const UD_HINT_GROUPS: IUdHintGroup[] = [
	UD_GAME_INTRO_GROUP,
];
