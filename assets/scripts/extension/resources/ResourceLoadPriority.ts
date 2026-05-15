/**
 * 加载的优先级，越大越优先
 */
export enum ResourceLoadPriority {
    NONE = 0,
    NORMAL = 1,
    CRITICAL = 2,
    GOD = 999999, // GOD可以插队，即使当前加载队列满了，他也能够直接调过去加载队列马上被加载
}


