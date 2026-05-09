import { List } from "../basecore/List";
import { PoolMgr } from "../pool/PoolMgr";
import { IUpdate } from "../update/IUpdate";
import { UpdateMgr } from "../update/UpdateMgr";
import { TimerData } from "./TimerData";

export class TimeMgr implements IUpdate
{
    private static _ins:TimeMgr;
    /**
     * static Instance:TimerHeap
     */
    public static get Ins():TimeMgr 
    {
        if (this._ins == null){
            this._ins = new TimeMgr();
        }

        return this._ins;
        
    }

    private constructor()
    {
        UpdateMgr.Ins.addUpdateHandler(this);
    }
    private _timers:List<TimerData> = new List<TimerData>();
    private _id:number = 0;

    private _timestamp:number = 0;
    private _realTime:number = 0;

    private readonly fewTime:number = 0.0001;
    
    /**
     * @description: 下一帧回调
     * @param handler 回调
     * @param args 回调参数
     */    
    public callFew(handler:(args?:any[])=>void, ...args:any[]):number
    {
        let tData = this.getTimerData(0, 0, handler, args);
        return this.addTimer(tData);
    }

    /**
     * @description: 一段时间后回调(仅一次)
     * @param delay 延迟时间（秒）
     * @param handler 回调
     * @param args 回调参数
     */    
    public callLater(delay:number, handler:(args?:any[])=>void, ...args:any[]):number
    {
        let tData = this.getTimerData(delay, 0, handler, args);
        return this.addTimer(tData);
    }

    /**
     * @description: 间隔时间持续调用
     * @param interval 间隔（秒）
     * @param handler 回调
     * @param args 回调参数
     */    
    public callInterval(interval:number, handler:(args?:any[])=>void, ...args:any[]):number
    {
        let tData = this.getTimerData(interval, interval, handler, args);
        return this.addTimer(tData);
    }


    /**
     * @description: 添加处理器
     * @param {type} 
     */    
    private addTimer(tData:TimerData)
    {
        this._timers.add(tData);
        // LogMgr.log(`添加计时器${tData.id}，${tData.nextTrick - this._timestamp}秒后`);

        this.reSort();
        
        return tData.id;
    }

    /**
     * @description: 移除指定的计时器
     * @param id
     */    
    public remove(id:number)
    {
        if (this._timers.length > 0)
        {
            for (let i = 0; i < this._timers.length; i++)
            {
                let tData = this._timers.get(i);
                if (tData && tData.id == id)
                {
                    this._timers.removeAt(i);
                    PoolMgr.Ins.recover(tData);
                    return;
                }
            }
        }
    }

    private reSort() {
        if (this._timers.length > 1) {
            this._timers.sort(this.sortPriority);
        }
    }
    
    /**
     * @description: 计时器检查
     * @param {type} 
     */
    public onUpdate(deltaTime:number)
    {
        this._timestamp += deltaTime;
        let timeScale = UpdateMgr.Ins.timeScale;
        this._realTime += timeScale > 0 ? deltaTime / timeScale : 0;

        while (this._timers.length > 0 && this._timestamp >= this._timers[0].nextTrick) {
            let trickData = this._timers[0];
            if (trickData.interval > 0) {
                //处理间隔计时器
                trickData.nextTrick += trickData.interval;
                if (this._timestamp > trickData.nextTrick) {
                    //处理完之后当前时间仍然大于下次触发时间，按当前时间修正下次触发点
                    trickData.nextTrick = this._timestamp - this._timestamp % trickData.interval + trickData.interval;
                }
                trickData.doAction();
    
                if (this._timers.length >= 2) {
                    let otherData = this._timers[1];
                    if (trickData.nextTrick > otherData.nextTrick) {
                        this.reSort();
                    }
                }
    
            } else {
                //处理延迟计时器
                this._timers.removeAt(0);
                trickData.doAction();
                // LogMgr.log(`计时器结束${trickData.id}，${trickData.nextTrick - this._timestamp}`);
                PoolMgr.Ins.recover(trickData);
            }
        }

        // this.onUpdate(0);
    }


    /**
     * @description: 销毁所有计时器
     */    
    public dispose()
    {
        if (this._timers.length > 0)
        {
            for (let i = 0; i < this._timers.length; i++)
            {
                let tData = this._timers.get(i);
                tData && PoolMgr.Ins.recover(tData);
            }

            this._timers.clear();
        }
    }

    public get timestamp():number
    {
        return this._timestamp;
    }

    public get realTime():number
    {
        return this._realTime;
    }

    /**
     * @description: 获取一个计时器实例
     * @param {type} 
     */
    private getTimerData(delay:number, interval:number, handler:(args:any[])=>void, args:any[]):TimerData
    {
        let tData = PoolMgr.Ins.impl(TimerData);
        tData.id = ++this._id;
        tData.interval = interval; 
        tData.nextTrick = this._timestamp + delay; 
        tData.args = args;
        tData.callback = handler;

        return tData;
    }

    /**
     * @description: 优先级排序
     * @param {type} 
     */
    private sortPriority(a:TimerData, b:TimerData)
    {
        if (a == null || b == null)
            return 0

        if (a.nextTrick > b.nextTrick)
            return 1;

        if (a.nextTrick < b.nextTrick)
            return -1;

        return 0;
    }
}