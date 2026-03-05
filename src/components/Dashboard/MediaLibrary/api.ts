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
    CropCoordinates,
    ImageTransforms,
    InitiateUploadParams,
    InitiateUploadResponse,
    ProcessUploadParams,
    ProcessUploadResponse,
    PostProcessingOperation,
} from "./types";
import {
    rewriteMediaItemToCDN,
    rewriteMediaItemsToCDN,
    rewriteVariantUrlToCDN,
    getCDNConfig,
} from "./cdn-config";

const API_BASE = "/api/v1/media";

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
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

    const response = await apiFetch<MediaListResponse>(url);

    // Rewrite URLs to use CDN
    const cdnConfig = getCDNConfig();
    return {
        ...response,
        data: rewriteMediaItemsToCDN(response.data, cdnConfig),
    };
}

/**
 * Step 1: Initiate upload - get presigned URL and asset ID
 */
export async function initiateUpload(
    params: InitiateUploadParams,
): Promise<InitiateUploadResponse> {
    return apiFetch<InitiateUploadResponse>(`${API_BASE}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
    });
}

/**
 * Step 2: Upload file directly to S3 using presigned URL
 */
export async function uploadToPresignedUrl(
    uploadUrl: string,
    file: File,
    onProgress?: (progress: number) => void,
): Promise<void> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable && onProgress) {
                const progress = Math.round((event.loaded / event.total) * 100);
                onProgress(progress);
            }
        });

        xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
            } else {
                reject(new Error(`Upload failed with status ${xhr.status}`));
            }
        });

        xhr.addEventListener("error", () => {
            reject(new Error("Upload failed due to network error"));
        });

        xhr.addEventListener("abort", () => {
            reject(new Error("Upload was aborted"));
        });

        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
    });
}

/**
 * Step 3: Process the uploaded asset (extract metadata, generate variants)
 */
export async function processUpload(
    assetId: string,
    params: ProcessUploadParams = {},
): Promise<ProcessUploadResponse> {
    const response = await apiFetch<ProcessUploadResponse>(
        `${API_BASE}/${assetId}/process`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(params),
        },
    );

    // Rewrite URLs to use CDN
    const cdnConfig = getCDNConfig();
    return {
        ...response,
        data: rewriteMediaItemToCDN(response.data, cdnConfig),
    };
}

/**
 * Complete upload flow: initiate -> upload to S3 -> process
 * This is the main function for uploading media with the new presigned URL flow
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
    generateThumbnail?: boolean;
    postProcessings?: PostProcessingOperation[];
    onProgress?: (progress: number) => void;
}): Promise<{ success: boolean; message: string; data: MediaItem }> {
    const { file, generateThumbnail, postProcessings, onProgress, ...metadata } =
        params;

    // Step 1: Initiate upload to get presigned URL
    const initiateResponse = await initiateUpload({
        filename: file.name,
        mimeType: file.type,
        fileSize: file.size,
        ...metadata,
    });

    if (!initiateResponse.success) {
        throw new Error(
            initiateResponse.message || "Failed to initiate upload",
        );
    }

    const { assetId, uploadUrl } = initiateResponse.data;

    try {
        // Step 2: Upload file directly to S3
        await uploadToPresignedUrl(uploadUrl, file, onProgress);

        // Step 3: Process the uploaded asset (with optional post-processing)
        const processResponse = await processUpload(assetId, {
            generateThumbnail,
            postProcessings,
        });

        return {
            success: true,
            message: "Media uploaded successfully",
            data: processResponse.data,
        };
    } catch (error) {
        // If upload or processing fails, the asset record may need cleanup
        // The backend will mark it as failed, and it can be cleaned up later
        throw error;
    }
}

/**
 * Get a single media item by ID
 */
export async function getMedia(
    id: string,
): Promise<{ success: boolean; data: MediaItem }> {
    const response = await apiFetch<{ success: boolean; data: MediaItem }>(
        `${API_BASE}/${id}`,
    );

    // Rewrite URLs to use CDN
    const cdnConfig = getCDNConfig();
    return {
        ...response,
        data: rewriteMediaItemToCDN(response.data, cdnConfig),
    };
}

/**
 * Update media metadata
 */
export async function updateMedia(
    id: string,
    updates: MediaUpdateParams,
): Promise<{ success: boolean; message: string; data: MediaItem }> {
    const response = await apiFetch<{
        success: boolean;
        message: string;
        data: MediaItem;
    }>(`${API_BASE}/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
    });

    // Rewrite URLs to use CDN
    const cdnConfig = getCDNConfig();
    return {
        ...response,
        data: rewriteMediaItemToCDN(response.data, cdnConfig),
    };
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
    const response = await apiFetch<{
        success: boolean;
        message: string;
        data: MediaVariant[];
    }>(`${API_BASE}/${id}/variants`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ presets }),
    });

    // Rewrite URLs to use CDN
    const cdnConfig = getCDNConfig();
    return {
        ...response,
        data: response.data.map((variant) =>
            rewriteVariantUrlToCDN(variant, cdnConfig),
        ),
    };
}

/**
 * Delete a media variant by name
 */
export async function deleteVariant(
    id: string,
    variantName: string,
): Promise<{ success: boolean; message: string }> {
    return apiFetch(`${API_BASE}/${id}/variants`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ variantName }),
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
    const response = await apiFetch<{
        success: boolean;
        message: string;
        data: MediaItem;
    }>(`${API_BASE}/${id}/resize`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ width, height, fit }),
    });

    // Rewrite URLs to use CDN
    const cdnConfig = getCDNConfig();
    return {
        ...response,
        data: rewriteMediaItemToCDN(response.data, cdnConfig),
    };
}

/**
 * Optimize/compress an image
 */
export async function optimizeMedia(
    id: string,
    quality?: number,
): Promise<{ success: boolean; message: string; data: MediaItem }> {
    const response = await apiFetch<{
        success: boolean;
        message: string;
        data: MediaItem;
    }>(`${API_BASE}/${id}/optimize`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ quality }),
    });

    // Rewrite URLs to use CDN
    const cdnConfig = getCDNConfig();
    return {
        ...response,
        data: rewriteMediaItemToCDN(response.data, cdnConfig),
    };
}

/**
 * Convert image format
 */
export async function convertMedia(
    id: string,
    format: ImageFormat,
    quality?: number,
): Promise<{ success: boolean; message: string; data: MediaItem }> {
    const response = await apiFetch<{
        success: boolean;
        message: string;
        data: MediaItem;
    }>(`${API_BASE}/${id}/convert`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ format, quality }),
    });

    // Rewrite URLs to use CDN
    const cdnConfig = getCDNConfig();
    return {
        ...response,
        data: rewriteMediaItemToCDN(response.data, cdnConfig),
    };
}

/**
 * Crop an image to create a custom variant
 */
export async function cropCustomVariant(
    id: string,
    variantName: string,
    coordinates: CropCoordinates,
    transforms?: ImageTransforms,
): Promise<{ success: boolean; message: string; data: MediaVariant }> {
    const response = await apiFetch<{
        success: boolean;
        message: string;
        data: MediaVariant;
    }>(`${API_BASE}/${id}/crop`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            variantName,
            coordinates,
            transforms,
        }),
    });

    // Rewrite URLs to use CDN
    const cdnConfig = getCDNConfig();
    return {
        ...response,
        data: rewriteVariantUrlToCDN(response.data, cdnConfig),
    };
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
