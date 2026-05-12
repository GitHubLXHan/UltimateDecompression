export interface IProfiler {
    
    memoryInfo() : {size: number, tips: string};

    freeMemory(): number;
}