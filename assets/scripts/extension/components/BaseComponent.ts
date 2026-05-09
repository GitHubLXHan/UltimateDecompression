import { LogMgr } from '../log/LogMgr';
import { ClassUtils } from '../utils/ClassUtils';
const { ccclass } = cc._decorator;

@ccclass
export class BaseComponent extends cc.Component {

    private _logModelName:string = "";
    public constructor() {
        super();
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


    public reuse(){
        //@ts-ignore
        let cmpos = this.node._components;
        if(cmpos){
            for (let i = 0; i < cmpos.length; i++) {
                const c = cmpos[i];
                if(c && c.impl){
                    c.impl();
                }
            }
        }

    }

    public unuse(){
        //@ts-ignore
        let cmpos = this.node._components;
        if(cmpos){
            for (let i = 0; i < cmpos.length; i++) {
                const c = cmpos[i];
                if(c && c.recover){
                    c.recover();
                }
            }
        }
    }

    public onClose(){

    }
}
