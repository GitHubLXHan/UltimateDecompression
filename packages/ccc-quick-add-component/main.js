const ConfigManager = require('./config-manager');
const { BrowserWindow, ipcMain} = require('electron');

/** 包名 */
const PACKAGE_NAME = 'ccc-quick-add-component';

/**
 * i18n
 * @param {string} key
 * @returns {string}
 */
// const translate = (key) => Editor.T(`${PACKAGE_NAME}.${key}`);
const translate = (key) => (`${PACKAGE_NAME}.${key}`);

/** 扩展名 */
const EXTENSION_NAME = translate('name');

module.exports = {

  /**
   * 搜索栏实例
   * @type {BrowserWindow}
   */
  searchBar: null,
  /**
   * 搜索类型
   * @type {number}
   */
  searchType: null,
  /**
   * 缓存
   * @type {string[]}
   */
  cache: null,

  /*
   * 节点转代码时对应组件的优先级 0表示忽略这个组件 数字越大优先级越高
   * PS： UUID是组件添加到节点后的uuid  不是组件ts代码的uuid
   *     uuid = cc.js._getClassId(cc.js.getClassByName("GameSprite"))
   */
  componentPriority: {
    "2febaj20bhOU7ukbli3i+xo": 70,  //gameSpine
    "2ccac4t1hxHpIIJdylpbN1H": 80,  //gameSprite
    "cc.Label" : 90,
    "GameLabel" : 90,
    "6f71bkufA9MjZkRs2Pz75Cb": 100,  //commonButton
    "eb164MnSI1C3rdr/fgBLaSY":99,  //gameButton
    "4aa0dRzjypLkKZa/7fzfJqb":98,  //ColorCostBtnComponent


    "otherCCComponent": 40,   //其他cc组件
    "custom": 50,  //自定义组件

    "cc.Layout": 0,
    "cc.Widget": 0,
    "cc.BlockInputEvents": 0,
  },

  spriteFramCache:null,
  textureCache:null,

  /**
   * 扩展消息
   * @type {{ [key: string]: Function }}
   */
  messages: {

    /**
     * 打开搜索面板
     */
    'open-search-panel'() {
      this.searchType = 0
      if (this.getSelectedNodeUuids().length === 0) {
        Editor.log(`[${EXTENSION_NAME}]`, translate('nodeError'));
        return;
      }
      this.openSearchBar();

      // Editor.log(this.spriteFramCache)
    },

    /**
     * 打开设置面板
     */
    'open-setting-panel'() {
      Editor.Panel.open(`${PACKAGE_NAME}.setting`);
    },

    /**
     * 读取配置
     * @param {any} event 
     */
    'read-config'(event) {
      const config = ConfigManager.read();
      event.reply(null, config);
    },

    /**
     * 保存配置
     * @param {any} event 
     * @param {any} config 
     */
    'save-config'(event, config) {
      ConfigManager.save(config);
      event.reply(null, true);
    },

    'assets-search'(event, config) {
      this.searchType = 1;
      this.openSearchBar();
    
    },

    'get-node-data'(event, config) {
      Editor.log("get-node-data")
      this.logNodeData();
      event.reply(null);
    },

    // 'get-path-by-uuid'(event, uuid) {
    //   Editor.log('get-path-by-uuid11', uuid)
    //   let doneFunc = (textureCache)=>{
    //        let path = ""
    //         Editor.log('get-path-by-uuid1111111')
    //        for(let index in textureCache){
    //           let item = textureCache[index]
    //           if(item.uuid == uuid){
    //             path = item.path
    //             break
    //           }
    //        }
    //        event.reply(path)
    //      }
    //    if(!this.textureCache){
    //       Editor.log('get-path-by-uuid22')
    //      this.getAllTexture(doneFunc)
    //    } else {
    //       Editor.log('get-path-by-uuid2333')
    //      doneFunc(this.textureCache)
    //    }
    // }
  },

  /**
   * 生命周期：加载
   */
  load() {
    // 监听事件
    ipcMain.on(`${PACKAGE_NAME}:match-keyword`, this.onMatchKeywordEvent.bind(this));
    ipcMain.on(`${PACKAGE_NAME}:add-component`, this.onAddComponentEvent.bind(this));
    ipcMain.on(`${PACKAGE_NAME}:add-Node`, this.onAddNodeEvent.bind(this));
    ipcMain.on(`${PACKAGE_NAME}:log`, (event, ...keyword)=>{
      Editor.log(...keyword);
      event.reply(``);
    });
    ipcMain.on(`${PACKAGE_NAME}:close`, this.onCloseEvent.bind(this));
  },

  /**
   * 生命周期：卸载
   */
  unload() {
    // 取消事件监听
    ipcMain.removeAllListeners(`${PACKAGE_NAME}:match-keyword`);
    ipcMain.removeAllListeners(`${PACKAGE_NAME}:add-component`);
    ipcMain.removeAllListeners(`${PACKAGE_NAME}:add-Node`);
    ipcMain.removeAllListeners(`${PACKAGE_NAME}:log`);
    ipcMain.removeAllListeners(`${PACKAGE_NAME}:close`);
  },

  /**
   * （渲染进程）关键词匹配事件回调
   * @param {*} event 
   * @param {string} keyword 关键词
   */
  async onMatchKeywordEvent(event, keyword) {
    switch(this.searchType){
      case 0:
        // 查找匹配关键词的组件
        const results = await this.getMatchComponents(keyword);
        event.reply(`${PACKAGE_NAME}:match-keyword-reply`, results);
        break;
      case 1:
        Editor.Ipc.sendToPanel('assets', 'assets:search', keyword, (err,ret)=>{
          // Editor.log("assets:search", err, ret)
        });
        event.reply(``);
        break
    }
  },

  /**
   * （渲染进程）添加组件事件回调
   * @param {*} event 
   * @param {string} name 组件名称
   */
  onAddComponentEvent(event, name) {
    // 获取当前选中节点 uuid
    const uuids = this.getSelectedNodeUuids();
    if (uuids.length === 0) {
      Editor.log(`[${EXTENSION_NAME}]`, translate('nodeError'));
      return;
    }
    // 调用场景脚本添加组件
    const data = { uuids, name };
    Editor.Scene.callSceneScript(PACKAGE_NAME, 'add-component', data, (error) => {
      event.reply(`${PACKAGE_NAME}:add-component-reply`);
    });
  },


  /**
   * （渲染进程）添加组件事件回调
   * @param {*} event 
   * @param {string} name 组件名称
   */
  async onAddNodeEvent(event, name, nodeName, spriteName) {
    // Editor.log("onAddNodeEvent",name, nodeName, spriteName)
    // 获取当前选中节点 uuid
    const uuids = this.getSelectedNodeUuids();
    if (uuids.length === 0) {
      Editor.log(`[${EXTENSION_NAME}]`, translate('nodeError'));
      return;
    }
    // 调用场景脚本添加组件
    const data = { uuids, name, nodeName };
    if(spriteName) {
      if(spriteName == "clear"){
        this.spriteFramCache = undefined
        Editor.log("图片缓存清除成功")
        event.reply(`${PACKAGE_NAME}:add-component-reply`);
        return
      }
      if(!this.spriteFramCache)
        await this.getAllSpriteFrameInUi()
      if(this.spriteFramCache[spriteName])
        data.spriteUuid = this.spriteFramCache[spriteName].uuid
      else {
        Editor.log("图片名字错误 将不生成节点",spriteName)
        event.reply(`${PACKAGE_NAME}:add-component-reply`);
        return
      }
    }
    Editor.Scene.callSceneScript(PACKAGE_NAME, 'add-Node', data, (error) => {
      event && event.reply(`${PACKAGE_NAME}:add-component-reply`);
    });
  },


  addSpriteByUuid(rootUuid, spriteUuid) {
    // 调用场景脚本添加组件
    const data = { uuids:[rootUuid], name:"GameSprite", nodeName:"New Sprite", spriteUuid:spriteUuid};
    Editor.Scene.callSceneScript(PACKAGE_NAME, 'add-Node', data, (error) => {
      event && event.reply(`${PACKAGE_NAME}:add-component-reply`);
    });
  },

  /**
   * （渲染进程）关闭事件回调
   * @param {*} event 
   */
  onCloseEvent() {
    this.closeSearchBar();
  },

  /**
   * 当前选中的节点 UUID
   */
  getSelectedNodeUuids() {
    // curGlobalActivate 只能获取单个选择
    // Editor.Selection.curGlobalActivate();
    return Editor.Selection.curSelection('node');
  },

  logNodeData() {
    let uuids = Editor.Selection.curSelection('node');
    if(uuids.length == 0){
      Editor.log("未选中节点")
      return
    }
    let definedStr = []
    let getDataStr = []
    let componentFormStr = []
    let count = 0
    for (var i = 0; i < uuids.length; i++) {
      let uuid = uuids[i]
      Editor.Scene.callSceneScript(PACKAGE_NAME, 'scene-query-node', uuid, (error, data) => {
        // Editor.log(data)
          count++
          let targetCode = this.translateEditorDataToTargetCode(data)
          if(targetCode){
            definedStr.push(targetCode[0])
            getDataStr.push(targetCode[1])
            componentFormStr.push(targetCode[2])
            componentFormStr.push(targetCode[3])
          }else{
            Editor.log("未命名节点将跳过")
          }
          if(count == uuids.length) {
            Editor.log("定义")
            definedStr.forEach(e=>{
              Editor.log(e)
            })
            Editor.log("赋值\n\n")
            Editor.log("赋值\n\n")
            getDataStr.forEach(e=>{
              Editor.log(e)
            })
            Editor.log("组件格式\n\n")
            Editor.log("组件格式\n\n")
            componentFormStr.forEach(e=>{
              Editor.log(e)
            })
          }
      });
    }
  },

  translateEditorDataToTargetCode(data) {
    let value = data.value
    let name = value.name.value
    if(name.indexOf("New ") >= 0 || name.indexOf("_") == 0) {
      return undefined
    }

    let __comps__ = value.__comps__
    if(!__comps__ || __comps__.length <= 0){
      return [`private _${name}: cc.Node;\n`, `this._${name} = this.ResBase.getNode("${name}");\n`,
      `@property(cc.Node)\n`,`public ${name}: cc.Node = undefined;\n`]
    }

    let componentName = ""
    let maxPriority = 0
    __comps__.forEach(e=>{
      if(this.componentPriority[e.type] == 0){
        return
      }
      let priority = this.componentPriority[e.type]
      if(!priority) {
        if(e.type.indexOf("cc.") >= 0) {
          priority = this.componentPriority["otherCCComponent"]
        } else {
          priority = this.componentPriority["custom"]
        }
      }
      if(priority > maxPriority){
        maxPriority = priority
        componentName = e.type
      }
    })

    if(!componentName)
      return [`private _${name}: cc.Node;\n`, `this._${name} = this.ResBase.getNode("${name}");\n`,
    `@property(cc.Node)\n`,`public ${name}: cc.Node = undefined;\n`]
    if(componentName.indexOf("cc.") >= 0){
      return [`private _${name}: ${componentName};\n`, `this._${name} = this.ResBase.getComponent("${name}", ${componentName});\n`,
      `@property(${componentName})\n`,`public ${name}: ${componentName} = undefined;`]
    }

    let types = data.types
    componentName = types[componentName].name
    return [`private _${name}: ${componentName};\n`, `this._${name} = this.ResBase.getComponent("${name}", ${componentName});\n`,
    `@property(${componentName})\n`,`public ${name}: ${componentName} = undefined;`]


  },

  /**
   * 展示搜索栏
   */
  openSearchBar() {
    // 已打开则关闭
    if (this.searchBar) {
      this.closeSearchBar();
      return;
    }
    // 创建窗口
    const winSize = [500, 600],
      winPos = this.getPosition(winSize),
      win = this.searchBar = new BrowserWindow({
        width: winSize[0],
        height: winSize[1],
        x: winPos[0],
        y: winPos[1],
        frame: false,
        resizable: false,
        skipTaskbar: true,
        alwaysOnTop: true,
        transparent: true,
        opacity: 0.95,
        backgroundColor: '#00000000',
        hasShadow: false,
        show: false,
        webPreferences: {
          nodeIntegration: true
        },
      });
    // 加载页面（并传递当前语言）
    const lang = Editor.lang;
    win.loadURL(`file://${__dirname}/panels/search/index.html?lang=${lang}`);
    // 调试用的 devtools（detach 模式需要将失焦自动隐藏关掉）
    // win.webContents.openDevTools({ mode: 'detach' });
    // 监听按键（ESC 关闭）
    win.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'Escape') {
        this.closeSearchBar();
      }
    });
    // 就绪后展示（避免闪烁）
    win.on('ready-to-show', () => win.show());
    // 展示后（缓存数据）
    switch(this.searchType){
      case 0:
        win.on('show', async () => (this.cache = await this.getAllComponents()));
        break;
      case 1:
        break;
    }
    // 失焦后（自动关闭）
    win.on('blur', () => this.closeSearchBar());
    // 关闭后（移除引用）
    win.on('closed', () => (this.searchBar = null));
  },

  /**
   * 隐藏搜索栏
   */
  closeSearchBar() {
    if (!this.searchBar) {
      return;
    }
    // 先隐藏
    // 在 2.4.5 版本中，扩展如果安装在局部，关闭搜索栏会引发编辑器闪退
    // 原因未知，修改为先隐藏再关闭就没问题了（离谱）
    this.searchBar.hide();
    // 关闭
    this.searchBar.close();
    // 清除缓存
    this.cache = null;
  },

  /**
   * 获取窗口位置
   * @param {[number, number]} size 窗口尺寸
   * @returns {[number, number]}
   */
  getPosition(size) {
    // 根据编辑器窗口的位置和尺寸来计算
    const editorWin = BrowserWindow.getFocusedWindow(),
      editorSize = editorWin.getSize(),
      editorPos = editorWin.getPosition(),
      // 需要注意一个问题：窗口的位置值必须是整数，否则修改不会生效
      // 毕竟像素应该是显示器上的最低单位了，合理
      x = Math.floor(editorPos[0] + (editorSize[0] / 2) - (size[0] / 2)),
      y = Math.floor(editorPos[1] + 200);
    return [x, y];
  },

  /**
   * 获取组件列表
   * @returns {Promise<string[]>}
   */
  getAllComponents() {
    return new Promise((res) => {
      // 调用场景脚本查找所有组件
      Editor.Scene.callSceneScript(PACKAGE_NAME, 'get-all-components', (error, results) => {
        res(results);
      });
    });
  },

  /**
   * 获取匹配关键词的组件
   * @param {string} keyword 关键词
   * @returns {Promise<{ name: string, similarity: number }[]>}
   */
  getMatchComponents(keyword) {
    return new Promise(async (res) => {
      const results = [];
      let cache = this.cache;
      // 是否有缓存
      if (!cache || cache.length === 0) {
        // 再次获取全部组件并缓存
        cache = this.cache = await this.getAllComponents();
      }
      // 查找并匹配
      if (cache && cache.length > 0) {
        // 正则匹配（每个关键字之间可以有任意个字符，且不区分大小写）
        const pattern = keyword.split('').join('.*'),
          regExp = new RegExp(pattern, 'i');
        // 下面这行正则插入很炫酷，但是性能不好，耗时接近 split + join 的 10 倍
        // const pattern = keyword.replace(/(?<=.)(.)/g, '.*$1');
        for (let i = 0, l = cache.length; i < l; i++) {
          const name = cache[i];
          // 匹配
          if (regExp.test(name)) {
            const similarity = name.match(regExp)[0].length;
            results.push({ name, similarity });
          }
        }
        // 排序（similarity 越小，匹配的长度越短，匹配度越高）
        results.sort((a, b) => a.similarity - b.similarity);
      } else {
        Editor.warn(`[${EXTENSION_NAME}]`, translate(`${PACKAGE_NAME}.dataError`));
      }
      // Done
      res(results);
    });
  },

  /**
   * 获取图片
   * @returns {Promise<string[]>}
   */
  getAllSpriteFrameInUi() {

  

    return new Promise((res) => {
      // 调用场景脚本查找所有组件
      Editor.assetdb.queryAssets("db://assets/resources/ui/**/*","sprite-frame",(err, ret)=>{
        this.spriteFramCache = {}
        ret.forEach(e=>{
          // destPath: "/Users/flamingo/Documents/binghu/x6/client_v2_4/library/imports/e5/e52ebadb-f68c-4939-9ba9-9ce92f361042.json"
          // hidden: false
          // isSubAsset: true
          // path: "/Users/flamingo/Documents/binghu/x6/client_v2_4/assets/resources/ui/adventure/bd_men_01.png/bd_men_01"
          // readonly: false
          // type: "sprite-frame"
          // url: "db://assets/resources/ui/adventure/bd_men_01.png/bd_men_01"
          // uuid: "e52ebadb-f68c-4939-9ba9-9ce92f361042"
          let uuid = e.uuid
          let paths = e.url.split("/")
          let name = paths[paths.length-1]
          this.spriteFramCache[name] = {uuid:uuid, path:e.url.split("resources/")[1]}
        })
        // Editor.log(this.spriteFramCache)
        res(this.spriteFramCache);
      })

      

      Editor.assetdb.queryAssets("db://assets/bundles/module/**/*","sprite-frame",(err, ret)=>{
        //this.spriteFramCache = {}
        ret.forEach(e=>{
          // destPath: "/Users/flamingo/Documents/binghu/x6/client_v2_4/library/imports/e5/e52ebadb-f68c-4939-9ba9-9ce92f361042.json"
          // hidden: false
          // isSubAsset: true
          // path: "/Users/flamingo/Documents/binghu/x6/client_v2_4/assets/resources/ui/adventure/bd_men_01.png/bd_men_01"
          // readonly: false
          // type: "sprite-frame"
          // url: "db://assets/resources/ui/adventure/bd_men_01.png/bd_men_01"
          // uuid: "e52ebadb-f68c-4939-9ba9-9ce92f361042"
          let uuid = e.uuid
          let paths = e.url.split("/")
          let name = paths[paths.length-1]
          this.spriteFramCache[name] = {uuid:uuid, path:e.url.split("assets/")[1]}
        })
        // Editor.log(this.spriteFramCache)
        res(this.spriteFramCache);
      })


    });
  },

  // 参数“texture”可以从 Editor.remote.assettype2name拿到
  getAllTexture(res){
     Editor.assetdb.queryAssets("db://assets/resources/ui/**/*","texture",(err, ret)=>{
        this.textureCache = {}
        ret.forEach(e=>{        
          let uuid = e.uuid
          let paths = e.url.split("/")
          let name = paths[paths.length-1]
          this.textureCache[name] = {uuid:uuid, path:e.url.split("resources/")[1]}
        })
        res(this.textureCache);
      })

  }

}
