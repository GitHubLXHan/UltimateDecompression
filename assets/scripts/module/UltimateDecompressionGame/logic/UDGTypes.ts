export interface UDGLevelConfig {
    level_id: number;
    level_num: number;
    scene_height: number;
    pool_multiple: number[];
    block_list: [number, number, number][];
    ball_max_collision: number;
    bg_color?: string;
}

export interface UDGBallConfig {
    ball_id: number;
    hp: number;
    max_collision: number;
    icon: string;
}

export interface UDGBlockConfig {
    block_id: number;
    type: "normal" | "spike";
    hp: number;
    gold: number;
    size: [number, number];
    icon: string;
}

export interface UDGBallBuyConfig {
    buy_count: number;
    cost: number;
    ball_id: number;
}

export interface UDGGridBallData {
    cell_idx: number;
    ball_id: number;
}

export interface UDGSaveData {
    player_gold: number;
    total_buy_count: number;
    grid_ball_list: UDGGridBallData[];
    level_unlock_list: number[];
}
