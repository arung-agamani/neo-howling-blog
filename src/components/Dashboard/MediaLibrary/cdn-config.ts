/**
 * CDN Configuration and URL Rewriting Utility for Media Library
 *
 * This utility provides CDN support for the media library, allowing URLs
 * to be rewritten to use a CDN host instead of direct S3 URLs.
 */

import type { MediaItem, MediaVariant } from "./types";

/**
 * CDN Configuration
 */
export interface CDNConfig {
    enabled: boolean;
    cdnHost: string;
}

/**
 * Default CDN configuration
 * Set enabled to true to use CDN URLs by default
 */
export const DEFAULT_CDN_CONFIG: CDNConfig = {
    enabled: true,
    cdnHost: "https://cdn.howlingmoon.dev",
};

/**
 * Extract the path from a full URL
 *
 * @param url - Full URL (e.g., https://s3.amazonaws.com/bucket/path/to/file.jpg)
 * @returns Path without domain (e.g., /path/to/file.jpg)
 */
function extractPathFromUrl(url: string): string {
    try {
        const urlObj = new URL(url);
        return urlObj.pathname;
    } catch {
        // If URL parsing fails, assume it's already a path
        return url.startsWith("/") ? url : `/${url}`;
    }
}

/**
 * Rewrite a single URL to use CDN host
 *
 * @param url - Original URL from backend
 * @param config - CDN configuration
 * @returns Rewritten URL or original URL if CDN is disabled
 */
export function rewriteUrlToCDN(url: string, config: CDNConfig = DEFAULT_CDN_CONFIG): string {
    if (!config.enabled || !url) {
        return url;
    }

    // Extract path from the URL
    const path = extractPathFromUrl(url);

    // Ensure CDN host doesn't have trailing slash
    const cdnHost = config.cdnHost.replace(/\/$/, "");

    // Combine CDN host with path
    return `${cdnHost}${path}`;
}

/**
 * Rewrite MediaVariant URLs to use CDN
 *
 * @param variant - Original variant from backend
 * @param config - CDN configuration
 * @returns Variant with rewritten URL
 */
export function rewriteVariantUrlToCDN(
    variant: MediaVariant,
    config: CDNConfig = DEFAULT_CDN_CONFIG
): MediaVariant {
    return {
        ...variant,
        url: rewriteUrlToCDN(variant.url, config),
    };
}

/**
 * Rewrite MediaItem URLs to use CDN (including all variants)
 *
 * @param item - Original media item from backend
 * @param config - CDN configuration
 * @returns Media item with rewritten URLs
 */
export function rewriteMediaItemToCDN(
    item: MediaItem,
    config: CDNConfig = DEFAULT_CDN_CONFIG
): MediaItem {
    return {
        ...item,
        url: rewriteUrlToCDN(item.url, config),
        variants: item.variants.map((variant) =>
            rewriteVariantUrlToCDN(variant, config)
        ),
    };
}

/**
 * Rewrite multiple MediaItems URLs to use CDN
 *
 * @param items - Array of media items from backend
 * @param config - CDN configuration
 * @returns Array of media items with rewritten URLs
 */
export function rewriteMediaItemsToCDN(
    items: MediaItem[],
    config: CDNConfig = DEFAULT_CDN_CONFIG
): MediaItem[] {
    if (!config.enabled) {
        return items;
    }

    return items.map((item) => rewriteMediaItemToCDN(item, config));
}

/**
 * Get the CDN configuration from environment or use defaults
 *
 * @returns CDN configuration
 */
export function getCDNConfig(): CDNConfig {
    // Check if there's an environment variable to disable CDN
    const cdnEnabled = process.env.NEXT_PUBLIC_CDN_ENABLED !== "false";
    const cdnHost = process.env.NEXT_PUBLIC_CDN_HOST || DEFAULT_CDN_CONFIG.cdnHost;

    return {
        enabled: cdnEnabled,
        cdnHost: cdnHost,
    };
}

/**
 * Create a custom CDN config
 *
 * @param enabled - Whether to enable CDN URL rewriting
 * @param cdnHost - CDN host URL (optional, uses default if not provided)
 * @returns CDN configuration
 */
export function createCDNConfig(
    enabled: boolean,
    cdnHost?: string
): CDNConfig {
    return {
        enabled,
        cdnHost: cdnHost || DEFAULT_CDN_CONFIG.cdnHost,
    };
}
