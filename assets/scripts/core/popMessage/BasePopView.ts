import { View } from "../../extension/view/compoment/View";

export abstract class BasePopView extends View {

	public abstract showPop(info: any);

	public abstract clearAll();
}
