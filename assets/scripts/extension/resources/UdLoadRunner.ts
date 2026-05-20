import { UdSeqList } from "../basecore/UdSeqList";
import { UdObjCache } from "../pool/UdObjCache";
import { UdLoadRequest } from "./UdLoadRequest";
import { UdLoadTier } from "./UdLoadTier";

export class UdLoadRunner {
	private _maxRequestCountSimultaneously: number = 999;
	private _counter: number = 0;

	private _loadingQueue: UdSeqList<UdLoadRequest> = new UdSeqList();
	private _waitingQueue: UdSeqList<UdLoadRequest> = new UdSeqList();
	private _loadOffList: UdSeqList<number> = new UdSeqList<number>();

	get maxRequestCountSimultaneously(): number {
		return this._maxRequestCountSimultaneously;
	}

	set maxRequestCountSimultaneously(maxRequestCountSimultaneously: number) {
		this._maxRequestCountSimultaneously = maxRequestCountSimultaneously;
	}

	constructor() {
		// let self = this;
		// /**
		//  * 拦截加载资源管道
		//  * 每个加载任务在 options 中都带有 UdLoadRequest 的 id
		//  * 如果当前 task 所带 id 记录在中断加载数组中(this._loadOffList)
		//  * 则不调用 done()，即可中断加载
		//  * 注：pipeline 管线中的任一管道不回调 done() 都会中断任务
		//  * 原 pipeline管线：cc.assetManager.pipeline = pipeline.append(preprocess).append(load);
		//  */
		// for (let i = 0; i <= cc.assetManager.pipeline.pipes.length; i += 2) {
		// 	cc.assetManager.pipeline.insert(function (task, done) {
		// 		self._checkAndstopTask(task, self._loadOffList, done);
		// 	}, i);
		// }
	}

	private _checkAndstopTask(task: cc.AssetManager.Task, loadOffList: UdSeqList<number>, done?: (err: Error) => void) {
		let myLoadId = task.options.myLoadId;
		if (!myLoadId || loadOffList.indexOf(myLoadId) == -1) {
			task.output = task.input;
			done && done(null);
		} else {
			task.recycle();
			loadOffList.remove(myLoadId);
		}
	}

	/**对应任务是否在加载中 */
	public isTaskLoading(id: number): boolean {
		for (let i = 0; i < this._loadingQueue.length; i++) {
			let loadTask = this._loadingQueue.get(i);
			if (loadTask.id == id) {
				return true;
			}
		}

		for (let i = 0; i < this._waitingQueue.length; i++) {
			let loadTask = this._waitingQueue.get(i);
			if (loadTask.id == id) {
				return true;
			}
		}
		return false;
	}

	/**停止加载对应任务 */
	public stopLoadTask(id: number): void {
		// if (this._loadOffList.indexOf(id) != -1) return;

		for (let i = 0; i < this._loadingQueue.length; i++) {
			let loadTask = this._loadingQueue.get(i);
			if (loadTask.id == id) {
				// this._loadOffList.add(id);
				this._loadingQueue.remove(loadTask);
				UdObjCache.Ins.recover(loadTask);
				this.scheduleNextTask();
				return;
			}
		}

		for (let i = 0; i < this._waitingQueue.length; i++) {
			let loadTask = this._waitingQueue.get(i);
			if (loadTask.id == id) {
				this._waitingQueue.remove(loadTask);
				UdObjCache.Ins.recover(loadTask);
				break;
			}
		}
	}

	/**获取一个加载任务实例 */
	public fetchLoadTask(): UdLoadRequest {
		let loadTask = UdObjCache.Ins.impl(UdLoadRequest);
		if (this._counter < Number.MAX_VALUE) {
			loadTask.id = this._counter = this._counter + 1;
		} else {
			loadTask.id = this._counter = 1;
		}
		return loadTask;
	}

	/**判断任务是否有效 */
	public isTaskValid(id: number): boolean {
		return this._loadingQueue.some((task) => task.id == id);
	}

	/**任务加载完成 */
	public onLoadTaskDone(id: number): void {
		for (let i = 0; i < this._loadingQueue.length; i++) {
			let loadTask = this._loadingQueue.get(i);
			if (loadTask.id == id) {
				this._loadingQueue.remove(loadTask);
				UdObjCache.Ins.recover(loadTask);
				break;
			}
		}
		this.scheduleNextTask();
	}

	/**开始下一个任务 */
	public scheduleNextTask(loadTask?: UdLoadRequest) {
		if (loadTask) {
			this._waitingQueue.push(loadTask);
		}
		if (this._loadingQueue.length >= this.maxRequestCountSimultaneously) {
			if (!loadTask || loadTask.priority < UdLoadTier.CRITICAL)
				// GOD可以插队
				return;
		}
		// 由大到小排列
		this._waitingQueue.sort((a: UdLoadRequest, b: UdLoadRequest) => {
			return b.priority - a.priority;
		});
		loadTask = this._waitingQueue.shift();
		if (loadTask) {
			this._loadingQueue.add(loadTask);
			loadTask.loadFunc.apply(loadTask.loadFuncTarget, loadTask.loadFuncArgs);
		}
	}
}
