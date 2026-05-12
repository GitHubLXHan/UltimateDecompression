import { RefClass } from "../basecore/RefDecorator";
import { LogMgr } from "../log/LogMgr"

@RefClass
export class ClassUtils {
    private static readonly devClssLink: string = "__quick_compile_project__";
    private static readonly devRequireFun: string = "require";

    private static readonly requireFun: string = "__require";

    /**
     * @description: 根据类名获取一个Class对象
     * @param clsName
     * @return: 
     */
    public static getClass(clsName: string): any {
        let cls = cc.js.getClassByName(clsName);

        if (cls == null) {
            LogMgr.logError("对象不存在或者没有 @RefClass 装饰器，无法获取:", clsName);
            return null;
        }

        return cls;
    }

    /**
     * @description: 是否存在指定的类
     * @param clsName
     * @return: 
     */
    public static hasClass(clsName: string): boolean {
        if (clsName == "Object")
            return true;

        return this.getClassName(clsName) != null;
    }

    /**
     * @description: 根据类名创建一个实例
     * @param clsName
     * @return: 
     */
    public static getIns(clsName: string): any {
        if (clsName == "Object")
            return {};

        let cls = this.getClass(clsName);
        if (cls == null)
            return null;

        let ins = new cls();
        return ins;
    }

    /**
     * @description: 获取对象对应的类名
     * @param obj
     * @return: 
     */
    public static getClassName(obj: any): string {
        if (obj == null)
            return null;

        // let baseType = typeof obj;
        // if (baseType == "string" || baseType == "number" || baseType == "boolean") {
        //     let baseTypeStr = baseType.toString();
        //     let firstChar = baseTypeStr.charAt(0).toUpperCase();
        //     return firstChar + baseTypeStr.substr(1);
        // }

        let clsName = cc.js.getClassName(obj);
        if (clsName == null || clsName.length <= 0) {
            clsName = obj.constructor.name;
        }
        return clsName;
    }
}