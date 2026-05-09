module.exports = {

    /**
     * 获取所有组件
     * @param {*} event 
     */
    'get-all-components': function (event) {
        // 获取所有组件
        const components = getAllComponents();
        // 返回结果给主进程
        event.reply(null, components);
    },

    /**
     * 添加组件
     * @param {*} event 
     * @param {{ uuids: string[], name: string }} data 数据
     */
    'add-component': function (event, data) {
        // 获取组件 id
        const id = getComponentId(data.name);
        if (!id) {
            event.reply(null);
            return;
        }
        // 添加组件到节点
        Editor.Ipc.sendToPanel('scene', 'scene:add-component', data.uuids, id);
        event.reply(null);
    },
    /**
     * 添加节点
     * @param {*} event 
     * @param {{ uuids: string[]}} data 数据
     */
     'add-Node': function (event, data) {   
        // 添加空节点
        // Editor.Ipc.sendToPanel('scene', 'scene:create-node-by-classid', data.nodeName, data.name, data.uuids);
        let uuid = data.uuids[0]
        let root = getNodeByUuid(uuid)
        if(root){
            let info = isPerfab(data.name)
            if(info.isPerfab) {
                Editor.Ipc.sendToPanel('scene', 'scene:create-nodes-by-uuids', [info.uuid], uuid);
            } else {
                let node = new cc.Node()
                root.addChild(node)
                node.name = data.nodeName
                let component = cc.js.getClassByName(data.name)
                component && node.addComponent(component)

                let curSelectUuids = Editor.Selection.curSelection('node');
                if(data.name == "GameSprite" && data.spriteUuid) {
                    let componentUuid = node.getComponent(component).uuid             
                    Editor.Ipc.sendToPanel('scene', 'scene:set-property', {
                        id: componentUuid,
                        path: 'spriteFrame',
                        type: 'cc.SpriteFrame',
                        value: {uuid:data.spriteUuid},
                        isSubProp: false,
                    });                 
                }
                if(data.name == "GameLabel") {
                    let componentUuid = node.getComponent(component).uuid             
                    Editor.Ipc.sendToPanel('scene', 'scene:set-property', {
                        id: componentUuid,
                        path: 'font',
                        type: 'cc.Font',
                        value: {uuid:"33faee89-4cbd-43e9-8d77-e8c8ecc4a126"},
                        isSubProp: false,
                    });

                }
                Editor.Selection.select('node', node.uuid);

            }
        }
        event.reply(null);
    },
     /**
     * 获取组件数据
     * @param {*} event 
     */
    'scene-query-node': function (event, uuid) {    
        Editor.Ipc.sendToPanel('scene', 'scene:query-node', uuid,(err,ret)=>{
            event.reply(null,JSON.parse(ret));
        });
    }

}


function isPerfab(name) {
    let ret = {
        uuid:"",
        isPerfab:false
    }
    switch(name){
        case "ColorBtn":
            ret.isPerfab = true
            ret.uuid = "84866a43-c071-4af9-b16d-b2fee78cb061"
            break;
        case "SmallColorBtn":
            ret.isPerfab = true
            ret.uuid = "ed308033-59fa-4340-959f-02917e4e2972"
            break;
        case "ColorCostBtn":
            ret.isPerfab = true
            ret.uuid = "98f57f5d-02d4-4d44-8f32-3f7b030f282e"
            break;
        case "iconButton":
            ret.isPerfab = true
            ret.uuid = "8b4f15c3-8426-4054-97a2-eec80167f28f"
            break;
        case "base_item":
            ret.isPerfab = true
            ret.uuid = "f2b200c2-be44-4205-88fd-037f7f114e21"
            break;
        case "base_item_plus":
            ret.isPerfab = true
            ret.uuid = "93088097-b9bd-4627-9b88-b276ff741a1f"
            break;

    }
    return ret
}

/**
 * 获取所有组件
 * @returns {string[]}
 */
function getAllComponents() {
    // 组件菜单数据
    const items = cc._componentMenuItems;
    // 组件名列表
    const components = items.map(item => cc.js.getClassName(item.component));
    return components;
}

/**
 * 获取组件 id
 * @param {string} name 组件名称
 * @returns {string}
 */
function getComponentId(name) {
    const items = cc._componentMenuItems;
    for (let i = 0, l = items.length; i < l; i++) {
        const component = items[i].component;
        if (cc.js.getClassName(component) === name) {
            return cc.js._getClassId(component);
        }
    }
    return null;
}


function getNodeByUuid(uuid, root){
    if(!root) {
        let scene = cc.director.getScene();
        root = scene
    }
    if(root.uuid == uuid) return root
    let length = root.children.length
    for(let i = 0; i < length; i++){
        let child = root.children[i]
        if(child.uuid == uuid){
            return child
        } else {
            let ret = getNodeByUuid(uuid, child)
            if(ret) return ret
        }
    }  
    return undefined
}

