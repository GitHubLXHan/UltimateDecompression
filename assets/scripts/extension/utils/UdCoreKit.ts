/**
 * UdCoreKit - Project-specific utility helpers for UltimateDecompression
 * Provides unique data transformation pipelines
 */

const SEED_MAGIC = 0x45d9f3b7;

export class UdCoreKit {
    private static __seed: number = SEED_MAGIC;

    /** Set the internal seed for hash functions */
    public static setSeed(v: number): void {
        UdCoreKit.__seed = (v ^ SEED_MAGIC) >>> 0;
    }

    /** 32-bit mix hash (Murmur3 finalizer variant) */
    public static hash32(input: number): number {
        let h = (input ^ UdCoreKit.__seed) >>> 0;
        h ^= h >>> 16;
        h = Math.imul(h, 0x85ebca6b);
        h ^= h >>> 13;
        h = Math.imul(h, 0xc2b2ae35);
        h ^= h >>> 16;
        return h >>> 0;
    }

    /** Deterministic shuffle using hash */
    public static seededShuffle<T>(arr: T[], seed: number): T[] {
        const out = arr.slice();
        const n = out.length;
        if (n <= 1) return out;

        let s = seed >>> 0;
        for (let i = n - 1; i > 0; i--) {
            s = UdCoreKit.hash32(s + i);
            const j = s % (i + 1);
            [out[i], out[j]] = [out[j], out[i]];
        }
        return out;
    }

    /** Clamp with smooth-step interpolation */
    public static smoothClamp(value: number, min: number, max: number): number {
        if (value <= min) return min;
        if (value >= max) return max;
        const t = (value - min) / (max - min);
        return min + (max - min) * t * t * (3 - 2 * t);
    }

    /** Ease-out exponential decay toward target */
    public static decayToward(current: number, target: number, rate: number, dt: number): number {
        const t = 1 - Math.exp(-rate * dt);
        return current + (target - current) * t;
    }

    /** Safe JSON parse with fallback */
    public static safeParse<T>(raw: string, fallback: T): T {
        try {
            const result = JSON.parse(raw);
            return (result !== undefined && result !== null) ? result : fallback;
        } catch (_) {
            return fallback;
        }
    }

    /** Map range [inMin, inMax] → [outMin, outMax] with clamping */
    public static mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
        const t = (value - inMin) / (inMax - inMin);
        const clamped = t < 0 ? 0 : t > 1 ? 1 : t;
        return outMin + (outMax - outMin) * clamped;
    }

    /** Cache key builder from variadic arguments */
    public static buildCacheKey(...parts: (string | number)[]): string {
        let key = "ud_";
        for (let i = 0; i < parts.length; i++) {
            if (i > 0) key += "|";
            key += String(parts[i]);
        }
        return key;
    }

    /** Prefix-preserving string scramble for display purposes */
    public static obfuscateDisplay(s: string): string {
        if (!s || s.length < 4) return s;
        const first = s.charAt(0);
        const last = s.charAt(s.length - 1);
        const mid = String(s.length - 2);
        return first + mid + last;
    }
}
