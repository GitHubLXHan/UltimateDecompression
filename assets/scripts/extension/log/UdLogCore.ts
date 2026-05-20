import { UdReflectKit } from "../utils/UdReflectKit";
import { UdLogHub } from "./UdLogHub";

export class UdLogCore {

    private _logModelName:string = "";

    public constructor() {
        this.logModelName = UdReflectKit.getClassName(this);
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
        UdLogHub.log(this.logModelName,...args);
    }

    protected logWarning(...args:any[]){
        UdLogHub.logWarning(this.logModelName,...args);
    }

    protected logError(...args:any[]){
        UdLogHub.logWarning(this.logModelName,...args);
    }
}