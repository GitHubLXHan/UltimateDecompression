import { UdKeyMap } from "../basecore/UdKeyMap";
import { UdSeqList } from "../basecore/UdSeqList";

export class UdEnumKit
{
    /**
     * @description: 获取枚举的名字列表
     * @param {type} 
     */    
    public static getNames(targetEnum:any):UdSeqList<string>
    {
        let list = new UdSeqList<any>();
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
    public static getValues(targetEnum:any):UdSeqList<any>
    {
        let list = new UdSeqList<any>();
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
    public static getDic(targetEnum:any):UdKeyMap<string,number> {
        var list = [];
        var dic = new UdKeyMap<string, number>();

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