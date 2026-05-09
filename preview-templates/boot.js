
(function () {
    'use strict';

    var isMobile = function () {
        var check = false;
        (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
        return check;
    };

    // init toolbar
    // =======================

    var designWidth = _CCSettings.designWidth;
    var designHeight = _CCSettings.designHeight;

    var rotated = false;
    // var paused = false;
    var canvas = document.getElementById('GameCanvas');

    // coockie
    // =======================
    function setCookie(name, value, days) {
        days = days || 30;              //cookie will be saved for 30 days
        var expires = new Date();
        expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
        document.cookie = name + '=' + encodeURIComponent(value) + ';expires=' + expires.toGMTString();
    }

    function getCookie(name) {
        var arr = document.cookie.match(new RegExp('(^| )' + name + '=([^;]*)(;|$)'));
        if (arr !== null) return (arr[2]);
        return null;
    }

    function isFullScreen() {
        return true;
    }

    function getEmulatedScreenSize() {
        return {
            width: 0,
            height: 0
        };
    }

    function showSplash() {
        var LOGO_IMG_L_W = 416;
        var LOGO_IMG_L_H = 87;
        var LOGO_SIZE = 0.4;

        var size = isFullScreen() ? document.documentElement.getBoundingClientRect() : getEmulatedScreenSize();
        var splash = document.getElementById('splash');
        var progressBar = splash.querySelector('.progress-bar span');
        splash.style.width = size.width + 'px';
        splash.style.height = size.height + 'px';
        var marginTop;
        if (size.width < size.height) {
            // portrait
            splash.style.backgroundImage = 'url("app/editor/static/img/logo_portrait.png")';
            splash.style.backgroundSize = '30%';
            marginTop = (size.height - size.width * (1 - LOGO_SIZE)) / 2;
        }
        else {
            var logoDisplayH = size.width * LOGO_SIZE / LOGO_IMG_L_W * LOGO_IMG_L_H;
            marginTop = logoDisplayH / 2 * 1.47;
        }
        progressBar.parentElement.style.marginTop = marginTop + 'px';
        splash.style.display = '';
        progressBar.style.width = '0%';

        var div = document.getElementById('GameDiv');
        if (div) {
            div.style.visibility = 'visible';
        }

        if (!isMobile()) {
            // make the splash screen in center
            canvas.width = size.width;
            canvas.height = size.height;
        }
    }

    // init options
    function initPreviewOptions() {
        showSplash();
    }

    initPreviewOptions();

    window.onload = function () {
        //此方法可以加载json
        // loadAgent()
        if (window.__quick_compile_engine__) {
            window.__quick_compile_engine__.load(onload);
        }
        else {
            onload();
        }
    };

    window.loadMain = function (cb) {
        if (_CCSettings) {
            let jsList = [];
            _CCSettings.jsList.forEach(function (x) { 
                if (x.indexOf("i18n") == -1) {
                    jsList.push('/plugins/' + x);
                }
            })
            cc.assetManager.loadScript(jsList, cb);
            // cc.assetManager.loadScript(_CCSettings.jsList.map(function (x) { return '/plugins/' + x; }), cb);
            _CCSettings = undefined;
        } else {
            if (cb) {
                cb();
            }
        }
    }

    function onload() {

        // socket
        // =======================

        // jshint camelcase:false

        var socket = window.__socket_io__();
        socket.on('browser:reload', function () {
            window.location.reload();
        });
        socket.on('browser:confirm-reload', function () {
            var r = confirm('Reload?');
            if (r) {
                window.location.reload();
            }
        });

        function updateResolution() {
            var size = isFullScreen() ? document.documentElement.getBoundingClientRect() : getEmulatedScreenSize();
            var gameDiv = document.getElementById('GameDiv');
            gameDiv.style.width = size.width + 'px';
            gameDiv.style.height = size.height + 'px';

            cc.view.setCanvasSize(size.width, size.height);
        }

        // init engine
        // =======================

        var engineInited = false;

        if (isFullScreen()) {
            window.addEventListener('resize', updateResolution);
        }

        var showFPS = getCookie('showFPS');
        // FPS is on by default
        showFPS = showFPS === null ? true : showFPS === 'true';

        var onStart = function () {
            // resize canvas
            if (!isFullScreen()) {
                updateResolution();
            }
            updateResolution();

            cc.view.enableRetina(true);
            cc.view.resizeWithBrowserSize(true);

            // Loading splash scene
            var splash = document.getElementById('splash');
            var progressBar = splash.querySelector('.progress-bar span');
            showSplash();

            cc.director.once(cc.Director.EVENT_AFTER_SCENE_LAUNCH, function () {
                splash.style.display = 'none';
                checkEmptyScene();
            });

            cc.game.pause();

            // init assets
            engineInited = true;

            cc.assetManager.loadAny({ url: 'preview-scene.json', __isNative__: false }, null, function (finish, totalCount) {
                var percent = 100 * finish / totalCount;
                if (progressBar) {
                    progressBar.style.width = percent.toFixed(2) + '%';
                }
            }, function (err, sceneAsset) {
                if (err) {
                    console.error(err.message, err.stack);
                    return;
                }
                var scene = sceneAsset.scene;
                scene._name = sceneAsset._name;
                // HACK: Change key to uuid from url
                cc.assetManager.dependUtil._depends.add(scene._id, cc.assetManager.dependUtil._depends.get('preview-scene.json'));
                cc.director.runSceneImmediate(scene, function () {
                    // play game
                    cc.game.resume();
                });
            });

            // purge
            //noinspection JSUnresolvedVariable
            // _CCSettings = undefined;
        };

        var option = {
            id: canvas,
            debugMode: 0,
            showFPS: showFPS,
            frameRate: 60,
            groupList: _CCSettings.groupList,
            collisionMatrix: _CCSettings.collisionMatrix,
        };

        cc.assetManager.init({
            importBase: 'assets/others/import',
            nativeBase: 'assets/others/native'
        });

        // var RESOURCES = cc.AssetManager.BuiltinBundleName.RESOURCES;
        var INTERNAL = cc.AssetManager.BuiltinBundleName.INTERNAL;
        var MAIN = cc.AssetManager.BuiltinBundleName.MAIN;
        // var LOGIN = "login"
        // var bundleRoot = [INTERNAL, LOGIN];
        var bundleRoot = [INTERNAL];
        // _CCSettings.hasResourcesBundle && bundleRoot.push(RESOURCES);

        var count = 0;
        function cb(err) {
            if (err) return console.error(err);
            count++;
            if (count === bundleRoot.length) {
                cc.assetManager.loadBundle(MAIN, function (err) {
                    if (!err) cc.game.run(option, onStart);
                });
            }
        }

        // load plugins
		if (_CCSettings) {
			let jsUrl = null;
			for (let i = 0, len = _CCSettings.jsList.length; i < len; i++) {
				let jsUrlTmp = _CCSettings.jsList[i];
				if (jsUrlTmp.indexOf("i18n") != -1) {
					jsUrl = "/plugins/" + jsUrlTmp;
					break;
				}
			}
            
            cc.assetManager.loadScript(jsUrl, () => {
                // load bundles
                for (var i = 0; i < bundleRoot.length; i++) {
                    cc.assetManager.loadBundle(bundleRoot[i], cb);
                }
            })
        } else {
            console.err("_CCSettings 为空");
        }

    };

    function checkEmptyScene() {
        var scene = cc.director.getScene();
        if (scene) {
            if (scene.children.length > 1) {
                return;
            }
            if (scene.children.length === 1) {
                var node = scene.children[0];
                if (node.children.length > 0) {
                    return;
                }
                if (node._components.length > 1) {
                    return;
                }
                if (node._components.length > 0 && !(node._components[0] instanceof cc.Canvas)) {
                    return;
                }
            }
        }
        document.getElementById('bulletin').style.display = 'block';
        document.getElementById('sceneIsEmpty').style.display = 'block';
    }


    function loadAgent() {
        var now = Date.now();
        var xhr = new XMLHttpRequest();
        xhr.open('GET', `agent.json?v=${now}`, true);
        xhr.addEventListener("load", function () {
            var agent = JSON.parse(xhr.response);
            window.agent = agent
        });
        xhr.send(null);

    }
})();

