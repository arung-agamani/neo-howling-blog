"use client";

import { useEffect } from "react";
import {
    applyCachedTheme,
    applyThemeColors,
    clearThemeCss,
} from "./applyThemeColors";
import type { ThemeColors } from "./themeTokens";

interface ThemeResponse {
    data?: {
        overrides?: ThemeColors;
    };
}

/**
 * Applies config-driven shadcn colour overrides to the document.
 *
 * Mounted at the v2 admin root so dialogs and other portals (which render into
 * `document.body`) inherit the same variables.
 */
export default function ThemeColorProvider() {
    useEffect(() => {
        let cancelled = false;

        // Cached theme first, so repeat visits don't flash the defaults.
        applyCachedTheme();

        fetch("/api/v1/config/theme")
            .then((response) =>
                response.ok ? (response.json() as Promise<ThemeResponse>) : null,
            )
            .then((payload) => {
                if (cancelled) return;
                const overrides = payload?.data?.overrides;
                if (overrides) applyThemeColors(overrides);
            })
            .catch(() => {
                // The shipped defaults remain in effect.
            });

        return () => {
            cancelled = true;
            // Do not leak admin colours into other route groups.
            clearThemeCss();
        };
    }, []);

    return null;
}
