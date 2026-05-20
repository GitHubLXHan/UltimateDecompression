declare global {
    interface IExtAssetTypeKey {
        DragonBonesAsset: "DragonBonesAsset",
        DragonBonesAtlasAsset: "DragonBonesAtlasAsset"
    }
    
}
export class UdDragonBoneParser implements aswallow.IAssetParser {
    extAssetMgr: aswallow.IExtAssetManager;
    type: keyof IExtAssetTypeKey = "DragonBonesAsset";
    parse(url: string, data: any) {
        const dasset = new dragonBones.DragonBonesAsset();
        if (data instanceof cc.JsonAsset) {
            data = data.json;
            dasset["_dragonBonesJson"] = JSON.stringify(data);
            dasset["_dragonBonesJsonData"] = data;
        } else if (data instanceof cc.BufferAsset) {
            dasset["_nativeUrl"] = data.nativeUrl;
            data = data["_nativeAsset"];
            dasset["_nativeAsset"] = data;
        }

        this.extAssetMgr.cache(url, dasset);
        return dasset;
    }
    getDepReqs?(req: aswallow.IResRequestItem): aswallow.ResRequestItem[] {
        let reqs: aswallow.ResRequestItem[] = [];
        if (req.ext === ".dbbin") {
            //二进制处理
            reqs.push({
                url: req.url + "_ske.dbbin",
                assetType: "DragonBonesAsset"
            });

        } else {
            //默认用json
            reqs.push({
                url: req.url + "_ske.json",
                assetType: "DragonBonesAsset"
            });
        }
        reqs.push({
            url: req.url + "_tex.json",
            assetType: "DragonBonesAtlasAsset"
        });
        reqs.push({ url: req.url + "_tex.png" });
        return reqs;
    }

}
export class UdDragonBoneAtlasParser implements aswallow.IAssetParser {
    type: keyof IExtAssetTypeKey = "DragonBonesAtlasAsset";
    extAssetMgr: aswallow.IExtAssetManager

    parse(path: string, data: any): any {
        const datlasAsset = new dragonBones.DragonBonesAtlasAsset();
        if (data instanceof cc.JsonAsset) {
            data = data.json;
        }
        datlasAsset["_atlasJsonData"] = data;
        datlasAsset["_atlasJson"] = JSON.stringify(data);
        const texPath = cc.path.changeExtname(path, ".png")
        let texture = this.extAssetMgr.get(texPath);
        if (!texture) {
            console.error(`[DragonBonesAtlasAssetParseHandler]texPath:${texPath},资源未加载`);
            return;
        }
        if (!(texture instanceof cc.Texture2D)) {
            const newTex = new cc.Texture2D()
            newTex["_nativeAsset"] = texture;
            newTex["_nativeUrl"] = texPath;
            texture = newTex;
            this.extAssetMgr.cache(texPath, newTex);
        }
        datlasAsset.texture = texture as any;
        this.extAssetMgr.cache(path, datlasAsset);
        return datlasAsset;
    }


}