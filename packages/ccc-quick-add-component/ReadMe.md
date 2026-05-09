#扩展包说明

本地安装： 解压到项目的packages目录下
全局安装：  解压到  ~/.CocosCreator/packages（Windows 用户为 C:\Users\${你的用户名}\.CocosCreator\packages)
完成后 重启cocos方能生效

ccc-quick-add-component

快速添加组件（F3） 选中节点 输入组件名称 选中需要的组件 回车
快速搜索（cmd+F)
快速添加节点（F3） ：
			lb: 在当前选中节点下生成label节点
			lb-name : 在当前选中节点下生成名为 lb_name 的label节点
			im[-name][:spriteName] : GameSprite
				特别说明 : 1. spriteName 可以直接设置图片，注意不带png等后缀且匹配是完全匹配的
						  2. 只覆盖 resources/ui下的 
						  3. 此部分有本地缓存加速 新加图片需要输入  im:clear 清除缓存后才能拿到
			et : EditBox
			rt : RichText 
			#预制
			cb : ColorBtn 
			scb : SmallColorBtn 
			ccb : ColorCostBtn 
			ib : iconButton 
			bi : base_item 
			bip : base_item_plus 
			
			其他需求可在 panels/search/index.js内添加（只能添加原生节点）

快速生成代码（F5）
			选中要生成的节点 按F5即可（带"New "将视为无需生成对应代码）





uuid = cc.js._getClassId(cc.js.getClassByName("GameSprite"))