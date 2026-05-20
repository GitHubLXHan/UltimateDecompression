
export class UdPathKit {

    // /**
    //  * 加载图片
    //  * @param icon    图片路径
    //  * @param sprite  图片显示对象
    //  */
    // public static LoadIcon(icon: string, sprite: cc.Sprite) {
    //     let path = ResConfig.getTexturePath(icon);
    //     let iconPath = LoadMgr.Ins.GetRes(path);
    //     if (iconPath == null) {
    //         LoadMgr.Ins.LoadRes(path, UdPathKit.IconLoadComplete, LoadPriorityType.Other, sprite, icon);
    //     }
    //     else {
    //         UdPathKit.IconLoadComplete([sprite, icon]);
    //     }
    // }   

    // private static IconLoadComplete(args: any[]) {
    //     let sprite: cc.Sprite = args[0] as cc.Sprite;
    //     let path: string = args[1] as string;
    //     let resPath = ResConfig.getTexturePath(path);
    //     let icon = LoadMgr.Ins.GetRes(resPath);
    //     if (icon instanceof cc.Texture2D) {
    //         sprite.spriteFrame = new cc.SpriteFrame(icon);
    //     }
    //     else if (icon instanceof cc.SpriteAtlas) {
    //         sprite.spriteFrame = icon.getSpriteFrame(icon.name);
    //     }
    //     else if (icon instanceof cc.SpriteFrame) {
    //         sprite.spriteFrame = icon;
    //     }
    // }


    /**
     * @description: 过滤路径
     * @param {string} path
     * @return {*}
     */
    public static urlPathFilter(path:string):string {
        if (path != null && path.length > 0) {
            path = path.replace("\\", "/");
        }

        return path;
    }

    /**
     * @description: 过滤路径
     * @param {string} path
     * @return {*}
     */
     public static folderPathFilter(path:string):string {
        if (path != null && path.length > 0) {
            path = path.replace("\\", "/");
            path = path.replace("//", "/");

            if (path.charAt(path.length - 1) != "/")
                path += "/";
        }

        return path;
    }

    /**
     * @description: 获取文件名
     * @param {string} path
     */
     public static getFileName(path:string):string {
        path = UdPathKit.urlPathFilter(path);
          
        if (path != null && path.length > 0) {

            let index = path.lastIndexOf("/");
            if (index >= 0) {
                return path.substring(index + 1);
            }
        }

        return path;
    }
}