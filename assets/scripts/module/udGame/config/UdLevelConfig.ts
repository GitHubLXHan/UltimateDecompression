/** 单关卡配置 */
export interface IUdLevelConfig {
    /** 关卡编号 */
    stage: number;
    /** 通关所需分数 */
    passScore: number;
    /** 单次挑战消耗体力 */
    staminaCost: number;
}

/**
 * 根据关卡编号获取配置（全公式生成，支持无限关卡）。
 *
 * 公式设计（黄金递增）：
 *   passScore    = 50 + 20·(n-1) + 0.05·(n-1)²    （二次曲线，前期平缓后期加速）
 *   staminaCost  = 1 + floor((n-1) / 20)            （每 20 关体力 +1）
 *
 * 关键节点：
 *   stage   1: score=   50, stamina= 1
 *   stage  10: score=  234, stamina= 1
 *   stage  25: score=  559, stamina= 2
 *   stage  50: score= 1150, stamina= 3
 *   stage 100: score= 2520, stamina= 5
 *   stage 200: score= 6010, stamina=10
 *   stage 350: score=13110, stamina=18
 *   stage 500: score=22480, stamina=25
 */
export function getLevelConfig(stage: number): IUdLevelConfig {
    const n = Math.max(1, Math.floor(stage));
    const d = n - 1;
    const passScore = Math.round(50 + 20 * d + 0.05 * d * d);
    const staminaCost = 1 + Math.floor(d / 20);
    return { stage: n, passScore, staminaCost };
}
