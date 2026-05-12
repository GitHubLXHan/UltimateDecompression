import { EaseType } from "../types/EaseType";

export class EaseUtils {
	public static GetEaseFun(type: EaseType): (k: number) => number {
		switch (type) {
			case EaseType.Linear:
				return (k: number) => {
					return k;
				};

			case EaseType.InSine:
				return cc.easing.sineIn;

			case EaseType.OutSine:
				return cc.easing.sineOut;

			case EaseType.InOutSine:
				return cc.easing.sineInOut;

			case EaseType.InQuad:
				return cc.easing.quadIn;

			case EaseType.OutQuad:
				return cc.easing.quadOut;

			case EaseType.InOutQuad:
				return cc.easing.quadInOut;

			case EaseType.InCubic:
				return cc.easing.cubicIn;

			case EaseType.OutCubic:
				return cc.easing.cubicOut;

			case EaseType.InOutCubic:
				return cc.easing.cubicInOut;

			case EaseType.InQuart:
				return cc.easing.quartIn;

			case EaseType.OutQuart:
				return cc.easing.quartOut;

			case EaseType.InOutQuart:
				return cc.easing.quartInOut;

			case EaseType.InQuint:
				return cc.easing.quintIn;

			case EaseType.OutQuint:
				return cc.easing.quintOut;

			case EaseType.InOutQuint:
				return cc.easing.quintInOut;

			case EaseType.InExpo:
				return cc.easing.expoIn;

			case EaseType.OutExpo:
				return cc.easing.expoOut;

			case EaseType.InOutExpo:
				return cc.easing.expoInOut;

			case EaseType.InCirc:
				return cc.easing.circIn;

			case EaseType.OutCirc:
				return cc.easing.circOut;

			case EaseType.InOutCirc:
				return cc.easing.circInOut;

			case EaseType.InElastic:
				return cc.easing.elasticIn;

			case EaseType.OutElastic:
				return cc.easing.elasticOut;

			case EaseType.InOutElastic:
				return cc.easing.elasticInOut;

			case EaseType.InBack:
				return cc.easing.backIn;

			case EaseType.OutBack:
				return cc.easing.backOut;

			case EaseType.InOutBack:
				return cc.easing.backInOut;

			case EaseType.InBounce:
				return cc.easing.bounceIn;

			case EaseType.OutBounce:
				return cc.easing.bounceOut;

			case EaseType.InOutBounce:
				return cc.easing.bounceInOut;

			default:
				return null;
		}
	}

	public static GetEaseData(type: EaseType): Object {
		return { easing: this.GetEaseFun(type) };
	}
}
