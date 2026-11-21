import { z } from "zod";
import prisma from "@/utils/prisma";
import { ConfigType } from "@prisma/client";
import {
    HSL_TRIPLET_PATTERN,
    THEME_COLOR_TOKENS,
} from "@/components/theme/themeTokens";
import type {
    ThemeColorMap,
    ThemeColorToken,
    ThemeColors,
} from "@/components/theme/themeTokens";

/** Config keys holding per-mode overrides. */
export const THEME_CONFIG_KEYS = {
    light: "theme.colors.light",
    dark: "theme.colors.dark",
} as const;

/** Values shipped in `(user)/globals.css`; the reference for "reset". */
export const DEFAULT_THEME_COLORS: ThemeColors = {
    light: {
        background: "0 0% 100%",
        foreground: "224 71.4% 4.1%",
        card: "0 0% 100%",
        "card-foreground": "224 71.4% 4.1%",
        popover: "0 0% 100%",
        "popover-foreground": "224 71.4% 4.1%",
        primary: "220.9 39.3% 11%",
        "primary-foreground": "210 20% 98%",
        secondary: "220 14.3% 95.9%",
        "secondary-foreground": "220.9 39.3% 11%",
        muted: "220 14.3% 95.9%",
        "muted-foreground": "220 8.9% 46.1%",
        accent: "220 14.3% 95.9%",
        "accent-foreground": "220.9 39.3% 11%",
        destructive: "0 84.2% 60.2%",
        "destructive-foreground": "210 20% 98%",
        border: "220 13% 91%",
        input: "220 13% 91%",
        ring: "224 71.4% 4.1%",
    },
    dark: {
        background: "224 71.4% 4.1%",
        foreground: "210 20% 98%",
        card: "224 71.4% 4.1%",
        "card-foreground": "210 20% 98%",
        popover: "224 71.4% 4.1%",
        "popover-foreground": "210 20% 98%",
        primary: "210 20% 98%",
        "primary-foreground": "220.9 39.3% 11%",
        secondary: "215 27.9% 16.9%",
        "secondary-foreground": "210 20% 98%",
        muted: "215 27.9% 16.9%",
        "muted-foreground": "217.9 10.6% 64.9%",
        accent: "215 27.9% 16.9%",
        "accent-foreground": "210 20% 98%",
        destructive: "0 62.8% 30.6%",
        "destructive-foreground": "210 20% 98%",
        border: "215 27.9% 16.9%",
        input: "215 27.9% 16.9%",
        ring: "212.7 26.8% 83.9%",
    },
};

const ColorMapSchema = z
    .record(z.string(), z.string().regex(HSL_TRIPLET_PATTERN))
    .refine(
        (map) =>
            Object.keys(map).every((token) =>
                (THEME_COLOR_TOKENS as readonly string[]).includes(token),
            ),
        { message: "Unknown colour token" },
    );

const StoredSchema = ColorMapSchema;

const PatchSchema = z.object({
    light: z
        .record(z.string(), z.string().regex(HSL_TRIPLET_PATTERN).nullable())
        .optional(),
    dark: z
        .record(z.string(), z.string().regex(HSL_TRIPLET_PATTERN).nullable())
        .optional(),
});

export type ThemeConfigPatch = z.infer<typeof PatchSchema>;

export interface ThemeConfigResolution {
    /** Values to inject as CSS variables (customised tokens only). */
    overrides: ThemeColors;
    /** Defaults followed by overrides — what the UI shows. */
    effective: ThemeColors;
    defaults: ThemeColors;
}

function merge(
    defaults: ThemeColorMap,
    overrides: ThemeColorMap,
): ThemeColorMap {
    return { ...defaults, ...overrides };
}

function warnInvalid(key: string, error: unknown) {
    console.warn(
        `[themeConfig] Ignoring invalid stored value for '${key}'.`,
        error,
    );
}

function parseStored(
    key: string,
    raw: string | undefined,
): ThemeColorMap {
    if (raw === undefined) return {};
    let value: unknown;
    try {
        value = JSON.parse(raw);
    } catch (error) {
        warnInvalid(key, error);
        return {};
    }
    const parsed = StoredSchema.safeParse(value);
    if (!parsed.success) {
        warnInvalid(key, parsed.error);
        return {};
    }
    return parsed.data as ThemeColorMap;
}

/** Current overrides, effective values, and the shipped defaults. */
export async function resolveThemeConfig(): Promise<ThemeConfigResolution> {
    const rows = await prisma.config.findMany({
        where: { key: { in: Object.values(THEME_CONFIG_KEYS) } },
    });
    const stored: Record<string, string> = Object.fromEntries(
        rows.map((row) => [row.key, row.value]),
    );

    const overrides: ThemeColors = {
        light: parseStored(
            THEME_CONFIG_KEYS.light,
            stored[THEME_CONFIG_KEYS.light],
        ),
        dark: parseStored(
            THEME_CONFIG_KEYS.dark,
            stored[THEME_CONFIG_KEYS.dark],
        ),
    };

    return {
        overrides,
        effective: {
            light: merge(DEFAULT_THEME_COLORS.light, overrides.light),
            dark: merge(DEFAULT_THEME_COLORS.dark, overrides.dark),
        },
        defaults: DEFAULT_THEME_COLORS,
    };
}

async function writeMode(
    mode: keyof typeof THEME_CONFIG_KEYS,
    patch: Record<string, string | null>,
): Promise<void> {
    const key = THEME_CONFIG_KEYS[mode];
    const existing = (
        await prisma.config.findUnique({ where: { key } })
    )?.value;

    const current = parseStored(key, existing);
    const next: ThemeColorMap = { ...current };

    for (const [token, value] of Object.entries(patch)) {
        const tokenKey = token as ThemeColorToken;
        if (value === null) {
            delete next[tokenKey];
        } else {
            next[tokenKey] = value;
        }
    }

    if (Object.keys(next).length === 0) {
        // Nothing customised: drop the row so defaults apply untouched.
        await prisma.config.deleteMany({ where: { key } });
        return;
    }

    const value = JSON.stringify(next);
    await prisma.config.upsert({
        where: { key },
        update: { value, type: ConfigType.json },
        create: {
            key,
            value,
            type: ConfigType.json,
            description: `shadcn colour overrides (${mode} mode). Null clears a token; the default from globals.css applies.`,
        },
    });
}

/**
 * Apply overrides for one or both modes. `null` clears a single token so the
 * shipped default applies again.
 */
export async function updateThemeConfig(
    patch: ThemeConfigPatch,
): Promise<ThemeConfigResolution> {
    if (patch.light) await writeMode("light", patch.light);
    if (patch.dark) await writeMode("dark", patch.dark);
    return resolveThemeConfig();
}

/** Clear overrides for one mode, or both when `mode` is omitted. */
export async function resetThemeConfig(
    mode?: keyof typeof THEME_CONFIG_KEYS,
): Promise<ThemeConfigResolution> {
    const keys = mode
        ? [THEME_CONFIG_KEYS[mode]]
        : Object.values(THEME_CONFIG_KEYS);

    await prisma.config.deleteMany({ where: { key: { in: keys } } });
    return resolveThemeConfig();
}
