window.urlKV = {};

// 微信游戏圈 openlink 参数
const GAME_CLUB_OPEN_LINK = "-SSEykJvFV3pORt5kTNpSytYPCIC7VFntqkh5bbad8i-euAE07eCuN1WzskzaUfuPHrLGxbPRl6jOb-WyD_3VHn_677NuyspxQ1qHe50Kd8lcg3JS6sCvzpyravkCjakvn7_Thjix5DaPa3ccGcIZAkOmGWckwvRB23oig7DS1JqDBTckYGkIe4yjc5tWNGFkI48VH_nQkzTJ-Sd4omE8HDzIs5VKAOEXAZHdnO8LZFIWMprYoQe4M8gtH8-1Dsm5XH_Y69RmRn8xWM1VwH0My8gYovDeHiRBaRDWQ5juQAlwoM98ExKhUkSMPP0WBTre25iNkwn485_BDVpHWCDGg";

class UdPlatform {
  constructor() {
    let wxSystemInfo = wx.getSystemInfoSync();
    let platform = wxSystemInfo.platform;

    if (platform == "windows") {
      window.urlKV["statusBarHeight"] = 0;
    } else {
      window.urlKV["statusBarHeight"] = 140;
      if (wx.getMenuButtonBoundingClientRect) {
        let info = wx.getMenuButtonBoundingClientRect();
        console.log("getMenuButtonBoundingClientRect", info);
        window.urlKV["statusBarHeight"] =
          ((info.height + info.top) * 720) / wxSystemInfo.screenWidth;
        window.urlKV["capsuleButtonLeft"] =
          ((wxSystemInfo.screenWidth - info.left) * 720) / wxSystemInfo.screenWidth;
      } else {
        console.log("当前微信版本过低，无法适配刘海屏");
        window.urlKV["statusBarHeight"] = 0;
      }
    }
  }

  // 打开微信游戏圈
  openGameClub() {
    if (typeof wx === "undefined") {
      console.log("当前环境不支持游戏圈");
      return;
    }

    // 新版接口（基础库 3.6.7+）：wx.createPageManager + openlink
    if (wx.createPageManager) {
      if (!this._pageManager) {
        this._pageManager = wx.createPageManager();
      }
      const pageManager = this._pageManager;
      pageManager
        .load({ openlink: GAME_CLUB_OPEN_LINK })
        .then(function () {
          pageManager.show();
        })
        .catch(function (err) {
          console.log("openGameClub fail", err);
        });
      return;
    }

    // 旧版接口（基础库 2.25.3+）：wx.openGameClub，url 需带 openlink= 前缀
    if (wx.openGameClub) {
      wx.openGameClub({
        url: "openlink=" + GAME_CLUB_OPEN_LINK,
        success: function () {
          console.log("openGameClub success");
        },
        fail: function (res) {
          console.log("openGameClub fail", res);
        }
      });
      return;
    }

    console.log("当前微信版本过低，不支持游戏圈");
  }
}


window.UdPlatform = new UdPlatform();
