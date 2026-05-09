import { List } from "./../basecore/List";

/**
 * @description: 
 * @author: Zeros
 */
export class RandomUtils
{
    /**
     * @description: 检查概率命中
     * @param value 0-1
     */
    public static isHit(value:number):boolean
    {
        return value >= Math.random();
    }

    /**
     * @description: 获取范围内的随机数（浮点数—）
     * @param min 最小值
     * @param max 最大值
     * @return: 
     */
    public static getRandomNumber(min:number, max:number):number {
        max = Math.max(min, max);
        
        if (min == max)
            return min;
        
        return Math.random() * (max - min) + min;
    }

    /**
     * @description: 获取范围内的随机数（整数）
     * @param min 最小值
     * @param max 最大值
     * @return: 
     */
    public static getRandomInt(min:number, max:number):number {
        max = Math.max(min, max);

        if (min == max)
            return min;
        
        return Math.round(Math.random() * (max - min) + min); //TODO只列
    }

    /**
     * @description: 获取列表中的一个随机元素
     * @param list 列表对象
     * @return: 
     */
    public static getRandomListElm<T>(list:List<T>):T {
        if (list == null || list.length <= 0)
            return null;

        let index = RandomUtils.getRandomInt(0, list.length - 1);
        return list[index];
    }

    /**
     * @description: 获取列表中的一个随机元素
     * @param list 列表对象
     * @return: 
     */
    public static getRandomArrayElm<T>(list:Array<T>):T {
        if (list == undefined || list.length <= 0)
            return undefined;
        
        let index = RandomUtils.getRandomInt(0, list.length - 1);
        return list[index];
    }

    /**
     * @description: 获取列表中的一个随机元素
     * @param list 列表对象
     * @return: 
     */
    public static getRandomSimpleArrayElm(list:any[]):any {
        if (list == null || list.length <= 0)
            return null;
        
        let index = RandomUtils.getRandomInt(0, list.length - 1);
        return list[index];
    }

    /**
     * @description: 随机排序
     * @param a
     * @param b
     */
    public static randomSort(a:object, b:object):number {
        return RandomUtils.getRandomInt(-1, 1);
    }

    /**
     * @description: 返回1或-1
     */    
    public static getPlusOrMinus ():number {
        return this.getRandomInt(0, 1) == 0 ? -1 : 1;
    }

    /**
     * @description: 返回true或false
     */    
     public static getYesOrNo ():boolean {
        return this.getRandomInt(0, 1) == 0 ? false : true;
    }
}