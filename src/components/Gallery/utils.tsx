import * as React from "react";

// ── URL extraction & rendering ─────────────────────────────────────────────────

const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;

export function extractUrls(text: string): string[] {
    return Array.from(
        text.matchAll(new RegExp(URL_REGEX.source, "g")),
        (m) => m[0],
    );
}

/**
 * Render a text string with embedded URLs turned into clickable `<a>` elements.
 * Only `http:` / `https:` URLs are linkified (the regex guarantees this).
 */
export function renderDescriptionText(text: string): React.ReactNode {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    const regex = new RegExp(URL_REGEX.source, "g");
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex)
            parts.push(text.slice(lastIndex, match.index));
        const url = match[0];
        parts.push(
            <a
                key={match.index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#8b7cf6] hover:underline break-all"
                onClick={(e) => e.stopPropagation()}
            >
                {url}
            </a>,
        );
        lastIndex = match.index + url.length;
    }
    if (lastIndex < text.length) parts.push(text.slice(lastIndex));
    return <>{parts}</>;
}

/**
 * Validate that a URL uses a safe protocol before rendering it as an href.
 * Prevents `javascript:`, `data:`, etc.
 */
export function isSafeUrl(url: string): boolean {
    try {
        const { protocol } = new URL(url);
        return protocol === "http:" || protocol === "https:";
    } catch {
        return false;
    }
}
