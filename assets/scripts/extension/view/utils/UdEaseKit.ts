import { UdEaseKind } from "../types/UdEaseKind";

export class UdEaseKit {
	public static GetEaseFun(type: UdEaseKind): (k: number) => number {
		switch (type) {
			case UdEaseKind.Linear:
				return (k: number) => {
					return k;
				};

			case UdEaseKind.InSine:
				return cc.easing.sineIn;

			case UdEaseKind.OutSine:
				return cc.easing.sineOut;

			case UdEaseKind.InOutSine:
				return cc.easing.sineInOut;

			case UdEaseKind.InQuad:
				return cc.easing.quadIn;

			case UdEaseKind.OutQuad:
				return cc.easing.quadOut;

			case UdEaseKind.InOutQuad:
				return cc.easing.quadInOut;

			case UdEaseKind.InCubic:
				return cc.easing.cubicIn;

			case UdEaseKind.OutCubic:
				return cc.easing.cubicOut;

			case UdEaseKind.InOutCubic:
				return cc.easing.cubicInOut;

			case UdEaseKind.InQuart:
				return cc.easing.quartIn;

			case UdEaseKind.OutQuart:
				return cc.easing.quartOut;

			case UdEaseKind.InOutQuart:
				return cc.easing.quartInOut;

			case UdEaseKind.InQuint:
				return cc.easing.quintIn;

			case UdEaseKind.OutQuint:
				return cc.easing.quintOut;

			case UdEaseKind.InOutQuint:
				return cc.easing.quintInOut;

			case UdEaseKind.InExpo:
				return cc.easing.expoIn;

			case UdEaseKind.OutExpo:
				return cc.easing.expoOut;

			case UdEaseKind.InOutExpo:
				return cc.easing.expoInOut;

			case UdEaseKind.InCirc:
				return cc.easing.circIn;

			case UdEaseKind.OutCirc:
				return cc.easing.circOut;

			case UdEaseKind.InOutCirc:
				return cc.easing.circInOut;

			case UdEaseKind.InElastic:
				return cc.easing.elasticIn;

			case UdEaseKind.OutElastic:
				return cc.easing.elasticOut;

			case UdEaseKind.InOutElastic:
				return cc.easing.elasticInOut;

			case UdEaseKind.InBack:
				return cc.easing.backIn;

			case UdEaseKind.OutBack:
				return cc.easing.backOut;

			case UdEaseKind.InOutBack:
				return cc.easing.backInOut;

			case UdEaseKind.InBounce:
				return cc.easing.bounceIn;

			case UdEaseKind.OutBounce:
				return cc.easing.bounceOut;

			case UdEaseKind.InOutBounce:
				return cc.easing.bounceInOut;

			default:
				return null;
		}
	}

	public static GetEaseData(type: UdEaseKind): Object {
		return { easing: this.GetEaseFun(type) };
	}
}
