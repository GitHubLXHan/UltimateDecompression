import { UdPopPanel } from "../../../core/view/compoment/UdPopPanel";
import { UdBindMeta } from "../../../extension/basecore/UdDecoratorKit";
import { UdBtnSignal } from "../../../extension/components/GameBtn/UdBtnSignal";
import { UdButton } from "../../../extension/game/UdButton";
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
	// 左边按钮（默认红色0xEB1111）
	leftBtnStyle?: { text: string, clickCallBack: () => void };
	// 右边按钮（默认紫色0xB740FF）
	rightBtnStyle?: { text: string, clickCallBack: () => void };
}

@UdBindMeta
export class UdTipView extends UdPopPanel {

	private content_lb: UdLabel = undefined;
	private title_lb: UdLabel = undefined;
	private left_btn: UdButton = undefined;
	private left_btn_lb: UdLabel = undefined;
	private right_btn: UdButton = undefined;
	private right_btn_lb: UdLabel = undefined;
	private btn_node: cc.Node = undefined;

	private _params: IUdTipViewData = null;

	public constructor() {
		super();
		this.prefabPath = "resources/prefabs/views/UdTipView";
	}

	public init(root: cc.Node) {
		super.init(root);

		const R = this.UdResFinder;
		this.content_lb = R.getComponent("content_lb", UdLabel);
		this.title_lb = R.getComponent("title_lb", UdLabel);
		this.left_btn = R.getComponent("left_btn", UdButton);
		this.left_btn_lb = R.getComponent("left_btn_lb", UdLabel);
		this.right_btn = R.getComponent("right_btn", UdButton);
		this.right_btn_lb = R.getComponent("right_btn_lb", UdLabel);
		this.btn_node = R.getNode("btn_node");
	}

	public addEvents() {
		super.addEvents();
		this.left_btn.addListener(UdBtnSignal.FingerTap, this._onLeftBtnTapHandler, this);
		this.right_btn.addListener(UdBtnSignal.FingerTap, this._onRightBtnTapHandler, this);
	}

	public removeEvents() {
		this.left_btn.removeListener(UdBtnSignal.FingerTap, this._onLeftBtnTapHandler, this);
		this.right_btn.removeListener(UdBtnSignal.FingerTap, this._onRightBtnTapHandler, this);
	}

	private _onLeftBtnTapHandler() {
		if (!this._params.leftBtnStyle) {
			this.close();
			return;
		}

		let clickCallBack = this._params.leftBtnStyle.clickCallBack;
		if (clickCallBack) {
			clickCallBack();
		}

		this.close();
	}

	private _onRightBtnTapHandler() {
		if (!this._params.rightBtnStyle) {
			this.close();
			return;
		}

		let clickCallBack = this._params.rightBtnStyle.clickCallBack;
		if (clickCallBack) {
			clickCallBack();
		}

		this.close();
	}

	public updateView(params: IUdTipViewData) {
		super.updateView(params);

		this._params = params;

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

		if (params.leftBtnStyle) {
			this.left_btn.node.active = true;
			this.left_btn_lb.string = params.leftBtnStyle.text;
		} else {
			this.left_btn.node.active = false;
		}

		if (params.rightBtnStyle) {
			this.right_btn.node.active = true;
			this.right_btn_lb.string = params.rightBtnStyle.text;
		} else {
			this.right_btn.node.active = false;
		}

		this.btn_node.active = this.left_btn.node.active || this.right_btn.node.active;
	}

	public onClose() {
		super.onClose();
	}
}
