import { IUpdate } from "./IUpdate";

export class UpdateMgr {
    private static _ins: UpdateMgr;

    public static get Ins(): UpdateMgr {
        if (!this._ins) {
            this._ins = new UpdateMgr();
        }
        return this._ins;
    }

    public timeScale = 1;
    private _handlers: IUpdate[] = [];

    public addUpdateHandler(handler: IUpdate): void {
        if (!handler || this._handlers.indexOf(handler) >= 0) {
            return;
        }
        this._handlers.push(handler);
    }

    public removeUpdateHandler(handler: IUpdate): void {
        const idx = this._handlers.indexOf(handler);
        if (idx >= 0) {
            this._handlers.splice(idx, 1);
        }
    }

    public onUpdate(deltaTime: number): void {
        const dt = Math.max(0, deltaTime) * this.timeScale;
        for (const h of this._handlers) {
            h.onUpdate && h.onUpdate(dt);
        }
    }

    public onLateUpdate(deltaTime: number): void {
        const dt = Math.max(0, deltaTime) * this.timeScale;
        for (const h of this._handlers) {
            h.onLateUpdate && h.onLateUpdate(dt);
        }
    }
}
