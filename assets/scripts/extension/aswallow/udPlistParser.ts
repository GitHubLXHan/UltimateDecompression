
const BRACE_REGEX = /[\{\}]/g;

function parseSize(sizeStr) {
    sizeStr = sizeStr.slice(1, -1);
    let arr = sizeStr.split(',');
    let width = parseFloat(arr[0]);
    let height = parseFloat(arr[1]);
    return new cc.Size(width, height);
}

function parseVec2(vec2Str) {
    vec2Str = vec2Str.slice(1, -1);
    var arr = vec2Str.split(',');
    var x = parseFloat(arr[0]);
    var y = parseFloat(arr[1]);
    return new cc.Vec2(x, y);
}

function parseTriangles(trianglesStr) {
    return trianglesStr.split(' ').map(parseFloat);
}

function parseVertices(verticesStr) {
    return verticesStr.split(' ').map(parseFloat);
}

function parseRect(rectStr) {
    rectStr = rectStr.replace(BRACE_REGEX, '');
    let arr = rectStr.split(',');
    return new cc.Rect(
        parseFloat(arr[0] || 0),
        parseFloat(arr[1] || 0),
        parseFloat(arr[2] || 0),
        parseFloat(arr[3] || 0),
    );
}
/**
 * 解析图集文件
 * @param plist 
 * @param texture 
 * @returns 
 */
export function parsePlist(plist: any, texture: cc.Texture2D) {
    if (plist instanceof cc.Asset) {
        plist = plist["_nativeAsset"];
    }
    let info = plist.metadata;
    let frames = plist.frames;

    let atlas = new cc.SpriteAtlas();
    let spriteFrames = atlas["_spriteFrames"];

    for (let key in frames) {
        let frame = frames[key];
        let rotated = false, sourceSize, offsetStr, textureRect;
        // let trimmed = frame.trimmed;
        if (info.format === 0) {
            rotated = false;
            // trimmed = frame.trimmed;
            sourceSize = `{${frame.originalWidth},${frame.originalHeight}}`;
            offsetStr = `{${frame.offsetX},${frame.offsetY}}`;
            textureRect = `{{${frame.x},${frame.y}},{${frame.width},${frame.height}}}`;
        }
        else if (info.format === 1 || info.format === 2) {
            rotated = frame.rotated;
            // trimmed = frame.trimmed;
            sourceSize = frame.sourceSize;
            offsetStr = frame.offset;
            textureRect = frame.frame;
        }
        else if (info.format === 3) {
            rotated = frame.textureRotated;
            // trimmed = frame.trimmed;
            sourceSize = frame.spriteSourceSize;
            offsetStr = frame.spriteOffset;
            textureRect = frame.textureRect;
        }

        const spframe = new cc.SpriteFrame();

        spframe.setTexture(texture, parseRect(textureRect), !!rotated, parseVec2(offsetStr), parseSize(sourceSize));
        if (frame.triangles) {
            let vertices = parseVertices(frame.vertices);
            let verticesUV = parseVertices(frame.verticesUV);
            const sfVertices = {
                triangles: parseTriangles(frame.triangles),
                x: [],
                y: [],
                u: [],
                v: []
            }
            spframe["vertices"] = sfVertices;

            for (let i = 0; i < vertices.length; i += 2) {
                sfVertices.x.push(vertices[i]);
                sfVertices.y.push(vertices[i + 1]);
            }
            for (let i = 0; i < verticesUV.length; i += 2) {
                sfVertices.u.push(verticesUV[i]);
                sfVertices.v.push(verticesUV[i + 1]);
            }
        }

        let name = cc.path.mainFileName(key);
        spriteFrames[name] = spframe;
    }

    return atlas;
}

declare global {
    interface IExtAssetTypeKey {
        plist: "plist"
    }
}
export class UdPlistParser implements aswallow.IAssetParser {
    type: keyof IExtAssetTypeKey = "plist";
    extAssetMgr: aswallow.IExtAssetManager

    parse(path: string, data: any): any {
        const plistAsset = data;

        const texPath = cc.path.changeExtname(path, ".png")
        let texture = this.extAssetMgr.get(texPath);
        if (!texture) {
            console.error(`[PlistParseHandler]texPath:${texPath},资源未加载`);
            return;
        }
        if (!(texture instanceof cc.Texture2D)) {
            const newTex = new cc.Texture2D()
            newTex["_nativeAsset"] = texture;
            newTex["_nativeUrl"] = texPath;
            texture = newTex;
            this.extAssetMgr.cache(texPath, newTex);
        }

        const atlas: cc.SpriteAtlas = parsePlist(plistAsset, texture as any);
        this.extAssetMgr.cache(path, atlas);
        return atlas;
    }
    getDepReqs(req: aswallow.IResRequestItem): aswallow.ResRequestItem[] {
        const reqs: aswallow.ResRequestItem[] = [];
        reqs.push({ url: req.url + ".plist", assetType: "plist" });
        reqs.push({ url: req.url + ".png" });
        return reqs;
    }

}