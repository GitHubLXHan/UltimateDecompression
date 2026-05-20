declare global {
    interface IExtAssetTypeKey {
        SpineAsset: "SpineAsset"
    }
}
export class UdSpineParser implements aswallow.IAssetParser {
    type: keyof IExtAssetTypeKey = "SpineAsset";
    extAssetMgr: aswallow.IExtAssetManager
    parse(path: string, data: any): any {

        const spineAsset = new sp.SkeletonData();
        const atlasPath = cc.path.changeExtname(path, ".atlas");
        const atlasPath_txt = cc.path.changeExtname(path, ".txt");
        const texPath = cc.path.changeExtname(path, ".png");
        if (data instanceof ArrayBuffer) {
            spineAsset["_nativeAsset"] = data;
            
        } else if (data instanceof cc.JsonAsset) {
            data = data.json;
            spineAsset.skeletonJson = JSON.stringify(data);
        } else if (data instanceof cc.BufferAsset) {
            spineAsset["_nativeUrl"] = data.nativeUrl;
            spineAsset["_nativeAsset"] = data["_nativeAsset"];
            
        }
        spineAsset["_uuid"] = path;
        let atlasText: any = this.extAssetMgr.get(atlasPath);
        if (!atlasText) {
            atlasText = this.extAssetMgr.get(atlasPath_txt);
        }
        if (!atlasText) {
            console.error(`[SpineParseHandler]:path:${path}图集资源未加载=>atlasPath:${atlasPath},atlasUrl_txt:${atlasPath_txt}`);
        }
        if (atlasText instanceof cc.TextAsset) {
            atlasText = atlasText.text;
        }
        spineAsset.atlasText = atlasText;
        let texture = this.extAssetMgr.get(texPath);
        if (!texture) {
            console.error(`[SpineParseHandler]texPath:${texPath},资源未加载`);
            return;
        }
        if (!(texture instanceof cc.Texture2D)) {
            const newTex = new cc.Texture2D()
            newTex["_nativeAsset"] = texture;
            newTex["_nativeUrl"] = texPath;
            texture = newTex;
            this.extAssetMgr.cache(texPath, newTex);
        }



        spineAsset["textureNames"] = [cc.path.basename(texPath)];
        spineAsset.textures = [texture as any];
        this.extAssetMgr.cache(path, spineAsset);
        return spineAsset;
    }
    getDepReqs?(req: aswallow.IResRequestItem): aswallow.ResRequestItem[] {
        let reqs: aswallow.ResRequestItem[] = [];
        if (req.ext === ".skel") {
            //二进制处理
            reqs.push({
                url: req.url + ".skel",
                assetType: "SpineAsset"
            });

        } else {
            //json处理
            reqs.push({
                url: req.url + ".json",
                assetType: "SpineAsset"
            });
        }

        reqs.push({ url: req.url + ".atlas" });
        reqs.push({ url: req.url + ".png" });
        return reqs;
    }

}