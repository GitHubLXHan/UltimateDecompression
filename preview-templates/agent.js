/*
 * @description: 
 * @author: Zeros
 */
(function () {
    'use strict';

    //渠道标识
    window.agent = {
        "AgentCode": "test",
        "AgentName": "内网-未知",
        "HttpSerever": "http://192.168.6.130:8888/sy_api/game_api.php",
        "HttpUnitServer": "http://192.168.6.130:8888/sy_api",
        "IsDebug": true,
        "RemoteResHost": "http://192.168.6.130:7070/binghu_web/oversea_latest_global",
        "JSVer": 2,
        "VersionTime": "20210720 15:31:46",
        "PtId": 1,
        "isHttps": false,
        "version": "online",
        "thirdUserSystem": 0,
        "checkConfig": {

        }
    }
    console.log("loading agent", window.agent)

})();