import { List } from "./List";
import { SortType } from "./SortType";

export class ListSortUtils {
   
    /**
     * @description: 对象属性排序，排序会修改原始数组
     * @param list 原始数组
     * @param name 属性名
     * @param type 排序类型
     * @param compareFun 排序方法
     */
    public static sortParser<T>(list:List<T>, name:string, type:SortType, compareFun:(a:T, b:T, name:string)=>number, sortList?:number[]) {
        sortList = sortList == null ? [0, list.length] : sortList;
        let temp; // 开辟一个临时空间, 存放交换的中间值
        // 要遍历的次数
        for (let u = 0; u < sortList.length - 1; u++) {
            let start = sortList[u];
            let end = sortList[u + 1];
            for (let i = start; i < end; i++) {
                //依次的比较相邻两个数的大小，遍历一次后，把数组中第i小的数放在第i个位置上
                let endOffset = i - start;
                for (let j = start; j < end - endOffset - 1; j++) {
                    // 比较相邻的元素，如果前面的数小于后面的数，交换
                    let aPos = j;
                    let bPos = j + 1;
    
                    let aVal = list[aPos];
                    let bVal = list[bPos];
    
                    if (compareFun(aVal, bVal, name) * type > 0) {
                        temp = list[aPos];
                        list[aPos] = list[bPos];
                        list[bPos] = temp;
                    }
                }
            }
        }
    }

    /**
     * @description: 更新多字段排序使用的范围定义
     * @param list 原始数组
     * @param name 对象属性
     * @param sortList 排序数组的引用
     */
    public static updateSort<T>(list:List<T>, name:string, sortList?:number[]):number[] {
        if (sortList == null) {
            sortList = [];
            sortList.push(0, list.length);
        }

        if (list.length > 1) {
            for (let u = 0; u < sortList.length - 1; u++) {
                let start = sortList[u];
                let end = sortList[u + 1];
                let uOffset = sortList.length - u - 1;

                let matchIndex = start;
                for (let i = start; i < end - 1; i++) {
                    let a = list[i] as any;// warning any value
                    let b = list[i + 1] as any;// warning any value
                    if (a == null && b == null)
                        continue;

                    if (a == null || b == null) {
                        matchIndex++;
                        sortList.splice(matchIndex, 0 , i + 1);
                        
                        continue;
                    }

                    if (a[name] === b[name]) // warning any value
                        continue;
                        
                    matchIndex++;
                    sortList.splice(matchIndex, 0 , i + 1);
                }

                u = Math.max(0, sortList.length - uOffset - 1);
            }
        }

        return sortList;
    }


    /**
     * @description: 比较字符串
     * @param a
     * @param b
     */
    public static compareStr<T>(a:T, b:T, name:string):number {
        if (b == null)
            return 1;
        if (a == null)
            return -1;

        let aStr:string = name != null ? (a as any)[name] : a;// warning any value
        let bStr:string = name != null ? (b as any)[name] : b;// warning any value
        return aStr.localeCompare(bStr);
    }

    /**
     * @description: 比较数字
     * @param a
     * @param b
     */
    public static compareNumber<T>(a:T, b:T, name:string):number {
        if (b == null)
            return 1;
        if (a == null)
            return -1;

        let aVal:number = name != null ? (a as any)[name] : a;// warning any value
        let bVal:number = name != null ? (b as any)[name] : b;// warning any value

        let sortValue = (aVal - bVal);
        if (sortValue != 0) {
            sortValue =  sortValue / Math.abs(sortValue);
            return sortValue;
        }

        return 0;
    }

    /**
     * @description: 比较对象
     * @param a
     * @param b
     */
    public static compareObject<T>(a:T, b:T, name:string):number {
        if (b == null)
            return 1;
        if (a == null)
            return -1;


        let aVal:any = name != null ? (a as any)[name] : a;// warning any value
        let bVal:any = name != null ? (b as any)[name] : b;// warning any value

        let aSortVal:number = Boolean(aVal) ? 0 : 1;
        let bSortVal:number = Boolean(bVal) ? 0 : 1;

        let sortValue = (aSortVal - bSortVal);
        if (sortValue != 0) {
            sortValue =  sortValue / Math.abs(sortValue);
            return sortValue;
        }

        return 0;
    }
}