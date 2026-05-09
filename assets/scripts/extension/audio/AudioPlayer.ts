import { Mathf } from "../basecore/Mathf";
import { resource } from "../resources/ResourceManager";
import { RefClass } from "../basecore/RefDecorator";
import { IPoolInstance } from "../pool/IPoolInstance";
import { PoolMgr } from "../pool/PoolMgr";
import { AudioEventType } from "./AudioEventType";
import { Listener } from "../eventListener/Listener";

/**
 * @description: 
 * @author: Zeros
 */
@RefClass
export class AudioPlayer extends Listener<AudioEventType, AudioPlayer> implements IPoolInstance {
    private _clip: cc.AudioClip;
    private _path: string = "";
    private _isLoop: boolean = false;
    private _isPlaying: boolean = false;
    private _audioId: number = -1;
    private _loadId: number = 0;
    private _volume: number = 1;
    private _fadeTime: number = 0;
    private _fadeTween?: cc.Tween<AudioPlayer>;

    public preload(path: string) {
        this.stop();
        this.stopLoad();

        this._path = path;
        this._loadId = resource.ResourceManager.sInstance.load(this._path, cc.AudioClip, (err: Error, clip: cc.AudioClip) => {
            this._loadId = 0;
            if (err != null) {
                this.dispatchEvent(AudioEventType.LoadFailed);
                return;
            }

            resource.ResourceManager.sInstance.cacheAsset(clip);
            this._clip = clip;
            this.loadCompleted();
        })
    }

    public playPath(path: string, volume: number, loop: boolean = true, fadeTime: number = 0) {
        this.preload(path);
        this.play(volume, loop, fadeTime);
    }

    private _lastPlayTime = 0
    public play(volume: number = 1, loop: boolean = true, fadeTime: number = 0) {
        let curTime = cc.director.getTotalTime();
        if (curTime - this._lastPlayTime < 200)
            return
        this._lastPlayTime = curTime
        if (this._audioId > 0) {
            this.stop();
        }

        this._volume = volume;
        this._isLoop = loop;
        this._fadeTime = Mathf.clamp(fadeTime, 0, 10);
        this._isPlaying = true;

        this.playAudio();
    }



    /**
     * @description: 加载完毕
     */
    private loadCompleted() {
        if (this._clip != null && this.isPlaying) {
            this.playAudio();
        }

        this.dispatchEvent(AudioEventType.LoadComplete);
    }

    /**
     * @description: 是否正在播放中
     */
    public get isPlaying(): boolean {
        return this._isPlaying;
    }

    /**
     * @description: 播放路径
     */
    public get path(): string {
        return this._path;
    }

    /**
     * @description: 停止播放
     */
    public stop() {
        if (!this.isPlaying)
            return;

        if (this._audioId >= 0) {
            cc.audioEngine.setVolume(this._audioId, 0);
            cc.audioEngine.stop(this._audioId);
            this._audioId = -1;
        }

        this._isPlaying = false;
    }

    /**
     * @description: 暂停播放
     */
    public pause() {
        if (!this.isPlaying || this._audioId < 0)
            return;

        cc.audioEngine.pause(this._audioId);
        this._isPlaying = false;
    }

    /**
     * @description: 恢复播放
     */
    public resume() {
        if (this.isPlaying)
            return;

        if (this._audioId >= 0) {
            cc.audioEngine.resume(this._audioId);
            this._isPlaying = true;
            this.fadein();
            return;
        }
    }

    /**
     * @description: 播放音频
     */
    private playAudio() {
        if (this._clip != null) {
            this._audioId = cc.audioEngine.play(this._clip, this._isLoop, this.volume);
            this.fadein();
            if (!this._isLoop)
                cc.audioEngine.setFinishCallback(this._audioId, this.playHandler.bind(this));
        }
    }

    /**
     * @description: 播放结束
     */
    private playHandler() {
        this.dispatchEvent(AudioEventType.Finished);
    }

    /**
     * @description: 淡入效果
     */
    private fadein() {
        if (this._audioId >= 0 && this._fadeTime > 0) {
            this.clearFade();
            let time = 1 * this._fadeTime;
            let curVolue = this.volume;
            this.volume = 0;
            this._fadeTween = new cc.Tween(this);
            this._fadeTween.to(time, { fadeVolume: curVolue });
            this._fadeTween.call(this.fadeDoneHandler.bind(this));
            this._fadeTween.start();
        }
    }


    /**
     * @description: 淡出效果
     * @param autoRecover 自动回收
     */
    public fadeout(autoRecover: boolean = true) {
        if (this._audioId >= 0 && this._fadeTime > 0) {
            this.clearFade();
            let time = 1 * this._fadeTime * this.volume;
            this._fadeTween = new cc.Tween(this);
            this._fadeTween.to(time, { fadeVolume: 0 });
            if (autoRecover)
                this._fadeTween.call(this.fadeoutDoneRecoverHandler.bind(this));
            else
                this._fadeTween.call(this.fadeDoneHandler.bind(this));

            this._fadeTween?.start();
        } else {
            PoolMgr.Ins.recover(this);
        }
    }

    /**
     * @description: 过度效果播放完毕
     */
    private fadeDoneHandler() {
        this._fadeTween = undefined;
    }

    /**
     * @description: 过度效果结束并自动回收
     */
    private fadeoutDoneRecoverHandler() {
        this._fadeTween = undefined;
        PoolMgr.Ins.recover(this);
    }

    /**
     * @description: 移除音效过度
     */
    private clearFade() {
        if (this._fadeTween != null) {
            this._fadeTween.stop();
            this._fadeTween = undefined;
        }
    }

    /**
     * @description: 停止加载
     */
    private stopLoad() {
        if (this._loadId > 0) {
            resource.ResourceManager.sInstance.stopLoad(this._loadId);
            this._loadId = 0;
        }
    }

    /**
     * @description: 音量
     */
    public get volume(): number {
        return this._volume;
    }
    public set volume(value: number) {
        this._volume = value;
        if (this._audioId >= 0) {
            this.clearFade();
            cc.audioEngine.setVolume(this._audioId, this._volume);
        }
    }

    /**
     * @description: 淡入淡出专用音量属性
     */
    public get fadeVolume(): number {
        return this._volume;
    }
    public set fadeVolume(value: number) {
        this._volume = value;
        if (this._audioId >= 0)
            cc.audioEngine.setVolume(this._audioId, this._volume);
    }


    public init() {
        //以下是3.0写法
        // if(!this._node){
        //     let parent = find("audioMgr[Persist]");
        //     this._node = new Node();
        //     this._node.parent = parent;
        //     this._audioSource =  this._node.addComponent(AudioSource);
        //     // 使用函数绑定
        //     // this._node.on("started", this.playHandler, this);
        //     // 使用第三个参数
        // }
    }

    public impl() {
        // this.init()
    }

    public recover() {
        this.clearFade();
        this.clearListeners();
        this.stopLoad();
        this.stop();
        // 使用函数绑定
        // this._node?.off("started", this.playHandler, this);
        // 使用第三个参数
        // this._clip?.off("ended", this.playHandler, this);

        if (this._clip != null) {
            resource.ResourceManager.sInstance.uncacheAsset(this._clip);
            cc.audioEngine.uncache(this._clip)
            this._clip = null;
        }

        this._path = "";
        this._isLoop = false;
    }
}