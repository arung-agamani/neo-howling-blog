/**
 * Normalize a storage folder to a clean relative prefix.
 *
 * Storage keys are built as `${base}/${folder}/${filename}` with no
 * normalization downstream, so a leading slash produces `//` in the public
 * CDN URL. Unify separators and strip leading, trailing, and duplicate
 * slashes here. An empty result means "no folder" (dated path).
 */
export function normalizeStorageFolder(folder: string): string {
    return folder
        .trim()
        .replace(/\\/g, "/")
        .replace(/\/{2,}/g, "/")
        .replace(/^\/+/, "")
        .replace(/\/+$/, "");
}

/**
 * Root prefix for storage keys. Deploy-level concern, so it is env-driven
 * rather than stored in the database; the editor upload config only controls
 * the folder beneath it.
 */
export const DEFAULT_UPLOAD_BASE_PATH =
    process.env.UPLOAD_BASE_PATH?.trim() || "akasha";
