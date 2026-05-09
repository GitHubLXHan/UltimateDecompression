/**
 * @description: 
 * @author: Zeros
 */
export class Mathf {
    public static clamp(value: number, min: number, max: number): number {
        return Math.max(Math.min(value, max), min);
    }

    public static isInteger(value: number): boolean {
        return (value - Math.floor(value)) == 0;
    }

    /**
     * 四阶贝塞尔曲线公式
     * @param p0   起始点
     * @param p1   控制点1
     * @param p2   控制点2
     * @param p3   终止点
     * @param t
     */
    public static bezier(p0: cc.Vec3, p1: cc.Vec3, p2: cc.Vec3, p3: cc.Vec3, t: number): cc.Vec3 {
        let P0: cc.Vec3 = p0.clone().multiplyScalar(Math.pow((1 - t), 3));
        let P1: cc.Vec3 = p1.clone().multiplyScalar(3 * t * Math.pow((1 - t), 2));
        let P2: cc.Vec3 = p2.clone().multiplyScalar(3 * Math.pow(t, 2) * (1 - t));
        let P3: cc.Vec3 = p3.clone().multiplyScalar(Math.pow(t, 3));
        return P0.add(P1.add(P2.add(P3)));
    }

    /**
     * 二阶贝塞尔曲线公式
     * @param p0   起始点
     * @param p1   控制点1
     * @param p2   终止点
     * @param t
     */
    public static bezier2(p0: cc.Vec3, p1: cc.Vec3, p2: cc.Vec3, t: number): cc.Vec3 {
        let P0: cc.Vec3 = p0.clone().multiplyScalar(Math.pow((1 - t), 2));
        let P1: cc.Vec3 = p1.clone().multiplyScalar(2 * t * (1 - t));
        let P2: cc.Vec3 = p2.clone().multiplyScalar(Math.pow(t, 2));
        return P0.add(P1.add(P2));
    }

    /**
     * @description: 取整并保留指定小数位
     * @param {number} value
     * @param {number} len
     */
    public static round(value: number, len: number = 0) {
        if (len <= 0) {
            return Math.round(value);
        }

        let fix = Math.pow(10, len);
        return Math.round(value * fix) / fix;
    }

    /**
     * @description: 取整并保留指定小数位
     * @param {number} value
     * @param {number} len
     */
    public static floor(value: number, len: number = 0) {
        let fix = Math.pow(10, len);
        return Math.floor(Math.round(value * fix)) / fix;

    }

    /**
     * @description: 取整并保留有效位数
     * @param {number} value
     * @param {number} len
     */
    public static limitFloor(value: number, len: number) {
        let valLen = Math.floor(Math.log10(value) + 1);
        if (valLen > len) {
            value = Math.floor(value / Math.pow(10, valLen - len));
        } else {
            len = len - valLen;
        }



        let fix = Math.pow(10, len);
        return Math.floor(value * fix) / fix;
    }

    /**
     * @description: 值是否是2次幂
     * @param {number} value
     */
    public static isPow2(value: number): boolean {
        if (value == null || isNaN(value) || value <= 0) {
            return false;
        }

        let log2 = Math.log2(value);

        if (log2 - Math.floor(log2) > 0) {
            return false;
        }
  
        return true;
    }

    public static lerp(a: number, b: number, t: number): number {
        return a + t * (b - a);
    }

    public static lerpVec2(a: cc.Vec2, b: cc.Vec2, t: number, source: cc.Vec2 = null): cc.Vec2 {
        if (source == null) {
            source = new cc.Vec2();
        }

        source.set(a);
        return source.addSelf(b.sub(a).mul(t));
    }

    public static lerpVec3(a: cc.Vec3, b: cc.Vec3, t: number, source: cc.Vec3 = null): cc.Vec3 {
        if (source == null) {
            source = new cc.Vec3();
        }

        source.set(a);
        return source.addSelf(b.sub(a).mul(t));
    }

    /* 返回顶角在o点，起始边为os，终止边为oe的夹角(单位：弧度)
    角度小于pi，返回正值，角度大于pi，返回负值，可以用于求线段之间的夹角
    */
    public static angle(o: cc.Vec2, s: cc.Vec2, e: cc.Vec2) {
        let a1 = Math.atan2(s.y - o.y, s.x - o.x);
        let a2 = Math.atan2(e.y - o.y, e.x - o.x);
        let ret = a2 - a1;
        if (ret < -1.0 * Math.PI)
            ret += 2 * Math.PI;

        if (ret > Math.PI)
            ret -= 2 * Math.PI;
        return ret;
    }
}