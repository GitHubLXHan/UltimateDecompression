export class UdColorKit {
	public static hexToCCColor(hexColor: number) {
		return new cc.Color(hexColor >> 16 & 0xff, hexColor >> 8 & 0xff, hexColor & 0xff);
	}

	/**
	 * @description: 获取一张动态填充的贴图
	 */
	public static generateTexture(width: number = 1, height: number = 1, color: cc.Color = cc.Color.WHITE): cc.Texture2D {
		let buffSize = 4 * width * height;
		let u8a = new Uint8Array(buffSize);

		let size = width * height;
		for (let i = 0; i < size; i++) {
			u8a[i + 0] = color.r;
			u8a[i + 1] = color.g;
			u8a[i + 2] = color.b;
			u8a[i + 3] = color.a;
		}

		let t2d = new cc.Texture2D();
		t2d.initWithData(u8a, cc.Texture2D.PixelFormat.RGBA8888, width, height);
		return t2d;
	}
}
