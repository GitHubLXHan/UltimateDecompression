import { BaseView } from "../../../core/view/compoment/BaseView";
import { RefClass } from "../../../extension/basecore/RefDecorator";
import { BtnEventType } from "../../../extension/components/GameBtn/BtnEventType";
import { GameButton } from "../../../extension/game/GameButton";
import { GameLabel } from "../../../extension/game/GameLabel";
import { GameSprite } from "../../../extension/game/GameSprite";
import { UDGConfigRepo } from "../logic/UDGConfigRepo";
import { UDGGameSession, UDGSessionViewBridge } from "../logic/UDGGameSession";

const UDG_GRID_BALL_ICON_FALLBACK = "watermelonMinGame/ui/auto/ssy_img_lanmei";

@RefClass
export class UltimateDecompressionGameView extends BaseView implements UDGSessionViewBridge {
    bg_img_node: cc.Node = undefined;
    game_container_node: cc.Node = undefined;
    /** 预制内玩法滚动层，缺省时由 Session 运行时创建 */
    stage_root_node: cc.Node = undefined;
    reward_pool_node: cc.Node = undefined;
    top_panel_node: cc.Node = undefined;
    grid_root_node: cc.Node = undefined;
    drop_btn_node: cc.Node = undefined;
    bottom_panel_node: cc.Node = undefined;
    buy_ball_btn_node: cc.Node = undefined;
    upgrade_profit_btn_node: cc.Node = undefined;

    drop_btn: GameButton = undefined;
    buy_ball_btn: GameButton = undefined;
    upgrade_profit_btn: GameButton = undefined;
    level_lb: GameLabel = undefined;
    gold_lb: GameLabel = undefined;

    private _repo: UDGConfigRepo = undefined;
    private _session: UDGGameSession = undefined;
    private _ui_state: "idle" | "running" = "idle";
    private _udg_tick_bound: (dt: number) => void = undefined;

    public constructor() {
        super();
        this.skinName = "UltimateDecompressionGame/prefabs/ultimateDecompressionGameView";
    }

    public init(root: cc.Node): void {
        super.init(root);
        this.bg_img_node = this.ResBase.getNode("bg_img");
        this.game_container_node = (this.root && this.root.getChildByName("game_container")) || this.ResBase.getNode("game_container");
        this.stage_root_node =
            this.game_container_node && this.game_container_node.getChildByName("stage_root");
        this.reward_pool_node = (this.root && this.root.getChildByName("reward_pool")) || this.ResBase.getNode("reward_pool");
        this._udg_tick_bound = (dt: number) => {
            if (this._session) {
                this._session.tick(dt);
            }
        };
        this.top_panel_node = this.ResBase.getNode("top_panel");
        this.grid_root_node = this.ResBase.getNode("grid_root");
        this.drop_btn_node = this.ResBase.getNode("drop_btn");
        this.bottom_panel_node = this.ResBase.getNode("bottom_panel");
        this.buy_ball_btn_node = this.ResBase.getNode("buy_ball_btn");
        this.upgrade_profit_btn_node = this.ResBase.getNode("upgrade_profit_btn");

        this.drop_btn = this.ResBase.getComponent("drop_btn", GameButton);
        this.buy_ball_btn = this.ResBase.getComponent("buy_ball_btn", GameButton);
        this.upgrade_profit_btn = this.ResBase.getComponent("upgrade_profit_btn", GameButton);
        this.level_lb = this.ResBase.getComponent("level_lb", GameLabel);
        this.gold_lb = this.ResBase.getComponent("gold_lb", GameLabel);
    }

    public updateView(arg?: any): void {
        super.updateView(arg);
        this.bootstrap().catch((error) => {
            cc.error("[UltimateDecompressionGameView] bootstrap failed", error);
        });
    }

    protected addEvents(): void {
        super.addEvents();
        this.drop_btn && this.drop_btn.addListener(BtnEventType.OnTouchTap, this.onDropTap, this);
        this.buy_ball_btn && this.buy_ball_btn.addListener(BtnEventType.OnTouchTap, this.onBuyTap, this);
        this.upgrade_profit_btn && this.upgrade_profit_btn.addListener(BtnEventType.OnTouchTap, this.onUpgradeTap, this);
    }

    protected removeEvents(): void {
        super.removeEvents();
        this.drop_btn && this.drop_btn.removeListener(BtnEventType.OnTouchTap, this.onDropTap, this);
        this.buy_ball_btn && this.buy_ball_btn.removeListener(BtnEventType.OnTouchTap, this.onBuyTap, this);
        this.upgrade_profit_btn && this.upgrade_profit_btn.removeListener(BtnEventType.OnTouchTap, this.onUpgradeTap, this);
    }

    protected onDestroy(): void {
        super.onDestroy();
        this.stopUdgTick();
        this._session && this._session.destroy();
    }

    public refreshTopInfo(gold: number, level: number): void {
        if (this.gold_lb) {
            this.gold_lb.string = `金币 ${Math.floor(gold)}`;
        }
        if (this.level_lb) {
            this.level_lb.string = `关卡 ${Math.floor(level)}`;
        }
    }

    public refreshPlacementGrid(): void {
        if (!this.grid_root_node || !this._session || !this._repo) {
            return;
        }
        const list = this._session.getSaveData().grid_ball_list || [];
        const by_cell: { [key: number]: number } = {};
        for (let i = 0; i < list.length; i += 1) {
            by_cell[list[i].cell_idx] = list[i].ball_id;
        }
        for (let row = 0; row < 4; row += 1) {
            for (let col = 0; col < 4; col += 1) {
                const cell_idx = row * 4 + col;
                const cell_node = this.grid_root_node.getChildByName(`cell_${row}_${col}`);
                if (!cell_node) {
                    continue;
                }
                const gs = cell_node.getComponent(GameSprite);
                if (!gs) {
                    continue;
                }
                const ball_id = by_cell[cell_idx];
                if (ball_id === undefined) {
                    gs.source = "";
                } else {
                    const cfg = this._repo.getBallById(ball_id);
                    gs.source = cfg.icon && cfg.icon.length > 0 ? cfg.icon : UDG_GRID_BALL_ICON_FALLBACK;
                }
            }
        }
    }

    public onRoundStart(): void {
        this.setUIState("running");
        if (!this.stage_root_node && this.game_container_node) {
            this.stage_root_node = this.game_container_node.getChildByName("stage_root");
        }
    }

    public onRoundEnd(round_gold: number, total_gold: number): void {
        this.setUIState("idle");
        this.refreshTopInfo(total_gold, this._session ? this._session.getCurrentLevel() : 1);
        cc.log(`[UDG] 本局结算 +${round_gold}, 总金币 ${total_gold}`);
    }

    private async bootstrap(): Promise<void> {
        this._repo = new UDGConfigRepo();
        await this._repo.loadAll();
        this._session = new UDGGameSession(this, this._repo);
        this._session.initSave();
        this.setUIState("idle");
        this.startUdgTick();
    }

    private onDropTap(): void {
        if (!this._session) {
            return;
        }
        if (!this._session.startRound()) {
            cc.log("[UDG] 当前无法开始（可能没有可下落球或已在运行中）");
        }
    }

    private onBuyTap(): void {
        if (!this._session) {
            return;
        }
        const result = this._session.buyBall();
        cc.log(`[UDG] ${result.msg}`);
        this.refreshTopInfo(this._session.getSaveData().player_gold, this._session.getCurrentLevel());
    }

    private onUpgradeTap(): void {
        if (!this._session) {
            return;
        }
        const result = this._session.upgradeProfit();
        cc.log(`[UDG] ${result.msg}`);
        this.refreshTopInfo(this._session.getSaveData().player_gold, this._session.getCurrentLevel());
    }

    private setUIState(state: "idle" | "running"): void {
        this._ui_state = state;
        const is_idle = state === "idle";
        if (this.grid_root_node) {
            this.grid_root_node.active = is_idle;
        }
        if (this.drop_btn_node) {
            this.drop_btn_node.active = is_idle;
        }
        if (this.bottom_panel_node) {
            this.bottom_panel_node.active = is_idle;
        }
        if (this.game_container_node) {
            this.game_container_node.active = !is_idle;
        }
        if (this.reward_pool_node) {
            this.reward_pool_node.active = !is_idle;
        }
    }

    private startUdgTick(): void {
        this.stopUdgTick();
        if (this.root && this._udg_tick_bound) {
            (this.root as any).schedule(this._udg_tick_bound, 0);
        }
    }

    private stopUdgTick(): void {
        if (this.root && this._udg_tick_bound) {
            (this.root as any).unschedule(this._udg_tick_bound);
        }
    }
}
