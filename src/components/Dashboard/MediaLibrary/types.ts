// Types for Media Library - Integrated with /v1/media API

// API response types matching Prisma schema
export interface MediaVariant {
    id: string;
    assetId: string;
    name: string; // "thumbnail", "medium", "large", etc.
    path: string;
    url: string;
    width?: number;
    height?: number;
    fileSize: number;
    createdAt: string;
}

export interface MediaUploader {
    id: string;
    name: string;
    email: string;
}

export interface MediaItem {
    id: string;
    filename: string;
    title: string | null;
    slug: string;
    path: string;
    url: string;
    mimeType: string;
    fileSize: number;
    type: MediaType;
    width?: number;
    height?: number;
    duration?: number; // For video/audio
    altText?: string;
    caption?: string;
    description?: string;
    remoteLocation: "Local" | "S3" | "Other";
    bucketName?: string;
    storageKey?: string;
    folder?: string;
    tags: string[];
    uploaderId: string;
    uploader: MediaUploader;
    variants: MediaVariant[];
    usageCount: number;
    lastUsedAt?: string;
    metadata?: Record<string, any>;
    uploadedAt: string;
    updatedAt: string;
    deletedAt?: number; // Unix timestamp (-1 = not deleted)
}

export type MediaType =
    | "Image"
    | "Video"
    | "Audio"
    | "Document"
    | "Archive"
    | "Other";

export type ViewMode = "grid" | "list";

export type FilterType = "all" | "Image" | "Video" | "Audio" | "Document";

export interface MediaLibraryProps {
    onSelect?: (item: MediaItem) => void;
    selectionMode?: "single" | "multiple";
}

export interface MediaItemComponentProps {
    item: MediaItem;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onView: (item: MediaItem) => void;
}

export interface MediaListItemProps extends MediaItemComponentProps {
    onDownload: (item: MediaItem) => void;
}

export interface MediaDetailPanelProps {
    item: MediaItem | null;
    onClose: () => void;
    onUpdate: (id: string, updates: MediaUpdateParams) => Promise<void>;
    onDelete: (permanent?: boolean) => void;
    onDownload: (item: MediaItem) => void;
    onGenerateVariants: (presets?: VariantPreset[]) => Promise<void>;
    onCustomCrop: (item: MediaItem) => void;
    onResize: (
        width?: number,
        height?: number,
        fit?: ResizeFit,
    ) => Promise<void>;
    onOptimize: (quality?: number) => Promise<void>;
    onConvert: (format: ImageFormat, quality?: number) => Promise<void>;
    isProcessing?: boolean;
}

// API Request/Response types
export interface MediaListParams {
    type?: MediaType;
    folder?: string;
    tags?: string;
    search?: string;
    limit?: number;
    offset?: number;
    orderBy?: "uploadedAt" | "filename" | "fileSize" | "usageCount";
    orderDirection?: "asc" | "desc";
    includeDeleted?: boolean;
}

export interface MediaListResponse {
    success: boolean;
    data: MediaItem[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}

export interface MediaUploadParams {
    file: File;
    title?: string;
    altText?: string;
    caption?: string;
    description?: string;
    folder?: string;
    tags?: string[];
    metadata?: Record<string, any>;
    generateVariants?: boolean;
}

export interface MediaUpdateParams {
    title?: string;
    slug?: string;
    altText?: string;
    caption?: string;
    description?: string;
    folder?: string;
    tags?: string[];
    metadata?: Record<string, any>;
}

export interface MediaStatsResponse {
    success: boolean;
    data: {
        totalAssets: number;
        totalSize: number;
        breakdown: {
            images: number;
            videos: number;
            documents: number;
            others: number;
        };
    };
}

// Image processing types
export type VariantPreset =
    | "thumbnail"
    | "medium"
    | "medium_large"
    | "large"
    | "2048x2048";

export type ResizeFit = "cover" | "contain" | "fill" | "inside" | "outside";

export type ImageFormat = "jpeg" | "png" | "webp" | "avif";

export interface GenerateVariantsParams {
    presets?: VariantPreset[];
}

export interface ResizeParams {
    width?: number;
    height?: number;
    fit?: ResizeFit;
}

export interface OptimizeParams {
    quality?: number;
}

export interface ConvertParams {
    format: ImageFormat;
    quality?: number;
}

// Utility types for component state
export interface MediaLibraryState {
    items: MediaItem[];
    selectedItems: Set<string>;
    selectedItem: MediaItem | null;
    isLoading: boolean;
    isUploading: boolean;
    isProcessing: boolean;
    error: string | null;
    pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}

// Helper type for variant display
export interface VariantInfo {
    name: string;
    label: string;
    url: string;
    dimensions: string;
    size: string;
}

// Custom crop coordinates from react-advanced-cropper
export interface CropCoordinates {
    left: number;
    top: number;
    width: number;
    height: number;
}

// Image transforms from react-advanced-cropper (flip and rotation)
export interface ImageTransforms {
    rotate: number; // Rotation angle in degrees (0, 90, 180, 270)
    flipHorizontal: boolean;
    flipVertical: boolean;
}

// Custom crop parameters for creating a custom variant
export interface CustomCropParams {
    coordinates: CropCoordinates;
    variantName: string;
    transforms?: ImageTransforms;
}

// API request for cropping
export interface CropMediaParams {
    coordinates: CropCoordinates;
    variantName: string;
    transforms?: ImageTransforms;
}

// Response for crop API
export interface CropMediaResponse {
    success: boolean;
    message: string;
    data: MediaVariant;
}
