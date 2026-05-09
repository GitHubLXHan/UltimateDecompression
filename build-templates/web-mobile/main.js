window.boot = function () {
    var settings = window._CCSettings;
    // window._CCSettings = undefined;
    var onProgress = null;
    
    var RESOURCES = cc.AssetManager.BuiltinBundleName.RESOURCES;
    var INTERNAL = cc.AssetManager.BuiltinBundleName.INTERNAL;
    var MAIN = cc.AssetManager.BuiltinBundleName.MAIN;
    var LOGIN = "login"

    function setLoadingDisplay () {
        // Loading splash scene
        var splash = document.getElementById('splash');
        var progressBar = splash.querySelector('.progress-bar span');
        onProgress = function (finish, total) {
            var percent = 100 * finish / total;
            if (progressBar) {
                progressBar.style.width = percent.toFixed(2) + '%';
            }
        };
        splash.style.display = 'block';
        progressBar.style.width = '0%';

        cc.director.once(cc.Director.EVENT_AFTER_SCENE_LAUNCH, function () {
            splash.style.display = 'none';
        });
    }

    var onStart = function () {

        cc.view.enableRetina(true);
        cc.view.resizeWithBrowserSize(true);

        if (cc.sys.isBrowser) {
            setLoadingDisplay();
        }

        if (cc.sys.isMobile) {
            if (settings.orientation === 'landscape') {
                cc.view.setOrientation(cc.macro.ORIENTATION_LANDSCAPE);
            }
            else if (settings.orientation === 'portrait') {
                cc.view.setOrientation(cc.macro.ORIENTATION_PORTRAIT);
            }
            cc.view.enableAutoFullScreen([
                cc.sys.BROWSER_TYPE_BAIDU,
                cc.sys.BROWSER_TYPE_BAIDU_APP,
                cc.sys.BROWSER_TYPE_WECHAT,
                cc.sys.BROWSER_TYPE_MOBILE_QQ,
                cc.sys.BROWSER_TYPE_MIUI,
                cc.sys.BROWSER_TYPE_HUAWEI,
                cc.sys.BROWSER_TYPE_UC,
            ].indexOf(cc.sys.browserType) < 0);
        }

        // Limit downloading max concurrent task to 2,
        // more tasks simultaneously may cause performance draw back on some android system / browsers.
        // You can adjust the number based on your own test result, you have to set it before any loading process to take effect.
        if (cc.sys.isBrowser && cc.sys.os === cc.sys.OS_ANDROID) {
            cc.assetManager.downloader.maxConcurrency = 2;
            cc.assetManager.downloader.maxRequestsPerFrame = 2;
        }

        var launchScene = settings.launchScene;
        var bundle = cc.assetManager.bundles.find(function (b) {
            return b.getSceneInfo(launchScene);
        });
        
        if (!bundle) {
            console.error("Cannot find bundle for launch scene:", launchScene);
            return;
        }

        bundle.loadScene(launchScene, null, onProgress,
            function (err, scene) {
                if (!err) {
                    cc.director.runSceneImmediate(scene);
                    if (cc.sys.isBrowser) {
                        // show canvas
                        var canvas = document.getElementById('GameCanvas');
                        canvas.style.visibility = '';
                        var div = document.getElementById('GameDiv');
                        if (div) {
                            div.style.backgroundImage = '';
                        }
                        console.log('Success to load scene: ' + launchScene);
                    }
                }
            }
        );

    };

    var option = {
        id: 'GameCanvas',
        debugMode: settings.debug ? cc.debug.DebugMode.INFO : cc.debug.DebugMode.ERROR,
        showFPS: settings.debug,
        frameRate: 60,
        groupList: settings.groupList,
        collisionMatrix: settings.collisionMatrix,
    };

    cc.assetManager.init({ 
        bundleVers: settings.bundleVers,
        remoteBundles: settings.remoteBundles,
        server: settings.server
    });
    
    var bundleRoot = [INTERNAL, LOGIN];
    // var bundleRoot = [INTERNAL];
    // settings.hasResourcesBundle && bundleRoot.push(RESOURCES);

    function loadRootBundles() {
        var finished = 0;
        var total = bundleRoot.length;
        function done() {
            finished++;
            if (finished === total) {
                cc.assetManager.loadBundle(MAIN, function (err) {
                    if (!err) cc.game.run(option, onStart);
                });
            }
        }

        for (var i = 0; i < bundleRoot.length; i++) {
            (function (bundleName) {
                cc.assetManager.loadBundle(bundleName, function (err) {
                    if (err) {
                        var isMissingLogin = bundleName === LOGIN;
                        if (!isMissingLogin) {
                            console.error(err.message, err.stack);
                            return;
                        }
                        console.warn("Optional bundle missing:", LOGIN);
                    }
                    done();
                });
            });
        }
    }
    // // cc.assetManager.loadScript(settings.jsList.map(function (x) { return 'src/' + x;}), cb);
    // for (var i = 0; i < bundleRoot.length; i++) {
    //     cc.assetManager.loadBundle(bundleRoot[i], cb);
    // }

    // load plugins
    if (_CCSettings) {
        let jsUrl = null;
        const pluginList = (_CCSettings && _CCSettings.jsList) || [];
        for (let i = 0, len = pluginList.length; i < len; i++) {
            let jsUrlTmp = pluginList[i];
            if (jsUrlTmp.indexOf("i18n") !== -1) {
                jsUrl = "src/" + jsUrlTmp;
                break;
            }
        }

        if (jsUrl) {
            cc.assetManager.loadScript(jsUrl, function () {
                loadRootBundles();
            });
        } else {
            loadRootBundles();
        }
    } else {
        console.error("_CCSettings 为空");
    }
};


window.loadMain =function(cb){
    if(window._CCSettings){
        var settings = window._CCSettings;
        // window._CCSettings = undefined;
        // cc.assetManager.loadScript(settings.jsList.map(function (x) { return 'src/' + x;}), cb);
        let jsList = [];
        (settings.jsList || []).forEach(function (x) { 
            if (x.indexOf("i18n") == -1) {
                jsList.push('src/' + x);
            }
        })
        cc.assetManager.loadScript(jsList, cb);
    }else{
        if (cb){
            cb();
        }
    }
}

if (window.jsb) {
    var isRuntime = (typeof loadRuntime === 'function');
    if (isRuntime) {
        require('src/settings.js');
        require('src/cocos2d-runtime.js');
        if (CC_PHYSICS_BUILTIN || CC_PHYSICS_CANNON) {
            require('src/physics.js');
        }
        require('jsb-adapter/engine/index.js');
    }
    else {
        require('src/settings.js');
        require('src/cocos2d-jsb.js');
        if (CC_PHYSICS_BUILTIN || CC_PHYSICS_CANNON) {
            require('src/physics.js');
        }
        require('jsb-adapter/jsb-engine.js');
    }

    cc.macro.CLEANUP_IMAGE_CACHE = true;
    window.boot();
}