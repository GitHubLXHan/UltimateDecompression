
/**
 * @description:
 * @author: Zeros
 */
export class NodeUtils {
	/**
	 * static GetWidget
	 * */
	public static addWidget(node: cc.Node, top: number = -1, bottom: number = -1, left: number = -1, right: number = -1, vertical: number = -1, horizontal: number = -1): cc.Widget {
		if (node == undefined) {
			throw Error(i18n("【addWidget】node不能为空"));
		}

		let widget = node.getComponent(cc.Widget) ?? node.addComponent(cc.Widget);

		if (top >= 0) {
			widget.isAlignTop = true;
			widget.top = top;
		} else {
			widget.isAlignTop = false;
		}

		if (bottom >= 0) {
			widget.isAlignBottom = true;
			widget.bottom = bottom;
		} else {
			widget.isAlignBottom = false;
		}

		if (left >= 0) {
			widget.isAlignLeft = true;
			widget.left = left;
		} else {
			widget.isAlignLeft = false;
		}

		if (right >= 0) {
			widget.isAlignRight = true;
			widget.right = right;
		} else {
			widget.isAlignRight = false;
		}

		if (vertical >= 0) {
			widget.isAlignVerticalCenter = true;
			widget.verticalCenter = vertical;
		} else {
			widget.isAlignVerticalCenter = false;
		}

		if (horizontal >= 0) {
			widget.isAlignHorizontalCenter = true;
			widget.horizontalCenter = horizontal;
		} else {
			widget.isAlignHorizontalCenter = false;
		}

		return widget;
	}

	/**
	 * 给 Node添加 UITransform组件，节点的宽高、锚点、渲染优先级会跟随该组件
	 * @param node 节点
	 * @param width 宽度
	 * @param height 高度
	 * @param anchorX X锚点
	 * @param anchorY Y锚点
	 * @param priority 渲染优先级
	 */
	public static addTransform(node: cc.Node, width: number, height: number, anchorX: number = 0.5, anchorY: number = 0.5, priority: number = 0): cc.Node {
		if (!node) {
			throw Error(i18n("【【addTransform】node不能为空"));
		}

		// let uiTransform = node.getComponent(UITransform);
		// if (!uiTransform) {
		//     uiTransform = node.addComponent(UITransform);
		// }

		// uiTransform.width = width;
		// uiTransform.height = height;
		// uiTransform.anchorX = anchorX;
		// uiTransform.anchorY = anchorY;
		// uiTransform.priority = priority;

		node.width = width;
		node.height = height;
		node.anchorX = anchorX;
		node.anchorY = anchorY;

		// console.log("数据", width, height, anchorX, anchorY);

		return node;
	}

	/**
	 * 添加透明度组件
	 * @param node 节点
	 * @param opacity 透明度
	 * @returns
	 */
	public static addUIOpacity(node: cc.Node, opacity: number) {
		if (!node) {
			throw Error(i18n("【addUIOpacity】node不能为空"));
		}
		node.opacity = opacity;
	}

	public static getRenderOrder(node: cc.Node, out: string []){
		
		out.push(node.name);
		//@ts-ignore
		let comps = node._components;
		for (let i = 0; i < comps.length; i++) {
			const c = comps[i];
			if(c.renderOrders != undefined && c.renderOrders.length > 0){
				for (let j = 0; j < c.renderOrders.length; j++) {
					out.push(c.renderOrders[j])
				}
				return 
			}
		}
		for (let i = 0; i < node.children.length; i++) {
			this.getRenderOrder(node.children[i], out);
		}
	}
}
