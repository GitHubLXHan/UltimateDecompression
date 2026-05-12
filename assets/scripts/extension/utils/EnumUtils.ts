import { Dictionary } from "../basecore/Dictionary";
import { List } from "../basecore/List";

export class EnumUtils
{
    /**
     * @description: 获取枚举的名字列表
     * @param {type} 
     */    
    public static getNames(targetEnum:any):List<string>
    {
        let list = new List<any>();
        for (let i in targetEnum)
        {
            list.add(i.toString());
        }

        let len = list.length / 2;
        while (len > 0)
        {
            list.shift();
            len--;
        }

        return list;
    }

    /**
     * @description: 获取枚举的值列表
     * @param {type} 
     */    
    public static getValues(targetEnum:any):List<any>
    {
        let list = new List<any>();
        for (let i in targetEnum)
        {
            list.add(i);
        }

        let len = list.length / 2;
        while (len > 0)
        {
            list.pop();
            len--;
        }

        return list;
    }


    /**
     * @description: 获取枚举的字典数据
     * @param {type} 
     */    
    public static getDic(targetEnum:any):Dictionary<string,number> {
        var list = [];
        var dic = new Dictionary<string, number>();

        for (var name in targetEnum) {
            list.push(targetEnum[name]);
        }

        let len = list.length / 2;
        for (let i = 0; i < len; i++)
        {
            dic.add(list[i], list[i + len]);
        }

        return dic;
    }

    /**
     * @description: 获取枚举的长度
     * @param targetEnum
     * @return: 
     */
    public static getLength(targetEnum:any):number
    {
        let count = 0;
        for (var i in targetEnum)
        {
            count++;
        }

        return Math.floor(count / 2);
    }
}