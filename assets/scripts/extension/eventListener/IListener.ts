export interface IListener<T, U>
{
    /**
     * @description: 添加事件侦听
     * @param type 事件类型
     * @param handler 回调函数，参数1：发生时间的目标，参数2：自定义事件参数
     * @param target 作用域
     */    
    addListener(type:T, handler:(target:U, args:any[])=>void, target:any) : void;

    /**
     * @description: 移除事件侦听
     * @param type 事件类型
     * @param handler 回调函数
     * @param target 作用域
     */  
    removeListener(type:T, handler:(target:U, args:any[])=>void, target:any): void;

    /**
     * @description: 清空事件侦听
     */ 
    clearListeners(): void;

    /**
     * @description: 派发事件
     * @param type 事件类型
     * @param args 自定义参数
     */  
    dispatchEvent(type:T, ...args:any[]): void;
}