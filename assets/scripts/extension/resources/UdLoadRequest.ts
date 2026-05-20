import { UdBindMeta } from '../basecore/UdDecoratorKit';
import { IUdReusable } from '../pool/IUdReusable';
import { UdLoadTier } from './UdLoadTier';

@UdBindMeta
export class UdLoadRequest implements IUdReusable {
    /**任务id */
    id: number = 0;
    /**优先级 */
    priority: UdLoadTier;
    /**加载函数 */
    loadFunc: Function;
    /**加载函数作用域 */
    loadFuncTarget: any;
    /**加载函数参数, [加载完成回调, ...其余参数] */
    loadFuncArgs: any[];

    public impl(): void {

    }

    public recover(): void {
        this.id = 0; // 不重置id，以便直接复用
        this.loadFuncArgs = null;
        this.loadFunc = null;
        this.priority = UdLoadTier.IDLE;
        this.loadFuncTarget = undefined;
    }
}

