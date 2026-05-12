import { Dictionary } from "../basecore/Dictionary";
import { List } from "../basecore/List";
import { BaseProfiler } from "../profiler/BaseProfiler";
import { BaseProfilerEventType } from "../profiler/BaseProfilerEventType";
import { ClassUtils } from "../utils/ClassUtils";
import { IPoolInstance } from "./IPoolInstance";


export class PoolMgr extends BaseProfiler<BaseProfilerEventType> {
    private static _Ins: PoolMgr;

    public static get Ins(): PoolMgr {
        if (this._Ins == null) {
            this._Ins = new PoolMgr();
        }

        return this._Ins;
    }

    private constructor() {
        super();
    }

    private _store: Dictionary<string, List<IPoolInstance>> = new Dictionary<string, List<IPoolInstance>>();


    /**
     * @description: 根据类型从池子中获取对象
     * @param {type} 
     */
    public impl<T extends IPoolInstance>(clsInfo: { new(): T } | string): T {
        if (clsInfo == null)
            return null;

        let className: string = "";
        let cls: any = null;
        if (typeof clsInfo == "string") {
            className = clsInfo;
            cls = ClassUtils.getClass(className);
        }
        else {
            className = ClassUtils.getClassName(clsInfo);
            cls = clsInfo;
        }

        if (className == null)
            return;

        if (!this._store.contains(className))
            this._store.add(className, new List<IPoolInstance>());

        let ins: any = null;
        let list = this._store.getValue(className);
        if (list.length > 0) {
            //取第一个
            ins = list.shift();
        }
        else {
            //创建一个新的对象
            ins = new cls();
        }

        ins.impl();

        return ins;
    }

    /**
     * @description: 回收对象
     * @param {type} 
     */
    public recover(ins: IPoolInstance) {
        if (ins == null)
            return;

        let className = ClassUtils.getClassName(ins);
        if (className == null)
            return;

        if (!this._store.contains(className))
            this._store.add(className, new List<IPoolInstance>());

        let list = this._store.getValue(className);
        if (list.contains(ins))
            return;

        ins.recover();
        list.add(ins);
    }

    public clearByType<T extends IPoolInstance>(clsInfo: { new(): T } | string) {
        let className = ClassUtils.getClassName(clsInfo);
        if (className == null)
            return;
        let list = this._store.getValue(className);
        list && list.clear()
    }

    public memoryInfo(): { size: number, tips: string } {
        let count = 0;
        let num = 0
        for (let i = 0; i < this._store.length; i++) {
            let l = this._store.getValueByIndex(i);
            if (l) {
                count += l.length;
                num += 1;
            }
        }
        return { size: 0, tips: i18n`PoolMgr：共缓存${num}种共${count}个Class` }

    };

    public freeMemory(): number {
        return 0;
    }

}


if (CC_DEBUG) {
    window["PoolMgr"] = PoolMgr
}