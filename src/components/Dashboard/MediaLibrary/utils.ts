import {
    Image as ImageIcon,
    VideoFile,
    AudioFile,
    Description,
    InsertDriveFile,
    Archive,
} from "@mui/icons-material";
import type { MediaItem, MediaType, MediaVariant, VariantInfo } from "./types";

/**
 * Format bytes to human-readable file size
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

/**
 * Format date string to readable format
 */
export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
};

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
    return formatDate(dateString);
};

/**
 * Get the appropriate icon component for a media type
 */
export const getFileIcon = (type: MediaType) => {
    switch (type) {
        case "Image":
            return ImageIcon;
        case "Video":
            return VideoFile;
        case "Audio":
            return AudioFile;
        case "Document":
            return Description;
        case "Archive":
            return Archive;
        default:
            return InsertDriveFile;
    }
};

/**
 * Get human-readable label for media type
 */
export const getMediaTypeLabel = (type: MediaType): string => {
    switch (type) {
        case "Image":
            return "Image";
        case "Video":
            return "Video";
        case "Audio":
            return "Audio";
        case "Document":
            return "Document";
        case "Archive":
            return "Archive";
        default:
            return "Other";
    }
};

/**
 * Get color for media type (for badges/chips)
 */
export const getMediaTypeColor = (
    type: MediaType,
): "primary" | "secondary" | "success" | "warning" | "error" | "info" => {
    switch (type) {
        case "Image":
            return "primary";
        case "Video":
            return "secondary";
        case "Audio":
            return "success";
        case "Document":
            return "warning";
        case "Archive":
            return "info";
        default:
            return "info";
    }
};

/**
 * Get thumbnail URL for a media item
 * Returns thumbnail variant if available, otherwise the original URL
 */
export const getThumbnailUrl = (item: MediaItem): string => {
    if (item.type !== "Image") return "";

    const thumbnail = item.variants.find((v) => v.name === "thumbnail");
    if (thumbnail) return thumbnail.url;

    const medium = item.variants.find((v) => v.name === "medium");
    if (medium) return medium.url;

    return item.url;
};

/**
 * Get variant by name
 */
export const getVariantByName = (
    item: MediaItem,
    name: string,
): MediaVariant | undefined => {
    return item.variants.find((v) => v.name === name);
};

/**
 * Format variant name to human-readable label
 */
export const formatVariantName = (name: string): string => {
    const labels: Record<string, string> = {
        thumbnail: "Thumbnail (150×150)",
        medium: "Medium (300×300)",
        medium_large: "Medium Large (768px)",
        large: "Large (1024×1024)",
        "2048x2048": "2K (2048×2048)",
    };
    return labels[name] || name;
};

/**
 * Get variant info for display
 */
export const getVariantInfo = (variant: MediaVariant): VariantInfo => {
    const dimensions =
        variant.width && variant.height
            ? `${variant.width} × ${variant.height}`
            : "Unknown";

    return {
        name: variant.name,
        label: formatVariantName(variant.name),
        url: variant.url,
        dimensions,
        size: formatFileSize(variant.fileSize),
    };
};

/**
 * Get all variants with info for display
 */
export const getVariantsInfo = (item: MediaItem): VariantInfo[] => {
    return item.variants.map(getVariantInfo);
};

/**
 * Format dimensions string
 */
export const formatDimensions = (item: MediaItem): string => {
    if (item.width && item.height) {
        return `${item.width} × ${item.height}`;
    }
    return "Unknown";
};

/**
 * Format duration for video/audio
 */
export const formatDuration = (seconds?: number): string => {
    if (!seconds) return "Unknown";

    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Check if item is an image
 */
export const isImage = (item: MediaItem): boolean => item.type === "Image";

/**
 * Check if item is a video
 */
export const isVideo = (item: MediaItem): boolean => item.type === "Video";

/**
 * Check if item is an audio file
 */
export const isAudio = (item: MediaItem): boolean => item.type === "Audio";

/**
 * Check if item is a document
 */
export const isDocument = (item: MediaItem): boolean =>
    item.type === "Document";

/**
 * Check if item supports image processing (resize, optimize, convert)
 */
export const supportsImageProcessing = (item: MediaItem): boolean =>
    item.type === "Image";

/**
 * Check if item supports variants
 */
export const supportsVariants = (item: MediaItem): boolean =>
    item.type === "Image";

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename: string): string => {
    const parts = filename.split(".");
    return parts.length > 1 ? parts.pop()?.toUpperCase() || "" : "";
};

/**
 * Truncate filename if too long
 */
export const truncateFilename = (
    filename: string,
    maxLength: number = 30,
): string => {
    if (filename.length <= maxLength) return filename;

    const ext = getFileExtension(filename);
    const nameWithoutExt = filename.slice(0, filename.lastIndexOf("."));
    const truncatedLength = maxLength - ext.length - 4; // 4 for "..." and "."

    return `${nameWithoutExt.slice(0, truncatedLength)}...${ext ? `.${ext}` : ""}`;
};

/**
 * Convert filter type for API
 */
export const filterTypeToApiType = (filter: string): string | undefined => {
    if (filter === "all") return undefined;
    return filter;
};

/**
 * Generate a slug from a string
 */
export const generateSlug = (text: string): string => {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand("copy");
            return true;
        } catch {
            return false;
        } finally {
            document.body.removeChild(textArea);
        }
    }
};

/**
 * Download a file from URL
 */
export const downloadFile = (url: string, filename: string): void => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Get accepted file types for upload input
 */
export const getAcceptedFileTypes = (): string => {
    return [
        // Images
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
        // Videos
        "video/mp4",
        "video/webm",
        "video/ogg",
        // Audio
        "audio/mpeg",
        "audio/wav",
        "audio/ogg",
        "audio/webm",
        // Documents
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        // Archives
        "application/zip",
        "application/x-rar-compressed",
        "application/x-tar",
        "application/gzip",
    ].join(",");
};

/**
 * Validate file size (max 50MB by default)
 */
export const validateFileSize = (
    file: File,
    maxSizeMB: number = 50,
): boolean => {
    return file.size <= maxSizeMB * 1024 * 1024;
};

/**
 * Get error message for file validation
 */
export const getFileValidationError = (
    file: File,
    maxSizeMB: number = 50,
): string | null => {
    if (!validateFileSize(file, maxSizeMB)) {
        return `File size exceeds ${maxSizeMB}MB limit`;
    }
    return null;
};
