#!/bin/bash
# Step 1: Rename all physical .ts files
# Step 2: Rename all symbol references (including import paths)
set -e
TS_DIR="/Users/admin/Documents/Code/UltimateDecompression/assets/scripts"

echo "=== Step 1: Renaming physical files ==="

# Array of old_path:new_path
declare -A RENAMES
RENAMES["$TS_DIR/Main.ts"]="$TS_DIR/UdAppEntry.ts"
RENAMES["$TS_DIR/core/manager/UIMgr.ts"]="$TS_DIR/core/manager/UdPanelHub.ts"
RENAMES["$TS_DIR/core/popMessage/PopMgr.ts"]="$TS_DIR/core/popMessage/UdToastHub.ts"
RENAMES["$TS_DIR/core/popMessage/BasePopView.ts"]="$TS_DIR/core/popMessage/UdToastBase.ts"
RENAMES["$TS_DIR/core/view/compoment/BaseView.ts"]="$TS_DIR/core/view/compoment/UdFullView.ts"
RENAMES["$TS_DIR/core/view/compoment/SubView.ts"]="$TS_DIR/core/view/compoment/UdSubPanel.ts"
RENAMES["$TS_DIR/core/view/compoment/EventSubView.ts"]="$TS_DIR/core/view/compoment/UdEventPanel.ts"
RENAMES["$TS_DIR/core/view/med/ModuleViewEnums.ts"]="$TS_DIR/core/view/med/UdModuleKind.ts"
RENAMES["$TS_DIR/core/view/med/ModuleViews.ts"]="$TS_DIR/core/view/med/UdModuleMap.ts"
RENAMES["$TS_DIR/core/utils/PathUtils.ts"]="$TS_DIR/core/utils/UdFilePathKit.ts"
RENAMES["$TS_DIR/core/utils/ResPathUtils.ts"]="$TS_DIR/core/utils/UdAssetPathKit.ts"
RENAMES["$TS_DIR/core/popMessage/IPopRewardMsg.ts"]="$TS_DIR/core/popMessage/IUdRewardItem.ts"
RENAMES["$TS_DIR/core/popMessage/PopMsgColors.ts"]="$TS_DIR/core/popMessage/UdToastColors.ts"
RENAMES["$TS_DIR/extension/basecore/Dictionary.ts"]="$TS_DIR/extension/basecore/UdKeyMap.ts"
RENAMES["$TS_DIR/extension/basecore/List.ts"]="$TS_DIR/extension/basecore/UdSeqList.ts"
RENAMES["$TS_DIR/extension/basecore/ListSortUtils.ts"]="$TS_DIR/extension/basecore/UdSeqSorter.ts"
RENAMES["$TS_DIR/extension/basecore/Mathf.ts"]="$TS_DIR/extension/basecore/UdMathKit.ts"
RENAMES["$TS_DIR/extension/basecore/RefDecorator.ts"]="$TS_DIR/extension/basecore/UdDecoratorKit.ts"
RENAMES["$TS_DIR/extension/basecore/SortType.ts"]="$TS_DIR/extension/basecore/UdSortDir.ts"
RENAMES["$TS_DIR/extension/view/BaseUIMgr.ts"]="$TS_DIR/extension/view/UdPanelHubCore.ts"
RENAMES["$TS_DIR/extension/view/compoment/View.ts"]="$TS_DIR/extension/view/compoment/UdViewCore.ts"
RENAMES["$TS_DIR/extension/view/compoment/ResBase.ts"]="$TS_DIR/extension/view/compoment/UdResFinder.ts"
RENAMES["$TS_DIR/extension/view/types/UILayerType.ts"]="$TS_DIR/extension/view/types/UdLayerKind.ts"
RENAMES["$TS_DIR/extension/view/types/UIEventType.ts"]="$TS_DIR/extension/view/types/UdPanelSignal.ts"
RENAMES["$TS_DIR/extension/view/types/EaseType.ts"]="$TS_DIR/extension/view/types/UdEaseKind.ts"
RENAMES["$TS_DIR/extension/view/utils/EaseUtils.ts"]="$TS_DIR/extension/view/utils/UdEaseKit.ts"
RENAMES["$TS_DIR/extension/view/animations/ViewAnimation.ts"]="$TS_DIR/extension/view/animations/UdViewMotion.ts"
RENAMES["$TS_DIR/extension/eventListener/Listener.ts"]="$TS_DIR/extension/eventListener/UdSignalBus.ts"
RENAMES["$TS_DIR/extension/eventListener/ComponentListener.ts"]="$TS_DIR/extension/eventListener/UdNodeSignal.ts"
RENAMES["$TS_DIR/extension/eventListener/IListener.ts"]="$TS_DIR/extension/eventListener/IUdSignalBus.ts"
RENAMES["$TS_DIR/extension/eventListener/ListenerHandlerVo.ts"]="$TS_DIR/extension/eventListener/UdSignalSlot.ts"
RENAMES["$TS_DIR/extension/resources/CCAsset.ts"]="$TS_DIR/extension/resources/UdAssetItem.ts"
RENAMES["$TS_DIR/extension/resources/LoadTask.ts"]="$TS_DIR/extension/resources/UdLoadRequest.ts"
RENAMES["$TS_DIR/extension/resources/ResourceEventType.ts"]="$TS_DIR/extension/resources/UdResSignal.ts"
RENAMES["$TS_DIR/extension/resources/ResourceLoadPriority.ts"]="$TS_DIR/extension/resources/UdLoadTier.ts"
RENAMES["$TS_DIR/extension/resources/ResourceLoader.ts"]="$TS_DIR/extension/resources/UdLoadRunner.ts"
RENAMES["$TS_DIR/extension/resources/ResourceManager.ts"]="$TS_DIR/extension/resources/UdResHub.ts"
RENAMES["$TS_DIR/extension/time/TimeMgr.ts"]="$TS_DIR/extension/time/UdTimerHub.ts"
RENAMES["$TS_DIR/extension/time/TimerData.ts"]="$TS_DIR/extension/time/UdTimerSlot.ts"
RENAMES["$TS_DIR/extension/update/UpdateMgr.ts"]="$TS_DIR/extension/update/UdTickHub.ts"
RENAMES["$TS_DIR/extension/update/IUpdate.ts"]="$TS_DIR/extension/update/IUdTickable.ts"
RENAMES["$TS_DIR/extension/utils/ClassUtils.ts"]="$TS_DIR/extension/utils/UdReflectKit.ts"
RENAMES["$TS_DIR/extension/utils/NodeUtils.ts"]="$TS_DIR/extension/utils/UdNodeKit.ts"
RENAMES["$TS_DIR/extension/utils/RandomUtils.ts"]="$TS_DIR/extension/utils/UdRandomKit.ts"
RENAMES["$TS_DIR/extension/utils/DateUtils.ts"]="$TS_DIR/extension/utils/UdDateKit.ts"
RENAMES["$TS_DIR/extension/utils/DeviceUtils.ts"]="$TS_DIR/extension/utils/UdDeviceKit.ts"
RENAMES["$TS_DIR/extension/utils/EnumUtils.ts"]="$TS_DIR/extension/utils/UdEnumKit.ts"
RENAMES["$TS_DIR/extension/utils/LoadUtils.ts"]="$TS_DIR/extension/utils/UdPathKit.ts"
RENAMES["$TS_DIR/extension/pool/PoolMgr.ts"]="$TS_DIR/extension/pool/UdObjCache.ts"
RENAMES["$TS_DIR/extension/pool/IPoolInstance.ts"]="$TS_DIR/extension/pool/IUdReusable.ts"
RENAMES["$TS_DIR/extension/game/GameButton.ts"]="$TS_DIR/extension/game/UdButton.ts"
RENAMES["$TS_DIR/extension/game/GameLabel.ts"]="$TS_DIR/extension/game/UdLabel.ts"
RENAMES["$TS_DIR/extension/game/GameSprite.ts"]="$TS_DIR/extension/game/UdSprite.ts"
RENAMES["$TS_DIR/extension/game/GameSpine.ts"]="$TS_DIR/extension/game/UdSpine.ts"
RENAMES["$TS_DIR/extension/components/BaseComponent.ts"]="$TS_DIR/extension/components/UdBehavior.ts"
RENAMES["$TS_DIR/extension/components/GrayEffect.ts"]="$TS_DIR/extension/components/UdGrayMask.ts"
RENAMES["$TS_DIR/extension/components/GameBtn/BtnEventType.ts"]="$TS_DIR/extension/components/GameBtn/UdBtnSignal.ts"
RENAMES["$TS_DIR/extension/log/LogMgr.ts"]="$TS_DIR/extension/log/UdLogHub.ts"
RENAMES["$TS_DIR/extension/log/BaseLog.ts"]="$TS_DIR/extension/log/UdLogCore.ts"
RENAMES["$TS_DIR/extension/log/LogLevelType.ts"]="$TS_DIR/extension/log/UdLogLevel.ts"
RENAMES["$TS_DIR/extension/audio/AudioMgr.ts"]="$TS_DIR/extension/audio/UdAudioHub.ts"
RENAMES["$TS_DIR/extension/audio/AudioPlayer.ts"]="$TS_DIR/extension/audio/UdAudioTrack.ts"
RENAMES["$TS_DIR/extension/audio/AudioConfig.ts"]="$TS_DIR/extension/audio/UdAudioDef.ts"
RENAMES["$TS_DIR/extension/audio/AudioEventType.ts"]="$TS_DIR/extension/audio/UdAudioSignal.ts"
RENAMES["$TS_DIR/module/mainGame/views/MainGameView.ts"]="$TS_DIR/module/mainGame/views/UdGameMain.ts"
RENAMES["$TS_DIR/module/mainGame/views/MainGameResultView.ts"]="$TS_DIR/module/mainGame/views/UdGameResult.ts"
RENAMES["$TS_DIR/module/mainGame/items/MainGameFruitItem.ts"]="$TS_DIR/module/mainGame/items/UdFruitBlock.ts"
RENAMES["$TS_DIR/module/popMessage/PopMsgView.ts"]="$TS_DIR/module/popMessage/UdToastView.ts"
RENAMES["$TS_DIR/module/popMessage/PopMsgSubView.ts"]="$TS_DIR/module/popMessage/UdToastItem.ts"
RENAMES["$TS_DIR/module/popMessage/types/PopViewEventType.ts"]="$TS_DIR/module/popMessage/types/UdToastSignal.ts"

# Execute file renames
for old in "${!RENAMES[@]}"; do
    new="${RENAMES[$old]}"
    if [ -f "$old" ]; then
        echo "  mv $(basename "$old") → $(basename "$new")"
        mv "$old" "$new"
    fi
done

echo ""
echo "=== Step 2: Renaming all symbol references ==="
echo ""

find "$TS_DIR" -name "*.ts" -print0 | xargs -0 perl -pi -e '

# ======== CLASS/ENUM/INTERFACE SYMBOL RENAMES ========

# Entry Point
s/\bclass Main\b/class UdAppEntry/g;
s/\bMain\b/UdAppEntry/g;

# Core Framework
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

# Extension BaseCore
s/\bclass Dictionary\b/class UdKeyMap/g;
s/\bDictionary\b/UdKeyMap/g;
s/\bListSortUtils\b/UdSeqSorter/g;
s/\bclass RefDecorator\b/class UdDecoratorKit/g;
s/\bRefDecorator\b/UdDecoratorKit/g;
s/\bRefClass\b/UdBindMeta/g;
s/\bSortType\b/UdSortDir/g;
s/\bMathf\b/UdMathKit/g;
s/\bclass List\b/class UdSeqList/g;
s/\bList</UdSeqList</g;
s/new List\b/new UdSeqList/g;
s/\(List</(UdSeqList</g;
s/\["List"\]/["UdSeqList"]/g;
s/List\.prototype/UdSeqList.prototype/g;

# Extension View
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

# View class hierarchy
s/\bclass View\b/class UdViewCore/g;
s/View extends/UdViewCore extends/g;
s/extends View\b/extends UdViewCore/g;
s/<T extends View>/<T extends UdViewCore>/g;
s/: View\b/: UdViewCore/g;
s/View \| null/UdViewCore | null/g;
s/\bclass BaseView\b/class UdFullView/g;
s/BaseView\b/UdFullView/g;
s/\bclass SubView\b/class UdSubPanel/g;
s/SubView\b/UdSubPanel/g;

# UILayerType.View enum value -> Panel
s/UdLayerKind\.View\b/UdLayerKind.Panel/g;

# EventListener
s/\bclass ComponentListener\b/class UdNodeSignal/g;
s/\bComponentListener\b/UdNodeSignal/g;
s/\bclass ListenerHandlerVo\b/class UdSignalSlot/g;
s/\bListenerHandlerVo\b/UdSignalSlot/g;
s/\bIListener\b/IUdSignalBus/g;
s/\bclass Listener\b/class UdSignalBus/g;
s/\bListener\b/UdSignalBus/g;

# Resources
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

# Time
s/\bTimerData\b/UdTimerSlot/g;
s/\bTimeMgr\b/UdTimerHub/g;

# Update
s/\bUpdateMgr\b/UdTickHub/g;
s/\bIUpdate\b/IUdTickable/g;

# Utils
s/\bClassUtils\b/UdReflectKit/g;
s/\bNodeUtils\b/UdNodeKit/g;
s/\bRandomUtils\b/UdRandomKit/g;
s/\bDateUtils\b/UdDateKit/g;
s/\bDeviceUtils\b/UdDeviceKit/g;
s/\bEnumUtils\b/UdEnumKit/g;
s/\bLoadUtils\b/UdPathKit/g;

# Pool
s/\bPoolMgr\b/UdObjCache/g;
s/\bIPoolInstance\b/IUdReusable/g;

# Game
s/\bGameButton\b/UdButton/g;
s/\bGameLabel\b/UdLabel/g;
s/\bGameSprite\b/UdSprite/g;
s/\bGameSpine\b/UdSpine/g;
s/\bSPINE_LOAD_COMPLETE\b/UD_SPINE_READY/g;
s/\bSPINE_LOW_DIR\b/UD_SPINE_LOW_PATH/g;
s/\bSPINE_HEIGHT_DIR\b/UD_SPINE_HIGH_PATH/g;
s/\bMODEL_QUALITY\b/UD_MODEL_TIER/g;

# Components
s/\bBaseComponent\b/UdBehavior/g;
s/\bGrayEffect\b/UdGrayMask/g;
s/\bBtnEventType\b/UdBtnSignal/g;

# Log
s/\bLogMgr\b/UdLogHub/g;
s/\bBaseLog\b/UdLogCore/g;
s/\bLogLevelType\b/UdLogLevel/g;

# Audio
s/\bAudioMgr\b/UdAudioHub/g;
s/\bAudioPlayer\b/UdAudioTrack/g;
s/\bAudioConfig\b/UdAudioDef/g;
s/\bAudioEventType\b/UdAudioSignal/g;

# Module: MainGame
s/\bMainGameResultView\b/UdGameResult/g;
s/\bIMainGameResultViewData\b/IUdGameScore/g;
s/\bIMainGameFruitItemData\b/IUdFruitInfo/g;
s/\bMainGameFruitItem\b/UdFruitBlock/g;
s/\bMainGameView\b/UdGameMain/g;

# Module: PopMessage
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
s/"Main"/"UdAppEntry"/g;

'

echo "=== All done ==="
