
import { UdBindMeta } from "../../../extension/basecore/UdDecoratorKit";
import { UdReflectKit } from "../../../extension/utils/UdReflectKit";
import { UdViewCore } from "../../../extension/view/compoment/UdViewCore";
import { UdPanelHub } from "../../manager/UdPanelHub";

/**
 * @description: 全屏类界面父类
 *  生命周期:   init(root)  和预制绑定
 *             initRunData() 初始化变量 会在第一次打开和从缓存中打开时调用
 *             updateView(params) 更新界面 会在第一次打开和从缓存中打开时调用 其他时机需自己管理
 *  其他参数&函数  skinName :预制体名称 默认是类名（首字母小写）
 *              show hide 设置对应的visible=true  添加和删除事件
 *              close 从界面上移除 相当于关闭界面
 */
// const {ccclass} = _decorator;
// @ccclass
@UdBindMeta
export class UdFullView extends UdViewCore {
    /**
     * @description: 关闭窗口
     * @param isDestroy
     */
    public close(isDestroy: boolean = false) {
        UdPanelHub.Ins.close(UdReflectKit.getClass(this.name), isDestroy === true);
    }
}