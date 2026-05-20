import { UdBindMeta } from "../basecore/UdDecoratorKit";
import { IUdReusable } from "../pool/IUdReusable";

@UdBindMeta
export class UdSignalSlot implements IUdReusable {
    public handler:(target: any, args: any[])=>void;
    public target:any;

    public clone():UdSignalSlot {
        let vo = new UdSignalSlot();
        vo.target = this.target;
        vo.handler = this.handler;
        return vo;
    }

    public impl() {}

    public recover() {
        this.handler = null;
        this.target = null;
    }
}