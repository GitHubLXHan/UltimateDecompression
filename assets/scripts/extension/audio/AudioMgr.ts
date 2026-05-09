import { List } from "../basecore/List";
import { Mathf } from "../basecore/Mathf";
import { Listener } from "../eventListener/Listener";
import { PoolMgr } from "../pool/PoolMgr";
import { TimeMgr } from "../time/TimeMgr";
import { LoadUtils } from "../utils/LoadUtils";
import { AudioEventType } from "./AudioEventType";
import { AudioPlayer } from "./AudioPlayer";


export class AudioMgr extends Listener<AudioEventType, AudioMgr>
{
    private readonly _cacheName: string = "AudioMgr";
    private static _ins: AudioMgr;

    /**
     * static Instance:AudioMgr
     */
    public static get Ins(): AudioMgr {
        if (this._ins == null)
            this._ins = new AudioMgr();

        return this._ins;
    }

    //背景音乐路径
    private _bgmRootPath: string = "";
    //音效路径
    private _soundRootPath: string = "";
    //音效路径
    private _voiceRootPath: string = "";
    //当前背景音乐
    private _bgmPath: string = "";
    //背景音乐音量
    private _bgmVolume: number = 1;
    //配音音量
    private _voiceVolume: number = 1;
    //音效音量
    private _soundVolume: number = 1;
    //背景音乐开关
    private _bgmEnabled: boolean = true;
    //音效开关
    private _soundEnabled: boolean = true;
    //背景音乐过渡时间
    private _fadeTime: number = 1.5;
    //背景音乐播放器
    private _bgmPlayer: AudioPlayer;
    private _retryBgmTimer: number = 0;
    //初始化状态
    private _isInit: boolean = false;
    //音效库
    private _soundStore: List<AudioPlayer> = new List<AudioPlayer>();
    //配音库
    private _voiceStore: List<AudioPlayer> = new List<AudioPlayer>();


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
            this._bgmRootPath = LoadUtils.folderPathFilter(bgmPath);

        if (soundPath != null && soundPath.length > 0) {
            this._soundRootPath = LoadUtils.folderPathFilter(soundPath + "/common/");
            this._voiceRootPath = LoadUtils.folderPathFilter(soundPath + "/voices/");
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
                PoolMgr.Ins.recover(this._bgmPlayer);
                this._bgmPlayer = null;
            }
            else {
                if (!this._bgmPlayer.isPlaying)
                    this._bgmPlayer.resume();

                return;
            }
        }
        this._bgmPlayer = PoolMgr.Ins.impl(AudioPlayer);
        this._bgmPlayer.addListener(AudioEventType.LoadFailed, this.bgmLoadFailHandler, this);
        this._bgmPlayer.playPath(path, this._bgmVolume, true, this._fadeTime);
    }

    private bgmLoadFailHandler(target: AudioPlayer, args: any[]) {
        this.stopRetryBgmTimer();
        if (this._bgmPlayer != null) {
            PoolMgr.Ins.recover(this._bgmPlayer);
            this._bgmPlayer = null;
        }

        this._retryBgmTimer = TimeMgr.Ins.callLater(2, () => {
            this.playBgm(this._bgmPath);
        })

    }

    private stopRetryBgmTimer() {
        if (this._retryBgmTimer > 0) {
            TimeMgr.Ins.remove(this._retryBgmTimer);
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
        let audioPlayer = PoolMgr.Ins.impl(AudioPlayer);
        this._soundStore.add(audioPlayer);
        audioPlayer.addListener(AudioEventType.Finished, this.soundFinishHandler, this);
        audioPlayer.addListener(AudioEventType.LoadFailed, this.soundFinishHandler, this);
        audioPlayer.playPath(path, this._soundVolume, false);
    }

    /**
     * @description: 播放语音
     * @param {string} path 路径
     * @param {boolean} onlyOne 是否同一时间只播放一句语音（移除上一个未播放完毕的）
     */
    public playVoice(path: string, onlyOne: boolean = true) {
        if (!this._isInit)
            return;

        if (!this.soundEnabled)
            return;

        if (onlyOne) {
            this.stopVoice();
        }

        path = this.getVoicePath(path);
        let audioPlayer = PoolMgr.Ins.impl(AudioPlayer);
        this._voiceStore.add(audioPlayer);

        audioPlayer.addListener(AudioEventType.Finished, this.voiceFinishHandler, this);
        audioPlayer.addListener(AudioEventType.LoadFailed, this.voiceFinishHandler, this);
        audioPlayer.playPath(path, this._soundVolume, false);
    }

    /**
     * @description: 播放结束
     * @param target
     * @param args
     */
    private soundFinishHandler(target: AudioPlayer, args: any[]) {
        this._soundStore.remove(target);
        PoolMgr.Ins.recover(target);
    }

    /**
     * @description: 播放结束
     * @param target
     * @param args
     */
    private voiceFinishHandler(target: AudioPlayer, args: any[]) {
        this._voiceStore.remove(target);
        PoolMgr.Ins.recover(target);
    }

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

    /**
     * @description: 配音路径
     * @param path
     */
    public getVoicePath(path: string): string {
        return this._voiceRootPath + path;
    }

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
        this.stopSoundStore(this._voiceStore);
    }

    /**
     * @description: 停止所有语音
     */
    public stopVoice() {
        this.stopSoundStore(this._voiceStore);
    }

    private stopSoundStore(store: List<AudioPlayer>) {
        if (store == null || store.length <= 0) {
            return;
        }

        while (store.length > 0) {
            let player = store.removeAt(0);
            PoolMgr.Ins.recover(player);
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
        value = Mathf.clamp(value, 0, 1);
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

        this.dispatchEvent(AudioEventType.BgmVolumeUpdate);
    }

    /**
     * @description: 背景音乐音量
     */
    public get voiceVolume(): number {
        return this._voiceVolume;
    }
    public set voiceVolume(value: number) {
        value = Mathf.clamp(value, 0, 1);
        if (this._voiceVolume == value)
            return;

        this._voiceVolume = value;
        if (this._voiceVolume > 0) {
            //应当是独立的
            // this.soundEnabled = true;
            if (this._voiceStore.length > 0) {
                for (let i = 0; i < this._voiceStore.length; i++) {
                    let player = this._voiceStore.get(i);
                    player.volume = this._voiceVolume;
                }
            }

        }
        else {
            // this.soundEnabled = false;
        }

        this.dispatchEvent(AudioEventType.VoiceVolumeUpdate);
    }


    /**
     * @description:音效音量
     */
    public get soundVolume(): number {
        return this._soundVolume;
    }
    public set soundVolume(value: number) {
        value = Mathf.clamp(value, 0, 1);
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

        this.dispatchEvent(AudioEventType.SoundVolumeUpdate);
    }

    /**
     * @description: 背景音乐过渡时间
     */
    public get dadeTime(): number {
        return this._fadeTime;
    }
    public set dadeTime(value: number) {
        this._fadeTime = Mathf.clamp(value, 0, 10);
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

        this.dispatchEvent(AudioEventType.BgmEnableUpdate);
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

        this.dispatchEvent(AudioEventType.SoundEnableupdate);
    }


    public vibrateShort() {
        this.dispatchEvent(AudioEventType.VibrateShort)
    }

}