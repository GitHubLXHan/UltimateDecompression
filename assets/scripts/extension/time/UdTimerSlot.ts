import { IUdReusable } from "../pool/IUdReusable";
import { UdBindMeta } from "../basecore/UdDecoratorKit";

// const { ccclass, property, type } = _decorator;
@UdBindMeta
export class UdTimerSlot implements IUdReusable {
    public id: number = 0;
    public interval: number = 0;
    public nextTrick: number = 0;
    public args ?: any[];
    public callback ?: (...args : any[]) => void;

    public doAction() {
        if (this.callback != null) {
            if (this.args != null && this.args.length > 0) {
                this.callback(...this.args);
            } else {
                this.callback();
            }
        }
    }

    public impl() { }

    public recover() {
        this.id = 0;
        this.interval = 0;
        this.nextTrick = 0;
        this.args = undefined;
        this.callback = undefined;
    }
}