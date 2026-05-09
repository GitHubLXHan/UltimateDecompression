const Path = require('path');
const Fs = require('fs');

/** 包名 */
const PACKAGE_NAME = 'ccc-quick-add-component';

/** package.json 的路径 */
const packageJsonPath = Path.join(__dirname, 'package.json');

/** package.json 中的菜单项 key */
const menuItemKey = `i18n:MAIN_MENU.package.title/i18n:${PACKAGE_NAME}.name/i18n:${PACKAGE_NAME}.search`;

/**
 * 配置管理器
 */
const ConfigManager = {

    /**
     * 读取配置
     * @returns {{ hotkey: string }}
     */
    read() {
        const jsonData = JSON.parse(Fs.readFileSync(packageJsonPath)),
            config = Object.create(null);
        // 快捷键
        config.hotkey = jsonData['main-menu'][menuItemKey]['accelerator'];
        // Done
        return config;
    },

    /**
     * 保存配置
     * @param {{ hotkey: string }} config 配置
     */
    save(config) {
        const jsonData = JSON.parse(Fs.readFileSync(packageJsonPath)),
            menuItem = jsonData['main-menu'][menuItemKey];
        // 快捷键
        if (menuItem['accelerator'] !== config.hotkey) {
            menuItem['accelerator'] = config.hotkey;
            Fs.writeFileSync(packageJsonPath, JSON.stringify(jsonData, null, 2));
        }
    },

}

module.exports = ConfigManager;
