import { uploadMedia } from "@/components/Dashboard/MediaLibrary/api";

/** Max inline image size: 10 MiB. Larger files belong in Media Library. */
export const MAX_INLINE_IMAGE_BYTES = 10 * 1024 * 1024;

const ACCEPTED_IMAGE_TYPES: Record<string, true> = {
    "image/jpeg": true,
    "image/png": true,
    "image/gif": true,
    "image/webp": true,
    "image/avif": true,
    "image/svg+xml": true,
};

export class ImageUploadError extends Error {}

/**
 * Guarded uploadFile for BlockNote editors. Rejects non-images and oversize
 * files before hitting the presigned-URL flow; BlockNote surfaces thrown
 * errors on the in-progress block, so failures never silently vanish.
 */
export async function uploadEditorImage(
    file: File,
    _blockId?: string,
): Promise<string> {
    if (!file.type.startsWith("image/") || !ACCEPTED_IMAGE_TYPES[file.type]) {
        throw new ImageUploadError(
            `Unsupported image type "${file.type || "unknown"}". Use JPEG, PNG, GIF, WebP, AVIF, or SVG.`,
        );
    }
    if (file.size > MAX_INLINE_IMAGE_BYTES) {
        throw new ImageUploadError(
            `Image is ${(file.size / 1024 / 1024).toFixed(1)} MiB — limit is 10 MiB. Use Media Library for larger files.`,
        );
    }
    const result = await uploadMedia({
        // No leading slash: AssetService interpolates folder raw into
        // `${base}/${folder}/${file}` — a leading slash yields `//` in the URL.
        folder: "images/post-inline",
        tags: ["post-inline"],
        file,
    });
    return result.data.url;
}
