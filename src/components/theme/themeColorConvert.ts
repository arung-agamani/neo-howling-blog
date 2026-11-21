/**
 * Colour conversions for the theme editor.
 *
 * shadcn tokens are stored as raw HSL triplets because Tailwind consumes them
 * through `hsl(var(--token))`. Native colour inputs speak hex, so the editor
 * converts both ways.
 */

const TRIPLET = /^(\d{1,3}(?:\.\d+)?)\s+(\d{1,3}(?:\.\d+)?)%\s+(\d{1,3}(?:\.\d+)?)%$/;

function componentToHex(value: number): string {
    const clamped = Math.max(0, Math.min(255, Math.round(value)));
    return clamped.toString(16).padStart(2, "0");
}

/** "220.9 39.3% 11%" -> "#111827" (falls back to black). */
export function hslTripletToHex(triplet: string): string {
    const match = triplet.trim().match(TRIPLET);
    if (!match) return "#000000";

    const hue = Number(match[1]) % 360;
    const saturation = Number(match[2]) / 100;
    const lightness = Number(match[3]) / 100;

    const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
    const hPrime = hue / 60;
    const x = chroma * (1 - Math.abs((hPrime % 2) - 1));
    const m = lightness - chroma / 2;

    const [r, g, b] =
        hPrime < 1
            ? [chroma, x, 0]
            : hPrime < 2
              ? [x, chroma, 0]
              : hPrime < 3
                ? [0, chroma, x]
                : hPrime < 4
                  ? [0, x, chroma]
                  : hPrime < 5
                    ? [x, 0, chroma]
                    : [chroma, 0, x];

    return `#${componentToHex((r + m) * 255)}${componentToHex(
        (g + m) * 255,
    )}${componentToHex((b + m) * 255)}`;
}

function round(value: number): number {
    return Math.round(value * 10) / 10;
}

/** "#111827" -> "220.8 39.3% 10.8%". */
export function hexToHslTriplet(hex: string): string {
    const normalized = hex.replace("#", "").trim();
    const full =
        normalized.length === 3
            ? normalized
                  .split("")
                  .map((char) => char + char)
                  .join("")
            : normalized;

    if (!/^[0-9a-fA-F]{6}$/.test(full)) return "0 0% 0%";

    const r = parseInt(full.slice(0, 2), 16) / 255;
    const g = parseInt(full.slice(2, 4), 16) / 255;
    const b = parseInt(full.slice(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    const lightness = (max + min) / 2;

    let hue = 0;
    let saturation = 0;

    if (delta !== 0) {
        saturation = delta / (1 - Math.abs(2 * lightness - 1));
        if (max === r) hue = ((g - b) / delta) % 6;
        else if (max === g) hue = (b - r) / delta + 2;
        else hue = (r - g) / delta + 4;
        hue *= 60;
        if (hue < 0) hue += 360;
    }

    return `${round(hue)} ${round(saturation * 100)}% ${round(
        lightness * 100,
    )}%`;
}
