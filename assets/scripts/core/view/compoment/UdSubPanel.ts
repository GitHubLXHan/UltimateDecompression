import { UdBindMeta } from "../../../extension/basecore/UdDecoratorKit";
import { UdLogCore } from "../../../extension/log/UdLogCore";
import { UdReflectKit } from "../../../extension/utils/UdReflectKit";
import { UdResFinder } from "../../../extension/view/compoment/UdResFinder";

@UdBindMeta
export class UdSubPanel extends UdLogCore {
	protected _root: cc.Node;
	private _resBase: UdResFinder;
	private _name: string;

	public constructor() {
		super();
		this._name = UdReflectKit.getClassName(this);
	}

	public get name(): string {
		return this._name;
	}

	public get root(): cc.Node {
		return this._root;
	}

	public init(root: cc.Node) {
		if (this._root != null)
			return;

		this._root = root;

		if (this._resBase == null) {
			this._resBase = new UdResFinder();
		}

		this._resBase.init(root);
	}

	public initRunData(args: any) {

	}

	public get isInit(): boolean {
		return this._root != null;
	}

	public updateView(...args: any) {
		return;
	}

	public show() {
		if (this._root != null)
			this._root.active = true;

		this.addEvents();
	}

	public onFocusUpdate(value: boolean) {

	}

	public hide() {
		if (this._root != null)
			this._root.active = false;

		this.removeEvents();
	}

	protected addEvents() {

	}

	protected removeEvents() {

	}

	protected get UdResFinder(): UdResFinder {
		return this._resBase;
	}

	public dispose() {
		this.hide();

		if (this._resBase != null) {
			this._resBase.dispose();
			this._resBase = null;
		}

		if (this._root != null) {
			this._root.destroy();
			this._root = null;
		}
	}
}
