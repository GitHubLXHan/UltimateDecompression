import { UdKeyMap } from "../basecore/UdKeyMap";
import { UdSeqList } from "../basecore/UdSeqList";
import { UdReflectKit } from "../utils/UdReflectKit";
import { IUdReusable } from "./IUdReusable";


export class UdObjCache  {
    private static _Ins: UdObjCache;

    public static get Ins(): UdObjCache {
        if (this._Ins == null) {
            this._Ins = new UdObjCache();
        }

        return this._Ins;
    }

    private _store: UdKeyMap<string, UdSeqList<IUdReusable>> = new UdKeyMap<string, UdSeqList<IUdReusable>>();


    /**
     * @description: 根据类型从池子中获取对象
     * @param {type} 
     */
    public impl<T extends IUdReusable>(clsInfo: { new(): T } | string): T {
        if (clsInfo == null)
            return null;

        let className: string = "";
        let cls: any = null;
        if (typeof clsInfo == "string") {
            className = clsInfo;
            cls = UdReflectKit.getClass(className);
        }
        else {
            className = UdReflectKit.getClassName(clsInfo);
            cls = clsInfo;
        }

        if (className == null)
            return;

        if (!this._store.contains(className))
            this._store.add(className, new UdSeqList<IUdReusable>());

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
    public recover(ins: IUdReusable) {
        if (ins == null)
            return;

        let className = UdReflectKit.getClassName(ins);
        if (className == null)
            return;

        if (!this._store.contains(className))
            this._store.add(className, new UdSeqList<IUdReusable>());

        let list = this._store.getValue(className);
        if (list.contains(ins))
            return;

        ins.recover();
        list.add(ins);
    }

    public clearByType<T extends IUdReusable>(clsInfo: { new(): T } | string) {
        let className = UdReflectKit.getClassName(clsInfo);
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
        return { size: 0, tips: i18n`UdObjCache：共缓存${num}种共${count}个Class` }

    };

    public freeMemory(): number {
        return 0;
    }

}


if (CC_DEBUG) {
    window["UdObjCache"] = UdObjCache
}