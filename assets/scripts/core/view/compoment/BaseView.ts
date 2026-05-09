
import { RefClass } from "../../../extension/basecore/RefDecorator";
import { ClassUtils } from "../../../extension/utils/ClassUtils";
import { View } from "../../../extension/view/compoment/View";
import { UIMgr } from "../../manager/UIMgr";

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
@RefClass
export class BaseView extends View {
    /**
     * @description: 关闭窗口
     * @param isDestroy
     */
    public close(isDestroy: boolean = false) {
        UIMgr.Ins.close(ClassUtils.getClass(this.name), isDestroy === true);
    }
}