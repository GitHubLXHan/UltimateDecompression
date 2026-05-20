import { UdLogLevel } from "./UdLogLevel";
import { UdDateKit } from "./../utils/UdDateKit";

export class UdLogHub
{
    //Log库
    private static _List:Array<string> = [];

    private static _capacity = 100;
    private static _level:UdLogLevel = UdLogLevel.Trace;
    private static _isTrace:boolean;

    public static get level():UdLogLevel
    {
        return this._level;
    }
    public static set level(value:UdLogLevel)
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
        if (this._level > UdLogLevel.Trace)
            return;

        console.log(`[Log][${UdDateKit.getNowDateString()}]`,...info);
    }

    /**
     * Warning
     */
    public static logWarning(...info:any[]) {
        if (this._level > UdLogLevel.Warn)
            return;

        console.warn(`[Warning][${UdDateKit.getNowDateString()}]`,...info);
        // console.trace(str);
    }

    /**
     * Error
     */
    public static logError(...info:any[]) {
        if (this._level > UdLogLevel.Fatal)
            return;

        console.error(`[! Error !][${UdDateKit.getNowDateString()}]`,...info);
        // console.trace(str);
    }
}