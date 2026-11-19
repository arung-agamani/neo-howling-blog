const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

/** Hosts that serve YouTube videos we know how to embed. */
const YOUTUBE_HOSTS: Record<string, true> = {
    "youtube.com": true,
    "www.youtube.com": true,
    "m.youtube.com": true,
    "music.youtube.com": true,
    "youtu.be": true,
    "www.youtu.be": true,
    "youtube-nocookie.com": true,
    "www.youtube-nocookie.com": true,
};

export interface YouTubeVideo {
    videoId: string;
    /** Canonical watch URL derived from the ID — never the raw input. */
    watchUrl: string;
}

/**
 * Extract a YouTube video ID from a watch, share, embed, shorts, or live URL.
 * Returns null for anything else, including non-YouTube hosts.
 *
 * Only the derived 11-character ID is ever used in an embed URL, so the raw
 * pasted string can never end up as an iframe `src`.
 */
export function parseYouTubeUrl(input: string): YouTubeVideo | null {
    let url: URL;
    try {
        url = new URL(input.trim());
    } catch {
        return null;
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") return null;

    const host = url.hostname.toLowerCase();
    if (!YOUTUBE_HOSTS[host]) return null;

    let candidate: string | null = null;

    if (host === "youtu.be" || host === "www.youtu.be") {
        candidate = url.pathname.split("/")[1] ?? null;
    } else if (url.pathname === "/watch") {
        candidate = url.searchParams.get("v");
    } else {
        const match = url.pathname.match(
            /^\/(?:embed|shorts|live|v)\/([^/?#]+)/,
        );
        candidate = match?.[1] ?? null;
    }

    if (!candidate || !VIDEO_ID_PATTERN.test(candidate)) return null;

    return {
        videoId: candidate,
        watchUrl: `https://www.youtube.com/watch?v=${candidate}`,
    };
}

export function youtubeEmbedSrc(videoId: string): string {
    return `https://www.youtube.com/embed/${videoId}`;
}

export function youtubeThumbnailUrl(videoId: string): string {
    return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}
