import { UdPopPanel } from "../../../core/view/compoment/UdPopPanel";
import { UdBindMeta } from "../../../extension/basecore/UdDecoratorKit";
import { UdLabel } from "../../../extension/game/UdLabel";
import { UdSpine } from "../../../extension/game/UdSpine";

@UdBindMeta
export class UdHintingView extends UdPopPanel {

	private halo_eff: UdSpine = undefined;
	private finger_node: cc.Node = undefined;
	private tips_node: cc.Node = undefined;
	private tip_lb: UdLabel = undefined;

	public constructor() {
		super();
		this.prefabPath = "udHinting/prefabs/view/UdHintingView";
	}

	public init(root: cc.Node) {
		super.init(root);

		const R = this.UdResFinder;
		this.halo_eff = R.getComponent("halo_eff", UdSpine);
		this.finger_node = R.getNode("finger_node");
		this.tips_node = R.getNode("tips_node");
		this.tip_lb = R.getComponent("tip_lb", UdLabel);

	}

	public addEvents() {
	}


	public removeEvents() {
	}

	public updateView(...args: any[]) {
	}

	public onClose() {
		super.onClose();
	}
}
