export enum BtnEventType {
    OnTouchTap,//点击（按下并在显示对象区域内松开）
    OnTouchEnd,//松开
    OnTouchStart,//按下
    OnTouchReleaseOutSide,//取消（按下后没有在按钮内松开）
    DarkViewShowDone,//黑底出现播放完毕
    DarkViewHideDone,//黑底消失播放完毕
}