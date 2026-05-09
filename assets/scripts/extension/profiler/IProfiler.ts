/*
 * @Descripttion: 
 * @version: 
 * @Author: chenxia
 * @Date: 2022-08-19 11:33:29
 * @LastEditors: chenxia
 * @LastEditTime: 2021-11-30 13:44:56
 */
export interface IProfiler {
    
    memoryInfo() : {size: number, tips: string};

    freeMemory(): number;
}