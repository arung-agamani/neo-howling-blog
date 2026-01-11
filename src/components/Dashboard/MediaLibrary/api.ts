// API service for Media Library - communicates with /v1/media endpoints

import type {
    MediaItem,
    MediaListParams,
    MediaListResponse,
    MediaUpdateParams,
    MediaStatsResponse,
    MediaVariant,
    VariantPreset,
    ResizeFit,
    ImageFormat,
} from "./types";

const API_BASE = "/api/v1/media";

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(
    url: string,
    options?: RequestInit,
): Promise<T> {
    const response = await fetch(url, {
        ...options,
        headers: {
            ...options?.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `API error: ${response.status}`);
    }

    return response.json();
}

/**
 * List media items with filtering and pagination
 */
export async function listMedia(
    params: MediaListParams = {},
): Promise<MediaListResponse> {
    const searchParams = new URLSearchParams();

    if (params.type) searchParams.set("type", params.type);
    if (params.folder) searchParams.set("folder", params.folder);
    if (params.tags) searchParams.set("tags", params.tags);
    if (params.search) searchParams.set("search", params.search);
    if (params.limit) searchParams.set("limit", params.limit.toString());
    if (params.offset) searchParams.set("offset", params.offset.toString());
    if (params.orderBy) searchParams.set("orderBy", params.orderBy);
    if (params.orderDirection)
        searchParams.set("orderDirection", params.orderDirection);
    if (params.includeDeleted)
        searchParams.set("includeDeleted", params.includeDeleted.toString());

    const queryString = searchParams.toString();
    const url = queryString ? `${API_BASE}?${queryString}` : API_BASE;

    return apiFetch<MediaListResponse>(url);
}

/**
 * Upload a new media file
 */
export async function uploadMedia(params: {
    file: File;
    title?: string;
    altText?: string;
    caption?: string;
    description?: string;
    folder?: string;
    tags?: string[];
    metadata?: Record<string, any>;
    generateVariants?: boolean;
}): Promise<{ success: boolean; message: string; data: MediaItem }> {
    const formData = new FormData();
    formData.append("file", params.file);

    if (params.title) formData.append("title", params.title);
    if (params.altText) formData.append("altText", params.altText);
    if (params.caption) formData.append("caption", params.caption);
    if (params.description) formData.append("description", params.description);
    if (params.folder) formData.append("folder", params.folder);
    if (params.tags) formData.append("tags", JSON.stringify(params.tags));
    if (params.metadata)
        formData.append("metadata", JSON.stringify(params.metadata));
    if (params.generateVariants)
        formData.append("generateVariants", params.generateVariants.toString());

    return apiFetch(`${API_BASE}`, {
        method: "POST",
        body: formData,
    });
}

/**
 * Get a single media item by ID
 */
export async function getMedia(
    id: string,
): Promise<{ success: boolean; data: MediaItem }> {
    return apiFetch(`${API_BASE}/${id}`);
}

/**
 * Update media metadata
 */
export async function updateMedia(
    id: string,
    updates: MediaUpdateParams,
): Promise<{ success: boolean; message: string; data: MediaItem }> {
    return apiFetch(`${API_BASE}/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
    });
}

/**
 * Delete media (soft delete by default)
 */
export async function deleteMedia(
    id: string,
    permanent: boolean = false,
): Promise<{ success: boolean; message: string }> {
    const url = permanent
        ? `${API_BASE}/${id}?permanent=true`
        : `${API_BASE}/${id}`;

    return apiFetch(url, {
        method: "DELETE",
    });
}

/**
 * Bulk delete multiple media items
 */
export async function bulkDeleteMedia(
    ids: string[],
    permanent: boolean = false,
): Promise<{ success: number; failed: number }> {
    const results = await Promise.allSettled(
        ids.map((id) => deleteMedia(id, permanent)),
    );

    return {
        success: results.filter((r) => r.status === "fulfilled").length,
        failed: results.filter((r) => r.status === "rejected").length,
    };
}

/**
 * Get media variants
 */
export async function getMediaVariants(
    id: string,
): Promise<{ success: boolean; data: MediaVariant[] }> {
    return apiFetch(`${API_BASE}/${id}/variants`);
}

/**
 * Generate media variants
 */
export async function generateVariants(
    id: string,
    presets?: VariantPreset[],
): Promise<{ success: boolean; message: string; data: MediaVariant[] }> {
    return apiFetch(`${API_BASE}/${id}/variants`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ presets }),
    });
}

/**
 * Resize an image
 */
export async function resizeMedia(
    id: string,
    width?: number,
    height?: number,
    fit: ResizeFit = "inside",
): Promise<{ success: boolean; message: string; data: MediaItem }> {
    return apiFetch(`${API_BASE}/${id}/resize`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ width, height, fit }),
    });
}

/**
 * Optimize/compress an image
 */
export async function optimizeMedia(
    id: string,
    quality?: number,
): Promise<{ success: boolean; message: string; data: MediaItem }> {
    return apiFetch(`${API_BASE}/${id}/optimize`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ quality }),
    });
}

/**
 * Convert image format
 */
export async function convertMedia(
    id: string,
    format: ImageFormat,
    quality?: number,
): Promise<{ success: boolean; message: string; data: MediaItem }> {
    return apiFetch(`${API_BASE}/${id}/convert`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ format, quality }),
    });
}

/**
 * Get media statistics
 */
export async function getMediaStats(
    uploaderId?: string,
): Promise<MediaStatsResponse> {
    const url = uploaderId
        ? `${API_BASE}/stats?uploaderId=${uploaderId}`
        : `${API_BASE}/stats`;

    return apiFetch(url);
}

/**
 * Download a media file
 */
export function downloadMedia(item: MediaItem): void {
    const link = document.createElement("a");
    link.href = item.url;
    link.download = item.filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Copy media URL to clipboard
 */
export async function copyMediaUrl(url: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Get the thumbnail URL for a media item
 * Returns the thumbnail variant URL if available, otherwise the original URL
 */
export function getThumbnailUrl(item: MediaItem): string {
    const thumbnail = item.variants.find((v) => v.name === "thumbnail");
    return thumbnail?.url || item.url;
}

/**
 * Get variant by name
 */
export function getVariantByName(
    item: MediaItem,
    name: string,
): MediaVariant | undefined {
    return item.variants.find((v) => v.name === name);
}

/**
 * Check if the media item is an image
 */
export function isImage(item: MediaItem): boolean {
    return item.type === "Image";
}

/**
 * Check if the media item is a video
 */
export function isVideo(item: MediaItem): boolean {
    return item.type === "Video";
}

/**
 * Check if the media item is an audio file
 */
export function isAudio(item: MediaItem): boolean {
    return item.type === "Audio";
}

/**
 * Check if the media item is a document
 */
export function isDocument(item: MediaItem): boolean {
    return item.type === "Document";
}
