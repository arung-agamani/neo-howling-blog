// ── Platform branding & detection ──────────────────────────────────────────────

export interface PlatformInfo {
    id: string;
    label: string;
    bg: string;
    text: string;
    border: string;
    dot: string;
}

export const PLATFORM_MAP: Record<string, PlatformInfo> = {
    pixiv: {
        id: "pixiv",
        label: "Pixiv",
        bg: "bg-[#0096fa]/15",
        text: "text-[#0096fa]",
        border: "border-[#0096fa]/35",
        dot: "bg-[#0096fa]",
    },
    twitter: {
        id: "twitter",
        label: "Twitter / X",
        bg: "bg-white/8",
        text: "text-white",
        border: "border-white/20",
        dot: "bg-white",
    },
    x: {
        id: "twitter",
        label: "Twitter / X",
        bg: "bg-white/8",
        text: "text-white",
        border: "border-white/20",
        dot: "bg-white",
    },
    deviantart: {
        id: "deviantart",
        label: "DeviantArt",
        bg: "bg-[#05cc47]/12",
        text: "text-[#05cc47]",
        border: "border-[#05cc47]/30",
        dot: "bg-[#05cc47]",
    },
    artstation: {
        id: "artstation",
        label: "ArtStation",
        bg: "bg-[#13aff0]/12",
        text: "text-[#13aff0]",
        border: "border-[#13aff0]/30",
        dot: "bg-[#13aff0]",
    },
    danbooru: {
        id: "danbooru",
        label: "Danbooru",
        bg: "bg-[#f06292]/12",
        text: "text-[#f06292]",
        border: "border-[#f06292]/30",
        dot: "bg-[#f06292]",
    },
    gelbooru: {
        id: "gelbooru",
        label: "Gelbooru",
        bg: "bg-[#5b93ff]/12",
        text: "text-[#5b93ff]",
        border: "border-[#5b93ff]/30",
        dot: "bg-[#5b93ff]",
    },
    instagram: {
        id: "instagram",
        label: "Instagram",
        bg: "bg-[#e1306c]/12",
        text: "text-[#e1306c]",
        border: "border-[#e1306c]/30",
        dot: "bg-[#e1306c]",
    },
};

const HOSTNAME_MAP: Array<[RegExp, string]> = [
    [/pixiv\.net/, "pixiv"],
    [/twitter\.com|x\.com|t\.co/, "twitter"],
    [/deviantart\.com/, "deviantart"],
    [/artstation\.com/, "artstation"],
    [/danbooru\.donmai\.us/, "danbooru"],
    [/gelbooru\.com/, "gelbooru"],
    [/instagram\.com/, "instagram"],
];

/** Detect the source platform from tags first, then fallback to URL hostname matching. */
export function detectPlatform(
    tags: string[],
    urls: string[],
): PlatformInfo | null {
    for (const tag of tags) {
        const p = PLATFORM_MAP[tag.toLowerCase()];
        if (p) return p;
    }
    for (const url of urls) {
        try {
            const hostname = new URL(url).hostname.toLowerCase();
            for (const [pattern, key] of HOSTNAME_MAP) {
                if (pattern.test(hostname)) return PLATFORM_MAP[key];
            }
        } catch {
            /* ignore malformed URLs */
        }
    }
    return null;
}

/** Pick the best source URL matching the detected platform, or the first URL. */
export function pickSourceUrl(
    platform: PlatformInfo | null,
    urls: string[],
): string | null {
    if (urls.length === 0) return null;
    if (!platform) return urls[0];
    for (const url of urls) {
        try {
            const hostname = new URL(url).hostname.toLowerCase();
            for (const [pattern, key] of HOSTNAME_MAP) {
                if (
                    pattern.test(hostname) &&
                    PLATFORM_MAP[key]?.id === platform.id
                )
                    return url;
            }
        } catch {
            /* ignore */
        }
    }
    return urls[0];
}
