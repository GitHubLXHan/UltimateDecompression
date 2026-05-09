/*
 * @Author: CGT (caogtaa@gmail.com) 
 * @Date: 2020-01-16 22:08:55 
 * @Last Modified by:   flamingo
 * @Last Modified time: 2023-09-06 14:37:26
 */


function getCurSeleceNode() {
    let selected = Editor.Selection.curSelection('node');
    let uuid = selected[0]
    let root = undefined
    if(!uuid){
        root = cc.director.getScene();
    }else{
        root = cc.engine.getInstanceById(uuid)
    }
    return root
}


function attachNode(node, parent, worldPos, callback) {
  // world position to relative position
  parent.addChild(node);
  node.position = parent.convertToNodeSpaceAR(worldPos);

  // todo: support undo
  if (callback) {
    callback(null, node);
  }
}

module.exports = {
   /**
     * 添加节点
     * @param {*} event 
     * @param {{ uuids: string[]}} data 数据
     */
     'add-node-with-component': function (event, data) {   
        let root = getCurSeleceNode()
        if(root){
            let node = new cc.Node()
            let worldPos = cc.v2(data.worldX, data.worldY);   // todo: uniform param

            attachNode(node, root, worldPos)

            if(data.name){
                node.name = data.name 
                let component = cc.js.getClassByName(data.name)
                if(component){
                    node.addComponent(component)
                }else{
                    Editor.log(data.name + " not find")
                }
            }

            if(data.name == "GameLabel") {
                let componentUuid = node.getComponent(data.name).uuid             
                Editor.Ipc.sendToPanel('scene', 'scene:set-property', {
                    id: componentUuid,
                    path: 'font',
                    type: 'cc.Font',
                    value: {uuid : "33faee89-4cbd-43e9-8d77-e8c8ecc4a126"},
                    isSubProp: false,
                });
            }
            Editor.Selection.select('node', node.uuid);
        }
        event.reply(null);
    },

    'add-prefab': function (event, data) {   
        // 添加空节点
        // Editor.Ipc.sendToPanel('scene', 'scene:create-node-by-classid', data.nodeName, data.name, data.uuids);
        let root = getCurSeleceNode()
        if(root && data.uuid){
            let worldPos = cc.v2(data.worldX, data.worldY);   // todo: uniform param
            cc.assetManager.loadAny([data.uuid], (err, assets) => {
                if(err){
                    Editor.error(err)
                }else{
                    let node = cc.instantiate(assets);
                    attachNode(node, root, worldPos);
                }
            });

            // Editor.Ipc.sendToPanel('scene', 'scene:create-nodes-by-uuids', [data.uuid], root.uuid);
        }
        event.reply(null);
    },

};
