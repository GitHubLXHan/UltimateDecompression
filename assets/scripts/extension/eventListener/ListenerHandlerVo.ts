import { RefClass } from "../basecore/RefDecorator";
import { IPoolInstance } from "../pool/IPoolInstance";

/**
 * @description: 
 * @author: Zeros
 */
@RefClass
export class ListenerHandlerVo implements IPoolInstance {
    public handler:(target: any, args: any[])=>void;
    public target:any;

    public clone():ListenerHandlerVo {
        let vo = new ListenerHandlerVo();
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