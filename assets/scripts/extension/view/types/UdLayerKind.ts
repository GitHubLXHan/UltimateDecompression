export enum UdLayerKind {
    CoverFull,
    Fight,
    Nav,
    Panel,
    Hint,
    Tale,
    MiniGame, //微信小游戏过审用的小游戏
    Tip,
    Loader,
    Toast,
    Bulletin,
    Debug,
    Drawer,
}

export const UdLayerSetup = {
    [UdLayerKind.CoverFull]: {
        saveAreaEnable: true,
    },
    [UdLayerKind.Fight]: {
        saveAreaEnable: true,
    },
    [UdLayerKind.Nav]: {
        saveAreaEnable: true,
    },
    [UdLayerKind.Panel]: {
        saveAreaEnable: true,
    },
    [UdLayerKind.MiniGame]: {
        saveAreaEnable: false,
    },
    [UdLayerKind.Hint]: {
        saveAreaEnable: false,
    },
    [UdLayerKind.Tale]: {
        saveAreaEnable: false,
    },
    [UdLayerKind.Tip]: {
        saveAreaEnable: true,
    },
    [UdLayerKind.Loader]: {
        saveAreaEnable: false,
    },
    [UdLayerKind.Toast]: {
        saveAreaEnable: false,
    },
    [UdLayerKind.Bulletin]: {
        saveAreaEnable: false,
    },
    [UdLayerKind.Debug]: {
        saveAreaEnable: false,
    },
    [UdLayerKind.Drawer]: {
        saveAreaEnable: true,
    },
}


export enum UdMutexZone {
    Free,
    ZoneA,
}
