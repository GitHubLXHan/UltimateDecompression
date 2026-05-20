// import { js } from "cc";

export class UdDecoratorKit {
    public static readonly ValidFlag: string = "IsRefClass";
}

export function UdBindMeta(target: any): void {
    // let frameInfo = (<any>cc)['_RF'].peek();
    // if (frameInfo) {
    //     let clsName = frameInfo.script;
    //     if (js.getClassByName(clsName) != null)
    //         return;

    //     js.setClassName(clsName, target);
    //     target[UdDecoratorKit.ValidFlag] = true;
    // }
    let frameInfo = cc['_RF'].peek();
    let script = frameInfo.script;
    cc.js.setClassName(script, target);
    target[UdDecoratorKit.ValidFlag] = true;
}