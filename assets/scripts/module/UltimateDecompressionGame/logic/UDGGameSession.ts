import { GameSprite } from "../../../extension/game/GameSprite";
import { UDGConfigRepo } from "./UDGConfigRepo";
import { UDGStorage } from "./UDGStorage";
import { UDGBallConfig, UDGGridBallData, UDGLevelConfig, UDGSaveData } from "./UDGTypes";

const DEFAULT_BALL_ICON = "watermelonMinGame/ui/auto/ssy_img_lanmei";
const DEFAULT_BLOCK_ICON = "watermelonMinGame/ui/auto/common_img_xinxik";
const UDG_DEBUG_LOG_KEY = "udg_follow_debug_log_v1";

interface UDGBlockRuntime {
    node: cc.Node;
    hp: number;
    gold: number;
    is_spike: boolean;
}

interface UDGBallRuntime {
    node: cc.Node;
    hp: number;
    collision_left: number;
    settled: boolean;
    still_ms: number;
}

export interface UDGSessionViewBridge {
    game_container_node: cc.Node;
    reward_pool_node: cc.Node;
    /** 可选：预制中的可滚动玩法层；缺省时在运行时创建 */
    stage_root_node?: cc.Node;
    refreshTopInfo(gold: number, level: number): void;
    /** 根据当前存档的 grid_ball_list 刷新放置格（待机态） */
    refreshPlacementGrid(): void;
    onRoundStart(): void;
    onRoundEnd(round_gold: number, total_gold: number): void;
}

export class UDGGameSession {
    private _bridge: UDGSessionViewBridge;
    private _repo: UDGConfigRepo;
    private _save_data: UDGSaveData;
    private _blocks: UDGBlockRuntime[] = [];
    private _balls: UDGBallRuntime[] = [];
    private _bounds: cc.Node[] = [];
    private _runtime_stage_root: cc.Node = undefined;
    private _round_gold = 0;
    private _is_running = false;
    private _gravity_enabled = false;
    private _elapsed = 0;
    private _stage_follow_y = 0;
    private _last_step_ms = 0;
    private _debug_lines: string[] = [];
    private _debug_last_flush_ts = 0;
    private _debug_last_persist_ts = 0;
    /** 本局开局时的放置格快照，回合结束时还原为「仍拥有的球」 */
    private _grid_snapshot: UDGGridBallData[] = [];
    /** 物理步之后再跟镜头，避免读到未同步的 node 坐标 */
    private readonly _before_draw_camera = (): void => {
        if (!this._is_running) {
            return;
        }
        // 某些环境下外部 schedule tick 可能不触发，这里兜底推进一帧回合逻辑。
        const now = Date.now();
        const dt = this.getStepDt(now);
        this.stepRound(dt);
        this.updateCameraFollow();
    };

    private readonly _min_speed = 120;
    private readonly _max_speed = 1200;
    private readonly _still_timeout_ms = 3200;
    /** 世界坐标下的兜底回收线，避免球永远不结算 */
    private _fallback_recycle_world_y = -8000;

    public constructor(bridge: UDGSessionViewBridge, repo: UDGConfigRepo) {
        this._bridge = bridge;
        this._repo = repo;
    }

    public initSave(): void {
        this._save_data = UDGStorage.load();
        this._bridge.refreshTopInfo(this._save_data.player_gold, this.getCurrentLevel());
        this._bridge.refreshPlacementGrid();
    }

    public getSaveData(): UDGSaveData {
        return this._save_data;
    }

    public getCurrentLevel(): number {
        const max_unlock = Math.max.apply(null, this._save_data.level_unlock_list || [1]);
        return max_unlock || 1;
    }

    public isRunning(): boolean {
        return this._is_running;
    }

    public buyBall(): { ok: boolean; msg: string } {
        const buy_cfg = this._repo.getBuyConfig(this._save_data.total_buy_count);
        if (this._save_data.player_gold < buy_cfg.cost) {
            return { ok: false, msg: "金币不足" };
        }
        const next_idx = this.findEmptyCellIndex();
        if (next_idx < 0) {
            return { ok: false, msg: "放置框已满" };
        }
        this._save_data.player_gold -= buy_cfg.cost;
        this._save_data.total_buy_count += 1;
        this._save_data.grid_ball_list.push({ cell_idx: next_idx, ball_id: buy_cfg.ball_id });
        UDGStorage.save(this._save_data);
        this._bridge.refreshTopInfo(this._save_data.player_gold, this.getCurrentLevel());
        this._bridge.refreshPlacementGrid();
        return { ok: true, msg: `购买成功 -${buy_cfg.cost}` };
    }

    public upgradeProfit(): { ok: boolean; msg: string } {
        const cost = 50;
        if (this._save_data.player_gold < cost) {
            return { ok: false, msg: "金币不足" };
        }
        this._save_data.player_gold -= cost;
        const next_level = this.getCurrentLevel() + 1;
        if (this._save_data.level_unlock_list.indexOf(next_level) < 0) {
            this._save_data.level_unlock_list.push(next_level);
        }
        UDGStorage.save(this._save_data);
        this._bridge.refreshTopInfo(this._save_data.player_gold, this.getCurrentLevel());
        return { ok: true, msg: "收益升级成功" };
    }

    public startRound(): boolean {
        if (this._is_running) {
            return false;
        }
        if (!this._save_data.grid_ball_list || this._save_data.grid_ball_list.length === 0) {
            return false;
        }
        this.clearRuntimeNodes();
        this._round_gold = 0;
        this._is_running = true;
        this._elapsed = 0;
        this._stage_follow_y = 0;
        this._last_step_ms = Date.now();
        this._debug_lines = [];
        this._debug_last_flush_ts = 0;
        this._debug_last_persist_ts = 0;
        this.ensurePhysics();
        this.ensureStageRoot();
        this.applyRoundLayout();
        this._bridge.onRoundStart();
        this._grid_snapshot = this._save_data.grid_ball_list.map((row) => ({
            cell_idx: row.cell_idx,
            ball_id: row.ball_id,
        }));
        this.spawnBounds();
        this.spawnBlocks();
        this.spawnBalls();
        this.hookCameraFollow();
        this.pushDebugLog("round_start");
        this.persistDebugLog("start_round");
        return true;
    }

    public tick(dt: number): void {
        const now = Date.now();
        // 防止与 EVENT_BEFORE_DRAW 的兜底步进重复执行。
        if (now - this._last_step_ms < 8) {
            return;
        }
        const safe_dt = this.getStepDt(now, dt);
        this.stepRound(safe_dt);
    }

    private stepRound(dt: number): void {
        if (!this._is_running) {
            return;
        }
        const ms = Math.max(0, dt * 1000);
        this._elapsed += dt;
        for (let i = this._balls.length - 1; i >= 0; i -= 1) {
            const runtime = this._balls[i];
            if (!runtime || !runtime.node || !runtime.node.isValid) {
                this._balls.splice(i, 1);
                continue;
            }
            this.limitSpeed(runtime);
            const rb = runtime.node.getComponent(cc.RigidBody);
            if (rb) {
                if (rb.linearVelocity.mag() < 20) {
                    runtime.still_ms += ms;
                } else {
                    runtime.still_ms = 0;
                }
                if (runtime.still_ms >= this._still_timeout_ms) {
                    this.recycleBall(i);
                    continue;
                }
            }
            const world_center = runtime.node.convertToWorldSpaceAR(cc.v2(0, 0));
            if (world_center.y < this.getRecycleWorldY()) {
                this.pushDebugLog(`recycle_by_world_y idx=${i} y=${world_center.y.toFixed(1)} threshold=${this.getRecycleWorldY().toFixed(1)}`);
                this.recycleBall(i);
                continue;
            }
            if (!runtime.settled && this.inRewardPool(runtime.node)) {
                runtime.settled = true;
                const multiple = this.getRewardMultipleByBallNode(runtime.node);
                const gold = Math.max(0, Math.floor(multiple * Math.max(0, runtime.hp)));
                this._round_gold += gold;
                this.pushDebugLog(`settle idx=${i} y=${world_center.y.toFixed(1)} mul=${multiple} gold=${gold}`);
                this.recycleBall(i);
                continue;
            }
        }
        this.checkBlockCollision();
        if (this._balls.length === 0) {
            this.endRound();
        }
    }

    private getStepDt(now_ms: number, fallback_dt?: number): number {
        if (!this._last_step_ms || this._last_step_ms <= 0) {
            this._last_step_ms = now_ms;
            return typeof fallback_dt === "number" && fallback_dt > 0 ? fallback_dt : 1 / 60;
        }
        const dt = (now_ms - this._last_step_ms) / 1000;
        this._last_step_ms = now_ms;
        if (dt <= 0 || !isFinite(dt)) {
            return typeof fallback_dt === "number" && fallback_dt > 0 ? fallback_dt : 1 / 60;
        }
        // 限幅，避免切后台回来导致一次性跳太多物理逻辑。
        return Math.min(0.05, Math.max(1 / 240, dt));
    }

    public destroy(): void {
        this.unhookCameraFollow();
        this.flushDebugLog("destroy");
        this.clearRuntimeNodes();
        if (this._runtime_stage_root && this._runtime_stage_root.isValid) {
            this._runtime_stage_root.destroy();
            this._runtime_stage_root = undefined;
        }
    }

    private ensurePhysics(): void {
        if (this._gravity_enabled) {
            return;
        }
        const pm = cc.director.getPhysicsManager();
        pm.enabled = true;
        pm.gravity = cc.v2(0, -960);
        cc.director.getCollisionManager().enabled = true;
        this._gravity_enabled = true;
    }

    private getPlayParent(): cc.Node {
        const g = this._bridge.game_container_node;
        if (g && g.isValid) {
            const named = g.getChildByName("stage_root");
            if (named && named.isValid) {
                return named;
            }
        }
        if (this._runtime_stage_root && this._runtime_stage_root.isValid) {
            return this._runtime_stage_root;
        }
        return this._bridge.game_container_node;
    }

    private ensureStageRoot(): void {
        const container = this._bridge.game_container_node;
        if (!container || !container.isValid) {
            return;
        }
        let stage = container.getChildByName("stage_root");
        if (!stage) {
            stage = new cc.Node("stage_root");
            stage.setAnchorPoint(0.5, 1);
            stage.setContentSize(container.width, container.height);
            stage.setPosition(0, 0);
            stage.parent = container;
            stage.setSiblingIndex(0);
            this._runtime_stage_root = stage;
        }
        const bound_names = ["left_bound", "right_bound"];
        for (let i = 0; i < bound_names.length; i += 1) {
            const b = container.getChildByName(bound_names[i]);
            if (b && b.parent === container) {
                b.parent = stage;
            }
        }
    }

    /** 按关卡配置设置场地高度、奖池位置，并关闭上下边界碰撞 */
    private applyRoundLayout(): void {
        const level_cfg = this._repo.getLevel(this.getCurrentLevel());
        const container = this.resolveContainerNode();
        const pool = this._bridge.reward_pool_node;
        const stage = this.getPlayParent();
        if (!container || !container.isValid || !stage || !stage.isValid) {
            return;
        }
        const ch = this.computePlayfieldHeight(level_cfg);
        const w = this._bridge.game_container_node.width;
        container.setContentSize(w, ch);
        const widget = container.getComponent(cc.Widget);
        if (widget) {
            widget.enabled = false;
        }
        stage.setContentSize(w, ch);
        this._fallback_recycle_world_y = this.computeFallbackRecycleWorldY();
        this.deactivateVerticalBounds(container, stage);
        if (pool && pool.isValid) {
            pool.setContentSize(w, pool.height);
            pool.setPosition(container.x, container.y - ch);
        }
    }

    /** 与 spawnBlocks 行距一致：scene_height 为纵向行数，并保证包住最下方方块 */
    private computePlayfieldHeight(level: UDGLevelConfig): number {
        const row_unit = 100;
        const top_ref = 520;
        const rows_cfg = Math.max(1, Math.floor(level.scene_height) || 18);
        let max_row = 0;
        const list = level.block_list || [];
        for (let i = 0; i < list.length; i += 1) {
            const tuple = list[i];
            if (tuple) {
                max_row = Math.max(max_row, tuple[0]);
            }
        }
        const lowest_block_y = top_ref - max_row * row_unit;
        const below_blocks = -lowest_block_y + row_unit * 6 + 360;
        const from_scene = rows_cfg * row_unit + 720;
        return Math.ceil(Math.max(1600, from_scene, below_blocks));
    }

    private deactivateVerticalBounds(container: cc.Node, stage: cc.Node): void {
        const names = ["floor_bound", "top_bound"];
        for (let i = 0; i < names.length; i += 1) {
            let n = stage.getChildByName(names[i]);
            if (!n && container) {
                n = container.getChildByName(names[i]);
            }
            if (n && n.isValid) {
                n.active = false;
            }
        }
    }

    private spawnBlocks(): void {
        const level_cfg = this._repo.getLevel(this.getCurrentLevel());
        const parent = this.getPlayParent();
        if (!parent || !parent.isValid) {
            cc.error("[UDGGameSession] play parent is invalid");
            return;
        }
        for (let i = 0; i < level_cfg.block_list.length; i += 1) {
            const tuple = level_cfg.block_list[i];
            const row = tuple[0];
            const col = tuple[1];
            const block_cfg = this._repo.getBlockById(tuple[2]);
            const node = new cc.Node(`block_${i}`);
            node.parent = parent;
            node.setAnchorPoint(0.5, 0.5);
            node.setPosition((col - 1.5) * 120, 520 - row * 100);
            node.width = 100 * block_cfg.size[0];
            node.height = 100 * block_cfg.size[1];
            const block_sprite = node.addComponent(GameSprite);
            block_sprite.source = block_cfg.icon && block_cfg.icon.length > 0 ? block_cfg.icon : DEFAULT_BLOCK_ICON;
            block_sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
            const body = node.addComponent(cc.RigidBody);
            body.type = cc.RigidBodyType.Static;
            const box = node.addComponent(cc.PhysicsBoxCollider);
            box.size = cc.size(node.width, node.height);
            box.apply();
            this._blocks.push({
                node,
                hp: block_cfg.hp,
                gold: block_cfg.gold,
                is_spike: block_cfg.type === "spike",
            });
        }
    }

    private spawnBounds(): void {
        const container = this._bridge.game_container_node;
        const parent = this.getPlayParent();
        if (!container || !container.isValid || !parent || !parent.isValid) {
            cc.error("[UDGGameSession] game_container_node is invalid, skip spawnBounds");
            return;
        }
        const ch = container.height;
        const half_w = container.width * 0.5;
        const thick = 40;
        const v_pad = 100;
        const wall_h = ch + v_pad * 2;
        const wall_cy = -ch * 0.5;
        this._bounds.push(this.usePrefabBoundOrCreate("left_bound", cc.v2(-half_w - thick * 0.5, wall_cy), cc.size(thick, wall_h)));
        this._bounds.push(this.usePrefabBoundOrCreate("right_bound", cc.v2(half_w + thick * 0.5, wall_cy), cc.size(thick, wall_h)));
    }

    private usePrefabBoundOrCreate(name: string, pos: cc.Vec2, size: cc.Size): cc.Node {
        const parent = this.getPlayParent();
        const container = this._bridge.game_container_node;
        const node = (parent && parent.getChildByName(name)) || (container && container.getChildByName(name)) || this.createBoundNode(name);
        if (!node.parent) {
            node.parent = parent;
        } else if (node.parent !== parent) {
            node.parent = parent;
        }
        this.ensureBoundPhysics(node, size);
        node.active = true;
        node.setPosition(pos.x, pos.y);
        node.width = size.width;
        node.height = size.height;
        return node;
    }

    private createBoundNode(name: string): cc.Node {
        const node = new cc.Node(name);
        (<any>node)._udg_runtime_bound = true;
        node.parent = this.getPlayParent();
        return node;
    }

    private ensureBoundPhysics(node: cc.Node, size: cc.Size): void {
        let body = node.getComponent(cc.RigidBody);
        if (!body) {
            body = node.addComponent(cc.RigidBody);
        }
        body.type = cc.RigidBodyType.Static;
        body.gravityScale = 0;
        body.linearVelocity = cc.v2(0, 0);

        let box = node.getComponent(cc.PhysicsBoxCollider);
        if (!box) {
            box = node.addComponent(cc.PhysicsBoxCollider);
        }
        box.size = cc.size(size.width, size.height);
        box.sensor = false;
        box.apply();
    }

    private spawnBalls(): void {
        const parent = this.getPlayParent();
        const source_list = this._save_data.grid_ball_list.slice();
        for (let i = 0; i < source_list.length; i += 1) {
            const cfg = this._repo.getBallById(source_list[i].ball_id);
            this._balls.push(this.createBallNode(cfg, parent, i, source_list[i].cell_idx));
        }
        this._save_data.grid_ball_list = [];
        UDGStorage.save(this._save_data);
    }

    private createBallNode(cfg: UDGBallConfig, parent: cc.Node, spawn_order: number, cell_idx: number): UDGBallRuntime {
        const node = new cc.Node(`runtime_ball_${spawn_order}`);
        node.parent = parent;
        node.setAnchorPoint(0.5, 0.5);
        const ball_size = 100;
        node.width = ball_size;
        node.height = ball_size;
        const row = Math.floor(Math.max(0, Math.min(15, cell_idx)) / 4);
        const col = Math.max(0, Math.min(15, cell_idx)) % 4;
        const spread_x = (col - 1.5) * 115;
        const spread_y = -90 - row * 100 - col * 8;
        node.setPosition(spread_x, spread_y);
        const ball_sprite = node.addComponent(GameSprite);
        ball_sprite.source = cfg.icon && cfg.icon.length > 0 ? cfg.icon : DEFAULT_BALL_ICON;
        ball_sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        const rb = node.addComponent(cc.RigidBody);
        rb.type = cc.RigidBodyType.Dynamic;
        rb.fixedRotation = true;
        rb.linearDamping = 0.35;
        rb.angularDamping = 0.9;
        rb.gravityScale = 1;
        rb.bullet = true;
        rb.linearVelocity = cc.v2((spawn_order % 2 === 0 ? 1 : -1) * 80, -120);
        const circle = node.addComponent(cc.PhysicsCircleCollider);
        circle.radius = ball_size * 0.5;
        circle.apply();
        return {
            node,
            hp: Math.max(1, cfg.hp),
            collision_left: Math.max(1, cfg.max_collision),
            settled: false,
            still_ms: 0,
        };
    }

    private checkBlockCollision(): void {
        for (let bi = this._balls.length - 1; bi >= 0; bi -= 1) {
            const ball = this._balls[bi];
            if (!ball || !ball.node || !ball.node.isValid) {
                continue;
            }
            for (let i = this._blocks.length - 1; i >= 0; i -= 1) {
                const block = this._blocks[i];
                if (!block || !block.node || !block.node.isValid) {
                    this._blocks.splice(i, 1);
                    continue;
                }
                const intersects = this.rectIntersects(ball.node, block.node);
                if (!intersects) {
                    continue;
                }
                if (block.is_spike) {
                    this.recycleBall(bi);
                    break;
                }
                block.hp -= 1;
                ball.hp -= 1;
                ball.collision_left -= 1;
                const rb = ball.node.getComponent(cc.RigidBody);
                if (rb) {
                    rb.linearVelocity = cc.v2(rb.linearVelocity.x * -0.8, Math.abs(rb.linearVelocity.y) + 80);
                }
                if (block.hp <= 0) {
                    this._round_gold += block.gold;
                    block.node.destroy();
                    this._blocks.splice(i, 1);
                }
                if (ball.hp <= 0 || ball.collision_left <= 0) {
                    this.recycleBall(bi);
                    break;
                }
                this.splitBall(ball, bi);
                break;
            }
        }
    }

    private splitBall(ball: UDGBallRuntime, index: number): void {
        const pos = ball.node.position.clone();
        const next_hp = Math.max(1, ball.hp - 1);
        const level_cfg = this._repo.getLevel(this.getCurrentLevel());
        const collision_cap = Math.max(1, level_cfg.ball_max_collision || ball.collision_left);
        this.recycleBall(index);
        const small_cfg = this._repo.getBallById(1);
        for (let i = 0; i < 2; i += 1) {
            const child = this.createBallNode(small_cfg, this.getPlayParent(), this._balls.length + i, 0);
            child.node.setPosition(pos.x + (i === 0 ? -12 : 12), pos.y + 12);
            const rb = child.node.getComponent(cc.RigidBody);
            if (rb) {
                const angle = (Math.random() * 0.8 + 0.2) * Math.PI * (i === 0 ? -0.75 : -0.25);
                const speed = 220 + Math.random() * 80;
                rb.linearVelocity = cc.v2(Math.cos(angle) * speed * (i === 0 ? -1 : 1), Math.sin(angle) * speed);
            }
            child.collision_left = collision_cap;
            child.hp = next_hp;
            this._balls.push(child);
        }
    }

    private recycleBall(index: number): void {
        const ball = this._balls[index];
        if (ball && ball.node && ball.node.isValid) {
            ball.node.destroy();
        }
        this._balls.splice(index, 1);
    }

    private endRound(): void {
        this._is_running = false;
        this.unhookCameraFollow();
        this.pushDebugLog(`round_end balls=${this._balls.length} gold=${this._round_gold}`);
        this.flushDebugLog("end_round");
        this._save_data.player_gold += this._round_gold;
        this._save_data.grid_ball_list = this._grid_snapshot.map((row) => ({
            cell_idx: row.cell_idx,
            ball_id: row.ball_id,
        }));
        UDGStorage.save(this._save_data);
        this._bridge.refreshTopInfo(this._save_data.player_gold, this.getCurrentLevel());
        this._bridge.refreshPlacementGrid();
        this._bridge.onRoundEnd(this._round_gold, this._save_data.player_gold);
        this.clearBlocks();
    }

    private clearRuntimeNodes(): void {
        this.unhookCameraFollow();
        for (let i = 0; i < this._balls.length; i += 1) {
            if (this._balls[i].node && this._balls[i].node.isValid) {
                this._balls[i].node.destroy();
            }
        }
        this.clearBlocks();
        this._balls = [];
        for (let i = 0; i < this._bounds.length; i += 1) {
            const n = this._bounds[i];
            if (!n || !n.isValid) {
                continue;
            }
            if ((<any>n)._udg_runtime_bound) {
                n.destroy();
            } else {
                n.active = false;
            }
        }
        this._bounds = [];
        const container = this._bridge.game_container_node;
        const stage = container && container.getChildByName("stage_root");
        if (stage && stage.isValid) {
            stage.y = 0;
        }
        this._stage_follow_y = 0;
    }

    private hookCameraFollow(): void {
        this.unhookCameraFollow();
        cc.director.on(cc.Director.EVENT_BEFORE_DRAW, this._before_draw_camera, this);
    }

    private unhookCameraFollow(): void {
        cc.director.off(cc.Director.EVENT_BEFORE_DRAW, this._before_draw_camera, this);
    }

    private clearBlocks(): void {
        for (let i = 0; i < this._blocks.length; i += 1) {
            if (this._blocks[i].node && this._blocks[i].node.isValid) {
                this._blocks[i].node.destroy();
            }
        }
        this._blocks = [];
    }

    private inRewardPool(ball_node: cc.Node): boolean {
        const container = this.resolveContainerNode();
        if (!container || !container.isValid) {
            return false;
        }
        const rb = ball_node.getComponent(cc.RigidBody);
        if (!rb || rb.linearVelocity.y > 0) {
            return false;
        }
        const local_in_container = container.convertToNodeSpaceAR(ball_node.convertToWorldSpaceAR(cc.v2(0, 0)));
        const top = -container.height + 40;
        const bottom = -container.height - 420;
        return local_in_container.y <= top && local_in_container.y >= bottom;
    }

    private getRewardMultipleByBallNode(ball_node: cc.Node): number {
        const container = this.resolveContainerNode();
        if (!container || !container.isValid) {
            return 1;
        }
        const level = this._repo.getLevel(this.getCurrentLevel());
        const list = level.pool_multiple || [1];
        const center_world = ball_node.convertToWorldSpaceAR(cc.v2(0, 0));
        const local_in_container = container.convertToNodeSpaceAR(center_world);
        const col_w = container.width / Math.max(1, list.length);
        const rel_x = local_in_container.x + container.width * 0.5;
        const idx = Math.floor(rel_x / col_w);
        const safe = Math.max(0, Math.min(list.length - 1, idx));
        return list[safe] || 1;
    }

    private getRecycleWorldY(): number {
        const pool = this._bridge.reward_pool_node;
        if (pool && pool.isValid) {
            const rect = pool.getBoundingBoxToWorld();
            return rect.y - 600;
        }
        return this._fallback_recycle_world_y;
    }

    private computeFallbackRecycleWorldY(): number {
        const container = this.resolveContainerNode();
        if (!container || !container.isValid) {
            return -8000;
        }
        const top_world = container.convertToWorldSpaceAR(cc.v2(0, 0)).y;
        return top_world - container.height - 1200;
    }

    private updateCameraFollow(): void {
        // 直接跟随“球真实挂载的父节点”，避免 stage_root 引用偏差导致镜头在动、球不动。
        const runtime_parent =
            this._balls.length > 0 && this._balls[0] && this._balls[0].node && this._balls[0].node.isValid
                ? this._balls[0].node.parent
                : undefined;
        const stage = runtime_parent && runtime_parent.isValid ? runtime_parent : this.getPlayParent();
        const container = this.resolveContainerNode(stage);
        if (!stage || !container || !stage.isValid || !container.isValid) {
            return;
        }
        if (this._balls.length === 0) {
            return;
        }
        const ch = container.height;
        // 用容器局部坐标：锚点 (0.5,1) 时顶为 0、向下为负，避免 world rect 的 y 语义搞错导致 thW 几千才触发。
        let min_bottom_local = Infinity;
        for (let i = 0; i < this._balls.length; i += 1) {
            const n = this._balls[i].node;
            if (!n || !n.isValid) {
                continue;
            }
            const wbox = n.getBoundingBoxToWorld();
            const bottom_world = cc.v2(wbox.x + wbox.width * 0.5, wbox.y);
            const lp = container.convertToNodeSpaceAR(bottom_world);
            min_bottom_local = Math.min(min_bottom_local, lp.y);
        }
        if (!isFinite(min_bottom_local)) {
            return;
        }
        // scene_height 很大时，容器高度会非常高；跟随阈值需钳制到可视体验范围，避免“几千像素后才开始跟随”。
        const follow_depth = Math.min(1400, Math.max(520, ch * 0.62));
        const threshold_local = -follow_depth;
        let target_stage_y = stage.y;
        if (min_bottom_local < threshold_local) {
            const delta = threshold_local - min_bottom_local;
            const max_step = 180;
            target_stage_y = stage.y + cc.misc.clampf(delta, 0, max_step);
        }
        // 镜头上限也做软钳制，防止异常配置下追到极端大值。
        const y_max = Math.min(9000, Math.max(2600, ch + 2600));
        const clamped = cc.misc.clampf(target_stage_y, 0, y_max);
        const follow_lerp = 0.45;
        this._stage_follow_y += (clamped - this._stage_follow_y) * follow_lerp;
        if (Math.abs(clamped - this._stage_follow_y) < 0.6) {
            this._stage_follow_y = clamped;
        }
        stage.y = this._stage_follow_y;
        this.maybeDebugFollow(min_bottom_local, threshold_local, target_stage_y, clamped, stage.y);
    }

    private resolveContainerNode(stage?: cc.Node): cc.Node {
        const s = stage && stage.isValid ? stage : this.getPlayParent();
        if (s && s.parent && s.parent.isValid) {
            return s.parent;
        }
        return this._bridge.game_container_node;
    }

    private maybeDebugFollow(
        min_bottom_local: number,
        threshold_local: number,
        target_stage_y: number,
        clamped: number,
        stage_y: number
    ): void {
        const now = Date.now();
        if (now - this._debug_last_flush_ts < 120) {
            return;
        }
        this._debug_last_flush_ts = now;
        this.pushDebugLog(
            `follow t=${this._elapsed.toFixed(2)} balls=${this._balls.length} minL=${min_bottom_local.toFixed(1)} thL=${threshold_local.toFixed(
                1
            )} target=${target_stage_y.toFixed(1)} clamp=${clamped.toFixed(1)} stageY=${stage_y.toFixed(1)}`
        );
        this.persistDebugLog("follow_tick");
    }

    private pushDebugLog(line: string): void {
        this._debug_lines.push(line);
        if (this._debug_lines.length > 600) {
            this._debug_lines.shift();
        }
    }

    private flushDebugLog(reason: string): void {
        if (!this._debug_lines || this._debug_lines.length === 0) {
            return;
        }
        const payload = this.buildDebugPayload(reason);
        try {
            cc.sys.localStorage.setItem(UDG_DEBUG_LOG_KEY, payload);
        } catch (error) {
            cc.warn("[UDG] debug log save failed", error);
        }
        cc.log(`[UDG_DEBUG] log saved key=${UDG_DEBUG_LOG_KEY}, lines=${this._debug_lines.length}`);
    }

    private persistDebugLog(reason: string): void {
        const now = Date.now();
        if (now - this._debug_last_persist_ts < 500) {
            return;
        }
        this._debug_last_persist_ts = now;
        try {
            cc.sys.localStorage.setItem(UDG_DEBUG_LOG_KEY, this.buildDebugPayload(reason));
        } catch (error) {
            cc.warn("[UDG] debug log persist failed", error);
        }
    }

    private buildDebugPayload(reason: string): string {
        return [`# ${new Date().toISOString()} reason=${reason} level=${this.getCurrentLevel()}`, ...this._debug_lines].join("\n");
    }

    private limitSpeed(ball: UDGBallRuntime): void {
        const rb = ball.node.getComponent(cc.RigidBody);
        if (!rb) {
            return;
        }
        const speed = rb.linearVelocity.mag();
        if (speed <= 0.001) {
            return;
        }
        if (speed > this._max_speed) {
            rb.linearVelocity = rb.linearVelocity.normalize().mul(this._max_speed);
        } else if (speed < this._min_speed) {
            rb.linearVelocity = rb.linearVelocity.normalize().mul(this._min_speed);
        }
    }

    private rectIntersects(a: cc.Node, b: cc.Node): boolean {
        return a.getBoundingBoxToWorld().intersects(b.getBoundingBoxToWorld());
    }

    private findEmptyCellIndex(): number {
        const used = {};
        for (let i = 0; i < this._save_data.grid_ball_list.length; i += 1) {
            used[this._save_data.grid_ball_list[i].cell_idx] = true;
        }
        for (let i = 0; i < 16; i += 1) {
            if (!used[i]) {
                return i;
            }
        }
        return -1;
    }
}
