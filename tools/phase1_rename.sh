#!/bin/bash
# Safe, comprehensive class/enum/interface renames
set -e
TS_DIR="/Users/admin/Documents/Code/UltimateDecompression/assets/scripts"

echo "=== Phase 1: Comprehensive Identifier Renames ==="

find "$TS_DIR" -name "*.ts" -print0 | xargs -0 perl -pi -e '

# ======== CLASS & ENUM VALUE REFERENCE RENAMES ========

# -- Entry Point --
s/\bclass Main\b/class UdAppEntry/g;
s/from "\.\/Main"/from ".\/UdAppEntry"/g;

# -- Core Framework --
s/\bclass UIMgr\b/class UdPanelHub/g;
s/\bUIMgr\b/UdPanelHub/g;
s/\bclass BaseUIMgr\b/class UdPanelHubCore/g;
s/\bBaseUIMgr\b/UdPanelHubCore/g;
s/\bclass ViewCache\b/class UdViewSlot/g;
s/\bViewCache\b/UdViewSlot/g;
s/\bclass BasePopView\b/class UdToastBase/g;
s/\bBasePopView\b/UdToastBase/g;
s/\bIPopRewardMsg\b/IUdRewardItem/g;
s/\bclass PopMgr\b/class UdToastHub/g;
s/\bPopMgr\b/UdToastHub/g;
s/\bPOP_MSG_COLOR_TO_HEX\b/UD_TOAST_COLOR_MAP/g;
s/\bclass EventSubView\b/class UdEventPanel/g;
s/\bEventSubView\b/UdEventPanel/g;
s/\bModuleViewEnums\b/UdModuleKind/g;
s/\bModuleViews\b/UdModuleMap/g;
s/\bResPathUtils\b/UdAssetPathKit/g;
s/\bPathUtils\b/UdFilePathKit/g;

# -- Extension BaseCore --
s/\bclass Dictionary\b/class UdKeyMap/g;
s/\bDictionary\b/UdKeyMap/g;
s/\bListSortUtils\b/UdSeqSorter/g;
s/\bclass RefDecorator\b/class UdDecoratorKit/g;
s/\bRefDecorator\b/UdDecoratorKit/g;
s/\bRefClass\b/UdBindMeta/g;
s/\bSortType\b/UdSortDir/g;
s/\bMathf\b/UdMathKit/g;

# -- List class (needs careful handling) --
s/import \{ List,/import { UdSeqList,/g;
s/import \{ List \}/import { UdSeqList }/g;
s/import { List /import { UdSeqList /g;
s/\bclass List\b/class UdSeqList/g;
s/\bList</UdSeqList</g;
s/new List\b/new UdSeqList/g;
s/\(List</(UdSeqList</g;
s/\["List"\]/["UdSeqList"]/g;
s/List\.prototype/UdSeqList.prototype/g;

# -- Extension View --
s/\bVIEW_TYPE\b/UD_VIEW_CLASS/g;
s/UD_VIEW_CLASS\.BaseView/UD_VIEW_CLASS.FullPanel/g;
s/UD_VIEW_CLASS\.BasePanel/UD_VIEW_CLASS.PopPanel/g;
s/\bclass ResBase\b/class UdResFinder/g;
s/\bResBase\b/UdResFinder/g;
s/\bUILayerType\b/UdLayerKind/g;
s/\bUILayerConfig\b/UdLayerSetup/g;
s/\bExclusiveGroup\b/UdMutexZone/g;
s/\bUIEventType\b/UdPanelSignal/g;
s/\bEaseType\b/UdEaseKind/g;
s/\bEaseUtils\b/UdEaseKit/g;
s/\bViewAnimation\b/UdViewMotion/g;

# -- View class hierarchy --
s/\bclass View\b/class UdViewCore/g;
s/View extends/UdViewCore extends/g;
s/extends View\b/extends UdViewCore/g;
s/<T extends View>/<T extends UdViewCore>/g;
s/: View\b/: UdViewCore/g;
s/View \| null/UdViewCore | null/g;

# -- BaseView & SubView --
s/\bclass BaseView\b/class UdFullView/g;
s/BaseView\b/UdFullView/g;
s/\bclass SubView\b/class UdSubPanel/g;
s/SubView\b/UdSubPanel/g;

# -- Enum value: UILayerType.View -> UdLayerKind.Panel --
s/UdLayerKind\.View\b/UdLayerKind.Panel/g;

# -- Extension EventListener --
s/\bclass ComponentListener\b/class UdNodeSignal/g;
s/\bComponentListener\b/UdNodeSignal/g;
s/\bclass ListenerHandlerVo\b/class UdSignalSlot/g;
s/\bListenerHandlerVo\b/UdSignalSlot/g;
s/\bIListener\b/IUdSignalBus/g;
s/\bclass Listener\b/class UdSignalBus/g;
s/\bListener\b/UdSignalBus/g;

# -- Extension Resources --
s/\bresource\b/udRes/g;
s/udRes\.ResourceManager/udRes.UdResHub/g;
s/udRes\.AssetUtils/udRes.UdAssetUtil/g;
s/\bclass ResourceManager\b/class UdResHub/g;
s/ResourceManager\.sInstance/UdResHub.sInstance/g;
s/\bclass AssetUtils\b/class UdAssetUtil/g;
s/\bCCAsset\b/UdAssetItem/g;
s/\bLoadTask\b/UdLoadRequest/g;
s/\bResourceEventType\b/UdResSignal/g;
s/\bResourceLoadPriority\b/UdLoadTier/g;
s/\bResourceLoader\b/UdLoadRunner/g;

# -- Extension Time --
s/\bTimerData\b/UdTimerSlot/g;
s/\bTimeMgr\b/UdTimerHub/g;

# -- Extension Update --
s/\bUpdateMgr\b/UdTickHub/g;
s/\bIUpdate\b/IUdTickable/g;

# -- Extension Utils --
s/\bClassUtils\b/UdReflectKit/g;
s/\bNodeUtils\b/UdNodeKit/g;
s/\bRandomUtils\b/UdRandomKit/g;
s/\bDateUtils\b/UdDateKit/g;
s/\bDeviceUtils\b/UdDeviceKit/g;
s/\bEnumUtils\b/UdEnumKit/g;
s/\bLoadUtils\b/UdPathKit/g;

# -- Extension Pool --
s/\bPoolMgr\b/UdObjCache/g;
s/\bIPoolInstance\b/IUdReusable/g;

# -- Extension Game --
s/\bGameButton\b/UdButton/g;
s/\bGameLabel\b/UdLabel/g;
s/\bGameSprite\b/UdSprite/g;
s/\bGameSpine\b/UdSpine/g;
s/\bSPINE_LOAD_COMPLETE\b/UD_SPINE_READY/g;
s/\bSPINE_LOW_DIR\b/UD_SPINE_LOW_PATH/g;
s/\bSPINE_HEIGHT_DIR\b/UD_SPINE_HIGH_PATH/g;
s/\bMODEL_QUALITY\b/UD_MODEL_TIER/g;

# -- Extension Components --
s/\bBaseComponent\b/UdBehavior/g;
s/\bGrayEffect\b/UdGrayMask/g;
s/\bBtnEventType\b/UdBtnSignal/g;

# -- Extension Log --
s/\bLogMgr\b/UdLogHub/g;
s/\bBaseLog\b/UdLogCore/g;
s/\bLogLevelType\b/UdLogLevel/g;

# -- Extension Audio --
s/\bAudioMgr\b/UdAudioHub/g;
s/\bAudioPlayer\b/UdAudioTrack/g;
s/\bAudioConfig\b/UdAudioDef/g;
s/\bAudioEventType\b/UdAudioSignal/g;

# -- Module: MainGame --
s/\bMainGameResultView\b/UdGameResult/g;
s/\bIMainGameResultViewData\b/IUdGameScore/g;
s/\bIMainGameFruitItemData\b/IUdFruitInfo/g;
s/\bMainGameFruitItem\b/UdFruitBlock/g;
s/\bMainGameView\b/UdGameMain/g;

# -- Module: PopMessage --
s/\bPopMsgSubView\b/UdToastItem/g;
s/\bPopMsgView\b/UdToastView/g;
s/\bPopViewEventType\b/UdToastSignal/g;

# ======== ENUM VALUE RENAMES ========

s/UdLayerKind\.FullScreen/UdLayerKind.CoverFull/g;
s/UdLayerKind\.Battle/UdLayerKind.Fight/g;
s/UdLayerKind\.Menu/UdLayerKind.Nav/g;
s/UdLayerKind\.Guide/UdLayerKind.Hint/g;
s/UdLayerKind\.Story/UdLayerKind.Tale/g;
s/UdLayerKind\.ExtGame/UdLayerKind.MiniGame/g;
s/UdLayerKind\.Tooltip/UdLayerKind.Tip/g;
s/UdLayerKind\.Loading/UdLayerKind.Loader/g;
s/UdLayerKind\.PopTip/UdLayerKind.Toast/g;
s/UdLayerKind\.Post/UdLayerKind.Bulletin/g;
s/UdLayerKind\.GM/UdLayerKind.Debug/g;
s/UdLayerKind\.SideCover/UdLayerKind.Drawer/g;

s/UdPanelSignal\.Open\b/UdPanelSignal.PanelShow/g;
s/UdPanelSignal\.Close\b/UdPanelSignal.PanelHide/g;
s/UdPanelSignal\.ViewLoadDone/UdPanelSignal.PanelReady/g;
s/UdPanelSignal\.OpenAnimationDone/UdPanelSignal.ShowMotionEnd/g;
s/UdPanelSignal\.StartCloseAnimation/UdPanelSignal.HideMotionStart/g;
s/UdPanelSignal\.TweenPlayDone/UdPanelSignal.MotionEnd/g;

s/UdMutexZone\.NotConflit/UdMutexZone.Free/g;
s/UdMutexZone\.Group1/UdMutexZone.ZoneA/g;

s/UdAudioDef\.ViewClose\b/UdAudioDef.PanelCloseSfx/g;
s/UdAudioDef\.ViewOpen\b/UdAudioDef.PanelOpenSfx/g;
s/UdAudioDef\.UI_Click_1/UdAudioDef.TapSfxA/g;
s/UdAudioDef\.UI_Click_2/UdAudioDef.TapSfxB/g;
s/UdAudioDef\.Battle_Win/UdAudioDef.CombatWinSfx/g;

s/UdAudioSignal\.BgmEnableUpdate/UdAudioSignal.MusicToggle/g;
s/UdAudioSignal\.SoundEnableupdate/UdAudioSignal.SfxToggle/g;
s/UdAudioSignal\.BgmVolumeUpdate/UdAudioSignal.MusicVolume/g;
s/UdAudioSignal\.VoiceVolumeUpdate/UdAudioSignal.VoiceVolume/g;
s/UdAudioSignal\.SoundVolumeUpdate/UdAudioSignal.SfxVolume/g;
s/UdAudioSignal\.Start\b/UdAudioSignal.TrackPlay/g;
s/UdAudioSignal\.Finished/UdAudioSignal.TrackEnd/g;
s/UdAudioSignal\.LoadComplete/UdAudioSignal.TrackReady/g;
s/UdAudioSignal\.LoadFailed/UdAudioSignal.TrackError/g;
s/UdAudioSignal\.VibrateShort/UdAudioSignal.HapticPulse/g;

s/UdBtnSignal\.OnTouchTap/UdBtnSignal.FingerTap/g;
s/UdBtnSignal\.OnTouchEnd/UdBtnSignal.FingerUp/g;
s/UdBtnSignal\.OnTouchStart/UdBtnSignal.FingerDown/g;
s/UdBtnSignal\.OnTouchReleaseOutSide/UdBtnSignal.FingerCancel/g;
s/UdBtnSignal\.DarkViewShowDone/UdBtnSignal.ShadeInDone/g;
s/UdBtnSignal\.DarkViewHideDone/UdBtnSignal.ShadeOutDone/g;

s/UdLoadTier\.NONE\b/UdLoadTier.IDLE/g;
s/UdLoadTier\.NORMAL\b/UdLoadTier.STANDARD/g;
s/UdLoadTier\.CRITICAL\b/UdLoadTier.URGENT/g;
s/UdLoadTier\.GOD\b/UdLoadTier.CRITICAL/g;

s/UdLogLevel\.log\b/UdLogLevel.Trace/g;
s/UdLogLevel\.Warning\b/UdLogLevel.Warn/g;
s/UdLogLevel\.Error\b/UdLogLevel.Fatal/g;

s/UdResSignal\.ResLoadError/UdResSignal.AssetLoadFail/g;

s/UD_MODEL_TIER\.NORMAL/UD_MODEL_TIER.STANDARD/g;
s/UD_MODEL_TIER\.LOW/UD_MODEL_TIER.ECONOMY/g;
s/UD_MODEL_TIER\.HIGH/UD_MODEL_TIER.PREMIUM/g;

s/UdToastSignal\.Start\b/UdToastSignal.ItemShow/g;
s/UdToastSignal\.Complete/UdToastSignal.ItemDone/g;

s/UdModuleKind\.Player\b/UdModuleKind.Hero_/g;
s/UdModuleKind\.HeroEquip\b/UdModuleKind.HeroGear_/g;
s/UdModuleKind\.Hero\b/UdModuleKind.Character_/g;
s/UdModuleKind\.Battle\b/UdModuleKind.Combat_/g;
s/UdModuleKind\.Common\b/UdModuleKind.Shared_/g;
s/UdModuleKind\.Zero\b/UdModuleKind.None_/g;

# ======== STRING LITERAL CHANGES ========
s/"ViewRoot"/"UiStageRoot"/g;
s/"UIMgr"/"UdPanelHub"/g;
s/"PoolMgr"/"UdObjCache"/g;

'
echo "Phase 1 complete."
