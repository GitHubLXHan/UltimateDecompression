CocosCreator2.x 大项目卡顿终极解决方案
让你5000+资源的项目开发如燕般轻盈流畅。

-----

`如燕(Aswallow)`

## 简介
基于CocosCreator2.4.x

让你5000+资源的项目开发如燕般轻盈流畅。


## 特性

!!注意特性所需是 [**插件**] 还是 [**运行时**] 或者[**运行时**]+[**插件**]!!

1. [**插件**]/[**运行时**]开箱即用
2. [**插件**]在开发中加载`assets`目录外资源
3. [**插件**]发布时自动处理指定外部资源
4. [**插件**]支持发布构建流程自行扩展
5. [**插件**]支持发布小游戏和`runtime`（让你的包真机预览突破4M）、安卓原生、`web`

~~6. [**运行时**]+[**插件**]支持跨项目assetbundle协同开发(暂不支持微信小游戏)~~

6. [**运行时**]+[**插件**]支持跨项目`AssetBundle`协同开发(支持所有平台)

7. [**运行时**]支持加载`散图`、`plist图集`、`dragonbones`、`spine`、`tilemap`、`Fairygui资源`
8. [**运行时**]加载解析可自行扩展

9. 完美支持Cocos Creator官方的热更新（感谢@ 王壮壮的测试）

## 破坏性更新说明

### 2.1.x 版本

也不算是多破坏性的更新,而是更加简洁和符合开发部署习惯

1. **实现了更加完善简洁易用的跨项目`AssetBundle`协同**

    * 开发预览支持：浏览器预览，模拟器预览
    * 构建逻辑支持平台
        测试过的:安卓原生、微信小游戏、web、
        暂未测试但应该支持的平台：所有小游戏平台、CocosPlay平台、ios

    `2.0.4`的版本是利用远程包的特性来实现的，限制颇多，实际使用起来并不方便

    `2.1.0`及以后的版本，则使用了更加无缝的方式实现。子项目发布后的`AssetBundle`就像本来就在主项目中一样，预览时能正常加载和访问子项目构建后的`AssetBundle`,发布主项目后也可以正常访问这些资源

    移除了所有跟`AssetBundle`相关的配置字段`extBundleDir`，`extBundleRoot`

    加载主子项目的任意`AssetBundle`，都可以使用`aswallow.extAssetMgr.loadBundle`接口

    具体可见`assets\cases\sub-proj-bundle\sub-proj-bundle-test.ts`

2. **关于外部资源处理逻辑**

    移除了`defaultBuildPath`字段，构建后的外部资源直接复制到对应平台的`remote`目录下

    进行构建测试或者部署发布时的资源服务器地址填`ip地址+端口/<平台key>`，比如`http://xxx.xxx.x.xxx:7456/wechatgame`
    
    之前是填`ip地址+端口`(与实际的开发情况不符，会影响远程bundle的加载)








## 大版本不兼容说明
### 1.x版本
* 仅支持`CocosCreator2.3.x`版本
* 发布支持
    * 小游戏
    * web
    * 安卓原生(暂不支持`2.3.x`发布安卓原生)
* 不包含运行时，复杂资源的加载和解析需要运行时支持(仅支持`散图`、`plist图集`、`fairygui资源`)(有限支持`dragonbones`、`spine`)
    http://store.cocos.com/app/detail/2949
#### 发布Creator2.3.x安卓原生的思路(仅供参考)
1. 打包到包体里
    将`ext-res`复制到安卓发布目录下，**一个可以被creator安卓apk打包的文件夹**，比如jsb-link/src/assets里。加载的话参考[Creator文档](https://docs.cocos.com/creator/2.3/manual/zh/scripting/load-assets.html#%E5%8A%A0%E8%BD%BD%E8%BF%9C%E7%A8%8B%E8%B5%84%E6%BA%90%E5%92%8C%E8%AE%BE%E5%A4%87%E8%B5%84%E6%BA%90)来进行改造
2. 放到cdn
    将`ext-res`上传到cdn，在加载时，就使用cdn拼接资源路径进行加载。或者改造运行时来支持(**1.x版本不包含运行时的，需要另行购买**)
    
### 2.x版本
1. 仅支持`CocosCreator2.4.x`
2. 发布支持
    * web
    * 安卓原生
    * 小游戏
3. 运行时支持加载解析`散图`、`plist图集`、`dragonbones`、`spine`、`tilemap`、`Fairygui资源`
4. 支持跨项目`assetbundle`开发
    * 从`2.0.3`版本开始支持原生加载本地别的项目的`AssetBundle`，具体见下面的文档
    * Creator本身支持加载远程bundle，所以只要将别的项目发布的远程`AssetBundle`复制到主项目中，并做相应处理，即可加载（正常用creator的方式加载即可）
5. 注意从`2.0.2`版本开始包含运行时(所以国庆后会涨价哦),放在插件目录下的`runtime`文件夹:`packages/aswallow/aswallow/runtime`
6. 支持加载压缩纹理（creator支持的都可以）[文档](#加载压缩纹理)

### 后续版本计划

1. 支持Creator3.x
2. 增加GUI面板，支持构建单个子项目，以及修改开发和构建配置
3. 外部资源在主项目中预览，assetbundle资源在主项目中预览


## 购买须知

对于[`Aswallow`运行时和示例源码]的会继续更新。

如果是新购买者，建议移步去购买`Aswallow`插件，插件包含源码，而且有更多功能支持。

而不需要插件的，可以只购买源码

[`Aswallow`运行时和示例源码](http://store.cocos.com/app/detail/2949)

[`Aswallow`插件](https://store.cocos.com/app/detail/2948)

## 免责声明

示例所用资源仅作演示用，不可商用。

## 更新日志

### 2022/5/11 `2.1.7`

1. [插件] 优化预览服务器子项目加载性能

2. [运行时] 支持加载压缩纹理(默认后缀为`.pkm`,`.pvr`,`.webp`的文件为压缩纹理，可自行扩展，具体看[文档](#加载压缩纹理))

### 2022/2/11 `2.1.6`

1. 修复发布原生时，不勾选js代码加密和压缩导致的构建失败的bug

### 2022/2/10 `2.1.5`

1. 修复发布原生时，勾选js代码加密和压缩导致的构建失败的bug

### 2022/2/10 `2.1.4`

1. 修复子项目构建时没容错导致bug
2. 完善构建log提示

### 2022/2/09 `2.1.3`

1. 修复新建项目使用插件的诡异问题

### 2022/1/18 `2.1.2`

1. 修复子项目路径为相对路径时执行[构建全部子项目]时卡住的bug

### 2022/1/1 `2.1.1`

1. 增加配置控制预览服务器log输出

2. 修复配置备份bug和备份的时间错误bug
   
3. 适配和测试`Creator2.7`

### 2021/12/31 `2.1.0`

1. 更新新跨项目`AssetBundle`协同逻辑,更加流畅而自然

2. 修改外部资源的构建处理，让原生平台构建可配置构建为远程资源或者本地资源

3. 修复加载外部资源后，没有增加`asset.refCount`导致资源被释放的问题

4. 支持官方热更新(安卓已测)(感谢@王壮壮)
   
5. 构建配置优化

### 2021/11/15 `2.0.4`

1. 修复ext-res中有.git文件夹，md5报错的bug
2. 修改md5的算法

### 2021/10/26 `2.0.3`

1. 支持发布IOS 感谢`@街头浪人`小伙伴的验证

2. 支持原生加载本地的别的项目的`AssetBundle`资源，并提供微信小游戏加载别的项目发布的远程bundle的思路

### 2021/9/29 `2.0.2`

1. 合并运行时的源码和文档

2. 完善运行时加载获取逻辑

3. 完善跨项目assetbundle机制的插件构建处理和运行时处理

4. 完善文档

### 2021/7/22 `2.0.1`

增加声明文件aswallow.client.d.ts更新功能

### 2021/7/19 `2.0.0`

1. 跨项目AssetBundle协同支持
2. 配置处理逻辑修改，初始化逻辑修改
3. 和`1.0.0`不兼容

### 2021/7/5 `1.0.0`

1. 完善插件使用体验，默认生成空`version.json`文件,避免本地开发加载不到
2. 修复默认配置没生成的问题

### 2021/6/15 `0.2.0`

修复解压失败

### 2021/6/13 `0.1.0`

首次发布

## 联系我

关注公众号

公众号搜索: 玩转游戏开发

或扫码:<img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/abd0c14c9c954e56af20adb71fa00da9~tplv-k3u1fbpfcp-zoom-1.image" alt="img" style="zoom:50%;" />

QQ 群: 1103157878

博客主页: https://ailhc.github.io/

掘金: https://juejin.cn/user/3069492195769469

github: https://github.com/AILHC


## 原理

具体详细请见:[CocosCreator2.x大项目卡顿终极解决方案](https://forum.cocos.org/t/topic/115111)
这里我简单说一下

### 插件原理

Creator的预览，是通过启动一个可以访问`assets`目录的服务器程序，解析资源请求，返回所需资源。`Asswallow`的原理，就是让这个服务器程序可以访问`assets`目录外的文件夹的资源。这样预览的时候，或者小游戏连局域网真机调试时也可以访问到`assets`目录外的资源。
打包的话，就是将开始时能访问的资源，拷贝到发布时能访问的地方去。

跨项目`AssetsBundle`支持(支持发布时设置为`md5`的`bundle`)，主要是解析发布后的`assetsbundle`，配合插件，更加简易的加载`bundle`（不用你去上传`cdn`，或者开本地服务器，记`md5`版本号等）。

### 运行时原理

运行时的作用，就是简化加载解析复杂的外部资源的逻辑。
支持加载解析: 龙骨、`spine`、图集、`tilemap`、`assetbundle`、`fairygui`资源

任何复杂的资源加载解析，都是对简单资源加载并拼装起来的(ps:简单资源指文本、二进制、图片)

运行时就是通过`creator`的远程资源加载接口和设备本地资源加载接口，加载到基础资源，然后进行解析组装成复杂资源对象，然后使用`assetManager`进行资源管理

比如:
```ts
    this.emojiAtlasUrlInfo = { url: "atlas/emoji", assetType: "plist" } as aswallow.IResRequestItem;
    aswallow.extAssetMgr.load([this.emojiAtlasUrlInfo], (err, result) => {
        console.log(result);
        const [emojiAtlas] = aswallow.extAssetMgr.get(this.emojiAtlasUrlInfo);
        
        console.log(emojiAtlas);
        this.emojiSp.spriteFrame = emojiAtlas.getSpriteFrame("emoji1")
    });
```


## 插件使用

1. 将项目中大量同类的动态加载的资源复制到`ext-res`目录（包括meta文件）

    比如`icon`，技能序列帧、人物序列帧、龙骨、`spine`、文本/json

    可以在`assets/resources/aswallow-config.json`中修改`externalResPath`

3. 插件功能菜单说明
    
    1. 帮助信息 
    2. 更新声明文件

        更新插件版本后，可以点击一下，会将插件里的声明文件覆盖项目的`aswallow.client.d.ts`

    3. 还原默认配置`aswallow-config` ，更新插件后可以点一下，旧的配置不会被覆盖，会生成一个备份文件

    4. 构建所有子项目，调用命令行将所有子项目构建一次
### 配置文件

#### 运行时配置文件

配置文件路径:`assets/resources/aswallow-config.json`

注释具体可见`aswallow.client.d.ts`

```ts
declare module "aswallow" {

    export interface IAswallowConfig {
        /**
         * 外部资源目录路径
         * 默认ext-res
         */
        externalResPath: string,
        /**
         * 插件版本,自动生成
         * 
         */
        version?: string
        /**
         * 微信小游戏远程资源服务器地址
         * 默认取值于cc.assetManager.downloader.remoteServerAddress
         */
        miniGameRoot?: string,
        /**
         * 发布后的外部资源根路径
         * 原生 默认: 如果资源作为远程资源则cc.assetManager.downloader.remoteServerAddress+remote,否则取值 jsb.fileUtils.getDefaultResourceRootPath
         * web 默认 ""
         * 小游戏 默认使用 miniGameRoot，并且拼接/remote
         */
        extResRoot?: string
        /**
         * 模拟器预览时使用的服务器URL
         * 编辑器启动时，根据预览url自动生成
         */
        simulateExtBundleRoot?: string;
        /**
         * 原生外部资源是否为远程资源，默认为false
         * 构建时自动生成
         */
        nativeExtResIsRemote?: boolean

    }
}
```
* 默认配置

```json
{
    
    "externalResPath": "ext-res",
    
    "simulateExtBundleRoot": "http://localhost:7456",
    "version": "2.1.0",
}
```
* ！！！注意

1. 如果遇到`preview/main_proj_bundleNames.json`加载报错,是因为配置项目环境时开着编辑器的问题，关闭编辑器重新打开即可

2. 新建子项目时，建议手动构建一次`web-desktop`,否则菜单中**构建子项目**一直默认使用`platform=web-desktop;debug=true`构建

#### 构建配置文件
配置文件路径:`local/aswallow-build-config.json`,`settings/aswallow-build-config.json`

注释具体可见`packages/aswallow/aswallow.d.ts` 中的`IBuildConfig`

```ts
export interface IBuildConfig {
    /**插件版本 */
    version?: string
    /**是否启动 */
    isOpen: boolean,
    /**
     * 输出子项目命令行构建日志到编辑器控制台，默认false
     */
    outputSubProjBuildLog?: boolean,
    /**输出预览服务器日志 */
    outputPreviewServerLog?: boolean,
    /**
     * 强制重新发布，默认true
     */
    forceBuildSubProj?: boolean,
    /**
     * 多线程发布
     * 自动部署时可以开启
     * 默认false
     */
    mutiProgressBuildSubProj?: boolean,

    /**
     * 自定义构建脚本路径，相对路径
     * 属于跟随项目的固定配置 读取 settings/aswallow-build-config.json
     */
    scriptPath: string,
    /**
     * 子项目路径构建配置字典
     * key是子项目路径，尽量是相对路径，也可绝对
     * 属于跟随项目的固定配置 读取 settings/aswallow-build-config.json
     */
    subProjConfig: Record<string, any>,

    /**
     * 外部资源平台对应构建配置
     * 所有平台默认将外部资源作为远程资源
     * key为平台类型key，value为是否作为远程资源
     * 如果作为远程资源，构建时将复制到remote文件夹中
     * 平台类型:android,ios,web-mobile,web-desktop,mini-game,runtime
     * web平台默认构建到assets目录同级下
     * 小游戏和runtime平台默认构建到remote文件夹下
     * 属于跟随项目的固定配置 读取 settings/aswallow-build-config.json
     */
    extResPlatformBuildSetting: Record<string, boolean>
}
```
* 默认本地配置
`local/aswallow-build-config.json`
```json
{
	"isOpen": true,
	
	"version": "2.1.0",
	
	"outputSubProjBuildLog":false,
	"forceBuildSubProj": true,
	"mutiProgressBuildSubProj":false
}
```
* 默认受版本管理的配置
`settings/aswallow-build-config.json`
```json
{
	"scriptPath": "custom-build-scripts/custom-build.js",
	"subProjConfig": {
		"./other-proj":{}
	},
	"version": "2.1.0",
	"extResPlatformBuildSetting": {}
}
```
### 构建处理

具体逻辑看
1. 运行时加载逻辑可见 `aswallow-asset-manager.ts->init`

2. 默认构建逻辑可见 `custom-build-scripts/custom-build.js`(封装了常用的构建处理函数以及插件内部的配置变量)
3. 构建配置文件`local/aswallow-build-config.json` 可配置关闭和开启，以及配置自定义构建逻辑脚本路径

4. 外部资源构建处理
    
    会根据`extResPlatformBuildSetting`配置和所发布的平台类型，将外部资源复制到`remote`或者`assets`文件夹中

    小游戏和`runtime`平台默认构建逻辑只能复制到`remote`文件夹,原生可选

5. 子项目构建处理

    构建完成主项目后会默认重新构建所有子项目(可通过`forceBuildSubProj`进行关闭),然后复制子项目的非内置`AssetBundle`到主项目中

    然后做相应处理，让它能被正常加载

## 运行时使用

### 模拟器预览环境设置

将`assets/lib/fixsimulator-download-ext.js`复制到自己的项目，并设置为插件脚本

### 初始化

```ts
@ccclass
export default class Main extends cc.Component {

    onLoad() {
       await aswallow.extAssetMgr.init();
       //也可动态修改配置
       await aswallow.extAssetMgr.init({
            externalResPath: "ext-res",
            extResRoot: "http://localhost:8090"
        })
    }

    start() {

    }
}

```

### 加载示例

这里展示复杂的资源类型的加载示例和解释

#### 图集(plist图集)

```ts
this.emojiAtlasUrlInfo = { url: "atlas/emoji", assetType: "plist" } as aswallow.IResRequestItem;
aswallow.extAssetMgr.load([this.emojiAtlasUrlInfo], (err, result) => {
    console.log(result);
    const [emojiAtlas] = aswallow.extAssetMgr.get(this.emojiAtlasUrlInfo);
    
    console.log(emojiAtlas);
    this.emojiSp.spriteFrame = emojiAtlas.getSpriteFrame("emoji1")
});
```
这个是复杂资源类型，如果url没有后缀,则会默认根据同名路径查找依赖。

会找到 `atlas/emoji.plist`和`atlas/emoji.png` 两个资源url进行加载解析

如果不是这个规范的图集资源，则会加载出错
#### 骨骼动画资源

类似图集，是属于复杂资源类型，如果url没有后缀并且配置了`ext`字段,则会默认根据同名路径查找依赖

1. Spine资源
加载示例
```ts
this.raptorProResUrlInfo = { url: "spines/spineRatorBin/raptor-pro", assetType: "SpineAsset", ext: "skel" };
        extAssetMgr.load([this.raptorProResUrlInfo], (err, items) => {
            console.log(items)
            const [raptorProSkeletonData] = extAssetMgr.get(this.raptorProResUrlInfo);
            this.spine_bin.skeletonData = raptorProSkeletonData;
            this.spine_bin.animation = 'walk';
            // this.spine._updateSkeletonData
        });
```
这个加载会默认查找依赖`spines/spineRatorBin/raptor-pro.skel`、`spines/spineRatorBin/raptor-pro.atlas`、`spines/spineRatorBin/raptor-pro.png`



2. 龙骨资源
加载示例
```ts
this.swordsManUrlInfo = { url: "dragonbones/sword-man/SwordsMan", assetType: "DragonBonesAsset", ext: "dbbin" };
        extAssetMgr.load(this.swordsManUrlInfo, (err, items) => {
            const [dragonAsset, dragonAtlasAsset] = extAssetMgr.get(this.swordsManUrlInfo);
            this.dragonBone_bin.dragonAsset = dragonAsset
            this.dragonBone_bin.dragonAtlasAsset = dragonAtlasAsset;
            this.dragonBone_bin.armatureName = 'Swordsman-NestArmature';
            this.dragonBone_bin.playAnimation('walk', 0);
        })
```
这个加载会默认查找依赖`dragonbones/sword-man/SwordsMan_ske.dbbin`、`dragonbones/sword-man/SwordsMan_tex.json`、`dragonbones/sword-man/SwordsMan_tex.png`


更多加载示例可见`assets/cases`中的示例

### 加载解析扩展
例子:
```ts
declare global {
    //定义类型key,给外界提供key
    interface IExtAssetTypeKey {
        plist: "plist"
    }
}
export class PlistAssetParser implements aswallow.IAssetParser {
    type: keyof IExtAssetTypeKey = "plist";
    extAssetMgr: aswallow.IExtAssetManager

    parse(reqItem: aswallow.IResRequestItem, data: any): any {
        const plistAsset = data;
        const path = reqItem.extResPath;
        const texPath = cc.path.changeExtname(path, getRequestItemTextureExt(reqItem));
        let texture = this.extAssetMgr.get(texPath);
        if (!texture) {
            console.error(`[PlistParseHandler]texPath:${texPath},资源未加载`);
            return;
        }
        if (!(texture instanceof cc.Texture2D)) {
            const newTex = new cc.Texture2D()
            newTex["_nativeAsset"] = texture;
            newTex["_nativeUrl"] = texPath;
            texture = newTex;
            this.extAssetMgr.cache(texPath, newTex);
        }

        const atlas: cc.SpriteAtlas = parsePlist(plistAsset, texture as any);
        this.extAssetMgr.cache(path, atlas);
        return atlas;
    }
    getDepReqs(reqItem: aswallow.IResRequestItem): aswallow.ResRequestItem[] {
        const reqs: aswallow.ResRequestItem[] = [];
        reqs.push({ url: reqItem.url + ".plist", assetType: "plist" });
        reqs.push({ url: reqItem.url + getRequestItemTextureExt(reqItem) });
        return reqs;
    }

}
```
### 加载压缩纹理

**示例：**
```ts
// cases/loadimg/loadimg.ts
aswallow.extAssetMgr.load({ url: "imgs/BlueMonster.pkm", textureFormat: cc.Texture2D.PixelFormat.RGBA_ETC2 }, (err, result) => {
    console.log("测试加载pkm");
    console.log(err);
    console.log(result);
    this.extResCompressedSp.spriteFrame = new cc.SpriteFrame(result as cc.Texture2D);
})
```

加载的时候传递`textureFormat`即可

> **!!PS!!**: 如果想要做到开发时加载png，发布后加载压缩纹理，那么就需要侵入发布流程 ，使用命令行进行纹理压缩并生成映射文件，并且修改aswallow的逻辑，根据映射文件对加载路径进行转换，并赋值纹理格式。


### 跨项目Assetbundle协同

0. 配置

    在`local/aswallow-build-config.json`的`subProjConfig`中

1. 开发时

    * 可以使用编辑器打开对应子项目，编辑`bundle`的资源，编辑完后，可以构建`web-desktop`平台，然后刷新预览即可

    * 可以更新子项目的资源，比如图片，文本，3D模型，等，然后点击主项目`扩展/Aswallow/构建所有子项目`,等待构建完成即可
    
    * 增加子项目时（即修改`local/aswallow-build-config.json`）时，需要执行一下：扩展->Aswallow->重置预览服务器

3. 加载`AssetBundle`

    调用`aswallow.extAssetMgr.loadBundle`加载即可


    运行时会判断是否为预览，预览则会通过加载远程`AssetBundle`的方式加载

    ```ts

    // assets\cases\other-proj-bundle\other-bundle-test.ts

    const { ccclass, property } = cc._decorator;

    @ccclass
    export default class OtherBundleTest extends cc.Component {

        @property(cc.Label)
        label: cc.Label = null;

        @property
        text: string = 'hello';

        // LIFE-CYCLE CALLBACKS:

        // onLoad () {}

        async start() {
            await aswallow.extAssetMgr.init();
            aswallow.extAssetMgr.loadBundle("testbundle",
                (err, bundle) => {

                    console.log(`加载testbundle`);
                    console.log(err, bundle);
                    if (err) {
                        return
                    }
                    bundle.load("testprefab", cc.Prefab, (err, asset) => {
                        console.log(err, asset);
                        const node = cc.instantiate(asset) as unknown as cc.Node;

                        const x = this.node.width / 2;
                        const y = this.node.height / 2;
                        node.x = x;
                        node.y = y;
                        cc.director.getScene().addChild(node);
                    })
                })
        }

        // update (dt) {}
    }

    ```

## **!!!跨项目协同注意!!!**

`AssetBundle`不能同名，所有`AssetBundle`的名字必须是唯一的。进行构建时,插件会有提示

## 小游戏真机调试说明

1. 复制remote文件夹到项目根目录
2. 修改`settings.js`中的`server`字段去掉`build/xxxx`
3. 真机预览

## 对于不同项目阶段使用外部资源的建议

### 处于前期或者准备立项的项目

按照示例去使用资源加载接口即可。如果需要发布IOS原生，参考发布安卓原生的做法。

如果有自定义接口需求，可选择封装aswallow-asset-manager.ts中的接口，也可直接修改源码

### 处于后期的项目

这个时候的项目往往有大量的资源，也是导致项目开发时编辑器卡顿的原因

**如何去改造呢？**

1. 先分离散图资源(那些不打包图集，按照配表动态加载的图片资源)，比如:icon、活动banner图

将这些资源全部复制到`ext-res`,然后在assets中删除那些已经复制的资源，建议保留一两个作为预览和模板使用

可能这个时候，有些地方有用到那些删除资源的prefab会报错，需要一一修改（用保留的资源赋值或者直接清空引用）

然后加载这些资源的地方，替换成`aswallow`的加载接口

不同的项目的情况不同，大体的方向就是分离资源，修复引用这些资源报错的prefab、component脚本等，使用aswallow的资源管理器加载这些资源

2. 分离图集资源(手动打包成plist图集的资源)，比如：技能序列帧、人物行走序列帧、某些根据规则/配置动态加载的图集

操作类似`1`,但在修复引用上会更加麻烦，所以保留模板和预览用的图集很重要

`aswallow`默认支持的图集是`plist`图集,如果有自定义的图集格式，可以自行参考`plist`图集解析进行扩展

最后也是修改加载逻辑为用`aswallow`的接口加载

3. 分离骨骼动画资源(龙骨、spine)

骨骼动画资源相对复杂，但可能并不算大量，可自行衡量是否分离。

因为加载逻辑会比cocos的加载略微复杂。如果命名规范的话，加载也不算麻烦。

操作类似`1、2`

### 使用Fairygui的项目(无论前中后期)

直接将fairygui的导出路径改到`ext-res`下即可(最舒服了)

使用方式不变

不过需要注意的是,我重写了`fairygui`的部分逻辑，具体请看:`assets/fairygui-ext`




## 对于不同项目阶段使用跨项目AssetBundle协同的建议

任意阶段都可使用

推荐在中期，有大量动态加载资源时使用。

使用方式，不用我解释了，创建一个子项目直接`cv`即可

## QA

1. assetbundle不是通用的吗？为什么要搞这个

    因为通用，但又因为还有一些使用上的不方便

    自己开一个本地资源服务器，导出，复制到服务器目录，通过加载远程bundle一样加载，也只能当远程bundle。

    构建后还需要跟着构建，不同平台还需要手动构建。

    等等

2. 开多个creator不卡吗？

    多线程协作

    对开发体验影响更小

    可能很长一段时间并不需要打开。

    比如美术或者策划提交子项目资源，只需要拉取，构建一下即可

    或者美术更新资源，直接复制到子项目，不需要打开