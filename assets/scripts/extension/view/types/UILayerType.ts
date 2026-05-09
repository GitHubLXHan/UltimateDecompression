/**
 * @description:
 * @author: Zeros
 */
export enum UILayerType {
    FullScreen,
    Battle,
    Menu,
    View,
    Guide,
    Story,
    ExtGame, //微信小游戏过审用的小游戏
    Tooltip,
    Loading,
    PopTip,
    Post,
    GM,
    SideCover,
}

export const UILayerConfig = {
    [UILayerType.FullScreen]: {
        saveAreaEnable: true,
    },
    [UILayerType.Battle]: {
        saveAreaEnable: true,
    },
    [UILayerType.Menu]: {
        saveAreaEnable: true,
    },
    [UILayerType.View]: {
        saveAreaEnable: true,
    },
    [UILayerType.ExtGame]: {
        saveAreaEnable: false,
    },
    [UILayerType.Guide]: {
        saveAreaEnable: false,
    },
    [UILayerType.Story]: {
        saveAreaEnable: false,
    },
    [UILayerType.Tooltip]: {
        saveAreaEnable: true,
    },
    [UILayerType.Loading]: {
        saveAreaEnable: false,
    },
    [UILayerType.PopTip]: {
        saveAreaEnable: false,
    },
    [UILayerType.Post]: {
        saveAreaEnable: false,
    },
    [UILayerType.GM]: {
        saveAreaEnable: false,
    },
    [UILayerType.SideCover]: {
        saveAreaEnable: true,
    },
}


export enum ExclusiveGroup {
    NotConflit,
    Group1,
}