import { ModuleViewEnums } from "./ModuleViewEnums"


export class ModuleViews {

    private static _configs: Record<number, Record<number, any>> = {}
    public static register(moduleId: ModuleViewEnums, viewId: number, view: any) {
        if (!this._configs[moduleId]) this._configs[moduleId] = {}
        if (this._configs[moduleId][viewId]) {
            console.error("界面重复注册", moduleId, viewId, view)
            return
        }
        this._configs[moduleId][viewId] = view
    }


    public static get(moduleId: number, viewId: number) {
        return this._configs[moduleId] && this._configs[moduleId][viewId]
    }


} 