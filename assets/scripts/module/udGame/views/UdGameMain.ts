import { UdPanelHub } from "../../../core/manager/UdPanelHub";
import { UdToastHub } from "../../../core/toastMessage/UdToastHub";
import { UdFullView } from "../../../core/view/compoment/UdFullView";
import { UdSeqList } from "../../../extension/basecore/UdSeqList";
import { UdBindMeta } from "../../../extension/basecore/UdDecoratorKit";
import { UdBtnSignal } from "../../../extension/components/GameBtn/UdBtnSignal";
import { UdButton } from "../../../extension/game/UdButton";
import { UdLabel } from "../../../extension/game/UdLabel";
import { UdSpine } from "../../../extension/game/UdSpine";
import { UdTimerHub } from "../../../extension/time/UdTimerHub";
import { UdReflectKit } from "../../../extension/utils/UdReflectKit";
import { UdRandomKit } from "../../../extension/utils/UdRandomKit";
import { UdPanelSignal } from "../../../extension/view/types/UdPanelSignal";
import { UdLayerKind } from "../../../extension/view/types/UdLayerKind";
import { UdFruitBlock } from "../items/UdFruitBlock";
import { IUdGameScore, UdGameResult } from "./UdGameResult";
import { UdSettingView } from "../../udSetting/UdSettingView";
import { UdHapticHub } from "../../../extension/haptic/UdHapticHub";
import { UdHintingHub } from "../../UdHinting/UdHintingHub";
import { UdComboPraiseHub } from "../combo/UdComboPraiseHub";
import { UdCoinFly } from "../coin/UdCoinFly";
import { UdMathLabel } from "../../../extension/game/UdMathLabel";
import { IUdTipViewData, UdTipView } from "../../udCommon/views/UdTipView";
import { getLevelConfig, IUdLevelConfig } from "../config/UdLevelConfig";
import { IUdTickable } from "../../../extension/update/IUdTickable";
import { UdTickHub } from "../../../extension/update/UdTickHub";

/** Game play state enum */
const enum PlayPhase {
    Idle = 0,
    Running = 1,
    Spawning = 2,
    Finished = 3,
    Notified = 4,
}

/** Persisted fruit on board (hand = 当前待操作 / 下一个预览) */
interface IUdGameSaveFruit {
    id: number;
    x: number;
    y: number;
    sx: number;
    sy: number;
    /** 0 static, 1 dynamic */
    dyn: number;
    vx: number;
    vy: number;
    hasFun: boolean;
    hasContact: boolean;
    /** 0 场上, 1 当前可操作, 2 预览位 */
    hand: number;
}

interface IUdGameSave {
    v: number;
    spawnSequence: number[];
    dropCount: number;
    score: number;
    fruits: IUdGameSaveFruit[];
    stage: number;
}

@UdBindMeta
export class UdGameMain extends UdFullView {
    // ---- cache keys ----
    private static readonly STAGE_CACHE_KEY = "ud_stage_v1";
    private static readonly PLAY_TOKEN_CACHE_KEY = "ud_tokens_v1";
    private static readonly GAME_SAVE_CACHE_KEY = "ud_game_save_v1";
    private static readonly COMBO_WINDOW_SEC = 1.2;
    private static readonly COMBO_MIN = 2;

    // ---- serialized nodes ----
    fruit_prefab: cc.Node = undefined;
    fruit_content_node: cc.Node = undefined;
    boom_eff: cc.Node = undefined;
    eff_node: cc.Node = undefined;
    line_node: cc.Node = undefined;
    preview_info_node: cc.Node = undefined;
    score_node: cc.Node = undefined;
    bg_img: cc.Node = undefined;
    title_node: cc.Node = undefined;

    // ---- serialized labels & buttons ----
    desc_lb: UdLabel = undefined;
    score_lb: UdMathLabel = undefined;
    button_touch: UdButton = undefined;
    start_btn: UdButton = undefined;
    remaining_time_lb: UdLabel = undefined;
    add_power_btn: UdButton = undefined;
    setting_btn: UdButton = undefined;
    record_btn: UdButton = undefined;
    game_root: cc.Node = undefined;
    ground_1: cc.Node = undefined;
    ground_2_collider: cc.PhysicsBoxCollider = undefined;
    ground_3_collider: cc.PhysicsBoxCollider = undefined;
    help_btn: UdButton = undefined;
    stage_lb: UdLabel = undefined;
    passed_pro_bar: cc.ProgressBar = undefined;
    cost_power_lb: UdLabel = undefined;

    // ---- private nodes ----
    private skip_btn: UdButton;

    // ---- object pools ----
    __fruitCache = new UdSeqList<cc.Node>();
    __effCache = new UdSeqList<cc.Node>();

    // ---- fruit spawning state ----
    __activeFruit: cc.Node = undefined;
    __pendingFruit: cc.Node = undefined;
    __dropCount: number = 0;

    // ---- timers ----
    __endTimer = undefined;
    __spawnTimer = undefined;

    // ---- score ----
    __score: number = 0;

    // ---- phase tracker ----
    __phase: PlayPhase = PlayPhase.Idle;

    // ---- fruit config data ----
    __fruitLabels: string[] = ["lanmei", "shanzhu", "ningmeng", "hamigua", "qiyiguo", "huangtao", "yezi", "xigua", "daxigua"];
    __fruitBaseSizes: number[] = [50, 75, 100, 125, 150, 175, 200, 225, 250];
    __fruitScaledSizes: number[] = [];
    __spawnSequence: number[] = [];
    __sizeMultiplierBase: number = 1;
    __sizeMultiplierStep: number = 0;

    __rawConfig = undefined;
    __playTokens: number = 0;

    // ---- level system ----
    private __currentStage: number = 1;
    private __levelConfig: IUdLevelConfig = null;
    /** 进度条动画代理对象（由 cc.tween 驱动，UdTickHub 每帧同步到 passed_pro_bar） */
    private __progressAnimData = { value: 0 };
    private __progressTickHandler: IUdTickable = null;

    /** 点击"下一关"后跳过待机界面直接开始 */
    private __autoStartNext: boolean = false;

    /** 游戏已结束标志，防止结算界面被多次打开 */
    private __gameEnded: boolean = false;

    /** 连续合成计数（窗口内） */
    private __comboCount = 0;
    private __comboResetTimer = -1;

    // ==================== LIFECYCLE ====================

    public constructor() {
        super();
        this.prefabPath = "udGame/prefabs/UdGameMain";
    }

    public init(root: cc.Node): void {
        super.init(root);
        this.__bootPhysics();
        this.__bindNodeRefs();
        this._updateGroundSize(this.game_root.height);
        UdComboPraiseHub.Ins.init(this.root);
    }

    private __bindNodeRefs(): void {
        const R = this.UdResFinder;
        this.line_node = R.getNode("line_node");
        this.fruit_content_node = R.getNode("fruit_content_node");
        this.eff_node = R.getNode("eff_node");
        this.fruit_prefab = R.getNode("fruit_prefab");
        this.score_node = R.getNode("score_node");
        this.score_lb = R.getComponent("score_lb", UdMathLabel);
        this.preview_info_node = R.getNode("preview_info_node");
        this.start_btn = R.getComponent("start_btn", UdButton);
        this.desc_lb = R.getComponent("desc_lb", UdLabel);
        this.remaining_time_lb = R.getComponent("remaining_time_lb", UdLabel);
        this.add_power_btn = R.getComponent("add_power_btn", UdButton);
        this.boom_eff = R.getNode("boom_eff");
        this.skip_btn = R.getComponent("skip_btn", UdButton);
        this.button_touch = R.getComponent("UdGameMain", UdButton);
        this.setting_btn = R.getComponent("setting_btn", UdButton);
        this.record_btn = R.getComponent("record_btn", UdButton);
        this.game_root = R.getNode("game_root");
        this.ground_1 = R.getNode("ground_1");
        this.ground_2_collider = R.getComponent("ground_2", cc.PhysicsBoxCollider);
        this.ground_3_collider = R.getComponent("ground_3", cc.PhysicsBoxCollider);
        this.help_btn = R.getComponent("help_btn", UdButton);
        this.title_node = R.getNode("title_node");
        this.bg_img = R.getNode("bg_img");
        this.stage_lb = R.getComponent("stage_lb", UdLabel);
        this.passed_pro_bar = R.getComponent("passed_pro_bar", cc.ProgressBar);
        this.cost_power_lb = R.getComponent("cost_power_lb", UdLabel);
    }

    protected addEvents(): void {
        super.addEvents();
        this.button_touch.addListener(UdBtnSignal.FingerDown, this.__onScreenTap, this);
        this.start_btn.addListener(UdBtnSignal.FingerTap, this.__onStartTap, this);
        this.skip_btn.addListener(UdBtnSignal.FingerTap, this.__onSkipTap, this);
        this.add_power_btn.addListener(UdBtnSignal.FingerTap, this.__onTokenAdd, this);
        UdPanelHub.Ins.addListener(UdPanelSignal.PanelHide, this.__onResultDismissed, this);
        this.setting_btn.addListener(UdBtnSignal.FingerTap, this.__onSettingTap, this);
        this.help_btn.addListener(UdBtnSignal.FingerTap, this.__onHelpTap, this);
        this.record_btn.addListener(UdBtnSignal.FingerTap, this.__onRecordTap, this);
    }

    protected removeEvents(): void {
        super.removeEvents();
        this.button_touch.removeListener(UdBtnSignal.FingerDown, this.__onScreenTap, this);
        this.start_btn.removeListener(UdBtnSignal.FingerTap, this.__onStartTap, this);
        this.skip_btn.removeListener(UdBtnSignal.FingerTap, this.__onSkipTap, this);
        this.add_power_btn.removeListener(UdBtnSignal.FingerTap, this.__onTokenAdd, this);
        UdPanelHub.Ins.removeListener(UdPanelSignal.PanelHide, this.__onResultDismissed, this);
        this.setting_btn.removeListener(UdBtnSignal.FingerTap, this.__onSettingTap, this);
        this.record_btn.removeListener(UdBtnSignal.FingerTap, this.__onRecordTap, this);
    }

    public updateView(arg?: any): void {
        super.updateView(arg);

        // parse level config
        this.__rawConfig = [
            [
                [1, 3000, 0],
                [2, 3000, 1],
                [3, 2000, 2],
                [4, 2000, 4],
                [5, 0, 8],
                [6, 0, 16],
                [7, 0, 32],
                [8, 0, 64],
                [9, 0, 128]
            ]
            , [1, 2]
            , 1000
        ];

        this.__computeScaledSizes();
        this.__currentStage = this.__loadStage();
        this.__levelConfig = getLevelConfig(this.__currentStage);
        // 金币动画完成后同步进度条，并检测是否通关
        UdCoinFly.onScoreCommit = () => {
            // 游戏已结束（结算界面已打开），忽略后续到达的金币
            if (this.__gameEnded) return;
            this.__refreshProgressBar();
            // 到达通关分数自动结束本局
            const cfg = this.__getCurrentLevelConfig();
            if (cfg.passScore > 0 && this.__score >= cfg.passScore) {
                this.__notifyGameOver(true);
            }
        };
        this.__resetState();
        this.__enterIdleUI();
        this.__prewarmFruitCache();
        this.__syncTokenDisplay();
        // 点击"下一关"后跳过待机界面直接开始
        if (this.__autoStartNext) {
            this.__autoStartNext = false;
            UdTimerHub.Ins.callFew(() => {
                this.__onStartTap();
            });
        }
        UdHintingHub.Ins.onTrigger("viewReady", {
            view: "UdGameMain",
            gamePhase: "idle",
        });
    }

    // ==================== STATE RESET ====================

    private __resetState(): void {
        this.__score = 0;
        this.__phase = PlayPhase.Idle;
        this.__gameEnded = false;
        this.__activeFruit = undefined;
        this.__pendingFruit = undefined;
        this.__dropCount = 0;
        this.skip_btn.node.active = false;
        this.__resetCombo();
        UdComboPraiseHub.Ins.hide();
        this.__applyLevelConfig();
        // 重新启用物理（结算时被关闭）
        cc.director.getPhysicsManager().enabled = true;
    }

    private __bumpCombo(): number {
        this.__comboCount++;
        if (this.__comboResetTimer >= 0) {
            UdTimerHub.Ins.remove(this.__comboResetTimer);
        }
        this.__comboResetTimer = UdTimerHub.Ins.callLater(UdGameMain.COMBO_WINDOW_SEC, () => {
            this.__comboCount = 0;
            this.__comboResetTimer = -1;
        });
        return this.__comboCount;
    }

    private __resetCombo(): void {
        this.__comboCount = 0;
        if (this.__comboResetTimer >= 0) {
            UdTimerHub.Ins.remove(this.__comboResetTimer);
            this.__comboResetTimer = -1;
        }
    }

    private __computeScaledSizes(): void {
        const out: number[] = [];
        const base = this.__sizeMultiplierBase;
        const step = this.__sizeMultiplierStep;
        for (let i = 0; i < this.__fruitBaseSizes.length; i++) {
            out.push(this.__fruitBaseSizes[i] * (base + i * step));
        }
        this.__fruitScaledSizes = out;
    }

    private __enterIdleUI(): void {
        this.__purgeTimers();
        this.__recycleAllFruit();
        this.__resetRedLine();
        this.preview_info_node.active = true;
        this.title_node.active = true;
        this.add_power_btn.node.active = true;
        this.__applyScoreBadge();
        UdTimerHub.Ins.callFew(() => {
            UdHintingHub.Ins.onTrigger("gameIdle", {
                view: "UdGameMain",
                gamePhase: "idle",
            });
        });
    }

    // ==================== PHYSICS SETUP ====================

    private __bootPhysics(): void {
        const pmgr = cc.director.getPhysicsManager();
        pmgr.enabled = true;
        pmgr.gravity = cc.v2(0, -960);

        const cmgr = cc.director.getCollisionManager();
        cmgr.enabled = true;
        cmgr.enabledDebugDraw = false;
    }

    // ==================== TOKEN MANAGEMENT ====================

    private __syncTokenDisplay(): void {
        let raw = cc.sys.localStorage.getItem(UdGameMain.PLAY_TOKEN_CACHE_KEY);
        let tokens = Number(raw);
        if (raw == null || isNaN(Number(raw))) {
            tokens = 999;
            this.__persistTokens(tokens);
            return;
        }
        this.__playTokens = tokens;
        this.remaining_time_lb.string = `${this.__playTokens}`;
    }

    private __persistTokens(tokens: number): void {
        cc.sys.localStorage.setItem(UdGameMain.PLAY_TOKEN_CACHE_KEY, tokens.toString());
        this.__syncTokenDisplay();
    }

    // ==================== START FLOW ====================

    private __onStartTap(): void {
        const cfg = this.__getCurrentLevelConfig();
        if (this.__playTokens < cfg.staminaCost) {
            UdToastHub.Ins.show("体力不足，请先获取体力");
            return;
        }
        this.__playTokens -= cfg.staminaCost;
        this.__persistTokens(this.__playTokens);

        this.__phase = PlayPhase.Running;
        this.preview_info_node.active = false;
        this.title_node.active = false;
        this.add_power_btn.node.active = false;
        this.skip_btn.node.active = true;
        UdTimerHub.Ins.callFew(() => {
            UdHintingHub.Ins.onTrigger("gameRunning", { gamePhase: "running" });
        });
        this.__bootstrapRound();
    }

    private __bootstrapRound(): void {
        this._updateGroundSize(this.game_root.height);
        this.__buildSpawnSequence();
        this.__trySpawnNextFruit();
    }

    // ==================== SPAWN SEQUENCE BUILDER ====================

    private __buildSpawnSequence(): void {
        const cfg = this.__rawConfig as any[];
        const weightTable: number[][] = cfg[0];
        const fixedHead: number[] = cfg[1];
        const totalCount: number = cfg[2];

        const seq: number[] = [];

        // Push fixed head items (zero-indexed)
        for (let i = 0; i < fixedHead.length; i++) {
            seq.push(fixedHead[i] - 1);
        }

        // Weighted random fill
        const fillCount = totalCount - fixedHead.length;
        const maxRoll = 10000;
        for (let n = 0; n < fillCount; n++) {
            let roll = UdRandomKit.getRandomInt(1, maxRoll);
            let chosen = weightTable[weightTable.length - 1][0] - 1; // default: last tier
            for (let j = 0; j < weightTable.length; j++) {
                if (roll <= weightTable[j][1]) {
                    chosen = weightTable[j][0] - 1;
                    break;
                }
                roll -= weightTable[j][1];
            }
            seq.push(chosen);
        }

        this.__spawnSequence = seq;
    }

    // ==================== FRUIT SPAWNING ====================

    private __trySpawnNextFruit(): void {
        const idx = this.__dropCount;
        const curType = this.__spawnSequence[idx];
        const nextType = this.__spawnSequence[idx + 1];
        const baselineY = this.line_node.y;
        const gap = 10;

        if (curType !== undefined && nextType !== undefined) {
            this.__spawnBoth(curType, nextType, baselineY, gap);
        } else if (curType !== undefined) {
            this.__spawnSingle(curType, baselineY, gap);
        } else {
            // No more fruit — end game after delay
            this.__phase = PlayPhase.Finished;
            this.__endTimer = UdTimerHub.Ins.callLater(5, () => this.__notifyGameOver());
        }
    }

    private __spawnBoth(curType: number, nextType: number, baseY: number, gap: number): void {
        const curR = this.__fruitScaledSizes[curType] / 2;
        const nextR = this.__fruitScaledSizes[nextType] / 2;
        const curY = baseY + gap + curR;
        const nextY = curY + curR + gap + nextR;

        if (this.__activeFruit === undefined && this.__pendingFruit === undefined) {
            this.__activeFruit = this.__instantiateFruit(0, curY, curType);
            this.__pendingFruit = this.__instantiateFruit(0, nextY, nextType);
            this.__phase = PlayPhase.Running;
        } else if (this.__activeFruit === undefined) {
            this.__activeFruit = this.__pendingFruit;
            cc.tween(this.__activeFruit)
                .to(0.1, { position: cc.v3(0, curY, 0) })
                .call(() => { this.__phase = PlayPhase.Running; })
                .start();
            this.__pendingFruit = this.__instantiateFruit(0, nextY, nextType);
            this.__pendingFruit.scale = 0;
            cc.tween(this.__pendingFruit).delay(0.1).to(0.3, { scale: 1 }, { easing: cc.easing.backOut }).start();
        }
    }

    private __spawnSingle(curType: number, baseY: number, gap: number): void {
        const curR = this.__fruitScaledSizes[curType] / 2;
        const curY = baseY + gap + curR;

        if (this.__activeFruit === undefined && this.__pendingFruit === undefined) {
            this.__activeFruit = this.__instantiateFruit(0, curY, curType);
            this.__phase = PlayPhase.Running;
        } else if (this.__activeFruit === undefined) {
            this.__activeFruit = this.__pendingFruit;
            cc.tween(this.__activeFruit)
                .to(0.2, { position: cc.v3(0, curY, 0) })
                .call(() => { this.__phase = PlayPhase.Running; })
                .start();
        }
    }

    // ==================== TOUCH HANDLING ====================

    private __onScreenTap(target: any, args: any[]): void {
        if (UdHintingHub.Ins.isForceGuiding()) return;
        if (this.__phase !== PlayPhase.Running) return;
        if (this.__activeFruit === undefined) return;

        const fruit = this.__activeFruit;
        this.__activeFruit = undefined;
        this.__dropCount += 1;
        this.__phase = PlayPhase.Spawning;

        const evt = args[0];
        const worldPos = evt.getLocation();
        const localPos = this.fruit_content_node.convertToNodeSpaceAR(worldPos);

        const dropAction = cc.sequence(
            cc.moveBy(0.1, cc.v2(localPos.x, 0)).easing(cc.easeCubicActionIn()),
            cc.callFunc(() => {
                this.__enableFruitPhysics(fruit);
                fruit.getComponent(UdFruitBlock).checkRedLine(this.line_node.y);
                this.__spawnTimer = UdTimerHub.Ins.callLater(0.5, () => this.__trySpawnNextFruit());
            })
        );
        fruit.runAction(dropAction);
    }

    private __enableFruitPhysics(node: cc.Node): void {
        const body = node.getComponent(cc.RigidBody);
        body.type = cc.RigidBodyType.Dynamic;
        const collider = node.getComponent(cc.PhysicsCircleCollider);
        collider.radius = node.height / 2;
        collider.apply();
    }

    // ==================== MERGE / COLLISION ====================

    private __onFruitCollide({ self, other }: { self: cc.PhysicsCollider; other: cc.PhysicsCollider }): void {
        // 游戏已结束，忽略后续碰撞
        if (this.__gameEnded) return;
        other.node.off('CollideEvent');
        self.node.off('CollideEvent');

        const otherBlock = other.getComponent(UdFruitBlock);
        const upgradeId = otherBlock.id + 1;
        const maxTier = this.__fruitLabels.length;

        if (upgradeId < maxTier) {
            // Compute merge midpoint
            const mx = (self.node.x + other.node.x) * 0.5;
            const my = (self.node.y + other.node.y) * 0.5;

            // Recycle both
            this.__enqueueFruit(self.node);
            this.__enqueueFruit(other.node);

            // Play merge vfx
            this.__playMergeEffect(upgradeId, cc.v2(mx, my), other.node.width);

            const combo = this.__bumpCombo();
            if (combo >= UdGameMain.COMBO_MIN) {
                UdComboPraiseHub.Ins.show(combo);
            }

            // Spawn upgraded fruit on next frame
            UdTimerHub.Ins.callFew(() => {
                const merged = this.__instantiateFruit(mx, my, upgradeId);
                this.__enableFruitPhysics(merged);
                merged.getComponent(UdFruitBlock).checkRedLine(this.line_node.y);

                // Pop-in tween
                merged.scale = 0;
                cc.tween(merged).to(0.5, { scale: 1 }, { easing: cc.easing.backOut }).start();

                // Score from config weight table
                const scoreTable = this.__rawConfig[0] as number[][];
                const earnedScore = (scoreTable[upgradeId] && scoreTable[upgradeId][2]) || 0;

                // ---- coin burst ----
                if (earnedScore > 0) {
                    const worldPos = this.eff_node.convertToWorldSpaceAR(cc.v2(mx, my));
                    const coinCount = Math.min(earnedScore, 16);
                    const scorePerCoin = Math.ceil(earnedScore / coinCount);
                    for (let i = 0; i < coinCount; i++) {
                        UdCoinFly.spawn(
                            this.eff_node,
                            worldPos,
                            this.score_lb.node,
                            scorePerCoin,
                            i,
                            coinCount,
                            0.5
                        );
                    }
                }

                // Score tracked for save / game-over, display updated by coin batch
                this.__score += earnedScore;
                // 得分后立即检测通关（不等金币动画），Notified 守卫防重复
                const cfg = this.__getCurrentLevelConfig();
                if (cfg.passScore > 0 && this.__score >= cfg.passScore) {
                    this.__notifyGameOver(true);
                }

            });
        }
    }

    private __playMergeEffect(tier: number, pos: cc.Vec2, refSize: number): void {
        const fxNode = cc.instantiate(this.boom_eff);
        this.eff_node.addChild(fxNode);
        fxNode.active = true;
        fxNode.setPosition(pos);
        fxNode.scale = refSize / fxNode.width;

        const spine = fxNode.getComponent(UdSpine);
        spine.play("ui_daxigua_1", false, true);
        spine.setCompleteListener(() => fxNode.destroy());

        UdHapticHub.Ins.vibrateShort();
    }

    // ==================== FRUIT INSTANTIATION & POOL ====================

    private __instantiateFruit(x: number, y: number, typeId: number): cc.Node {
        const fruit = this.__fruitCache.pop() ?? cc.instantiate(this.fruit_prefab);
        this.fruit_content_node.addChild(fruit);
        fruit.active = true;

        const block = fruit.getComponent(UdFruitBlock);
        block.setData({
            id: typeId,
            source: `udGame/ui/auto/fruit_${this.__fruitLabels[typeId]}_shuimo`,
            size: this.__fruitScaledSizes[typeId],
            hasFun: false,
            hasContact: false,
        });

        fruit.getComponent(cc.RigidBody).type = cc.RigidBodyType.Static;
        fruit.getComponent(cc.PhysicsCircleCollider).radius = 0;

        fruit.on('CollideEvent', this.__onFruitCollide.bind(this));
        fruit.on('RedLineEvent', this.__onRedLineBreach.bind(this));
        fruit.setPosition(cc.v2(x, y));
        return fruit;
    }

    private __enqueueFruit(node: cc.Node): void {
        node.off('CollideEvent', this.__onFruitCollide.bind(this));
        node.off('RedLineEvent', this.__onRedLineBreach.bind(this));
        node.removeFromParent(true);
        node.active = false;
        node.getComponent(UdFruitBlock).stopCheckRedLine();
        this.__fruitCache.push(node);
    }

    private __recycleAllFruit(): void {
        const content = this.fruit_content_node;
        if (content) {
            content.children.forEach((f) => {
                f.off('CollideEvent', this.__onFruitCollide.bind(this));
                f.off('RedLineEvent', this.__onRedLineBreach.bind(this));
                f.active = false;
                f.getComponent(UdFruitBlock).stopCheckRedLine();
                this.__fruitCache.push(f);
            });
            content.removeAllChildren();
        }
        this.__fruitCache.forEach((n) => n.destroy());
        this.__fruitCache.length = 0;
    }

    private __prewarmFruitCache(): void {
        for (let i = 0; i < this.__fruitLabels.length; i++) {
            const pre = cc.instantiate(this.fruit_prefab);
            pre.getComponent(UdFruitBlock).setData({
                id: i,
                source: `udGame/ui/auto/fruit_${this.__fruitLabels[i]}_shuimo`,
                size: this.__fruitScaledSizes[i],
                hasFun: false,
                hasContact: false,
            });
            this.__fruitCache.push(pre);
        }
    }

    // ==================== RED LINE ====================

    private __onRedLineBreach(): void {
        this.__phase = PlayPhase.Finished;
        this.fruit_content_node.children.forEach((n) => {
            n.getComponent(cc.RigidBody).type = cc.RigidBodyType.Static;
        });

        // Flash the red line
        cc.tween(this.line_node)
            .to(0.5, { opacity: 30 })
            .to(0.5, { opacity: 255 })
            .to(0.5, { opacity: 30 })
            .to(0.5, { opacity: 255 })
            .call(() => this.__notifyGameOver())
            .start();
    }

    private __resetRedLine(): void {
        cc.Tween.stopAllByTarget(this.line_node);
        this.line_node.opacity = 255;
    }

    // ==================== SCORE ====================

    private __applyScoreBadge(): void {
        const cfg = this.__getCurrentLevelConfig();
        this.score_lb.suffix = ` / ${cfg.passScore}`;
        this.score_lb.value = this.__score;
        this.__refreshProgressBar();
        this.__tryHintOnScore();
    }

    /** 本局积分变化时尝试触发依赖 minScore 的指引 */
    private __tryHintOnScore(): void {
        if (this.__phase !== PlayPhase.Running) {
            return;
        }
        UdHintingHub.Ins.onTrigger("gameScore", {
            gamePhase: "running",
            score: this.__score,
        });
    }

    // ==================== LEVEL SYSTEM ====================

    private __loadStage(): number {
        const raw = cc.sys.localStorage.getItem(UdGameMain.STAGE_CACHE_KEY);
        const val = Number(raw || 1);
        return Number.isFinite(val) && val >= 1 ? Math.floor(val) : 1;
    }

    private __saveStage(stage: number): void {
        cc.sys.localStorage.setItem(UdGameMain.STAGE_CACHE_KEY, `${stage}`);
    }

    private __getCurrentLevelConfig(): IUdLevelConfig {
        if (!this.__levelConfig) {
            this.__levelConfig = getLevelConfig(this.__currentStage);
        }
        return this.__levelConfig;
    }

    /** 根据当前关卡配置刷新 UI（stage_lb / cost_power_lb / score_lb / progress bar） */
    private __applyLevelConfig(): void {
        const cfg = this.__getCurrentLevelConfig();
        this.stage_lb.string = `第${cfg.stage}关`;
        this.cost_power_lb.string = `${cfg.staminaCost}`;
        this.score_lb.suffix = ` / ${cfg.passScore}`;
        this.__refreshProgressBar();
    }

    /** 如果本局分数达到通关线，推进到下一关 */
    private __advanceStageIfNeeded(): void {
        const cfg = this.__getCurrentLevelConfig();
        if (cfg.passScore > 0 && this.__score >= cfg.passScore) {
            const nextStage = this.__currentStage + 1;
            const nextCfg = getLevelConfig(nextStage);
            if (nextCfg.stage === nextStage) {
                this.__currentStage = nextStage;
                this.__levelConfig = nextCfg;
            }
        }
        this.__saveStage(this.__currentStage);
    }

    /** 计算进度目标值并启动动画 */
    private __refreshProgressBar(): void {
        const cfg = this.__getCurrentLevelConfig();
        const target = cfg.passScore > 0
            ? Math.min(this.__score / cfg.passScore, 1)
            : 0;
        this.__animateProgress(target);
    }

    /** 使用 cc.tween + UdTickHub 平滑动画进度条 */
    private __animateProgress(target: number): void {
        // tick handler 持久化，不反复创建/销毁
        if (!this.__progressTickHandler) {
            this.__progressTickHandler = {
                onUpdate: (): void => {
                    if (this.passed_pro_bar) {
                        this.passed_pro_bar.progress = this.__progressAnimData.value;
                    }
                },
            };
            UdTickHub.Ins.addUpdateHandler(this.__progressTickHandler);
        }

        // 停止旧动画，从当前位置开始新动画
        cc.Tween.stopAllByTarget(this.__progressAnimData);
        this.__progressAnimData.value = this.passed_pro_bar.progress;
        cc.tween(this.__progressAnimData)
            .to(0.3, { value: target }, { easing: cc.easing.sineOut })
            .start();
    }

    // ==================== GAME OVER ====================

    private __onSkipTap(): void {
        let viewParams: IUdTipViewData = {
            title: "提示",
            content: "确定跳过当局游戏吗？",
            alignVertical: cc.Label.VerticalAlign.CENTER,
            alignHorizontal: cc.Label.HorizontalAlign.CENTER,
            leftBtnStyle: {
                text: "取消",
                clickCallBack: null
            },
            rightBtnStyle: {
                text: "确定",
                clickCallBack: () => {
                    this.__notifyGameOver(false);
                }
            }
        }
        UdPanelHub.Ins.open(UdTipView, UdLayerKind.Panel, viewParams);
    }

    private __onTokenAdd(): void {
        this.__playTokens++;
        this.__persistTokens(this.__playTokens);
    }

    private __notifyGameOver(enterMainGame: boolean = true): void {
        if (this.__gameEnded) return;

        // 在推进关卡前先判断本局是否通关（推进后 cfg 会变）
        const cfg = this.__getCurrentLevelConfig();
        const isCleared = cfg.passScore > 0 && this.__score >= cfg.passScore;

        // 在分数重置前检查是否通关并推进关卡
        this.__advanceStageIfNeeded();

        this.__gameEnded = true;
        this.__phase = PlayPhase.Notified;

        // 关闭物理，防止结算后继续碰撞触发新的金币
        cc.director.getPhysicsManager().enabled = false;

        this.__clearSave();

        const displayScore = this.__score;
        // 下一关是否存在
        const nextCfg = getLevelConfig(this.__currentStage + 1);
        const hasNextStage = isCleared && nextCfg.stage === this.__currentStage + 1;
        const payload: IUdGameScore = {
            num: displayScore,
            enterMainGame,
            result: isCleared ? 1 : 0,
            hasNextStage,
            onNextStage: hasNextStage ? () => {
                this.__autoStartNext = true;
                UdPanelHub.Ins.close(UdGameResult, false);
            } : undefined,
        };
        UdPanelHub.Ins.open(UdGameResult, UdLayerKind.Panel, payload);
    }

    private __onResultDismissed(target: UdPanelHub, args: [string]): void {
        const clsName = args[0];
        if (clsName && clsName === UdReflectKit.getClassName(UdGameResult)) {
            this.updateView();
            UdHintingHub.Ins.onTrigger("gameResultClosed", { gamePhase: "idle" });
        }
    }

    private __onSettingTap(): void {
        UdPanelHub.Ins.open(UdSettingView, UdLayerKind.Panel);
    }

    private __onHelpTap(): void {
        let ctnArr: string[] = [];
        ctnArr.push("一、操作规则");
        ctnArr.push("        玩家选择并点击屏幕位置，上方的水果会以经过此位置的竖线为路径开始向下掉落；");
        ctnArr.push("二、合成规则");
        ctnArr.push("        相同的水果在触碰到的瞬间会合成更大一级的水果，最高级的大西瓜不会再向上合成；");
        ctnArr.push("三、合成积分");
        ctnArr.push("        每次合成水果都可获得积分，合成越大的水果获得的积分越多，合成各级水果获得的积分数据如下：");
        ctnArr.push("        0级蓝莓（0积分）");
        ctnArr.push("        1级山竹（1积分）");
        ctnArr.push("        2级柠檬（2积分）");
        ctnArr.push("        3级哈密瓜（4积分）");
        ctnArr.push("        4级猕猴桃（8积分）");
        ctnArr.push("        5级黄桃（16积分）");
        ctnArr.push("        6级椰子（32积分）");
        ctnArr.push("        7级西瓜半（64积分）");
        ctnArr.push("        8级大西瓜（128积分）");
        ctnArr.push("四、游戏奖励：");
        ctnArr.push("        1.玩家单局游戏消耗一次游戏机会；");
        ctnArr.push("        2.玩家单局达到800积分时，免扣本局游戏机会且和额外获得一次游戏机会；");

        let viewParams: IUdTipViewData = {
            title: "游戏规则",
            content: ctnArr.join("\n"),
        }

        UdPanelHub.Ins.open(UdTipView, UdLayerKind.Panel, viewParams);
    }

    // ==================== SAVE / LOAD ====================

    private __canSaveNow(): boolean {
        return this.__phase === PlayPhase.Running
            || this.__phase === PlayPhase.Spawning
            || this.__phase === PlayPhase.Finished;
    }

    private __readGameSave(): IUdGameSave | null {
        try {
            const raw = cc.sys.localStorage.getItem(UdGameMain.GAME_SAVE_CACHE_KEY);
            if (raw == null || raw === "") return null;
            const o = JSON.parse(raw) as IUdGameSave;
            if (o == null || o.v !== 1 || !Array.isArray(o.spawnSequence)) return null;
            if (!Array.isArray(o.fruits)) return null;
            return o;
        } catch {
            return null;
        }
    }

    private __writeGameSave(data: IUdGameSave): void {
        cc.sys.localStorage.setItem(UdGameMain.GAME_SAVE_CACHE_KEY, JSON.stringify(data));
    }

    private __clearSave(): void {
        cc.sys.localStorage.removeItem(UdGameMain.GAME_SAVE_CACHE_KEY);
    }

    private __serializeBoard(): IUdGameSave {
        const fruits: IUdGameSaveFruit[] = [];
        const content = this.fruit_content_node;
        if (content) {
            for (let i = 0; i < content.children.length; i++) {
                const node = content.children[i];
                const block = node.getComponent(UdFruitBlock);
                if (!block) continue;
                const rb = node.getComponent(cc.RigidBody);
                const isDyn = rb != null && rb.type === cc.RigidBodyType.Dynamic;
                const lv = rb != null ? rb.linearVelocity : cc.v2(0, 0);
                let hand = 0;
                if (node === this.__activeFruit) hand = 1;
                else if (node === this.__pendingFruit) hand = 2;
                fruits.push({
                    id: block.id,
                    x: node.x,
                    y: node.y,
                    sx: node.scaleX,
                    sy: node.scaleY,
                    dyn: isDyn ? 1 : 0,
                    vx: lv.x,
                    vy: lv.y,
                    hasFun: block.hasFun,
                    hasContact: block.hasContact,
                    hand,
                });
            }
        }
        return {
            v: 1,
            spawnSequence: this.__spawnSequence.slice(),
            dropCount: this.__dropCount,
            score: this.__score,
            fruits,
            stage: this.__currentStage,
        };
    }

    private __detachAllFruitsFromField(): void {
        const content = this.fruit_content_node;
        if (!content) return;
        while (content.children.length > 0) {
            this.__enqueueFruit(content.children[0]);
        }
        this.__activeFruit = undefined;
        this.__pendingFruit = undefined;
    }

    private __spawnFruitFromSnapshot(s: IUdGameSaveFruit): cc.Node {
        const fruit = this.__instantiateFruit(s.x, s.y, s.id);
        fruit.setScale(s.sx, s.sy);
        const block = fruit.getComponent(UdFruitBlock);
        block.setData({
            id: s.id,
            source: `udGame/ui/auto/fruit_${this.__fruitLabels[s.id]}_shuimo`,
            size: this.__fruitScaledSizes[s.id],
            hasFun: s.hasFun,
            hasContact: s.hasContact,
        });
        if (s.dyn === 1) {
            this.__enableFruitPhysics(fruit);
            const rb = fruit.getComponent(cc.RigidBody);
            if (rb != null) {
                rb.linearVelocity = cc.v2(s.vx, s.vy);
            }
        }
        return fruit;
    }

    private __applyGameSave(save: IUdGameSave): void {
        this.__purgeTimers();
        this.__spawnSequence = save.spawnSequence.slice();
        this.__dropCount = save.dropCount;
        this.__score = save.score;

        // 从存档恢复关卡
        if (save.stage != null && save.stage >= 1) {
            this.__currentStage = save.stage;
            this.__levelConfig = getLevelConfig(this.__currentStage);
        }

        this.__detachAllFruitsFromField();

        this.__phase = PlayPhase.Running;
        this.preview_info_node.active = false;
        this.title_node.active = false;
        this.add_power_btn.node.active = false;
        this.skip_btn.node.active = true;

        let active: cc.Node = undefined;
        let pending: cc.Node = undefined;
        for (let i = 0; i < save.fruits.length; i++) {
            const node = this.__spawnFruitFromSnapshot(save.fruits[i]);
            if (save.fruits[i].hand === 1) active = node;
            if (save.fruits[i].hand === 2) pending = node;
        }
        this.__activeFruit = active;
        this.__pendingFruit = pending;

        if (save.fruits.length === 0) {
            this.__trySpawnNextFruit();
        }

        this.__applyScoreBadge();
    }

    private __onRecordTap(): void {
        if (this.__phase === PlayPhase.Idle) {
            const save = this.__readGameSave();
            if (save != null) {
                this.__applyGameSave(save);
                UdToastHub.Ins.show("已读取存档");
            } else {
                // this.__onStartTap();
                UdToastHub.Ins.show("暂无存档");
            }
            return;
        }

        if (!this.__canSaveNow()) {
            return;
        }

        const payload = this.__serializeBoard();
        this.__writeGameSave(payload);

        this.__purgeTimers();
        this.__resetState();
        this.__enterIdleUI();
        UdToastHub.Ins.show("已存档");
    }

    // ==================== TIMER CLEANUP ====================

    private __purgeTimers(): void {
        if (this.__spawnTimer) { UdTimerHub.Ins.remove(this.__spawnTimer); this.__spawnTimer = undefined; }
        if (this.__endTimer) { UdTimerHub.Ins.remove(this.__endTimer); this.__endTimer = undefined; }
    }

    // ==================== TEARDOWN ====================

    protected onClose(): void {
        super.onClose();
        this.__purgeTimers();
        this.__recycleAllFruit();
        this.__resetRedLine();
        // 清理金币回调 + 进度条动画 tick handler
        UdCoinFly.onScoreCommit = null;
        if (this.__progressTickHandler) {
            UdTickHub.Ins.removeUpdateHandler(this.__progressTickHandler);
            this.__progressTickHandler = null;
        }
        cc.Tween.stopAllByTarget(this.__progressAnimData);
    }

    private _updateGroundSize(height: number) {
        this.game_root.height = height;
        this.game_root.getComponent(cc.Widget).updateAlignment();
        this.ground_2_collider.node.height = height;
        this.ground_2_collider.size = cc.size(200, height);
        this.ground_3_collider.node.height = height;
        this.ground_3_collider.size = cc.size(200, height);
    }



}
