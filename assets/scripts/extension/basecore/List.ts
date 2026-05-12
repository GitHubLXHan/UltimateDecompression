import { RandomUtils } from "./../utils/RandomUtils";
import { ListSortUtils } from "./ListSortUtils";
import { SortType } from "./SortType";
import { RefClass } from "./RefDecorator";

@RefClass
export class List<T> {
    //排序用临时数据
    private _TempSort: number[] = [];
    //长度
    private _length:number = 0;
    //只读，不允许修改
    private _isReadonly:boolean = false;

    [n: number]: T;

    /**
     * @description: 构造函数
     */    
    public constructor(...args:T[]) {
        this.addArray(args);
    }

    /**
     * @description: 添加元素
     * @param values 元素列表
     */
    public add(value:T): List<T> {
        if (this._isReadonly) return this;

        this[this.length] = value;
        this._length++;
        return this;
    }

    /**
     * @description: 添加元素
     * @param values 元素列表
     */
    public push(...values: T[]):List<T> {
        return this.addArray(values);
    }

    /**
     * @description: 添加一组元素
     * @param 元素数组
     */
    public addArray(list: T[]): List<T> {
        if (this._isReadonly) return this;
        if (list == null) return this;

        for (let i = 0; i < list.length; i++) {
            this.add(list[i]);
        }
        return this;
    }

    /**
     * @description: 插入元素
     * @param start 起始索引
     * @param value 值
     */
    public insert(start: number, value: T): List<T> {
        if (this._isReadonly) return this;
        if (start < 0) return this;

        if (start >= this.length) {
            let add = start - this.length;
            while (add > 0) {
                this.add(undefined);
                add--;
            }

            return this.add(value);
        }

        for (let i = this.length - 1; i >= start; i--) {
            this[i + 1] = this[i];
        }
        this[start] = value;
        this._length++;

        return this;
    }

    /**
     * @description: 链接另一个List的内容，返回新数组（不修改原数组）
     * @param list
     */
    public concat(list: List<T>): List<T> {
        let result = new List<T>();
        return result.addRange(this).addRange(list);
    }

    /**
     * @description: 添加一组元素，会修改原始数组的内容
     * @param list
     */
    public addRange(list: List<T>): List<T> {
        if (this._isReadonly) return this;
        if (list == null) return this;

        for (let i = 0; i < list.length; i++) {
            this.add(list[i]);
        }

        return this;
    }

    /**
     * @description: 反转数组
     */
    public reverse(): List<T> {
        if (this._isReadonly) return this;

        let list = new List<T>();
        list.addRange(this);
        this.clear();
        for (let i = list.length - 1; i >= 0; i--) {
            this.add(list[i]);
        }

        return this;
    }

    /**
     * @description: 删除元素
     * @param {type} 
     */
    public remove(value: T): List<T> {
        if (this._isReadonly) return this;

        let index = this.indexOf(value);
        if (index >= 0)
            this.removeAt(index);

        return this;
    }

    /**
     * @description: 删除指定位置的元素
     * @param index 起始索引
     * @return 删除的值
     */
    public removeAt(index: number): T {
        if (this._isReadonly) return null;

        let elm = this[index];
        this.removeRange(index, 1);
        return elm;
    }

    /**
     * @description: 从数组中删除项目，然后返回被删除的项目，该方法会修改原始数组的内容
     * @param start 起始索引​
     * @param length 长度，当长度 <=0 时，长度为最大值
     * @return: 新的数组对象
     */
    public removeRange(start: number, length: number = 0): List<T> {
        if (this._isReadonly) return this;

        if (start < 0 || start >= this.length) {
            return this;
        }

        if (length <= 0)
            length = this.length - start;

        for (let i = start + length; i < this.length; i++) {
            let head = i - 1;
            this[head] = this[i];
        }
        this.length = this.length - length;

        return this;
    }

    /**
     * @description: 列表中是否存在对应的元素
     * @param value
     */
    public contains(value: T): boolean {
        return this.indexOf(value) >= 0;
    }


    /**
     * @description: 设置指定索引的值
     * @param index 索引
     * @param value 值
     */
    public set(index: number, value: T) {
        if (this._isReadonly) return this;

        if (index < 0 || index >= this.length) {
            return;
        }

        this[index] = value;
    }

    /**
     * @description: 根据索引获取值
     * @param index
     * @return: 
     */
    public get(index: number): T {
        if (index < 0 || index >= this.length) {
            return null;
        }

        return this[index];
    }


    /**
     * @description: 获取从指定位置到指定长度的数组内容，返回新数组
     * @param start 起始索引
     * @param length 长度，当长度 <=0 时，长度为最大值
     */
    public getValues(start: number = 0, length: number = 0): List<T> {
        if (start < 0 || start >= this.length) {
            return this;
        }

        if (length <= 0)
            length = this.length - start;

        let list = new List<T>();
        for (let i = start; i < length; i++) {
            list.add(this[i]);
        }

        return list;
    }


    /**
     * @description: 从头部开始检索值所在的索引
     * @param {T} value
     */
    public indexOf(value:T):number {
        for (let i = 0; i < this.length; i++) {
            if (this[i] == value) {
                return i;
            }
        }
        return -1;
    }

    /**
     * @description: 从末尾开始检索值所在的索引
     * @param {T} value
     */
     public lastIndexOf(value:T):number {
        for (let i = this.length - 1; i >= 0; i--) {
            if (this[i] == value) {
                return i;
            }
        }
        return -1;
    }

    /**
     * @description: 根据值获取索引
     * @param value
     * @return: 
     */
    public getIndexByFunc(func: (t: T) => Boolean): number {
        for (let i = 0; i < this.length; i++) {
            if (func(this[i]))
                return i;
        }

        return -1;
    }

    /**
     * @description: 清空列表中的元素
     */
    public clear():List<T> {
        if (this._isReadonly) return this;

        for (let i = 0; i <  this.length; i++) {
            delete this[i];
        }
        this._TempSort.length = 0;
        this._length = 0;

        return this;
    }

    /**
     * @description: 获取并删除第一个元素
     * @return: T
     */
    public shift(): T {
        if (this._isReadonly) return null;

        if (this.length > 0) {
            return this.removeAt(0);
        }

        return undefined;
    }

    /**
     * @description: 获取并删除最后一个元素
     * @return: T
     */
    public pop(): T {
        if (this._isReadonly) return null;

        if (this.length > 0) {
            return this.removeAt(this.length - 1);
        }

        return undefined;
    }

    /**
     * @description: 从列表中获取一个随机元素
     */
    public getRandom(): T {
        let index = RandomUtils.getRandomInt(0, this.length - 1);
        if (index >= this.length)
            return undefined;

        return this[index];
    }

    /**
     * @description: 从列表中获取一个随机元素并从原始列表中将其移除
     */
    public getRandomThenRemove(): T {
        if (this._isReadonly) return null;

        let index = RandomUtils.getRandomInt(0, this.length - 1);
        if (index >= this.length)
            return undefined;

        return  this.removeAt(index);
    }

    /**
     * @description: 获取任意一个不为空的值
     */
    public getAnyValidValue(): T {
        for (let i = 0; i < this.length; i++) {
            if (this[i] != null)
                return this[i];
        }

        return undefined;
    }

    /**
     * @description: 内容排序
     * @param sortFunc 排序方法
     */
    public sort(sortFunc?: (a: T, b: T) => number):List<T> {
        if (this._isReadonly) return this;
        if (this.length <= 1) return this;

        if (sortFunc == null) {
            sortFunc = this.defaultCompare;
        }

        let len = this.length;
        for (let i = 0; i <= len; i++) {
            for (let j = 0; j < len - i - 1; j++) {
                if (sortFunc(this[j], this[j + 1]) > 0) {
                    //交换
                    let temp = this[j];
                    this[j] = this[j+1];
                    this[j+1] = temp;
                }
            }
        }

        return this;
    }

    /**
     * @description: 默认升序排序
     * @param {T} a
     * @param {T} b
     */
    private defaultCompare(a:T, b:T):number {
        if (a > b) {
            return 1;
        } else if (a < b) {
            return -1;
        }

        return 0;
    }

    /**
     * @description: 通用排序方法，根据字段顺序排序，主键排序
     * @param type 排序类型【升序/降序】
     * @param propertyName 排序字段，按参数顺序排优先级
     */
    public SortBy(type:SortType, propertyName?:ConstructorNameType<T>):List<T> {
        if (this._isReadonly) return this;
        if (this.length <= 1) return this;

        let name = propertyName != null ? propertyName.toString() : null;
        let value = this.getAnyValidValue();
        let itemType = typeof value[name];

        switch (itemType) {
            case "string":
                ListSortUtils.sortParser<T>(this, name, type, ListSortUtils.compareStr);
                break;
            case "number":
                ListSortUtils.sortParser<T>(this, name, type, ListSortUtils.compareNumber);
                break;

            default:
                ListSortUtils.sortParser<T>(this, name, type, ListSortUtils.compareObject);
                break;
        }
        this._TempSort = ListSortUtils.updateSort<T>(this, name);
        return this;
    }

    /**
     * @description: 通用排序方法，根据字段顺序排序，子键排序
     * @param type 排序类型【升序/降序】
     * @param propertyName 排序字段，按参数顺序排优先级
     */
    public ThenSortBy(type:SortType, propertyName:ConstructorNameType<T>):List<T> {
        if (this._isReadonly) return this;
        if (this.length <= 1) return this;

        let name = propertyName != null ? propertyName.toString() : null;
        let value = this.getAnyValidValue();
        let itemType = typeof value[name];

        switch (itemType) {
            case "string":
                ListSortUtils.sortParser<T>(this, name, type, ListSortUtils.compareStr, this._TempSort);
                break;
            case "number":
                ListSortUtils.sortParser<T>(this, name, type, ListSortUtils.compareNumber, this._TempSort);
                break;

            default:
                ListSortUtils.sortParser<T>(this, name, type, ListSortUtils.compareObject, this._TempSort);
                break;
        }
        this._TempSort = ListSortUtils.updateSort<T>(this, name, this._TempSort);

        return this;
    }

    /**
     * 遍历数组中每一个元素
     * @param callbackfn  遍历回调函数
     */
    public forEach(callbackfn: (value: T, index: number) => void): void {
        if (this.length > 0 && callbackfn != null) {
            for (let i = 0; i < this.length; i++) {
                let e = this[i];
                callbackfn(e, i);
            }
        }
    }

    /**
     * 用于检测数组中的元素是否满足指定条件
     * @param predicate  遍历检查函数
     */
    public some(predicate: (value: T, index: number) => boolean): boolean {
        if (this.length > 0 && predicate != null) {
            for (let i = 0; i < this.length; i++) {
                if (predicate(this[i], i))
                    return true;
            }
        }

        return false;
    }

    /**
     * 返回一个新数组，数组中的元素为原始数组元素调用函数处理后的值。
     * @param callbackfn 遍历处理函数
     */
    public map<U>(callbackfn: (value: T, index: number) => U): List<U> {
        let list = new List<U>();
        if (this.length > 0 && callbackfn != null) {
            for (let i = 0; i < this.length; i++) {
                list.add(callbackfn(this[i], i));
            }
            return list;
        }
        return list;
    }

    /**
     * 创建一个新的数组，新数组中的元素是通过检查指定数组中符合条件的所有元素。
     * @param predicate 遍历处理函数
     */
    public filter(predicate: (value: T, index: number) => boolean): List<T> {
        let list = new List<T>();
        if (this.length > 0 && predicate != null) {
            for (let i = 0; i < this.length; i++) {
                let e = this[i];
                if (predicate(e, i))
                    list.add(e);
            }

            return list;
        }
        return list;
    }

    public toString(): string {
        let arr = new  Array<T>();
        for (let i = 0; i < this.length; i++) {
            arr.push(this[i]);
        }
        
        return "[" + arr.join(",") + "]";
    }

    /**
     * @description: 列表长度
     */
    public get length() {
        return this._length;
    }
    public set length(value:number) {
        if (this._isReadonly) return;
        if (this.length > value) {
            //裁剪长度
            for (let i = this.length - 1; i >= value; i--) {
                delete this[i];
            }
        } else if (this.length < value) {
            //补长度
            let add = value - this.length;
            while (add > 0) {
                this.add(undefined);
                add--;
            }
        }

        this._length = value;
    }

    /**
     * @description: 设置只读标记，设置为ture后，不能再改变
     * @param {boolean} value
     */    
    public setReadonly(value:boolean):List<T> {
        if (!this._isReadonly) {
            //只能设置一次，写入数据后设置为true之后，不能再变更
            this._isReadonly = value;
        }
        
        return this;
    }

    /**
     * @description: 原始数组
     */
    public getArray(): Array<T> {
        let arr = new Array<T>();
        for (let i = 0; i < this.length; i++) {
            arr[i] = this[i];
        }
        return arr;
    }

    /**
     * @description: 克隆对象
     */
    public clone(): List<T> {
        let list = new List<T>();
        return list.addRange(this);
    }

    public cloneJsList(): T[] {
        return this.getArray();
    }
}