import { UdPopPanel } from "../../../core/view/compoment/UdPopPanel";
import { UdBindMeta } from "../../../extension/basecore/UdDecoratorKit";
import { UdLabel } from "../../../extension/game/UdLabel";


export interface IUdTipViewData {
	// 标题
	title: string;
	// 内容
	content: string;
	// 水平对齐（默认LEFT）
	alignHorizontal?: cc.Label.HorizontalAlign;
	// 垂直对齐（默认CENTER）
	alignVertical?: cc.Label.VerticalAlign;
}

@UdBindMeta
export class UdTipView extends UdPopPanel {

	private content_lb: UdLabel = undefined;
	private title_lb: UdLabel = undefined;

	public constructor() {
		super();
		this.prefabPath = "resources/prefabs/views/UdTipView";
	}

	public init(root: cc.Node) {
		super.init(root);

		const R = this.UdResFinder;
		this.content_lb = R.getComponent("content_lb", UdLabel);
		this.title_lb = R.getComponent("title_lb", UdLabel);
	}

	public addEvents() {
	}

	public removeEvents() {
	}

	public updateView(params: IUdTipViewData) {
		super.updateView(params);
		this.title_lb.string = params.title;
		this.content_lb.string = params.content;
		if (params.alignHorizontal !== undefined) {
			this.content_lb.horizontalAlign = params.alignHorizontal;
		} else {
			this.content_lb.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
		}

		if (params.alignVertical !== undefined) {
			this.content_lb.verticalAlign = params.alignVertical;
		} else {
			this.content_lb.verticalAlign = cc.Label.VerticalAlign.CENTER;
		}
	}

	public onClose() {
		super.onClose();
	}
}
