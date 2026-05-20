declare global {
    interface IExtAssetTypeKey {
        TiledMapAsset: any
    }
}
export class UdTiledMapParser implements aswallow.IAssetParser {
    type: keyof IExtAssetTypeKey = "TiledMapAsset";
    extAssetMgr: aswallow.IExtAssetManager;
    private _domPaser: DOMParser;
    private get domPaser(): DOMParser {
        if (!this._domPaser) {
            this._domPaser = new DOMParser();
        }
        return this._domPaser;
    }
    parse(tmxPath: string, data: cc.TextAsset) {
        const tiledMapAsset = new cc.TiledMapAsset();
        const doc = this.domPaser.parseFromString(data.text, "text/xml");
        const imageLayerTextures = [];
        const imageLayerTextureNames = [];
        const textures: cc.Texture2D[] = [];
        const tsxFiles = [];
        const tsxFileNames = [];
        const textureNames = [];
        const textureSizes = [];
        const parseTilesetImages = (tilesetNode, sourcePath: string) => {
            let images = tilesetNode.getElementsByTagName('image');
            for (let i = 0, n = images.length; i < n; i++) {
                let textureName = images[i].getAttribute('source');
                if (textureName) {
                    const texPath = cc.path.join(cc.path.dirname(sourcePath), textureName);
                    const texture: cc.Texture2D = this.extAssetMgr.get(texPath);
                    if (texture) {
                        textures.push(texture);
                        textureSizes.push(cc.size(texture.width, texture.height));
                    } else {
                        textureSizes.push(cc.size(0, 0));
                        console.error(`Can not find texture ${texPath}`);
                    }
                    textureNames.push(textureName);


                }
            }
        }

        var rootElement = doc.documentElement;
        var tilesetElements = rootElement.getElementsByTagName('tileset');
        for (var i = 0, n = tilesetElements.length; i < n; i++) {
            var tileset = tilesetElements[i];
            var sourceTSX = tileset.getAttribute('source');
            if (sourceTSX) {
                let tsxPath = cc.path.join(cc.path.dirname(tmxPath), sourceTSX);
                let tsxAsset: cc.TextAsset = this.extAssetMgr.get(tsxPath);
                let tsxDoc = this.domPaser.parseFromString(tsxAsset.text, "text/xml");
                tsxFiles.push(tsxAsset);
                tsxFileNames.push(sourceTSX);
                parseTilesetImages(tsxDoc, tsxPath);
            }

            // import images
            parseTilesetImages(tileset, tmxPath);
        }

        const imageLayerElements = rootElement.getElementsByTagName('imagelayer');
        for (let ii = 0, nn = imageLayerElements.length; ii < nn; ii++) {
            let imageLayer = imageLayerElements[ii];
            let imageInfos = imageLayer.getElementsByTagName('image');
            if (imageInfos && imageInfos.length > 0) {
                let imageInfo = imageInfos[0];
                let textureName = imageInfo.getAttribute('source');
                let texPath = cc.path.join(cc.path.dirname(tmxPath), textureName);
                const texture = this.extAssetMgr.get(texPath);
                imageLayerTextures.push(texture);
                imageLayerTextureNames.push(textureName);
            }
        }

        tiledMapAsset.textureNames = textureNames;
        tiledMapAsset.imageLayerTextureNames = textureNames;
        tiledMapAsset.textures = textures;
        tiledMapAsset.imageLayerTextures = imageLayerTextures;
        tiledMapAsset["tsxFiles"] = tsxFiles;
        tiledMapAsset["tsxFileNames"] = tsxFileNames;
        tiledMapAsset["tmxXmlStr"] = data.text;
        this.extAssetMgr.cache(tmxPath, tiledMapAsset);
        
        return tiledMapAsset;
    }

}