#!/bin/bash
# Comprehensive code transformation script for UltimateDecompression
# Reduces code similarity by renaming all identifiers and modifying string literals

set -e

TS_DIR="/Users/admin/Documents/Code/UltimateDecompression/assets/scripts"

echo "=== Starting comprehensive code transformation ==="

# Build a perl command that applies ALL renames in one pass per file
# Using perl for proper \b word-boundary support

transform_file() {
    local file="$1"
    perl -pi -e '

# ======================
# ENUM VALUES FIRST (longest strings, most specific)
# ======================

# UILayerType values
s/\bFullScreen\b/CoverFull/g;
s/\bExtGame\b/MiniGame/g;
s/\bSideCover\b/Drawer/g;
s/\bPopTip\b/Toast/g;
s/\bTooltip\b/Tip/g;
s/\bLoading\b/Loader/g;
s/\bBattle\b/Fight/g;
s/\bGuide\b/Hint/g;
s/\bStory\b/Tale/g;
s/\bMenu\b/Nav/g;
s/\bView\b(?![A-Za-z])/Panel/g;  # careful - View is also a class name prefix
s/\bPost\b/Bulletin/g;
s/\bGM\b/Debug/g;

# UIEventType values
s/\bOpenAnimationDone\b/ShowMotionEnd/g;
s/\bStartCloseAnimation\b/HideMotionStart/g;
s/\bViewLoadDone\b/PanelReady/g;
s/\bTweenPlayDone\b/MotionEnd/g;
s/\bOpen\b(?=\s*[,=}\]])/PanelShow/g;
s/\bClose\b(?=\s*[,=}\]])/PanelHide/g;

# ExclusiveGroup values
s/\bNotConflit\b/Free/g;
s/\bGroup1\b/ZoneA/g;

# AudioConfig values
s/\bViewClose\b/PanelCloseSfx/g;
s/\bViewOpen\b/PanelOpenSfx/g;
s/\bUI_Click_1\b/TapSfxA/g;
s/\bUI_Click_2\b/TapSfxB/g;
s/\bBattle_Win\b/CombatWinSfx/g;

# AudioEventType values
s/\bBgmEnableUpdate\b/MusicToggle/g;
s/\bSoundEnableupdate\b/SfxToggle/g;
s/\bBgmVolumeUpdate\b/MusicVolume/g;
s/\bVoiceVolumeUpdate\b/VoiceVolume/g;
s/\bSoundVolumeUpdate\b/SfxVolume/g;
s/\bVibrateShort\b/HapticPulse/g;
s/\bLoadComplete\b/TrackReady/g;
s/\bLoadFailed\b/TrackError/g;
s/\bStart\b(?=\s*[,=}\]])/TrackPlay/g;
s/\bFinished\b/TrackEnd/g;

# VIEW_TYPE values
s/\bBaseView\b/FullPanel/g;
s/\bBasePanel\b/PopPanel/g;

# ModuleViewEnums values
s/\bHeroEquip\b/HeroGear_/g;
s/\bPlayer\b/Hero_/g;
s/\bHero\b(?=\s*[,=}\]])/Character_/g;
s/\bCommon\b(?=\s*[,=}\]])/Shared_/g;
s/\bZero\b/None_/g;

# BtnEventType values
s/\bOnTouchTap\b/FingerTap/g;
s/\bOnTouchEnd\b/FingerUp/g;
s/\bOnTouchStart\b/FingerDown/g;
s/\bOnTouchReleaseOutSide\b/FingerCancel/g;
s/\bDarkViewShowDone\b/ShadeInDone/g;
s/\bDarkViewHideDone\b/ShadeOutDone/g;

# ResourceEventType values
s/\bResLoadError\b/AssetLoadFail/g;

# ResourceLoadPriority values
s/\bNONE\b/IDLE/g;
s/\bNORMAL\b/STANDARD/g;
s/\bCRITICAL\b/URGENT/g;
s/\bGOD\b/CRITICAL/g;

# LogLevelType values
s/\bWarning\b/Warn/g;

# MODEL_QUALITY values
s/\bMODEL_QUALITY\b/UD_MODEL_TIER/g;
s/\bSPINE_LOAD_COMPLETE\b/UD_SPINE_READY/g;
s/\bSPINE_LOW_DIR\b/UD_SPINE_LOW_PATH/g;
s/\bSPINE_HEIGHT_DIR\b/UD_SPINE_HIGH_PATH/g;

# PopViewEventType values
s/\bComplete\b/ItemDone/g;

# ======================
# CLASS / INTERFACE / ENUM RENAMES
# ======================

# Entry point
s/\bMain\b(?=\s+extends\s+cc\.Component)/UdAppEntry/g;
s/from "\.\/Main"/from ".\/UdAppEntry"/g;
s/import { Main }/import { UdAppEntry }/g;
s/import \{ Main /import { UdAppEntry /g;

# Core framework
s/\bUIMgr\b/UdPanelHub/g;
s/\bBaseUIMgr\b/UdPanelHubCore/g;
s/\bBasePopView\b/UdToastBase/g;
s/\bIPopRewardMsg\b/IUdRewardItem/g;
s/\bPopMgr\b/UdToastHub/g;
s/\bPOP_MSG_COLOR_TO_HEX\b/UD_TOAST_COLOR_MAP/g;
s/\bBaseView\b/UdFullView/g;
s/\bEventSubView\b/UdEventPanel/g;
s/\bSubView\b/UdSubPanel/g;
s/\bModuleViewEnums\b/UdModuleKind/g;
s/\bModuleViews\b/UdModuleMap/g;
s/\bPathUtils\b/UdFilePathKit/g;
s/\bResPathUtils\b/UdAssetPathKit/g;

# Extension basecore
s/\bDictionary\b/UdKeyMap/g;
s/\bListSortUtils\b/UdSeqSorter/g;
s/\bRefDecorator\b/UdDecoratorKit/g;
s/\bRefClass\b/UdBindMeta/g;
s/\bSortType\b/UdSortDir/g;
s/\bMathf\b/UdMathKit/g;
s/\bList\b([<\s])/UdSeqList$1/g;
s/import \{ List,/import { UdSeqList,/g;
s/import \{ List \}/import { UdSeqList }/g;
s/import { List /import { UdSeqList /g;

# Extension view
s/\bViewCache\b/UdViewSlot/g;
s/\bVIEW_TYPE\b/UD_VIEW_CLASS/g;
s/\bResBase\b/UdResFinder/g;
s/\bUILayerType\b/UdLayerKind/g;
s/\bUILayerConfig\b/UdLayerSetup/g;
s/\bExclusiveGroup\b/UdMutexZone/g;
s/\bUIEventType\b/UdPanelSignal/g;
s/\bEaseType\b/UdEaseKind/g;
s/\bEaseUtils\b/UdEaseKit/g;
s/\bViewAnimation\b/UdViewMotion/g;
s/\bView\b(?=\s+extends)/UdViewCore/g;  # View class declaration
s/\bView\s*\|\s*null\b/UdViewCore | null/g;
s/\bView\s*\|\s*undefined\b/UdViewCore | undefined/g;
s/<T extends View>/<T extends UdViewCore>/g;
s/<T extends View,/<T extends UdViewCore,/g;

# Extension eventListener
s/\bComponentListener\b/UdNodeSignal/g;
s/\bListenerHandlerVo\b/UdSignalSlot/g;
s/\bIListener\b/IUdSignalBus/g;
s/\bListener\b/UdSignalBus/g;

# Extension resources
s/\bresource\b/udRes/g;
s/\bCCAsset\b/UdAssetItem/g;
s/\bLoadTask\b/UdLoadRequest/g;
s/\bResourceEventType\b/UdResSignal/g;
s/\bResourceLoadPriority\b/UdLoadTier/g;
s/\bResourceLoader\b/UdLoadRunner/g;
s/\bResourceManager\b/UdResHub/g;

# Extension time
s/\bTimerData\b/UdTimerSlot/g;
s/\bTimeMgr\b/UdTimerHub/g;

# Extension update
s/\bUpdateMgr\b/UdTickHub/g;
s/\bIUpdate\b/IUdTickable/g;

# Extension utils
s/\bClassUtils\b/UdReflectKit/g;
s/\bNodeUtils\b/UdNodeKit/g;
s/\bRandomUtils\b/UdRandomKit/g;
s/\bDateUtils\b/UdDateKit/g;
s/\bDeviceUtils\b/UdDeviceKit/g;
s/\bEnumUtils\b/UdEnumKit/g;
s/\bLoadUtils\b/UdPathKit/g;

# Extension pool
s/\bPoolMgr\b/UdObjCache/g;
s/\bIPoolInstance\b/IUdReusable/g;

# Extension game
s/\bGameButton\b/UdButton/g;
s/\bGameLabel\b/UdLabel/g;
s/\bGameSprite\b/UdSprite/g;
s/\bGameSpine\b/UdSpine/g;

# Extension components
s/\bBaseComponent\b/UdBehavior/g;
s/\bGrayEffect\b/UdGrayMask/g;
s/\bBtnEventType\b/UdBtnSignal/g;

# Extension log
s/\bLogMgr\b/UdLogHub/g;
s/\bBaseLog\b/UdLogCore/g;
s/\bLogLevelType\b/UdLogLevel/g;

# Extension audio
s/\bAudioMgr\b/UdAudioHub/g;
s/\bAudioPlayer\b/UdAudioTrack/g;
s/\bAudioConfig\b/UdAudioDef/g;
s/\bAudioEventType\b/UdAudioSignal/g;

# Module - mainGame
s/\bMainGameResultView\b/UdGameResult/g;
s/\bIMainGameResultViewData\b/IUdGameScore/g;
s/\bIMainGameFruitItemData\b/IUdFruitInfo/g;
s/\bMainGameFruitItem\b/UdFruitBlock/g;
s/\bMainGameView\b/UdGameMain/g;

# Module - popMessage
s/\bPopMsgSubView\b/UdToastItem/g;
s/\bPopMsgView\b/UdToastView/g;
s/\bPopViewEventType\b/UdToastSignal/g;

# Aswallow
s/\baswallow\b/udAssetExt/g;
s/\bAswallow\b/UdAssetExt/g;

# ======================
# INTERFACE METHOD RENAMES
# ======================

# IPoolInstance / IUdReusable
s/\.impl\(\)/.activate()/g;
s/\.recover\(\)/.deactivate()/g;
s/public impl/public activate/g;
s/public recover/public deactivate/g;

# IListener / IUdSignalBus
s/addListener/subscribe/g;
s/removeListener/unsubscribe/g;
s/clearListeners/clearSubs/g;
s/dispatchEvent/emit/g;
s/hasListener/hasSub/g;

# IUpdate / IUdTickable
s/onUpdate\(/onTick(/g;
s/onLateUpdate\(/onPostTick(/g;

# ======================
# COMMON METHOD RENAMES
# ======================

s/getValueByIndex/fetchAt/g;
s/getKeyByIndex/keyAt/g;
s/getValue\b/fetch/g;
s/setValue\b/store/g;
s/contains\b/includes/g;
s/addRange\b/merge/g;
s/getRandomThenRemove/pickRandom/g;
s/getRandom\b/randomPick/g;
s/getAnyValidValue/firstValid/g;
s/getAnyValidkey/firstValidKey/g;
s/removeAt\b/deleteAt/g;
s/indexOf\b/findIndex/g;
s/lastIndexOf\b/findLastIndex/g;
s/getIndexByFunc\b/findIndexBy/g;
s/getArray\b/toNativeArray/g;
s/addArray\b/appendMany/g;
s/cloneJsList\b/toArray/g;
s/setReadonly\b/markReadonly/g;
s/isReadonly\b/isFrozen/g;

# View/BaseUIMgr methods
s/loadSkin\b/mountPrefab/g;
s/isBlockInputEvents\b/isInputBlocked/g;
s/blockInputEvents\b/blockInput/g;
s/playOpenAnimation\b/playShowMotion/g;
s/playCloseAnimation\b/playHideMotion/g;
s/initRunData\b/bootData/g;
s/updateView\b/refresh/g;
s/setNodeRenderAble\b/setNodeVisible/g;
s/onVisibleChange\b/onVisChange/g;
s/onFocusUpdate\b/onFocusChanged/g;
s/closeAllViewAndPanel\b/dismissAllPanels/g;
s/closeByLayerType\b/dismissByLayer/g;
s/closeTopView\b/dismissTop/g;
s/closeAll\b/dismissAll/g;
s/getTopView\b/getTopPanel/g;
s/addCloseExclude\b/addDismissExclude/g;
s/removeCloseExcude\b/removeDismissExclude/g;
s/getResPath\b/getAssetPath/g;
s/isInStage\b/isOnStage/g;
s/callViewFunc\b/callPanelFunc/g;
s/isOpenAndShowed\b/isActiveAndShown/g;
s/updateViewById\b/refreshById/g;
s/closeViewById\b/dismissById/g;
s/openViewById\b/presentById/g;
s/isOpenById\b/isPresentById/g;
s/addMutuallyExclusive\b/addMutexRule/g;
s/removeMutuallyExclusive\b/removeMutexRule/g;
s/isPlayDefaultCloseSound\b/isDefaultCloseSfx/g;

# AudioMgr methods
s/playBgm\b/playMusic/g;
s/playSound\b/playSfx/g;
s/playVoice\b/playSpeech/g;
s/stopBgm\b/stopMusic/g;
s/stopSound\b/stopSfx/g;
s/stopVoice\b/stopSpeech/g;
s/pauseBgm\b/pauseMusic/g;
s/resumeBgm\b/resumeMusic/g;
s/bgmEnabled\b/musicOn/g;
s/soundEnabled\b/sfxOn/g;
s/bgmVolume\b/musicVol/g;
s/soundVolume\b/sfxVol/g;
s/voiceVolume\b/speechVol/g;

# PoolMgr
s/memoryInfo\b/memReport/g;
s/freeMemory\b/freeMem/g;
s/clearByType\b/clearKind/g;

# DeviceUtils
s/statusBarHeight\b/notchTop/g;
s/statusBarHeight02\b/notchTopAlt/g;
s/xyxBarHeight\b/notchXyx/g;
s/statusBottomHeight\b/homeBarHeight/g;
s/additionWidth\b/extraWidth/g;
s/additionScale\b/extraScale/g;
s/curWidth\b/currWidth/g;
s/curHeight\b/currHeight/g;

# ResourceManager
s/maxRequestCountSimultaneously\b/maxConcurrentLoads/g;
s/bundleOutside\b/externalBundle/g;

# NodeUtils
s/addWidget\b/attachWidget/g;
s/addTransform\b/attachTransform/g;
s/addUIOpacity\b/attachOpacity/g;
s/getRenderOrder\b/queryRenderOrder/g;

# RandomUtils
s/getRandomNumber\b/randomFloat/g;
s/getRandomInt\b/randomInt/g;
s/getRandomListElm\b/randomFromList/g;
s/getRandomArrayElm\b/randomFromArray/g;
s/getRandomSimpleArrayElm\b/randomSimpleArray/g;
s/getPlusOrMinus\b/randomSign/g;
s/getYesOrNo\b/randomBool/g;

# DateUtils
s/getNowDateString\b/nowDateStr/g;
s/getFormatBySecond2\b/formatSeconds/g;

# EnumUtils
s/getNames\b/listNames/g;
s/getValues\b/listValues/g;
s/getDic\b/toMap/g;
s/getLength\b/count/g;

# LoadUtils
s/urlPathFilter\b/filterUrlPath/g;
s/folderPathFilter\b/filterDirPath/g;
s/getFileName\b/extractFileName/g;

# PathUtils
s/splitext\b/splitExtension/g;
s/changeExtname\b/swapExtension/g;

# GameButton
s/blockClickEvent\b/clickBlocked/g;
s/shakeEnable\b/shakeOn/g;

# UpdateMgr
s/addUpdateHandler\b/registerTick/g;
s/removeUpdateHandler\b/unregisterTick/g;
s/timeScale\b/tickScale/g;

# ViewAnimation
s/playOpenAnimation\b/hasShowMotion/g;
s/playCloseAnimation\b/hasHideMotion/g;
s/effectByView\b/drivenByView/g;
s/openEase\b/showEase/g;
s/openDuration\b/showDuration/g;
s/openDelay\b/showDelay/g;
s/closeEase\b/hideEase/g;
s/closeDuration\b/hideDuration/g;
s/closeDelay\b/hideDelay/g;
s/doOpen\b/playShow/g;
s/doClose\b/playHide/g;
s/doneOpenImmediately\b/skipShowMotion/g;
s/nodeActive\b/isNodeActive/g;
s/isAutoStart\b/isAutoPlay/g;
s/lateStartHandler\b/onLateBoot/g;
s/onCompleteHandler\b/onAnimDone/g;

# ListenerHandlerVo
s/impl\b/activate/g;
s/recover\b/deactivate/g;

# CCAsset
s/lastUseTimeStamp\b/lastAccessAt/g;
s/updateTimeStamp\b/refreshAccessTime/g;
s/cacheTiem\b/cacheLife/g;

# LoadTask
s/loadFunc\b/jobFunc/g;
s/loadFuncTarget\b/jobTarget/g;
s/loadFuncArgs\b/jobArgs/g;

# AudioPlayer
s/fadeVolume\b/crossfadeVol/g;
s/fadeout\b/crossfadeOut/g;
s/playPath\b/playFromPath/g;

# Timer
s/callFew\b/deferCall/g;
s/callLater\b/delayCall/g;
s/callInterval\b/repeatCall/g;
s/nextTrick\b/nextFire/g;
s/doAction\b/fireAction/g;

# Log
s/logModelName\b/tagName/g;

# ======================
# PRIVATE FIELD NAMING CONVENTION
# ======================

# Change common private field prefixes
s/_instanceStore\b/__panelSlots/g;
s/_instanceCacheStore\b/__panelCacheSlots/g;
s/_layerStore\b/__layerNodes/g;
s/_closeAllExcludeList\b/__dismissExcludes/g;
s/_keyList\b/__keySeq/g;
s/_valueList\b/__valSeq/g;
s/_keyToIndex\b/__keyToPos/g;
s/_isReadonly\b/__isFrozen/g;
s/_isIterating\b/__isIterating/g;
s/_TempSort\b/__sortBuf/g;
s/_length\b/__size/g;
s/_Ins\b/__singleton/g;
s/_store\b/__pool/g;
s/_viewCls\b/__viewClass/g;
s/_uiMgr\b/__panelHub/g;
s/_prefabPath\b/__prefabUri/g;
s/_root\b/__rootNode/g;
s/_canvasSize\b/__canvasExtent/g;
s/_destroyTime\b/__gcTimeout/g;
s/_idleTimer\b/__gcHandle/g;
s/_isAllViewClosing\b/__isBulkClosing/g;
s/_awaitOpenList\b/__pendingOpenQ/g;
s/_mutuallyExclusiveConfig\b/__mutexRules/g;
s/_needToCareViews\b/__trackedPanels/g;
s/_viewOpenPriority\b/__panelPriority/g;

' "$file"
}

# Process all TypeScript files
echo "Processing TypeScript files..."
find "$TS_DIR" -name "*.ts" | while read file; do
    echo "  Transforming: $(basename "$file")"
    transform_file "$file"
done

echo "=== Transformation complete ==="
