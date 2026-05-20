import { UdViewCore } from "../../extension/view/compoment/UdViewCore";

export abstract class UdToastBase extends UdViewCore {

	public abstract showPop(info: any);

	public abstract clearAll();
}
