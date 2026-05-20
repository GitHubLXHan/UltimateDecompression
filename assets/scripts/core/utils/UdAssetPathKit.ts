import { UdLogHub } from "../../extension/log/UdLogHub";
import { UdPathKit } from "../../extension/utils/UdPathKit";

export class UdAssetPathKit {
	private static _rootPath: string = "resources/";

	private static _prefabPath: string = "prefabs/";
	private static _configPath: string = "config/";
	private static _dataPath: string = "data/";
	private static _texturePath: string = "ui/";
	private static _shadersPath: string = "shaders/";
	private static _skillsCfgPath: string = "skills/";
	private static _materialsPath: string = "materials/";
	private static _fontPath: string = "fonts/";
	private static _shuzhiPath: string = "shuzhi/";
	private static _modelPath: string = "model/";
	private static _commonTexturePath: string = "ui/common/";
	private static _storiesPath: string = "stories/";

	public static ViewPrefabPath: string = "prefabs/view/";
	private static BgmPath = "audio/bgm/";
	private static SoundPath = "audio/sound/";

	private static _activityExtRootPath: string = "ext_ui/activity/";

	public static init(rootPath: string) {
		if (rootPath != null && rootPath.length > 0) {
			this._rootPath = UdPathKit.urlPathFilter(rootPath);
		}
	}

	/**
	 * @description: 资源根目录
	 */
	public static get rootPath(): string {
		return this._rootPath;
	}

	/**
	 * @description: 获取Prefab的路径
	 * @param path
	 */
	public static getPrefabPath(path: string): string {
		return this._rootPath + this._prefabPath + path;
	}

	/**
	 * @description: 获取静态数据的路径
	 * @param path
	 */
	public static getConfigPath(path: string): string {
		return this._rootPath + this._configPath + path;
	}

	/**
	 * @description: 获取数据目录路径
	 * @param path
	 */
	public static geDataPath(path: string): string {
		return this._rootPath + this._dataPath + path;
	}

	/**
	 * @description: 获取字体prefab的路径
	 */
	public static getFontPath(path: string): string {
		return this._rootPath + this._fontPath + path;
	}

	/**
	 * @description: 获取shader的路径
	 */
	public static getShaderPath(path: string): string {
		return this._rootPath + this._shadersPath + path;
	}

	/**
	 * @description: 获取战斗技能的路径
	 */
	public static getSkillPath(path: string): string {
		return this._rootPath + this._skillsCfgPath + path;
	}

	/**
	 * @description: 获取材质的路径
	 */
	public static getMaterialPath(path: string): string {
		return this._rootPath + this._materialsPath + path;
	}

	/**
	 * @description: 获取图片的路径
	 */
	public static getTexturePath(path: string): string {
		return this._rootPath + this._texturePath + path;
	}

	/**
	 * @description: 获取模型的路径
	 */
	public static getModelPath(path: string): string {
		return this._modelPath + path;
	}

	/**
	 * @description: 获取背景音乐的路径
	 */
	public static getBgmPath(path: string): string {
		return this._rootPath + this.BgmPath + path;
	}

	/**
	 * @description: 获取音效的路径
	 */
	public static getSoundPath(path: string): string {
		return this._rootPath + this.SoundPath + path;
	}

	/**
	 * @description: 数值资源路径
	 * @param path
	 */
	public static getShuzhiPath(path: string = ""): string {
		if (path.indexOf(this._shuzhiPath) >= 0) {
			UdLogHub.log("已是资源路径", path);
			return path;
		}
		return this._shuzhiPath + path;
	}

	/**
	 * @description: 获取UI特效的路径
	 */
	public static getOldUIEffectPath(path: string): string {
		return this._rootPath + "spine/ui/" + `${path}/${path}`;
	}

	/**
	 * @description: 获取UI特效的路径
	 */
	public static getNewUIEffectPath(path: string): string {
		return this._rootPath + "spine/newui/" + `${path}/${path}`;
	}

	/**
	 * @description: 获取通用图片路径
	 */
	public static getCommonTexturePath(path: string): string {
		return this._rootPath + this._commonTexturePath + path;
	}

	/**
	 * @description: 获取剧情配置路径
	 */
	public static getStoriesPathPath(path: string): string {
		return this._rootPath + this._storiesPath + path;
	}

	/**获取活动入口及列表图标 */
	public static getActivityEntranceIconPath(path: string): string {
		return this._activityExtRootPath + "entranceIcon/" + path;
	}


	/**获取活动入口及列表图标 */
	public static getActivityExtPath(code: number, path: string): string {
		return this._activityExtRootPath + "ext/" + `${code}/` + path;
	}
}
