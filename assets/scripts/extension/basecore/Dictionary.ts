import { List } from "./List";
import { RefClass } from "./RefDecorator";
import { LogMgr } from "../log/LogMgr";

@RefClass
export class Dictionary<T extends string | number, U> {
    private _keyList: List<T> = new List<T>();
    private _valueList: List<U> = new List<U>();
    //只读，不允许修改
    private _isReadonly:boolean = false;
    //内部数据，用key指向索引
    private _keyToIndex:{[key:number]:number } = {};
    //迭代中的状态，迭代过程不允许增删
    private _isIterating = false;

    [n: number]: U;

    /**
     * @description: 构造函数
     * @param {boolean} isReadonly 是否只读
     */    
     public constructor(isReadonly:boolean = false) {
        this._isReadonly = isReadonly;
    }

    /**
     * @description: 添加元素
     * @param {type} 
     * @param {type} 
     */
    public add(key: T, value: U):Dictionary<T, U> {
        return this.overlay(key, value);
    }
    
    /**
     * @description: 添加一组数据
     * @param dic
     */
    public addRange(dic: Dictionary<T, U>):Dictionary<T, U> {
        if (this._isReadonly || dic == null) return this;
        if (this._isIterating) {
            LogMgr.logError("字典在迭代过程中不允许做增/删操作。");
            return null;
        }

        for (let i = 0; i < dic.length; i++) {
            let key = dic.getKeyByIndex(i);
            let value = dic.getValueByIndex(i);
            this.overlay(key, value);
        }

        return this;
    }

    /**
     * @description: 删除元素
     * @param key
     */
    public remove(key: T): U {
        if (this._isReadonly || key == null) return null;
        if (this._isIterating) {
            LogMgr.logError("字典在迭代过程中不允许做增/删操作。");
            return null;
        }

        let k = (<any>key);
        let value = this[k];
        if (k != null) {
            delete this[k];
            let index = this._keyToIndex?.[k];
            if (index != null) {
                this._keyList.removeAt(index);
                this._valueList.removeAt(index);
                delete this._keyToIndex[k];

                //移动key指向的索引
                for (let i = index; i < this._keyList.length; i++) {
                    let moveKey = (<any>this._keyList[i]);
                    this._keyToIndex[moveKey] = i;
                }
            }
        }

        return value;
    }

    /**
     * @description: 移除指定的索引
     * @param index
     */
    public removeAt(index: number): U {
        let key = this._keyList[index];
        if (key != null) {
            return this.remove(key);
        }

        return null;
    }


    /**
     * @description: 列表中是否存在对应的元素
     * @param key
     */
    public contains(key: T): boolean {
        return this._keyToIndex[(<any>key)] != null;
    }

    /**
     * @description: 设置指定索引的值
     * @param key
     * @param value
     */
    public setValue(key: T, value: U):Dictionary<T, U> {
        return this.overlay(key, value);
    }

    /**
     * @description: 设置指定索引的值
     * @param {type} 
     * @param {type} 
     */
    public overlay(key: T, value: U):Dictionary<T, U>  {
        if (this._isReadonly || key == null) return this;
        if (this._isIterating) {
            LogMgr.logError("字典在迭代过程中不允许做增/删操作。");
            return this;
        }

        let k = (<any>key);
        let index = this._keyToIndex[k];
        if (index == null) {
            this._keyList.add(k);
            this._valueList.add(value);
            this._keyToIndex[k] = this._keyList.length - 1;
        } else {
            this._valueList[index] = value;
        }
        this[k] = value;

        return this;
    }

    /**
     * @description: 获取指定键值的值引用
     * @param {type} 
     */
    public getValue(key: T): U {
        let k = (<any>key);
        return this[k];
    }

    /**
     * @description: 根据索引获取键值
     * @param {type} 
     */
    public getKeyByIndex(index: number): T {
        return this._keyList[index];
    }

    /**
     * @description: 根据索引获取值
     * @param {type} 
     */
    public getValueByIndex(index: number): U {
        return this[(<any>this._keyList[index])];
    }

    /**
     * @description: 获取key所在的索引
     * @param key
     * @return 找不到索引将返回-1
     */
    public getIndex(key: T): number {
        return this._keyToIndex[(<any>key)];
    }

    /**
     * @description: 获取任意一个不为空的键
     */
    public getAnyValidkey(): T {
        for (let i = 0; i < this._keyList.length; i++) {
            let key = this._keyList[i];
            if (key != null) {
                return key;
            }
        }

        return null;
    }

    /**
     * @description: 获取任意一个不为空的值
     */
    public getAnyValidValue(): U {
        for (let i = 0; i < this._valueList.length; i++) {
            let value = this._valueList[i];
            if (value != null) {
                return value;
            }
        }

        return null;
    }

    /**
     * @description: 清空列表中的元素
     */
    public clear():Dictionary<T, U> {
        if (this._isReadonly) return this;
        if (this._isIterating) {
            LogMgr.logWarning("字典在迭代过程中不允许做增/删操作。");
            return;
        }
        
        while (this.length > 0) {
            this.removeAt(0);
        }

        return this;
    }

    /**
     * @description: 列表长度
     */
    public get length() {
        return this._keyList.length;
    }

    /**
     * @description: 设置只读标记，设置为ture后，不能再改变
     * @param {boolean} value
     */    
     public setReadonly(value:boolean):Dictionary<T, U> {
        if (!this._isReadonly) {
            //只能设置一次，写入数据后设置为true之后，不能再变更
            this._isReadonly = value;
        }
        
        return this;
    }

    /**
     * @description: 原始数组
     * @param 是否复制
     */
    public getKeys(isClone: boolean = true): List<T> {
        if (isClone) {
            return this._keyList.clone();
        }

        return this._keyList;
    }

    /**
     * @description: 原始数组
     * @param 是否复制
     */
    public getValues(isClone: boolean = true): List<U> {
        if (isClone) {
            return this._valueList.clone();
        }

        return this._valueList;
    }

    /**
     * @description: 克隆数据
     */
    public clone(): Dictionary<T, U> {
        let dic = new Dictionary<T, U>();
        if (this.length > 0) {
            dic.addRange(this);
        }

        return dic;
    }

    public find(func: (e: U) => boolean):U {
        if (func == null)
            return;

        this._isIterating = true;
        let list = this.getValues()
        for (let index = 0; index < list.length; index++) {
            const element = list.get(index);
            if (func(element)) {
                this._isIterating = false;
                return element;
            }
        }
        this._isIterating = false;
    }

    public foreach(func:(key:T, value:U, index:number)=>void) {
        if (func == null)
            return;
        
        this._isIterating = true;
        for (let i = 0; i < this.length; i++) {
            let key = this.getKeyByIndex(i);
            let value = this.getValueByIndex(i);
            func(key, value, i);
        }
        this._isIterating = false;
    }
}