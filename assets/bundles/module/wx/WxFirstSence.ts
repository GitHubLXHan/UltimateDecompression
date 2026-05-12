
const { ccclass, property } = cc._decorator;

@ccclass
export default class WxFirstSence extends cc.Component {
    start() {
        //@ts-ignore
        let loadMainSrc = window.loadMainSrc
        if (loadMainSrc) {
            loadMainSrc(() => {
                //cc.AssetManager.BuiltinBundleName.MAIN  声明是数字 但是实际上是字符串
                cc.assetManager.loadBundle(cc.AssetManager.BuiltinBundleName.MAIN + "", this.onLoadMainBundleDone.bind(this));
            })
        } else {
            cc.assetManager.loadBundle(cc.AssetManager.BuiltinBundleName.MAIN + "", this.onLoadMainBundleDone.bind(this));
        }
    }


    onLoadMainBundleDone() {
        let m = this.node.parent.addComponent("Main")
        m.wxFirstSceneComponent = this
    }

    onLoginViewOpenDone() {
        this.node.removeFromParent()
    }
}
