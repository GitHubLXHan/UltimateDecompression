import { RefClass } from "../../../extension/basecore/RefDecorator";
import { BaseLog } from "../../../extension/log/BaseLog";
import { ClassUtils } from "../../../extension/utils/ClassUtils";
import { ResBase } from "../../../extension/view/compoment/ResBase";

@RefClass
export class SubView extends BaseLog {
	protected _root: cc.Node;
	private _resBase: ResBase;
	private _name: string;

	public constructor() {
		super();
		this._name = ClassUtils.getClassName(this);
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
			this._resBase = new ResBase();
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

	protected get ResBase(): ResBase {
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
