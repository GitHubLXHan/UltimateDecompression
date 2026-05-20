import { UdSeqList } from "../basecore/UdSeqList";
import { UdMathKit } from "../basecore/UdMathKit";
import { UdSignalBus } from "../eventListener/UdSignalBus";
import { UdObjCache } from "../pool/UdObjCache";
import { UdTimerHub } from "../time/UdTimerHub";
import { UdPathKit } from "../utils/UdPathKit";
import { UdAudioSignal } from "./UdAudioSignal";
import { UdAudioTrack } from "./UdAudioTrack";
import { UdBindMeta } from "../basecore/UdDecoratorKit";

export interface IUdAudioPrefs {
    bgmEnabled: boolean;
    soundEnabled: boolean;
    bgmVolume: number;
    soundVolume: number;
}

@UdBindMeta
export class UdAudioHub extends UdSignalBus<UdAudioSignal, UdAudioHub>
{
    private static readonly PREFS_STORAGE_KEY = "ud_audio_prefs";
    private readonly _cacheName: string = "UdAudioHub";
    private static _ins: UdAudioHub;

    
    /**
     * static Instance:UdAudioHub
     */
    public static get Ins(): UdAudioHub {
        if (this._ins == null)
            this._ins = new UdAudioHub();

        return this._ins;
    }

    public static loadPrefs(): IUdAudioPrefs {
        const defaults: IUdAudioPrefs = {
            bgmEnabled: true,
            soundEnabled: true,
            bgmVolume: 0.7,
            soundVolume: 1,
        };
        try {
            const raw = cc.sys.localStorage.getItem(UdAudioHub.PREFS_STORAGE_KEY);
            if (raw == null || raw === "") {
                return defaults;
            }
            const parsed = JSON.parse(raw);
            return {
                bgmEnabled: parsed.bgmEnabled !== false,
                soundEnabled: parsed.soundEnabled !== false,
                bgmVolume: typeof parsed.bgmVolume === "number"
                    ? UdMathKit.clamp(parsed.bgmVolume, 0, 1)
                    : defaults.bgmVolume,
                soundVolume: typeof parsed.soundVolume === "number"
                    ? UdMathKit.clamp(parsed.soundVolume, 0, 1)
                    : defaults.soundVolume,
            };
        } catch {
            return defaults;
        }
    }

    public savePrefs(): void {
        cc.sys.localStorage.setItem(UdAudioHub.PREFS_STORAGE_KEY, JSON.stringify({
            bgmEnabled: this._bgmEnabled,
            soundEnabled: this._soundEnabled,
            bgmVolume: this._bgmVolume,
            soundVolume: this._soundVolume,
        }));
    }

    //背景音乐路径
    private _bgmRootPath: string = "";
    //音效路径
    private _soundRootPath: string = "";
    //音效路径
    // private _voiceRootPath: string = "";
    //当前背景音乐
    private _bgmPath: string = "";
    //背景音乐音量
    private _bgmVolume: number = 1;
    //配音音量
    // private _voiceVolume: number = 1;
    //音效音量
    private _soundVolume: number = 1;
    //背景音乐开关
    private _bgmEnabled: boolean = true;
    //音效开关
    private _soundEnabled: boolean = true;
    //背景音乐过渡时间
    private _fadeTime: number = 1.5;
    //背景音乐播放器
    private _bgmPlayer: UdAudioTrack;
    private _retryBgmTimer: number = 0;
    //初始化状态
    private _isInit: boolean = false;
    //音效库
    private _soundStore: UdSeqList<UdAudioTrack> = new UdSeqList<UdAudioTrack>();
    //配音库
    // private _voiceStore: UdSeqList<UdAudioTrack> = new UdSeqList<UdAudioTrack>();


    public init(bgmPath: string, soundPath: string, setting: {
        bgmEnabled: boolean,
        soundEnabled: boolean,
        bgmVolume: number,
        soundVolume: number,
    }) {
        // 2.x 实现不一样
        // if(!find("audioMgr[Persist]")){
        //     this._aduioNode = new Node("audioMgr[Persist]");
        //     game.addPersistRootNode(this._aduioNode);
        // }
        // return true;
        this._isInit = true;

        this.bgmEnabled = setting.bgmEnabled;
        this.soundEnabled = setting.soundEnabled;
        this.bgmVolume = setting.bgmVolume;
        this.soundVolume = setting.soundVolume;
        
        if (bgmPath != null && bgmPath.length > 0)
            this._bgmRootPath = UdPathKit.folderPathFilter(bgmPath);

        if (soundPath != null && soundPath.length > 0) {
            this._soundRootPath = UdPathKit.folderPathFilter(soundPath + "/common/");
            // this._voiceRootPath = UdPathKit.folderPathFilter(soundPath + "/voices/");
        }
    }

    /**
     * @description: 播放背景音乐
     * @param path 路径
     * @param isRecover 自动回收上一个音乐
     */
    public playBgm(path: string, isRecover: boolean = true) {
        this._bgmPath = path;
        if (!this._isInit)
            return;

        if (!this.bgmEnabled)
            return;

        this.stopRetryBgmTimer();

        path = this.getBgmPath(path);
        if (this._bgmPlayer != null) {
            if (this._bgmPlayer.path != path) {
                this._bgmPlayer.fadeout(isRecover);
                UdObjCache.Ins.recover(this._bgmPlayer);
                this._bgmPlayer = null;
            }
            else {
                if (!this._bgmPlayer.isPlaying)
                    this._bgmPlayer.resume();

                return;
            }
        }
        this._bgmPlayer = UdObjCache.Ins.impl(UdAudioTrack);
        this._bgmPlayer.addListener(UdAudioSignal.TrackError, this.bgmLoadFailHandler, this);
        this._bgmPlayer.playPath(path, this._bgmVolume, true, this._fadeTime);
    }

    private bgmLoadFailHandler(target: UdAudioTrack, args: any[]) {
        this.stopRetryBgmTimer();
        if (this._bgmPlayer != null) {
            UdObjCache.Ins.recover(this._bgmPlayer);
            this._bgmPlayer = null;
        }

        this._retryBgmTimer = UdTimerHub.Ins.callLater(2, () => {
            this.playBgm(this._bgmPath);
        })

    }

    private stopRetryBgmTimer() {
        if (this._retryBgmTimer > 0) {
            UdTimerHub.Ins.remove(this._retryBgmTimer);
            this._retryBgmTimer = 0;
        }
    }

    /**
     * @description: 播放音效
     * @param {string} path
     */
    public playSound(path: string) {
        if (!this._isInit)
            return;

        if (!this.soundEnabled)
            return;

        path = this.getSoundPath(path);
        let audioPlayer = UdObjCache.Ins.impl(UdAudioTrack);
        this._soundStore.add(audioPlayer);
        audioPlayer.addListener(UdAudioSignal.TrackEnd, this.soundFinishHandler, this);
        audioPlayer.addListener(UdAudioSignal.TrackError, this.soundFinishHandler, this);
        audioPlayer.playPath(path, this._soundVolume, false);
    }

    // /**
    //  * @description: 播放语音
    //  * @param {string} path 路径
    //  * @param {boolean} onlyOne 是否同一时间只播放一句语音（移除上一个未播放完毕的）
    //  */
    // public playVoice(path: string, onlyOne: boolean = true) {
    //     if (!this._isInit)
    //         return;

    //     if (!this.soundEnabled)
    //         return;

    //     if (onlyOne) {
    //         this.stopVoice();
    //     }

    //     path = this.getVoicePath(path);
    //     let audioPlayer = UdObjCache.Ins.impl(UdAudioTrack);
    //     this._voiceStore.add(audioPlayer);

    //     audioPlayer.addListener(UdAudioSignal.TrackEnd, this.voiceFinishHandler, this);
    //     audioPlayer.addListener(UdAudioSignal.TrackError, this.voiceFinishHandler, this);
    //     audioPlayer.playPath(path, this._soundVolume, false);
    // }

    /**
     * @description: 播放结束
     * @param target
     * @param args
     */
    private soundFinishHandler(target: UdAudioTrack, args: any[]) {
        this._soundStore.remove(target);
        UdObjCache.Ins.recover(target);
    }

    // /**
    //  * @description: 播放结束
    //  * @param target
    //  * @param args
    //  */
    // private voiceFinishHandler(target: UdAudioTrack, args: any[]) {
    //     this._voiceStore.remove(target);
    //     UdObjCache.Ins.recover(target);
    // }

    /**
     * @description: 背景音乐路径
     * @param path
     */
    public getBgmPath(path: string): string {
        return this._bgmRootPath + path;
    }

    /**
     * @description: 音效路径
     * @param path
     */
    public getSoundPath(path: string): string {
        return this._soundRootPath + path;
    }

    // /**
    //  * @description: 配音路径
    //  * @param path
    //  */
    // public getVoicePath(path: string): string {
    //     return this._voiceRootPath + path;
    // }

    /**
     * @description: 停止背景音乐
     */
    public stopBgm() {
        if (this._bgmPlayer != null) {
            this._bgmPlayer.stop();
        }
    }

    /**
     * @description: 停止所有声音
     */
    public stopAll() {
        this.stopBgm();
        this.stopSound();
    }

    /**
     * @description: 停止所有音效，包含语音
     */
    public stopSound() {
        this.stopSoundStore(this._soundStore);
        // this.stopSoundStore(this._voiceStore);
    }

    // /**
    //  * @description: 停止所有语音
    //  */
    // public stopVoice() {
    //     this.stopSoundStore(this._voiceStore);
    // }

    private stopSoundStore(store: UdSeqList<UdAudioTrack>) {
        if (store == null || store.length <= 0) {
            return;
        }

        while (store.length > 0) {
            let player = store.removeAt(0);
            UdObjCache.Ins.recover(player);
        }
    }


    /**
     * @description: 暂定背景音乐
     */
    public pauseBgm() {
        if (this._bgmPlayer != null)
            this._bgmPlayer.pause();
    }

    /**
     * @description: 恢复背景音乐
     */
    public resumeBgm() {
        if (!this.bgmEnabled) {
            return;
        }

        if (this._bgmPlayer != null) {
            this._bgmPlayer.volume = this.bgmVolume;
            this._bgmPlayer.resume();
        } else if (this._bgmPath != null && this._bgmPath.length > 0) {
            this.playBgm(this._bgmPath);
        }
    }

    /**
     * @description: 暂定所有声音
     */
    public pauseAll() {
        this.stopSound();
        this.pauseBgm();
    }

    /**
     * @description: 恢复所有声音
     */
    public resumeAll() {
        this.resumeBgm();
    }
    /**
     * @description: 背景音乐音量
     */
    public get bgmVolume(): number {
        return this._bgmVolume;
    }
    public set bgmVolume(value: number) {
        value = UdMathKit.clamp(value, 0, 1);
        if (this._bgmVolume == value)
            return;

        this._bgmVolume = value;
        if (this._bgmVolume > 0) {
            // this.bgmEnabled = true;

            if (this._bgmPlayer != null)
                this._bgmPlayer.volume = this._bgmVolume;
        }
        else {
            // this.bgmEnabled = false;
        }

        this.dispatchEvent(UdAudioSignal.MusicVolume);
        this.savePrefs();
    }

    // /**
    //  * @description: 背景音乐音量
    //  */
    // public get voiceVolume(): number {
    //     return this._voiceVolume;
    // }
    // public set voiceVolume(value: number) {
    //     value = UdMathKit.clamp(value, 0, 1);
    //     if (this._voiceVolume == value)
    //         return;

    //     this._voiceVolume = value;
    //     if (this._voiceVolume > 0) {
    //         //应当是独立的
    //         // this.soundEnabled = true;
    //         if (this._voiceStore.length > 0) {
    //             for (let i = 0; i < this._voiceStore.length; i++) {
    //                 let player = this._voiceStore.get(i);
    //                 player.volume = this._voiceVolume;
    //             }
    //         }

    //     }
    //     else {
    //         // this.soundEnabled = false;
    //     }

    //     this.dispatchEvent(UdAudioSignal.VoiceVolume);
    // }


    /**
     * @description:音效音量
     */
    public get soundVolume(): number {
        return this._soundVolume;
    }
    public set soundVolume(value: number) {
        value = UdMathKit.clamp(value, 0, 1);
        if (this._soundVolume == value)
            return;

        this._soundVolume = value;
        if (this._soundVolume > 0) {
            //应当是独立的
            // this.soundEnabled = true;
            if (this._soundStore.length > 0) {
                for (let i = 0; i < this._soundStore.length; i++) {
                    let player = this._soundStore.get(i);
                    player.volume = this._soundVolume;
                }
            }

        }
        else {
            // this.soundEnabled = false;
        }

        this.dispatchEvent(UdAudioSignal.SfxVolume);
        this.savePrefs();
    }

    /**
     * @description: 背景音乐过渡时间
     */
    public get dadeTime(): number {
        return this._fadeTime;
    }
    public set dadeTime(value: number) {
        this._fadeTime = UdMathKit.clamp(value, 0, 10);
    }

    /**
     * @description: 背景音乐开关
     */
    public get bgmEnabled(): boolean {
        return this._bgmEnabled;
    }
    public set bgmEnabled(value: boolean) {
        if (this._bgmEnabled == value)
            return;

        this._bgmEnabled = value;
        if (this._bgmEnabled)
            this.resumeBgm();
        else
            this.pauseBgm();

        this.dispatchEvent(UdAudioSignal.MusicToggle);
        this.savePrefs();
    }

    /**
     * @description: 音效开关
     */
    public get soundEnabled(): boolean {
        return this._soundEnabled;
    }
    public set soundEnabled(value: boolean) {
        if (this._soundEnabled == value)
            return;

        this._soundEnabled = value;
        if (!this._soundEnabled)
            this.stopSound();

        this.dispatchEvent(UdAudioSignal.SfxToggle);
        this.savePrefs();
    }

}