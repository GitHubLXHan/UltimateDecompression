import { UDGBallBuyConfig, UDGBallConfig, UDGBlockConfig, UDGLevelConfig } from "./UDGTypes";
import { resource } from "../../../extension/resources/ResourceManager";

export class UDGConfigRepo {
    public level_config: UDGLevelConfig[] = [];
    public ball_config: UDGBallConfig[] = [];
    public block_config: UDGBlockConfig[] = [];
    public ball_buy_config: UDGBallBuyConfig[] = [];

    public async loadAll(): Promise<void> {
        this.level_config = this.normalizeLevelConfig(await this.loadJson("resources/config/udg/level_config"));
        this.ball_config = this.normalizeBallConfig(await this.loadJson("resources/config/udg/ball_config"));
        this.block_config = this.normalizeBlockConfig(await this.loadJson("resources/config/udg/block_config"));
        this.ball_buy_config = this.normalizeBuyConfig(await this.loadJson("resources/config/udg/ball_buy_config"));
    }

    public getLevel(level_num: number): UDGLevelConfig {
        return this.level_config.find((v) => v.level_num === level_num) || this.level_config[0];
    }

    public getBallById(ball_id: number): UDGBallConfig {
        return this.ball_config.find((v) => v.ball_id === ball_id) || this.ball_config[0];
    }

    public getBlockById(block_id: number): UDGBlockConfig {
        return this.block_config.find((v) => v.block_id === block_id) || this.block_config[0];
    }

    public getBuyConfig(total_buy_count: number): UDGBallBuyConfig {
        const next = total_buy_count + 1;
        return this.ball_buy_config.find((v) => v.buy_count === next) || this.ball_buy_config[this.ball_buy_config.length - 1];
    }

    private loadJson(path: string): Promise<any[]> {
        return new Promise((resolve, reject) => {
            resource.ResourceManager.sInstance.load(path, cc.JsonAsset, (err: Error, data: cc.Asset) => {
                if (err) {
                    reject(err);
                    return;
                }
                const asset = data as cc.JsonAsset;
                resolve(Array.isArray(asset && asset.json) ? asset.json : []);
            });
        });
    }

    private normalizeLevelConfig(raw: any[]): UDGLevelConfig[] {
        return raw.map((row, index) => ({
            level_id: this.n(row.level_id, index + 1),
            level_num: this.n(row.level_num, index + 1),
            scene_height: this.n(row.scene_height, 18),
            pool_multiple: Array.isArray(row.pool_multiple) ? row.pool_multiple.map((v: any) => this.n(v, 1)) : [1, 1.5, 2],
            block_list: Array.isArray(row.block_list) ? row.block_list : [],
            ball_max_collision: this.n(row.ball_max_collision, 6),
            bg_color: typeof row.bg_color === "string" ? row.bg_color : "#A8B2FF",
        }));
    }

    private normalizeBallConfig(raw: any[]): UDGBallConfig[] {
        return raw.map((row, index) => ({
            ball_id: this.n(row.ball_id, index + 1),
            hp: this.n(row.hp, 1),
            max_collision: this.n(row.max_collision, 6),
            icon: typeof row.icon === "string" ? row.icon : "",
        }));
    }

    private normalizeBlockConfig(raw: any[]): UDGBlockConfig[] {
        return raw.map((row, index) => ({
            block_id: this.n(row.block_id, 100 + index),
            type: row.type === "spike" ? "spike" : "normal",
            hp: this.n(row.hp, 3),
            gold: this.n(row.gold, 1),
            size: Array.isArray(row.size) ? [this.n(row.size[0], 1.4), this.n(row.size[1], 1.4)] : [1.4, 1.4],
            icon: typeof row.icon === "string" ? row.icon : "",
        }));
    }

    private normalizeBuyConfig(raw: any[]): UDGBallBuyConfig[] {
        return raw.map((row, index) => ({
            buy_count: this.n(row.buy_count, index + 1),
            cost: this.n(row.cost, 10),
            ball_id: this.n(row.ball_id, 1),
        }));
    }

    private n(value: any, fallback: number): number {
        const num = Number(value);
        return Number.isFinite(num) ? num : fallback;
    }
}
