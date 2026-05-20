import { UdBindMeta } from "../basecore/UdDecoratorKit";
import { IUdReusable } from "../pool/IUdReusable";

@UdBindMeta
export class UdAssetItem implements IUdReusable {
    private _key: string = '';
    private _lastUseTimeStamp: number = 0;
    private _cacheTiem: number = 0;

    /**对应资源 */
    public get asset(): cc.Asset {
        return cc.assetManager.assets.get(this._key);
    }

    /**资源key */
    public get key(): string {
        return this._key;
    }

    /**上次使用时间，单位ms */
    public get lastUseTimeStamp(): number {
        return this._lastUseTimeStamp;
    }

    /**无外部引用时缓存资源的时间 */
    public get cacheTiem(): number {
        return this._cacheTiem;
    }

    public init(key: string, cacheTime: number): void {
        this._key = key;
        this._cacheTiem = cacheTime;
    }

    /**更新使用时间 */
    public updateTimeStamp(): void {
        this._lastUseTimeStamp = new Date().getTime();
    }

    public impl(): void {
        this._clear();
    }

    public recover(): void {

    }

    private _clear(): void {
        this._key = '';
        this._lastUseTimeStamp = 0;
        this._cacheTiem = 0;
    }
}