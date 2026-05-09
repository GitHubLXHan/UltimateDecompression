var getCodeFun = null;
function __i18n(str, args) {
    // console.log("__i18n", str, args);
    var length = args.length;

    var text = "";
    if (getCodeFun) {
        text = getCodeFun(str || "");
    } else {
        text = str;
    }

    if (length > 0) {
        for (var i = 0; i < length; i++) {
            text = text.replace("${" + i + "}", args[i]);
        }
        return text;
    }
    else {
        return text;
    }
};
function i18n(strList) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    // console.log("!!!!!!!!!!" ,typeof(strList), strList)
    if (typeof (strList) == 'string') {
        return __i18n(strList, args);
    }
    else if (typeof (strList) == 'object') {
        var str = strList[0];
        for (var i = 1; i < strList.length; i++) {
            str += "${" + (i - 1) + "}" + strList[i];
        }
        return __i18n(str, args);
    }
};
function setGetCodeFun(fun) {
    getCodeFun = fun;
};

window.i18n = i18n;
window.__i18n = __i18n;
window.setGetCodeFun = setGetCodeFun;
