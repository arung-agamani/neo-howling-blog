"use client";

import { buildThemeCss } from "./themeTokens";
import type { ThemeColors } from "./themeTokens";

const STYLE_ID = "nhb-theme-colors";
const CACHE_KEY = "nhb-theme-colors-css";

/**
 * Inject the given CSS, replacing any previous theme. The stylesheet is also
 * cached so the next page load can apply the theme before the config request
 * returns (no flash of default colours).
 */
export function applyThemeCss(css: string): void {
    if (typeof document === "undefined") return;

    let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!style) {
        style = document.createElement("style");
        style.id = STYLE_ID;
        // Appending to head places it after the base stylesheet, so these
        // variables win the cascade.
        document.head.appendChild(style);
    }
    style.textContent = css;

    try {
        window.localStorage.setItem(CACHE_KEY, css);
    } catch {
        // Storage can be unavailable (private mode); theming still applies.
    }
}

/** Apply colour overrides as CSS variables for light and dark mode. */
export function applyThemeColors(colors: ThemeColors): void {
    applyThemeCss(buildThemeCss(colors));
}

/** Remove the injected stylesheet, e.g. when leaving the themed area. */
export function clearThemeCss(): void {
    if (typeof document === "undefined") return;
    document.getElementById(STYLE_ID)?.remove();
}

/** Apply the last known theme immediately, before any network request. */
export function applyCachedTheme(): void {
    try {
        const css = window.localStorage.getItem(CACHE_KEY);
        if (css) applyThemeCss(css);
    } catch {
        // Ignore storage failures.
    }
}
