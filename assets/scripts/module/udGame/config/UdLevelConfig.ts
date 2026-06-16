/** 单关卡配置 */
export interface IUdLevelConfig {
    /** 关卡编号 */
    stage: number;
    /** 通关所需分数 */
    passScore: number;
    /** 单次挑战消耗体力 */
    staminaCost: number;
}

/** 关卡配置表（按 stage 升序） */
export const UD_LEVEL_CONFIGS: IUdLevelConfig[] = [
    { stage: 1, passScore: 50, staminaCost: 1 },
    { stage: 2, passScore: 50, staminaCost: 1 },
    { stage: 3, passScore: 1000, staminaCost: 2 },
    { stage: 4, passScore: 2000, staminaCost: 2 },
    { stage: 5, passScore: 4000, staminaCost: 3 },
];

/**
 * 根据关卡编号获取配置。
 * 超出已定义范围时，回退到最后一个配置（stage 不再推进）。
 */
export function getLevelConfig(stage: number): IUdLevelConfig {
    const found = UD_LEVEL_CONFIGS.find((c) => c.stage === stage);
    if (found) return found;
    const last = UD_LEVEL_CONFIGS[UD_LEVEL_CONFIGS.length - 1];
    return { ...last, stage };
}
