import { ClassUtils } from "../utils/ClassUtils";
import { LogMgr } from "./LogMgr";

export class BaseLog {

    private _logModelName:string = "";

    public constructor() {
        this.logModelName = ClassUtils.getClassName(this);
    }

    protected get logModelName(){
        return this._logModelName;
    }
    protected set logModelName(value:string){
        if (value != null) {
            this._logModelName = `【${value}】`;
        } else {
            this._logModelName = "";
        }
    }

    protected log(...args:any[]) {
        LogMgr.log(this.logModelName,...args);
    }

    protected logWarning(...args:any[]){
        LogMgr.logWarning(this.logModelName,...args);
    }

    protected logError(...args:any[]){
        LogMgr.logWarning(this.logModelName,...args);
    }
}