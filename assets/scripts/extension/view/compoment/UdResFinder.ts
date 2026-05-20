import { UdKeyMap } from "../../basecore/UdKeyMap";
export class UdResFinder {
    private _root: cc.Node;
    private _nodeStore: UdKeyMap<string, cc.Node> = new UdKeyMap<string, cc.Node>();
    private _componentStore: UdKeyMap<string, cc.Component> = new UdKeyMap<string, cc.Component>();
    private _isCacheNode: boolean = false;
    private _isCacheComponent: boolean = false;


    constructor(root?: cc.Node, isCacheNode: boolean = false, isCacheComponent: boolean = false) {
        if (root == null)
            return;

        this.init(root, isCacheNode, isCacheComponent);
    }

    /**
     * @description: 初始化
     * @param {type} 
     */
    public init(root: cc.Node, isCacheNode: boolean = false, isCacheComponent: boolean = false) {
        this._root = root;
        this._isCacheNode = isCacheNode;
        this._isCacheComponent = isCacheComponent;

    }


    /**
     * @description: 获取对应名字的子节点
     * @param {type} 
     */
    public getNode(childName: string): cc.Node | undefined{
        if (this._nodeStore.contains(childName))
            return this._nodeStore.getValue(childName) as cc.Node;

        let node = UdResFinder.getNode(this._root, childName);
        if (node != null && this._isCacheNode)
            this._nodeStore.add(childName, node);

        return node;
    }

    /**
     * @description: 从指定节点上获取组件
     * @param {type} 
     */
    public getComponent<T extends cc.Component>(childName: string, type: {name:string , prototype: T}): T {
        let cacheName = childName + "_" + type.name;

        if (this._componentStore.contains(cacheName))
            return this._componentStore.getValue(cacheName) as T;

        let node = this.getNode(childName);
        if (node) {
            let component = node.getComponent(type);
            if (component != null && this._isCacheComponent)
                this._componentStore.add(cacheName, component);

            return component;
        }

        return undefined;
    }


    /**
     * @description: 销毁对戏那个
     */
    public dispose() {
        if (this._root != null) {
            if (this._root.isValid) {
                this._root.destroy();
            }
            this._root = undefined;
        }
        this._nodeStore.clear();
        this._nodeStore = null;
    }

    public get Root(): cc.Node {
        return this._root;
    }

    /**
     * @description: 获取对应名字的子节点
     * @param {type} 
     */
    public static getNode(node: cc.Node, childName: string): cc.Node | undefined {
        if (node == undefined)
            return undefined;

        if (node.name == childName)
            return node;

        let len = node.children.length;
        for (let i = 0; i < len; i++) {
            let child = UdResFinder.getNode(node.children[i], childName);

            if (child != undefined)
                return child;
        }

        return undefined;
    }

    public static getComponent<T extends cc.Component>(node:cc.Node,  type: {name:string , prototype: T}): T {
        if (node != null) {
            let component = node.getComponent(type);
            if (component != null) {
                return component;
            }
            
            if (node.children != null && node.children.length > 0) {
                for (let i = 0; i < node.children.length; i++) {
                    return UdResFinder.getComponent(node.children[i], type);
                }
            }
        }

        return null;
    }
    
}