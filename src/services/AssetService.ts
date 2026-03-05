// AssetService acts as the service layer for managing assets in the application.
// The style will follow what Wordpress has for its asset management.
// This should be created with DI in mind for future extensibility and better testing.

import {
    PrismaClient,
    AssetType,
    RemoteLocation,
    UploadStatus,
    Prisma,
} from "@prisma/client";
import prisma from "@/utils/prisma";
import { s3Client } from "@/utils/aws-client";
import {
    PutObjectCommand,
    DeleteObjectCommand,
    CopyObjectCommand,
    GetObjectCommand,
    HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import path from "path";
import mime from "mime-types";
import {
    ImageService,
    IMAGE_SIZE_PRESETS,
    CustomCropOptions,
} from "./ImageService";

// Types for asset operations
export interface UploadAssetParams {
    file: Buffer;
    filename: string;
    mimeType: string;
    uploaderId: string;
    title?: string;
    altText?: string;
    caption?: string;
    description?: string;
    folder?: string;
    tags?: string[];
    metadata?: Record<string, any>;
}

export interface CreateAssetParams {
    filename: string;
    title?: string;
    slug: string;
    path: string;
    url: string;
    mimeType: string;
    fileSize: number;
    type: AssetType;
    width?: number;
    height?: number;
    duration?: number;
    altText?: string;
    caption?: string;
    description?: string;
    remoteLocation: RemoteLocation;
    bucketName?: string;
    storageKey?: string;
    folder?: string;
    tags?: string[];
    uploaderId: string;
    metadata?: Record<string, any>;
}

export interface UpdateAssetParams {
    title?: string;
    slug?: string;
    altText?: string;
    caption?: string;
    description?: string;
    folder?: string;
    tags?: string[];
    metadata?: Record<string, any>;
}

export interface AssetVariantParams {
    name: string;
    width?: number;
    height?: number;
    quality?: number;
}

export interface ImageTransforms {
    rotate: number; // 0, 90, 180, 270
    flipHorizontal: boolean;
    flipVertical: boolean;
}

export interface CustomCropVariantParams {
    variantName: string;
    coordinates: {
        left: number;
        top: number;
        width: number;
        height: number;
    };
    transforms?: ImageTransforms;
}

export interface ListAssetsParams {
    type?: AssetType;
    folder?: string;
    tags?: string[];
    uploaderId?: string;
    search?: string;
    limit?: number;
    offset?: number;
    orderBy?: "uploadedAt" | "filename" | "fileSize" | "usageCount";
    orderDirection?: "asc" | "desc";
    includeDeleted?: boolean;
}

export interface AssetFilters {
    type?: AssetType;
    mimeType?: string;
    uploaderId?: string;
    folder?: string;
    deletedAt?: number | { not: number };
}

// Parameters for initiating a presigned URL upload
export interface InitiateUploadParams {
    filename: string;
    mimeType: string;
    fileSize: number;
    uploaderId: string;
    title?: string;
    altText?: string;
    caption?: string;
    description?: string;
    folder?: string;
    tags?: string[];
    metadata?: Record<string, any>;
}

// Response from initiating upload
export interface InitiateUploadResponse {
    assetId: string;
    uploadUrl: string;
    storageKey: string;
    expiresAt: Date;
}

// Parameters for processing an uploaded asset
export interface ProcessUploadParams {
    generateThumbnail?: boolean;
    postProcessings?: PostProcessingOperation[];
}

// Post-processing operation types (gadgets)
export type PostProcessingType = "resize" | "compress" | "convertFormat";

// Base interface for post-processing operations
export interface BasePostProcessingOperation {
    type: PostProcessingType;
}

// Resize operation config
export interface ResizeOperation extends BasePostProcessingOperation {
    type: "resize";
    config: {
        width?: number;
        height?: number;
        fit?: "cover" | "contain" | "fill" | "inside" | "outside";
    };
}

// Compress operation config
export interface CompressOperation extends BasePostProcessingOperation {
    type: "compress";
    config: {
        quality?: number; // 1-100
    };
}

// Convert format operation config
export interface ConvertFormatOperation extends BasePostProcessingOperation {
    type: "convertFormat";
    config: {
        format: "jpeg" | "png" | "webp" | "avif";
        quality?: number; // 1-100
    };
}

// Union type for all post-processing operations
export type PostProcessingOperation =
    | ResizeOperation
    | CompressOperation
    | ConvertFormatOperation;

// Image dimension presets similar to WordPress
export const IMAGE_SIZES = {
    thumbnail: { width: 150, height: 150 },
    medium: { width: 300, height: 300 },
    medium_large: { width: 768, height: 0 }, // 0 means maintain aspect ratio
    large: { width: 1024, height: 1024 },
    full: { width: 0, height: 0 }, // Original size
} as const;

// Constant for non-deleted assets (MongoDB/Prisma compatibility)
// Using -1 to represent "not deleted" (deletedAt is Unix timestamp)
export const NOT_DELETED_DATE = -1;

export class AssetService {
    private db: PrismaClient;
    private bucketName: string;
    private cdnBaseUrl: string;
    private uploadBasePath: string;
    private _imageService?: ImageService;

    constructor(
        db: PrismaClient = prisma,
        bucketName?: string,
        cdnBaseUrl?: string,
        uploadBasePath: string = "akasha",
        imageService?: ImageService,
    ) {
        this.db = db;
        this.bucketName = bucketName || process.env.BUCKET_NAME || "";
        this.cdnBaseUrl = cdnBaseUrl || process.env.CDN_BASE_URL || "";
        this.uploadBasePath = uploadBasePath;
        this._imageService = imageService;
    }

    /**
     * Lazy-loaded ImageService getter
     * Only initializes Sharp when image processing is actually needed
     */
    private get imageService(): ImageService {
        if (!this._imageService) {
            const initStart = Date.now();
            this._imageService = new ImageService();
            const initTime = Date.now() - initStart;
            console.log(
                `[AssetService] ImageService initialized in ${initTime}ms`,
            );
        }
        return this._imageService;
    }

    /**
     * Generate a unique slug for the asset
     */
    private async generateUniqueSlug(filename: string): Promise<string> {
        const baseName = path.parse(filename).name;
        let slug = this.sanitizeSlug(baseName);
        let counter = 1;
        let isUnique = false;

        while (!isUnique) {
            const existing = await this.db.assets.findFirst({
                where: { slug, deletedAt: NOT_DELETED_DATE },
            });

            if (!existing) {
                isUnique = true;
            } else {
                slug = `${this.sanitizeSlug(baseName)}-${counter}`;
                counter++;
            }
        }

        return slug;
    }

    /**
     * Sanitize filename to create URL-friendly slug
     */
    private sanitizeSlug(filename: string): string {
        return filename
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
    }

    /**
     * Determine asset type from MIME type
     */
    private getAssetTypeFromMime(mimeType: string): AssetType {
        if (mimeType.startsWith("image/")) return AssetType.Image;
        if (mimeType.startsWith("video/")) return AssetType.Video;
        if (mimeType.startsWith("audio/")) return AssetType.Audio;
        if (
            mimeType.includes("pdf") ||
            mimeType.includes("document") ||
            mimeType.includes("text") ||
            mimeType.includes("word") ||
            mimeType.includes("sheet") ||
            mimeType.includes("presentation")
        )
            return AssetType.Document;
        if (
            mimeType.includes("zip") ||
            mimeType.includes("rar") ||
            mimeType.includes("tar") ||
            mimeType.includes("gz")
        )
            return AssetType.Archive;
        return AssetType.Other;
    }

    /**
     * Generate storage path for the asset
     * Note: The filename is expected to already include a timestamp prefix
     * (added by the route handler) for uniqueness, so we just use it as-is.
     */
    private generateStoragePath(filename: string, folder?: string): string {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");

        if (folder) {
            return `${this.uploadBasePath}/${folder}/${filename}`;
        }

        return `${this.uploadBasePath}/${year}/${month}/${filename}`;
    }

    /**
     * Upload file to S3 storage
     */
    private async uploadToS3(
        buffer: Buffer,
        key: string,
        mimeType: string,
        metadata?: Record<string, string>,
    ): Promise<void> {
        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: buffer,
            ContentType: mimeType,
            Metadata: metadata,
        });

        await s3Client.send(command);
    }

    /**
     * Delete file from S3 storage
     */
    private async deleteFromS3(key: string): Promise<void> {
        const command = new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: key,
        });

        await s3Client.send(command);
    }

    /**
     * Copy file in S3 storage
     */
    private async copyInS3(
        sourceKey: string,
        targetKey: string,
    ): Promise<void> {
        const command = new CopyObjectCommand({
            Bucket: this.bucketName,
            CopySource: encodeURI(`${this.bucketName}/${sourceKey}`),
            Key: targetKey,
        });

        await s3Client.send(command);
    }

    /**
     * Get file size from S3
     */
    private async getS3FileSize(key: string): Promise<number> {
        const command = new HeadObjectCommand({
            Bucket: this.bucketName,
            Key: key,
        });

        const response = await s3Client.send(command);
        return response.ContentLength || 0;
    }

    /**
     * Generate URL for accessing the asset
     */
    private generateAssetUrl(key: string): string {
        if (this.cdnBaseUrl) {
            return `${this.cdnBaseUrl}/${key}`;
        }
        return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
    }

    /**
     * Create a new asset record in the database
     */
    async createAsset(params: CreateAssetParams) {
        return await this.db.assets.create({
            data: {
                filename: params.filename,
                title: params.title || path.parse(params.filename).name,
                slug: params.slug,
                path: params.path,
                url: params.url,
                mimeType: params.mimeType,
                fileSize: params.fileSize,
                type: params.type,
                width: params.width,
                height: params.height,
                duration: params.duration,
                altText: params.altText,
                caption: params.caption,
                description: params.description,
                remoteLocation: params.remoteLocation,
                bucketName: params.bucketName,
                storageKey: params.storageKey,
                folder: params.folder,
                tags: params.tags || [],
                uploaderId: params.uploaderId,
                metadata: params.metadata || {},
                usageCount: 0,
            },
            include: {
                uploader: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                variants: true,
            },
        });
    }

    /**
     * Upload an asset (main entry point for file uploads)
     */
    async uploadAsset(
        params: UploadAssetParams & { generateVariants?: boolean },
    ) {
        const {
            file,
            filename,
            mimeType,
            uploaderId,
            title,
            altText,
            caption,
            description,
            folder,
            tags,
            metadata,
            generateVariants = false,
        } = params;

        // Generate unique slug
        const slug = await this.generateUniqueSlug(filename);

        // Generate storage path (filename already includes timestamp from route)
        const storagePath = this.generateStoragePath(filename, folder);

        // Upload to S3
        await this.uploadToS3(file, storagePath, mimeType, {
            originalFilename: filename,
            uploadedBy: uploaderId,
        });

        // Get file size
        const fileSize = file.length;

        // Generate URL
        const url = this.generateAssetUrl(storagePath);

        // Determine asset type
        const assetType = this.getAssetTypeFromMime(mimeType);

        // Extract image dimensions if it's an image
        let width: number | undefined;
        let height: number | undefined;
        let extractedMetadata: Record<string, any> = metadata || {};

        if (assetType === AssetType.Image) {
            try {
                const imageMetadata = await this.imageService.getMetadata(file);
                width = imageMetadata.width;
                height = imageMetadata.height;

                // Store additional image metadata
                extractedMetadata = {
                    ...extractedMetadata,
                    imageMetadata: {
                        format: imageMetadata.format,
                        space: imageMetadata.space,
                        channels: imageMetadata.channels,
                        hasAlpha: imageMetadata.hasAlpha,
                        orientation: imageMetadata.orientation,
                        isProgressive: imageMetadata.isProgressive,
                    },
                };
            } catch (error) {
                console.error("Failed to extract image metadata:", error);
            }
        }

        // Create database record
        const asset = await this.createAsset({
            filename,
            title,
            slug,
            path: storagePath,
            url,
            mimeType,
            fileSize,
            type: assetType,
            width,
            height,
            altText,
            caption,
            description,
            remoteLocation: RemoteLocation.S3,
            bucketName: this.bucketName,
            storageKey: storagePath,
            folder:
                folder ||
                `${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, "0")}`,
            tags,
            uploaderId,
            metadata: extractedMetadata,
        });

        // Generate image variants if requested and it's an image
        if (generateVariants && assetType === AssetType.Image) {
            await this.generateImageVariantsForAsset(asset.id, asset);
        }

        return asset;
    }

    /**
     * Generate a presigned URL for direct upload
     */
    async generatePresignedUploadUrl(
        filename: string,
        mimeType: string,
        folder?: string,
        expiresIn: number = 600,
    ) {
        const storagePath = this.generateStoragePath(filename, folder);

        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: storagePath,
            ContentType: mimeType,
        });

        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });

        return {
            signedUrl,
            key: storagePath,
            url: this.generateAssetUrl(storagePath),
        };
    }

    /**
     * Initiate a presigned URL upload flow
     * Creates a pending asset record and returns the presigned URL for direct upload
     */
    async initiateUpload(
        params: InitiateUploadParams,
    ): Promise<InitiateUploadResponse> {
        const {
            filename,
            mimeType,
            fileSize,
            uploaderId,
            title,
            altText,
            caption,
            description,
            folder,
            tags,
            metadata,
        } = params;

        // Generate unique slug
        const slug = await this.generateUniqueSlug(filename);

        // Generate storage path
        const storagePath = this.generateStoragePath(filename, folder);

        // Generate URL
        const url = this.generateAssetUrl(storagePath);

        // Determine asset type from MIME type
        const assetType = this.getAssetTypeFromMime(mimeType);

        // Create pending asset record
        const asset = await this.db.assets.create({
            data: {
                filename,
                title: title || path.parse(filename).name,
                slug,
                path: storagePath,
                url,
                mimeType,
                fileSize,
                type: assetType,
                altText,
                caption,
                description,
                remoteLocation: RemoteLocation.S3,
                bucketName: this.bucketName,
                storageKey: storagePath,
                folder:
                    folder ||
                    `${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, "0")}`,
                tags: tags || [],
                uploaderId,
                metadata: metadata || {},
                usageCount: 0,
                uploadStatus: UploadStatus.Pending,
            },
        });

        // Generate presigned URL with 10 minute expiration
        const expiresIn = 600;
        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: storagePath,
            ContentType: mimeType,
            ContentLength: fileSize,
        });

        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });

        return {
            assetId: asset.id,
            uploadUrl,
            storageKey: storagePath,
            expiresAt: new Date(Date.now() + expiresIn * 1000),
        };
    }

    /**
     * Process an uploaded asset (after file has been uploaded via presigned URL)
     * Extracts metadata, applies post-processing operations, generates variants if requested
     */
    async processUpload(assetId: string, params: ProcessUploadParams = {}) {
        const { generateThumbnail = false, postProcessings = [] } = params;

        // Get the asset
        const asset = await this.db.assets.findUnique({
            where: { id: assetId },
            include: {
                uploader: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                variants: true,
            },
        });

        if (!asset) {
            throw new Error("Asset not found");
        }

        // Verify upload status
        if (
            asset.uploadStatus !== UploadStatus.Pending &&
            asset.uploadStatus !== UploadStatus.Uploaded
        ) {
            if (asset.uploadStatus === UploadStatus.Completed) {
                // Already processed, just return the asset
                return asset;
            }
            throw new Error(`Invalid asset status: ${asset.uploadStatus}`);
        }

        // Update status to processing
        await this.db.assets.update({
            where: { id: assetId },
            data: { uploadStatus: UploadStatus.Processing },
        });

        try {
            // Verify file exists in S3
            const headCommand = new HeadObjectCommand({
                Bucket: this.bucketName,
                Key: asset.storageKey!,
            });

            let actualFileSize: number;
            try {
                const headResponse = await s3Client.send(headCommand);
                actualFileSize = headResponse.ContentLength || asset.fileSize;
            } catch (error) {
                // File doesn't exist in S3
                await this.db.assets.update({
                    where: { id: assetId },
                    data: {
                        uploadStatus: UploadStatus.Failed,
                        statusMessage:
                            "File not found in storage. Upload may have failed.",
                    },
                });
                throw new Error(
                    "File not found in storage. Upload may have failed.",
                );
            }

            // Extract metadata for images
            let width: number | undefined;
            let height: number | undefined;
            let extractedMetadata: Record<string, any> =
                (asset.metadata as Record<string, any>) || {};

            if (asset.type === AssetType.Image) {
                try {
                    // Download file for metadata extraction
                    const getCommand = new GetObjectCommand({
                        Bucket: this.bucketName,
                        Key: asset.storageKey!,
                    });

                    const response = await s3Client.send(getCommand);
                    const arrayBuffer =
                        await response.Body?.transformToByteArray();

                    if (arrayBuffer) {
                        const buffer = Buffer.from(arrayBuffer);
                        const imageMetadata =
                            await this.imageService.getMetadata(buffer);
                        width = imageMetadata.width;
                        height = imageMetadata.height;

                        extractedMetadata = {
                            ...extractedMetadata,
                            imageMetadata: {
                                format: imageMetadata.format,
                                space: imageMetadata.space,
                                channels: imageMetadata.channels,
                                hasAlpha: imageMetadata.hasAlpha,
                                orientation: imageMetadata.orientation,
                                isProgressive: imageMetadata.isProgressive,
                            },
                        };
                    }
                } catch (error) {
                    console.error("Failed to extract image metadata:", error);
                }
            }

            // Apply post-processing operations if provided (only for images)
            // Track if we need to update file path info due to format conversion
            let newStorageKey: string | undefined;
            let newFilename: string | undefined;
            let newMimeType: string | undefined;
            let newUrl: string | undefined;
            let newSlug: string | undefined;

            if (postProcessings.length > 0 && asset.type === AssetType.Image) {
                try {
                    const processedResult = await this.applyPostProcessingChain(
                        asset.storageKey!,
                        postProcessings,
                    );

                    // Update dimensions if they changed
                    if (processedResult.width) width = processedResult.width;
                    if (processedResult.height) height = processedResult.height;

                    // Update file size
                    actualFileSize = processedResult.fileSize;

                    // Record post-processing in metadata
                    extractedMetadata = {
                        ...extractedMetadata,
                        postProcessingApplied: postProcessings,
                    };

                    // Handle format conversion - update storage key, filename, URL, etc.
                    if (processedResult.newStorageKey) {
                        newStorageKey = processedResult.newStorageKey;
                        newFilename = processedResult.newFilename;
                        newMimeType = processedResult.newMimeType;
                        newUrl = this.generateAssetUrl(newStorageKey);

                        // Generate new slug based on new filename
                        const slugBase = newFilename!.replace(/\.[^/.]+$/, "");
                        newSlug = await this.generateUniqueSlug(slugBase);
                    } else if (processedResult.newMimeType) {
                        // MimeType changed but extension didn't (shouldn't happen, but handle it)
                        newMimeType = processedResult.newMimeType;
                    }
                } catch (error) {
                    console.error("Failed to apply post-processing:", error);
                    // Continue without post-processing - don't fail the whole upload
                    extractedMetadata = {
                        ...extractedMetadata,
                        postProcessingError:
                            error instanceof Error
                                ? error.message
                                : "Post-processing failed",
                    };
                }
            }

            // Update asset with extracted metadata and potentially new file info
            const updatedAsset = await this.db.assets.update({
                where: { id: assetId },
                data: {
                    fileSize: actualFileSize,
                    width,
                    height,
                    metadata: extractedMetadata,
                    uploadStatus: UploadStatus.Completed,
                    statusMessage: null,
                    // Update file path info if format was converted
                    ...(newStorageKey && {
                        storageKey: newStorageKey,
                        path: newStorageKey,
                        url: newUrl,
                        filename: newFilename,
                        slug: newSlug,
                    }),
                    ...(newMimeType && { mimeType: newMimeType }),
                },
                include: {
                    uploader: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    variants: true,
                },
            });

            // Generate thumbnail if requested and it's an image
            if (generateThumbnail && asset.type === AssetType.Image) {
                await this.generateImageVariantsForAsset(assetId, updatedAsset, [
                    "thumbnail",
                ]);
            }

            // Fetch the final asset with variants
            return await this.db.assets.findUnique({
                where: { id: assetId },
                include: {
                    uploader: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    variants: true,
                },
            });
        } catch (error) {
            // Update status to failed
            await this.db.assets.update({
                where: { id: assetId },
                data: {
                    uploadStatus: UploadStatus.Failed,
                    statusMessage:
                        error instanceof Error
                            ? error.message
                            : "Processing failed",
                },
            });
            throw error;
        }
    }

    /**
     * Apply a chain of post-processing operations to an image
     * Operations are applied in order to the original file in S3
     * @param storageKey - The S3 key of the file to process
     * @param operations - Array of post-processing operations to apply in order
     * @returns Object containing the new file size, dimensions, and potentially new storage key/mimeType
     */
    async applyPostProcessingChain(
        storageKey: string,
        operations: PostProcessingOperation[],
    ): Promise<{
        fileSize: number;
        width?: number;
        height?: number;
        newStorageKey?: string;
        newMimeType?: string;
        newFilename?: string;
    }> {
        if (operations.length === 0) {
            const headResponse = await s3Client.send(
                new HeadObjectCommand({
                    Bucket: this.bucketName,
                    Key: storageKey,
                }),
            );
            return { fileSize: headResponse.ContentLength || 0 };
        }

        // Download the original file
        const getCommand = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: storageKey,
        });

        const response = await s3Client.send(getCommand);
        const arrayBuffer = await response.Body?.transformToByteArray();

        if (!arrayBuffer) {
            throw new Error("Failed to download file for post-processing");
        }

        let buffer: Buffer = Buffer.from(arrayBuffer);
        let currentMimeType = response.ContentType || "image/jpeg";
        let newFormat: string | null = null;

        // Apply each operation in order
        for (const operation of operations) {
            switch (operation.type) {
                case "resize": {
                    const { width, height, fit } = operation.config;
                    if (width || height) {
                        buffer = Buffer.from(
                            await this.imageService.resize(buffer, {
                                width,
                                height,
                                fit: fit || "inside",
                                withoutEnlargement: true,
                            }),
                        );
                    }
                    break;
                }

                case "compress": {
                    const { quality } = operation.config;
                    buffer = Buffer.from(
                        await this.imageService.compress(buffer, {
                            quality: quality || 85,
                        }),
                    );
                    break;
                }

                case "convertFormat": {
                    const { format, quality } = operation.config;
                    buffer = Buffer.from(
                        await this.imageService.convertFormat(buffer, format, {
                            quality: quality || 85,
                        }),
                    );
                    currentMimeType = `image/${format}`;
                    newFormat = format;
                    break;
                }

                default:
                    console.warn(
                        `Unknown post-processing operation: ${(operation as any).type}`,
                    );
            }
        }

        // Get final metadata
        const finalMetadata = await this.imageService.getMetadata(buffer);

        // Determine if we need a new storage key (format changed)
        let finalStorageKey = storageKey;
        let newFilename: string | undefined;

        if (newFormat) {
            // Replace the extension in the storage key
            const oldExtension = path.extname(storageKey);
            const newExtension = `.${newFormat === "jpeg" ? "jpg" : newFormat}`;

            if (oldExtension.toLowerCase() !== newExtension.toLowerCase()) {
                finalStorageKey = storageKey.replace(
                    new RegExp(`${oldExtension.replace(".", "\\.")}$`, "i"),
                    newExtension,
                );
                newFilename = path.basename(finalStorageKey);

                // Upload to new key
                await this.uploadToS3(buffer, finalStorageKey, currentMimeType);

                // Delete the old file
                try {
                    await this.deleteFromS3(storageKey);
                } catch (error) {
                    console.warn(
                        `Failed to delete old file after format conversion: ${storageKey}`,
                        error,
                    );
                }

                return {
                    fileSize: buffer.length,
                    width: finalMetadata.width,
                    height: finalMetadata.height,
                    newStorageKey: finalStorageKey,
                    newMimeType: currentMimeType,
                    newFilename,
                };
            }
        }

        // Upload the processed file back to S3 (same key)
        await this.uploadToS3(buffer, storageKey, currentMimeType);

        return {
            fileSize: buffer.length,
            width: finalMetadata.width,
            height: finalMetadata.height,
        };
    }

    /**
     * Cancel a pending upload (delete the pending asset record)
     */
    async cancelUpload(assetId: string) {
        const asset = await this.db.assets.findUnique({
            where: { id: assetId },
        });

        if (!asset) {
            throw new Error("Asset not found");
        }

        if (asset.uploadStatus !== UploadStatus.Pending) {
            throw new Error("Can only cancel pending uploads");
        }

        // Try to delete the file from S3 if it exists
        try {
            await this.deleteFromS3(asset.storageKey!);
        } catch (error) {
            // Ignore errors - file might not exist yet
        }

        // Delete the asset record
        await this.db.assets.delete({
            where: { id: assetId },
        });
    }

    /**
     * Mark upload as completed (called after frontend confirms upload to S3)
     */
    async markUploadComplete(assetId: string) {
        const asset = await this.db.assets.findUnique({
            where: { id: assetId },
        });

        if (!asset) {
            throw new Error("Asset not found");
        }

        if (asset.uploadStatus !== UploadStatus.Pending) {
            throw new Error("Asset is not in pending status");
        }

        return await this.db.assets.update({
            where: { id: assetId },
            data: { uploadStatus: UploadStatus.Uploaded },
        });
    }

    /**
     * Get asset by ID
     */
    async getAssetById(id: string, includeDeleted: boolean = false) {
        return await this.db.assets.findFirst({
            where: {
                id,
                // Exclude soft-deleted assets unless explicitly included
                ...(includeDeleted ? {} : { deletedAt: NOT_DELETED_DATE }),
            },
            include: {
                uploader: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                variants: true,
            },
        });
    }

    /**
     * Get asset by slug
     */
    async getAssetBySlug(slug: string, includeDeleted: boolean = false) {
        return await this.db.assets.findFirst({
            where: {
                slug,
                // Exclude soft-deleted assets unless explicitly included
                ...(includeDeleted ? {} : { deletedAt: NOT_DELETED_DATE }),
            },
            include: {
                uploader: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                variants: true,
            },
        });
    }

    /**
     * List assets with filtering and pagination
     */
    async listAssets(params: ListAssetsParams = {}) {
        const {
            type,
            folder,
            tags,
            uploaderId,
            search,
            limit = 20,
            offset = 0,
            orderBy = "uploadedAt",
            orderDirection = "desc",
            includeDeleted = false,
        } = params;

        const where: Prisma.assetsWhereInput = includeDeleted
            ? {}
            : { deletedAt: NOT_DELETED_DATE };

        if (type) where.type = type;
        if (folder) where.folder = { contains: folder };
        if (uploaderId) where.uploaderId = uploaderId;
        if (tags && tags.length > 0) {
            where.tags = { hasSome: tags };
        }
        if (search) {
            where.OR = [
                { filename: { contains: search, mode: "insensitive" } },
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                { tags: { hasSome: [search] } },
            ];
        }

        const [assets, total] = await Promise.all([
            this.db.assets.findMany({
                where,
                include: {
                    uploader: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    variants: true,
                },
                orderBy: { [orderBy]: orderDirection },
                take: limit,
                skip: offset,
            }),
            this.db.assets.count({ where }),
        ]);

        return {
            assets,
            total,
            limit,
            offset,
            hasMore: offset + limit < total,
        };
    }

    /**
     * Update asset metadata
     */
    async updateAssetMetadata(id: string, params: UpdateAssetParams) {
        const asset = await this.getAssetById(id);
        if (!asset) {
            throw new Error("Asset not found");
        }

        const updateData: Prisma.assetsUpdateInput = {};

        if (params.title !== undefined) updateData.title = params.title;
        if (params.altText !== undefined) updateData.altText = params.altText;
        if (params.caption !== undefined) updateData.caption = params.caption;
        if (params.description !== undefined)
            updateData.description = params.description;
        if (params.folder !== undefined) updateData.folder = params.folder;
        if (params.tags !== undefined) updateData.tags = params.tags;
        if (params.metadata !== undefined) {
            updateData.metadata = params.metadata as Prisma.InputJsonValue;
        }

        // Handle slug update
        if (params.slug !== undefined && params.slug !== asset.slug) {
            const existingSlug = await this.db.assets.findUnique({
                where: { slug: params.slug },
            });
            if (existingSlug && existingSlug.id !== id) {
                throw new Error("Slug already exists");
            }
            updateData.slug = params.slug;
        }

        return await this.db.assets.update({
            where: { id },
            data: updateData,
            include: {
                uploader: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                variants: true,
            },
        });
    }

    /**
     * Rename asset file (changes filename and storage path)
     */
    async renameAsset(id: string, newFilename: string) {
        const asset = await this.getAssetById(id);
        if (!asset) {
            throw new Error("Asset not found");
        }

        const ext = path.extname(newFilename);
        const oldExt = path.extname(asset.filename);

        // Ensure extension matches
        const finalFilename = ext ? newFilename : `${newFilename}${oldExt}`;

        // Generate new storage path
        const newStoragePath = this.generateStoragePath(
            finalFilename,
            asset.folder || undefined,
        );

        // Copy file in S3
        if (asset.storageKey) {
            await this.copyInS3(asset.storageKey, newStoragePath);
            await this.deleteFromS3(asset.storageKey);
        }

        // Generate new URL
        const newUrl = this.generateAssetUrl(newStoragePath);

        // Generate new slug
        const newSlug = await this.generateUniqueSlug(finalFilename);

        // Update database
        const updatedAsset = await this.db.assets.update({
            where: { id },
            data: {
                filename: finalFilename,
                slug: newSlug,
                path: newStoragePath,
                url: newUrl,
                storageKey: newStoragePath,
            },
            include: {
                uploader: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                variants: true,
            },
        });

        return updatedAsset;
    }

    /**
     * Soft delete an asset
     */
    async softDeleteAsset(id: string) {
        const asset = await this.getAssetById(id);
        if (!asset) {
            throw new Error("Asset not found");
        }

        return await this.db.assets.update({
            where: { id },
            data: {
                deletedAt: Math.floor(Date.now() / 1000), // Mark as deleted with Unix timestamp
            },
        });
    }

    /**
     * Restore a soft-deleted asset
     */
    async restoreAsset(id: string) {
        const asset = await this.getAssetById(id, true);
        if (!asset) {
            throw new Error("Asset not found");
        }

        return await this.db.assets.update({
            where: { id },
            data: {
                deletedAt: NOT_DELETED_DATE, // Reset to "not deleted" state
            },
            include: {
                uploader: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                variants: true,
            },
        });
    }

    /**
     * Permanently delete an asset
     */
    async deleteAsset(id: string, permanent: boolean = false) {
        const asset = await this.getAssetById(id, true);
        if (!asset) {
            throw new Error("Asset not found");
        }

        if (permanent) {
            // Delete from S3
            if (asset.storageKey) {
                await this.deleteFromS3(asset.storageKey);
            }

            // Delete all variants from S3
            for (const variant of asset.variants) {
                await this.deleteFromS3(variant.path);
            }

            // Delete from database (cascade will delete variants)
            return await this.db.assets.delete({
                where: { id },
            });
        } else {
            // Soft delete
            return await this.softDeleteAsset(id);
        }
    }

    /**
     * Create an asset variant (e.g., thumbnail, medium, large)
     */
    async createAssetVariant(
        assetId: string,
        variantName: string,
        variantBuffer: Buffer,
        width?: number,
        height?: number,
    ) {
        const asset = await this.getAssetById(assetId);
        if (!asset) {
            throw new Error("Asset not found");
        }

        // Generate storage path for variant
        const ext = path.extname(asset.filename);
        const baseName = path.parse(asset.filename).name;
        const variantPath = `${path.dirname(asset.path)}/${baseName}-${variantName}${ext}`;

        // Upload variant to S3
        await this.uploadToS3(variantBuffer, variantPath, asset.mimeType);

        // Get variant file size
        const fileSize = variantBuffer.length;

        // Generate URL
        const url = this.generateAssetUrl(variantPath);

        // Create variant record
        return await this.db.assetVariant.create({
            data: {
                assetId,
                name: variantName,
                path: variantPath,
                url,
                width,
                height,
                fileSize,
            },
        });
    }

    /**
     * Create a custom cropped variant for an asset using exact coordinates
     * This is designed to work with react-advanced-cropper which provides
     * the exact pixel coordinates for the crop region.
     *
     * @param assetId - The ID of the asset to create the variant for
     * @param params - Custom crop parameters including variant name and coordinates
     * @returns The created variant record
     */
    async createCustomCroppedVariant(
        assetId: string,
        params: CustomCropVariantParams,
    ) {
        const asset = await this.getAssetById(assetId);
        if (!asset) {
            throw new Error("Asset not found");
        }

        if (asset.type !== AssetType.Image) {
            throw new Error("Asset is not an image");
        }

        if (!asset.storageKey) {
            throw new Error("Asset storage key not found");
        }

        // Download the original image from S3
        const command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: asset.storageKey,
        });

        const response = await s3Client.send(command);
        const originalBuffer = await this.streamToBuffer(response.Body as any);

        // Apply transforms and crop the image using ImageService
        const croppedBuffer = await this.imageService.cropWithTransforms(
            originalBuffer,
            params.coordinates as CustomCropOptions,
            params.transforms,
        );

        // Get metadata of the cropped image
        const croppedMetadata =
            await this.imageService.getMetadata(croppedBuffer);

        // Check if variant with this name already exists and delete it
        const existingVariant = await this.db.assetVariant.findFirst({
            where: {
                assetId,
                name: params.variantName,
            },
        });

        if (existingVariant) {
            // Delete existing variant from S3 and database
            try {
                await this.deleteFromS3(existingVariant.path);
            } catch (error) {
                console.warn(
                    `Failed to delete existing variant from S3: ${error}`,
                );
            }
            await this.db.assetVariant.delete({
                where: { id: existingVariant.id },
            });
        }

        // Create the variant record
        const variant = await this.createAssetVariant(
            assetId,
            params.variantName,
            croppedBuffer,
            croppedMetadata.width,
            croppedMetadata.height,
        );

        return variant;
    }

    /**
     * Generate image variants for an asset using ImageService
     * @param assetId - The ID of the asset to generate variants for
     * @param existingAsset - Optional asset object to avoid re-querying the database (useful when called right after creation)
     * @param presets - Array of preset names to generate variants for
     */
    async generateImageVariantsForAsset(
        assetId: string,
        existingAsset?: Prisma.assetsGetPayload<{
            include: {
                uploader: {
                    select: {
                        id: true;
                        name: true;
                        email: true;
                    };
                };
                variants: true;
            };
        }>,
        presets: (keyof typeof IMAGE_SIZE_PRESETS)[] = [
            "thumbnail",
            "medium",
            "large",
        ],
    ) {
        const asset = existingAsset || (await this.getAssetById(assetId));
        if (!asset) {
            throw new Error("Asset not found");
        }

        if (asset.type !== AssetType.Image) {
            throw new Error("Asset is not an image");
        }

        if (!asset.storageKey) {
            throw new Error("Asset storage key not found");
        }

        // Download the original image from S3
        const command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: asset.storageKey,
        });

        const response = await s3Client.send(command);
        const originalBuffer = await this.streamToBuffer(response.Body as any);

        // Generate variants using ImageService
        const variantBuffers = await this.imageService.generateVariants(
            originalBuffer,
            presets,
        );

        // Upload each variant
        const variants = [];
        for (const [presetName, variantBuffer] of Object.entries(
            variantBuffers,
        )) {
            try {
                // Get dimensions of the variant
                const variantMetadata =
                    await this.imageService.getMetadata(variantBuffer);

                const variant = await this.createAssetVariant(
                    assetId,
                    presetName,
                    variantBuffer,
                    variantMetadata.width,
                    variantMetadata.height,
                );

                variants.push(variant);
            } catch (error) {
                console.error(`Failed to create variant ${presetName}:`, error);
            }
        }

        return variants;
    }

    /**
     * Regenerate all variants for an image asset
     */
    async regenerateImageVariants(assetId: string) {
        const asset = await this.getAssetById(assetId);
        if (!asset) {
            throw new Error("Asset not found");
        }

        if (asset.type !== AssetType.Image) {
            throw new Error("Asset is not an image");
        }

        // Delete existing variants
        const existingVariants = await this.getAssetVariants(assetId);
        for (const variant of existingVariants) {
            await this.deleteAssetVariant(variant.id);
        }

        // Generate new variants
        return await this.generateImageVariantsForAsset(assetId);
    }

    /**
     * Resize an existing image asset
     */
    async resizeImageAsset(
        assetId: string,
        width?: number,
        height?: number,
        fit: "cover" | "contain" | "fill" | "inside" | "outside" = "inside",
    ) {
        const asset = await this.getAssetById(assetId);
        if (!asset) {
            throw new Error("Asset not found");
        }

        if (asset.type !== AssetType.Image) {
            throw new Error("Asset is not an image");
        }

        if (!asset.storageKey) {
            throw new Error("Asset storage key not found");
        }

        // Download the original image
        const command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: asset.storageKey,
        });

        const response = await s3Client.send(command);
        const originalBuffer = await this.streamToBuffer(response.Body as any);

        // Resize the image
        const resizedBuffer = await this.imageService.resize(originalBuffer, {
            width,
            height,
            fit,
        });

        // Get new dimensions
        const metadata = await this.imageService.getMetadata(resizedBuffer);

        // Upload resized image (replace original)
        await this.uploadToS3(resizedBuffer, asset.storageKey, asset.mimeType);

        // Update database record
        return await this.db.assets.update({
            where: { id: assetId },
            data: {
                width: metadata.width,
                height: metadata.height,
                fileSize: resizedBuffer.length,
            },
            include: {
                uploader: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                variants: true,
            },
        });
    }

    /**
     * Optimize an image asset (compress without changing dimensions)
     */
    async optimizeImageAsset(assetId: string, quality?: number) {
        const asset = await this.getAssetById(assetId);
        if (!asset) {
            throw new Error("Asset not found");
        }

        if (asset.type !== AssetType.Image) {
            throw new Error("Asset is not an image");
        }

        if (!asset.storageKey) {
            throw new Error("Asset storage key not found");
        }

        // Download the original image
        const command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: asset.storageKey,
        });

        const response = await s3Client.send(command);
        const originalBuffer = await this.streamToBuffer(response.Body as any);

        // Compress the image
        const compressedBuffer = await this.imageService.compress(
            originalBuffer,
            {
                quality,
            },
        );

        // Upload compressed image (replace original)
        await this.uploadToS3(
            compressedBuffer,
            asset.storageKey,
            asset.mimeType,
        );

        // Update file size in database
        return await this.db.assets.update({
            where: { id: assetId },
            data: {
                fileSize: compressedBuffer.length,
            },
            include: {
                uploader: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                variants: true,
            },
        });
    }

    /**
     * Convert image format
     */
    async convertImageFormat(
        assetId: string,
        format: "jpeg" | "png" | "webp" | "avif",
        quality?: number,
    ) {
        const asset = await this.getAssetById(assetId);
        if (!asset) {
            throw new Error("Asset not found");
        }

        if (asset.type !== AssetType.Image) {
            throw new Error("Asset is not an image");
        }

        if (!asset.storageKey) {
            throw new Error("Asset storage key not found");
        }

        // Download the original image
        const command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: asset.storageKey,
        });

        const response = await s3Client.send(command);
        const originalBuffer = await this.streamToBuffer(response.Body as any);

        // Convert format
        const convertedBuffer = await this.imageService.convertFormat(
            originalBuffer,
            format,
            { quality },
        );

        // Update filename extension
        const oldExt = path.extname(asset.filename);
        const newExt = `.${format === "jpeg" ? "jpg" : format}`;
        const newFilename = asset.filename.replace(oldExt, newExt);
        const newStorageKey = asset.storageKey.replace(oldExt, newExt);

        // Upload converted image to new path
        const newMimeType = `image/${format === "jpeg" ? "jpeg" : format}`;
        await this.uploadToS3(convertedBuffer, newStorageKey, newMimeType);

        // Delete old file
        await this.deleteFromS3(asset.storageKey);

        // Generate new URL
        const newUrl = this.generateAssetUrl(newStorageKey);

        // Update database record
        return await this.db.assets.update({
            where: { id: assetId },
            data: {
                filename: newFilename,
                path: newStorageKey,
                url: newUrl,
                mimeType: newMimeType,
                storageKey: newStorageKey,
                fileSize: convertedBuffer.length,
            },
            include: {
                uploader: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                variants: true,
            },
        });
    }

    /**
     * Helper to convert stream to buffer
     */
    private async streamToBuffer(stream: any): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            stream.on("data", (chunk: Buffer) => chunks.push(chunk));
            stream.on("error", reject);
            stream.on("end", () => resolve(Buffer.concat(chunks)));
        });
    }

    /**
     * Get or create asset variants
     */
    async getAssetVariants(assetId: string) {
        return await this.db.assetVariant.findMany({
            where: { assetId },
            orderBy: { createdAt: "asc" },
        });
    }

    /**
     * Delete an asset variant
     */
    async deleteAssetVariant(variantId: string) {
        const variant = await this.db.assetVariant.findUnique({
            where: { id: variantId },
        });

        if (!variant) {
            throw new Error("Variant not found");
        }

        // Delete from S3
        await this.deleteFromS3(variant.path);

        // Delete from database
        return await this.db.assetVariant.delete({
            where: { id: variantId },
        });
    }

    /**
     * Delete an asset variant by asset ID and variant name
     */
    async deleteAssetVariantByName(assetId: string, variantName: string) {
        const variant = await this.db.assetVariant.findFirst({
            where: {
                assetId,
                name: variantName,
            },
        });

        if (!variant) {
            throw new Error("Variant not found");
        }

        // Delete from S3
        await this.deleteFromS3(variant.path);

        // Delete from database
        return await this.db.assetVariant.delete({
            where: { id: variant.id },
        });
    }

    /**
     * Increment usage count
     */
    async incrementUsageCount(id: string) {
        return await this.db.assets.update({
            where: { id },
            data: {
                usageCount: { increment: 1 },
                lastUsedAt: new Date(),
            },
        });
    }

    /**
     * Decrement usage count
     */
    async decrementUsageCount(id: string) {
        const asset = await this.getAssetById(id);
        if (!asset) {
            throw new Error("Asset not found");
        }

        return await this.db.assets.update({
            where: { id },
            data: {
                usageCount: Math.max(0, asset.usageCount - 1),
            },
        });
    }

    /**
     * Get asset statistics
     */
    async getAssetStats(uploaderId?: string) {
        const where: Prisma.assetsWhereInput = {
            deletedAt: NOT_DELETED_DATE, // Only count non-deleted assets
        };

        if (uploaderId) {
            where.uploaderId = uploaderId;
        }

        const [
            totalAssets,
            totalSize,
            imageCount,
            videoCount,
            documentCount,
            otherCount,
        ] = await Promise.all([
            this.db.assets.count({ where }),
            this.db.assets.aggregate({
                where,
                _sum: { fileSize: true },
            }),
            this.db.assets.count({
                where: { ...where, type: AssetType.Image },
            }),
            this.db.assets.count({
                where: { ...where, type: AssetType.Video },
            }),
            this.db.assets.count({
                where: { ...where, type: AssetType.Document },
            }),
            this.db.assets.count({
                where: {
                    ...where,
                    type: {
                        notIn: [
                            AssetType.Image,
                            AssetType.Video,
                            AssetType.Document,
                        ],
                    },
                },
            }),
        ]);

        return {
            totalAssets,
            totalSize: totalSize._sum.fileSize || 0,
            breakdown: {
                images: imageCount,
                videos: videoCount,
                documents: documentCount,
                others: otherCount,
            },
        };
    }

    /**
     * Search assets by tags
     */
    async searchByTags(tags: string[], limit: number = 20) {
        return await this.db.assets.findMany({
            where: {
                tags: { hasSome: tags },
                deletedAt: NOT_DELETED_DATE,
            },
            include: {
                uploader: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                variants: true,
            },
            take: limit,
            orderBy: { uploadedAt: "desc" },
        });
    }

    /**
     * Get recently uploaded assets
     */
    async getRecentAssets(limit: number = 10, uploaderId?: string) {
        const where: Prisma.assetsWhereInput = {
            deletedAt: NOT_DELETED_DATE,
        };

        if (uploaderId) {
            where.uploaderId = uploaderId;
        }

        return await this.db.assets.findMany({
            where,
            include: {
                uploader: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                variants: true,
            },
            orderBy: { uploadedAt: "desc" },
            take: limit,
        });
    }

    /**
     * Bulk delete assets
     */
    async bulkDeleteAssets(ids: string[], permanent: boolean = false) {
        const results = await Promise.allSettled(
            ids.map((id) => this.deleteAsset(id, permanent)),
        );

        return {
            successful: results.filter((r) => r.status === "fulfilled").length,
            failed: results.filter((r) => r.status === "rejected").length,
            results,
        };
    }

    /**
     * Bulk update asset tags
     */
    async bulkUpdateTags(
        ids: string[],
        tags: string[],
        mode: "add" | "remove" | "replace" = "add",
    ) {
        const assets = await this.db.assets.findMany({
            where: { id: { in: ids } },
            select: { id: true, tags: true },
        });

        const updates = assets.map((asset) => {
            let newTags: string[] = [];

            if (mode === "add") {
                newTags = Array.from(new Set([...asset.tags, ...tags]));
            } else if (mode === "remove") {
                newTags = asset.tags.filter((tag) => !tags.includes(tag));
            } else {
                newTags = tags;
            }

            return this.db.assets.update({
                where: { id: asset.id },
                data: { tags: newTags },
            });
        });

        await Promise.all(updates);

        return { updated: updates.length };
    }
}

// Export a singleton instance
export const assetService = new AssetService();
