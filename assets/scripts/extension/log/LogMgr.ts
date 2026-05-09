import { LogLevelType } from "./LogLevelType";
import { DateUtils } from "./../utils/DateUtils";

/**
 * @description: 
 * @author: Zeros
 */
export class LogMgr
{
    //Log库
    private static _List:Array<string> = [];

    private static _capacity = 100;
    private static _level:LogLevelType = LogLevelType.log;
    private static _isTrace:boolean;

    public static get level():LogLevelType
    {
        return this._level;
    }
    public static set level(value:LogLevelType)
    {
        this._level = value;
    }
    public static get isTrace():boolean
    {
        return this._isTrace;
    }
    public static set isTrace(value:boolean)
    {
        this._isTrace = value;
    }

    public static get capacity():number
    {
        return this._capacity;
    }
    public static set capactiy(value:number)
    {
        this._capacity = value;
    }

    /**
     * log
     */
    public static log(...info:any[]) {
        if (this._level > LogLevelType.log)
            return;

        console.log(`[Log][${DateUtils.getNowDateString()}]`,...info);
    }

    /**
     * Warning
     */
    public static logWarning(...info:any[]) {
        if (this._level > LogLevelType.Warning)
            return;

        console.warn(`[Warning][${DateUtils.getNowDateString()}]`,...info);
        // console.trace(str);
    }

    /**
     * Error
     */
    public static logError(...info:any[]) {
        if (this._level > LogLevelType.Error)
            return;

        console.error(`[! Error !][${DateUtils.getNowDateString()}]`,...info);
        // console.trace(str);
    }
}