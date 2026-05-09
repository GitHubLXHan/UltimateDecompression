import { UDGSaveData } from "./UDGTypes";

const UDG_STORAGE_KEY = "udg_save_data_v1";

export class UDGStorage {
    public static load(): UDGSaveData {
        const fallback = this.getDefault();
        try {
            const raw = cc.sys.localStorage.getItem(UDG_STORAGE_KEY);
            if (!raw) {
                return fallback;
            }
            const parsed = JSON.parse(raw) as UDGSaveData;
            let grid = Array.isArray(parsed && parsed.grid_ball_list) ? parsed.grid_ball_list : [];
            if (grid.length === 0) {
                grid = fallback.grid_ball_list.map((row) => ({ cell_idx: row.cell_idx, ball_id: row.ball_id }));
            }
            return {
                player_gold: this.toNumber(parsed && parsed.player_gold, fallback.player_gold),
                total_buy_count: this.toNumber(parsed && parsed.total_buy_count, fallback.total_buy_count),
                grid_ball_list: grid,
                level_unlock_list: Array.isArray(parsed && parsed.level_unlock_list) ? parsed.level_unlock_list : [1],
            };
        } catch (error) {
            cc.warn("[UDGStorage] load failed, use default", error);
            return fallback;
        }
    }

    public static save(data: UDGSaveData): void {
        try {
            cc.sys.localStorage.setItem(UDG_STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            cc.error("[UDGStorage] save failed", error);
        }
    }

    public static getDefault(): UDGSaveData {
        return {
            player_gold: 100,
            total_buy_count: 0,
            grid_ball_list: [{ cell_idx: 0, ball_id: 1 }],
            level_unlock_list: [1],
        };
    }

    private static toNumber(value: any, fallback: number): number {
        const n = Number(value);
        return Number.isFinite(n) ? n : fallback;
    }
}
