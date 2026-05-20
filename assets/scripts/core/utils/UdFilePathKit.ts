import { UdBindMeta } from "../../extension/basecore/UdDecoratorKit";

@UdBindMeta
export class UdFilePathKit {

    /**
     * Split a path in root and extension.
     * @param pathStr 
     */
    public static splitext(pathStr: string): string[] {
        let pathRes: string[] = [];

        let suffix = cc.path.extname(pathStr);
        let root = suffix ? pathStr.slice(0, pathStr.lastIndexOf(suffix)) : pathStr;
        pathRes[0] = root;
        pathRes[1] = suffix;

        return pathRes;
    }

    /**
     * !#en Change extname of a file path.
     * !#zh 更改文件路径的扩展名。
     * @method changeExtname
     * @example {@link cocos2d/core/utils/CCPath/changeExtname.js}
     * @param {String} pathStr
     * @param {String} [extname]
     * @returns {String}
     */
    public static changeExtname(pathStr: string, extname: string): string {
        let res: string = "";

        extname = extname || "";
        var index = pathStr.indexOf("?");
        var tempStr = "";
        if (index > 0) {
            tempStr = pathStr.substring(index);
            pathStr = pathStr.substring(0, index);
        }

        let pathArr = pathStr.split("/");
        let fileNameStr = pathArr[pathArr.length - 1];
        index = fileNameStr.lastIndexOf(".");
        if (index < 0) {
            res = pathStr + extname + tempStr;
        } else {
            fileNameStr = fileNameStr.substring(0, index) + extname;
            pathArr[pathArr.length - 1] = fileNameStr;
            pathStr = pathArr.join("/");
            res = pathStr + tempStr;
        }

        return res;
    }
}