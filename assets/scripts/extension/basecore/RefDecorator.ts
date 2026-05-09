// import { js } from "cc";

export class RefDecorator {
    public static readonly ValidFlag: string = "IsRefClass";
}

/**
 * @description: 反射装饰器函数，用于cc.js注册类信息，确保可以映射类名，配合对象池使用
 * @author: Zeros
 */

export function RefClass(target: any): void {
    // let frameInfo = (<any>cc)['_RF'].peek();
    // if (frameInfo) {
    //     let clsName = frameInfo.script;
    //     if (js.getClassByName(clsName) != null)
    //         return;

    //     js.setClassName(clsName, target);
    //     target[RefDecorator.ValidFlag] = true;
    // }
    let frameInfo = cc['_RF'].peek();
    let script = frameInfo.script;
    cc.js.setClassName(script, target);
    target[RefDecorator.ValidFlag] = true;
}