/**
 * shadcn/ui colour tokens, as defined in `(user)/globals.css`.
 *
 * Values are raw HSL triplets ("220.9 39.3% 11%") so they can be injected as
 * `--token` and consumed by Tailwind's `hsl(var(--token))` mapping.
 */
export const THEME_COLOR_TOKENS = [
    "background",
    "foreground",
    "card",
    "card-foreground",
    "popover",
    "popover-foreground",
    "primary",
    "primary-foreground",
    "secondary",
    "secondary-foreground",
    "muted",
    "muted-foreground",
    "accent",
    "accent-foreground",
    "destructive",
    "destructive-foreground",
    "border",
    "input",
    "ring",
] as const;

export type ThemeColorToken = (typeof THEME_COLOR_TOKENS)[number];

export type ThemeColorMap = Partial<Record<ThemeColorToken, string>>;

export type ThemeMode = "light" | "dark";

export interface ThemeColors {
    light: ThemeColorMap;
    dark: ThemeColorMap;
}

/** `H S% L%`, e.g. `220.9 39.3% 11%`. */
export const HSL_TRIPLET_PATTERN =
    /^\d{1,3}(?:\.\d+)?\s+\d{1,3}(?:\.\d+)?%\s+\d{1,3}(?:\.\d+)?%$/;

export const THEME_COLOR_LABELS: Record<ThemeColorToken, string> = {
    background: "Background",
    foreground: "Foreground",
    card: "Card",
    "card-foreground": "Card text",
    popover: "Popover",
    "popover-foreground": "Popover text",
    primary: "Primary",
    "primary-foreground": "Primary text",
    secondary: "Secondary",
    "secondary-foreground": "Secondary text",
    muted: "Muted",
    "muted-foreground": "Muted text",
    accent: "Accent",
    "accent-foreground": "Accent text",
    destructive: "Destructive",
    "destructive-foreground": "Destructive text",
    border: "Border",
    input: "Input border",
    ring: "Focus ring",
};

/** Groups used by the settings UI; order matters for scanability. */
export const THEME_COLOR_GROUPS: Array<{
    label: string;
    tokens: ThemeColorToken[];
}> = [
    {
        label: "Surfaces",
        tokens: [
            "background",
            "card",
            "popover",
            "muted",
            "secondary",
            "accent",
        ],
    },
    {
        label: "Text",
        tokens: [
            "foreground",
            "card-foreground",
            "popover-foreground",
            "muted-foreground",
            "secondary-foreground",
            "accent-foreground",
        ],
    },
    {
        label: "Actions",
        tokens: [
            "primary",
            "primary-foreground",
            "destructive",
            "destructive-foreground",
        ],
    },
    {
        label: "Lines",
        tokens: ["border", "input", "ring"],
    },
];

/** CSS that applies the given overrides for both colour modes. */
export function buildThemeCss(colors: ThemeColors): string {
    const declarations = (map: ThemeColorMap) =>
        THEME_COLOR_TOKENS.filter((token) => map[token])
            .map((token) => `--${token}: ${map[token]};`)
            .join("");

    return `:root{${declarations(colors.light)}}.dark{${declarations(
        colors.dark,
    )}}`;
}
