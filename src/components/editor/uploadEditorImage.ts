import { uploadMedia } from "@/components/Dashboard/MediaLibrary/api";

/** The subset of editor upload config the client needs for pre-flight UX. */
export interface EditorUploadLimits {
    enabled: boolean;
    maxBytes: number;
    allowedMimeTypes: string[];
}

/**
 * Pre-config fallback used while settings load. The media route enforces the
 * stored config, so an optimistic allow here can never bypass a real limit.
 */
export const OPTIMISTIC_UPLOAD_LIMITS: EditorUploadLimits = {
    enabled: true,
    maxBytes: 10 * 1024 * 1024,
    allowedMimeTypes: [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/avif",
        "image/svg+xml",
    ],
};

export class ImageUploadError extends Error {}

/**
 * Upload an image for the editor. Pre-flight checks mirror the server-side
 * config enforcement so users get immediate feedback, but the authoritative
 * limits, storage folder, tags, and post-processing come from the server.
 */
export async function uploadEditorImage(
    file: File,
    limits: EditorUploadLimits,
): Promise<string> {
    if (!limits.enabled) {
        throw new ImageUploadError("Editor image uploads are disabled.");
    }
    if (file.type.startsWith("video/") || file.type.startsWith("audio/")) {
        throw new ImageUploadError(
            "Video and audio uploads are not supported here yet. Upload the file in the Media Library, then insert it by URL.",
        );
    }
    if (!limits.allowedMimeTypes.includes(file.type)) {
        throw new ImageUploadError(
            `Unsupported image type "${file.type || "unknown"}". Allowed: ${limits.allowedMimeTypes.join(", ")}.`,
        );
    }
    if (file.size > limits.maxBytes) {
        throw new ImageUploadError(
            `Image is ${(file.size / 1024 / 1024).toFixed(1)} MiB — limit is ${(
                limits.maxBytes /
                (1024 * 1024)
            ).toFixed(1)} MiB.`,
        );
    }

    const result = await uploadMedia({ file, origin: "editor" });
    return result.data.url;
}
