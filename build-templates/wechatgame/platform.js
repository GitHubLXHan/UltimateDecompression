window.urlKV = {};

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
}


window.UdPlatform = new UdPlatform();
