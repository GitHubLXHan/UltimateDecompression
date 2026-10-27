let moduleMap = {
'src/assets/extension/i18n/i18n.js' () { return require('src/assets/extension/i18n/i18n.js') },
'src/assets/extension/i18n/i18n.min.js' () { return require('src/assets/extension/i18n/i18n.min.js') },
'assets/internal/index.js' () { return require('assets/internal/index.js') },
'assets/resources/index.js' () { return require('assets/resources/index.js') },
'src/scripts/udGame/index.js' () { return require('src/scripts/udGame/index.js') },
'assets/udHinting/index.js' () { return require('assets/udHinting/index.js') },
'assets/udSetting/index.js' () { return require('assets/udSetting/index.js') },
'assets/udToastMessage/index.js' () { return require('assets/udToastMessage/index.js') },
'assets/main/index.js' () { return require('assets/main/index.js') },
// tail
};

window.__cocos_require__ = function (moduleName) {
    let func = moduleMap[moduleName];
    if (!func) {
        throw new Error(`cannot find module ${moduleName}`);
    }
    return func();
};