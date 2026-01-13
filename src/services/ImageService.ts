// ImageService handles all image manipulation operations using Sharp.
// Provides utilities for format conversion, resizing, cropping, compression, and more.
// Optimized for Vercel serverless environment with memory and timeout considerations.

import sharp, { Sharp, ResizeOptions } from "sharp";

// Supported image formats
export type ImageFormat = "jpeg" | "png" | "webp" | "avif" | "gif" | "tiff";

// Resize modes
export type ResizeMode =
    | "cover" // Crop to cover both dimensions (default)
    | "contain" // Maintain aspect ratio, fit within dimensions
    | "fill" // Stretch to fill dimensions (may distort)
    | "inside" // Resize to fit inside dimensions
    | "outside"; // Resize to fit outside dimensions

// Fit positions for cropping
export type FitPosition =
    | "center"
    | "top"
    | "right top"
    | "right"
    | "right bottom"
    | "bottom"
    | "left bottom"
    | "left"
    | "left top"
    | "north"
    | "northeast"
    | "east"
    | "southeast"
    | "south"
    | "southwest"
    | "west"
    | "northwest"
    | "centre"
    | "entropy"
    | "attention";

// Image processing options
export interface ProcessImageOptions {
    format?: ImageFormat;
    quality?: number; // 1-100
    width?: number;
    height?: number;
    fit?: ResizeMode;
    position?: FitPosition;
    background?: string; // CSS color string
    withoutEnlargement?: boolean;
    fastShrinkOnLoad?: boolean;
}

// Compression options
export interface CompressionOptions {
    quality?: number; // 1-100
    progressive?: boolean; // For JPEG
    compressionLevel?: number; // For PNG (0-9)
    effort?: number; // For WebP/AVIF (0-9)
    lossless?: boolean; // For WebP
}

// Crop options
export interface CropOptions {
    width: number;
    height: number;
    left?: number;
    top?: number;
    position?: FitPosition;
}

// Custom crop options with exact coordinates (from react-advanced-cropper)
export interface CustomCropOptions {
    left: number;
    top: number;
    width: number;
    height: number;
}

// Resize options
export interface ResizeImageOptions {
    width?: number;
    height?: number;
    fit?: ResizeMode;
    position?: FitPosition;
    background?: string;
    withoutEnlargement?: boolean;
    kernel?: "nearest" | "cubic" | "mitchell" | "lanczos2" | "lanczos3";
}

// Watermark options
export interface WatermarkOptions {
    position?:
        | "top-left"
        | "top"
        | "top-right"
        | "left"
        | "center"
        | "right"
        | "bottom-left"
        | "bottom"
        | "bottom-right";
    opacity?: number; // 0-1
    margin?: number; // pixels from edge
}

// Image metadata
export interface ImageMetadata {
    format?: string;
    width?: number;
    height?: number;
    space?: string;
    channels?: number;
    depth?: string;
    density?: number;
    hasAlpha?: boolean;
    orientation?: number;
    isProgressive?: boolean;
    pages?: number;
    pageHeight?: number;
    hasProfile?: boolean;
    size?: number;
}

// WordPress-like image size presets
export const IMAGE_SIZE_PRESETS = {
    thumbnail: { width: 150, height: 150, fit: "cover" as ResizeMode },
    medium: { width: 300, height: 300, fit: "inside" as ResizeMode },
    medium_large: { width: 768, height: 0, fit: "inside" as ResizeMode },
    large: { width: 1024, height: 1024, fit: "inside" as ResizeMode },
    "2048x2048": { width: 2048, height: 2048, fit: "inside" as ResizeMode },
} as const;

// Default compression settings per format
const DEFAULT_COMPRESSION = {
    jpeg: { quality: 85, progressive: true },
    png: { compressionLevel: 9, progressive: false },
    webp: { quality: 85, effort: 4, lossless: false },
    avif: { quality: 80, effort: 4 },
    gif: { progressive: false },
    tiff: { quality: 85 },
} as const;

export class ImageService {
    /**
     * Create a Sharp instance from buffer or file path
     */
    private createSharpInstance(input: Buffer | string): Sharp {
        return sharp(input, {
            failOnError: false,
            unlimited: false, // Prevent processing extremely large images
        });
    }

    /**
     * Get image metadata
     */
    async getMetadata(input: Buffer | string): Promise<ImageMetadata> {
        const instance = this.createSharpInstance(input);
        const metadata = await instance.metadata();

        return {
            format: metadata.format,
            width: metadata.width,
            height: metadata.height,
            space: metadata.space,
            channels: metadata.channels,
            depth: metadata.depth,
            density: metadata.density,
            hasAlpha: metadata.hasAlpha,
            orientation: metadata.orientation,
            isProgressive: metadata.isProgressive,
            pages: metadata.pages,
            pageHeight: metadata.pageHeight,
            hasProfile: metadata.hasProfile,
            size: metadata.size,
        };
    }

    /**
     * Resize an image
     */
    async resize(
        input: Buffer | string,
        options: ResizeImageOptions,
    ): Promise<Buffer> {
        const instance = this.createSharpInstance(input);

        const resizeOptions: ResizeOptions = {
            width: options.width,
            height: options.height,
            fit: options.fit || "cover",
            position: options.position || "center",
            background: options.background || {
                r: 255,
                g: 255,
                b: 255,
                alpha: 0,
            },
            withoutEnlargement: options.withoutEnlargement ?? true,
            kernel: options.kernel || "lanczos3",
        };

        return await instance.resize(resizeOptions).toBuffer();
    }

    /**
     * Crop an image to specific dimensions
     */
    async crop(input: Buffer | string, options: CropOptions): Promise<Buffer> {
        const instance = this.createSharpInstance(input);

        if (options.left !== undefined && options.top !== undefined) {
            // Manual crop with exact coordinates
            return await instance
                .extract({
                    left: options.left,
                    top: options.top,
                    width: options.width,
                    height: options.height,
                })
                .toBuffer();
        } else {
            // Smart crop using resize with cover fit
            return await instance
                .resize({
                    width: options.width,
                    height: options.height,
                    fit: "cover",
                    position: options.position || "center",
                })
                .toBuffer();
        }
    }

    /**
     * Convert image format
     */
    async convertFormat(
        input: Buffer | string,
        format: ImageFormat,
        options?: CompressionOptions,
    ): Promise<Buffer> {
        const instance = this.createSharpInstance(input);

        switch (format) {
            case "jpeg":
                return await instance
                    .jpeg({
                        quality:
                            options?.quality ??
                            DEFAULT_COMPRESSION.jpeg.quality,
                        progressive:
                            options?.progressive ??
                            DEFAULT_COMPRESSION.jpeg.progressive,
                    })
                    .toBuffer();

            case "png":
                return await instance
                    .png({
                        compressionLevel:
                            options?.compressionLevel ??
                            DEFAULT_COMPRESSION.png.compressionLevel,
                        progressive:
                            options?.progressive ??
                            DEFAULT_COMPRESSION.png.progressive,
                    })
                    .toBuffer();

            case "webp":
                return await instance
                    .webp({
                        quality:
                            options?.quality ??
                            DEFAULT_COMPRESSION.webp.quality,
                        effort:
                            options?.effort ?? DEFAULT_COMPRESSION.webp.effort,
                        lossless:
                            options?.lossless ??
                            DEFAULT_COMPRESSION.webp.lossless,
                    })
                    .toBuffer();

            case "avif":
                return await instance
                    .avif({
                        quality:
                            options?.quality ??
                            DEFAULT_COMPRESSION.avif.quality,
                        effort:
                            options?.effort ?? DEFAULT_COMPRESSION.avif.effort,
                    })
                    .toBuffer();

            case "gif":
                return await instance.gif().toBuffer();

            case "tiff":
                return await instance
                    .tiff({
                        quality:
                            options?.quality ??
                            DEFAULT_COMPRESSION.tiff.quality,
                    })
                    .toBuffer();

            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }

    /**
     * Compress image (maintain format but optimize size)
     */
    async compress(
        input: Buffer | string,
        options?: CompressionOptions,
    ): Promise<Buffer> {
        const instance = this.createSharpInstance(input);
        const metadata = await instance.metadata();
        const format = metadata.format as ImageFormat;

        if (!format) {
            throw new Error("Could not determine image format");
        }

        return await this.convertFormat(input, format, options);
    }

    /**
     * Process image with multiple operations in one go
     */
    async process(
        input: Buffer | string,
        options: ProcessImageOptions,
    ): Promise<Buffer> {
        let instance = this.createSharpInstance(input);

        // Apply resize if dimensions provided
        if (options.width || options.height) {
            instance = instance.resize({
                width: options.width,
                height: options.height,
                fit: options.fit || "cover",
                position: options.position || "center",
                background: options.background || {
                    r: 255,
                    g: 255,
                    b: 255,
                    alpha: 0,
                },
                withoutEnlargement: options.withoutEnlargement ?? true,
                fastShrinkOnLoad: options.fastShrinkOnLoad ?? true,
            });
        }

        // Apply format conversion and compression
        if (options.format) {
            const formatDefaults = DEFAULT_COMPRESSION[options.format];
            const quality =
                options.quality ??
                ("quality" in formatDefaults ? formatDefaults.quality : 85);

            switch (options.format) {
                case "jpeg":
                    instance = instance.jpeg({
                        quality,
                        progressive: true,
                    });
                    break;
                case "png":
                    instance = instance.png({
                        compressionLevel: 9,
                    });
                    break;
                case "webp":
                    instance = instance.webp({
                        quality,
                        effort: 4,
                    });
                    break;
                case "avif":
                    instance = instance.avif({
                        quality,
                        effort: 4,
                    });
                    break;
                case "gif":
                    instance = instance.gif();
                    break;
                case "tiff":
                    instance = instance.tiff({ quality });
                    break;
            }
        }

        return await instance.toBuffer();
    }

    /**
     * Generate multiple variants from preset sizes
     */
    async generateVariants(
        input: Buffer | string,
        presets: (keyof typeof IMAGE_SIZE_PRESETS)[] = [
            "thumbnail",
            "medium",
            "large",
        ],
    ): Promise<Record<string, Buffer>> {
        const variants: Record<string, Buffer> = {};

        for (const preset of presets) {
            const config = IMAGE_SIZE_PRESETS[preset];
            variants[preset] = await this.resize(input, {
                width: config.width || undefined,
                height: config.height || undefined,
                fit: config.fit,
            });
        }

        return variants;
    }

    /**
     * Generate custom variants with specific sizes
     */
    async generateCustomVariants(
        input: Buffer | string,
        sizes: Array<{ name: string; options: ResizeImageOptions }>,
    ): Promise<Record<string, Buffer>> {
        const variants: Record<string, Buffer> = {};

        for (const size of sizes) {
            variants[size.name] = await this.resize(input, size.options);
        }

        return variants;
    }

    /**
     * Crop image with exact coordinates (for react-advanced-cropper integration)
     * This method takes the coordinates returned by react-advanced-cropper and
     * crops the image accordingly using Sharp's extract method.
     *
     * @param input - Image buffer or file path
     * @param coordinates - Exact crop coordinates { left, top, width, height }
     * @returns Cropped image buffer
     */
    async cropWithCoordinates(
        input: Buffer | string,
        coordinates: CustomCropOptions,
    ): Promise<Buffer> {
        const instance = this.createSharpInstance(input);

        // Get original image metadata to validate coordinates
        const metadata = await instance.metadata();
        const imageWidth = metadata.width || 0;
        const imageHeight = metadata.height || 0;

        // Validate and clamp coordinates to image bounds
        const left = Math.max(
            0,
            Math.min(Math.round(coordinates.left), imageWidth - 1),
        );
        const top = Math.max(
            0,
            Math.min(Math.round(coordinates.top), imageHeight - 1),
        );
        const width = Math.max(
            1,
            Math.min(Math.round(coordinates.width), imageWidth - left),
        );
        const height = Math.max(
            1,
            Math.min(Math.round(coordinates.height), imageHeight - top),
        );

        return await this.createSharpInstance(input)
            .extract({
                left,
                top,
                width,
                height,
            })
            .toBuffer();
    }

    /**
     * Crop and resize image in one operation
     * First crops to the specified coordinates, then resizes to target dimensions
     *
     * @param input - Image buffer or file path
     * @param coordinates - Exact crop coordinates { left, top, width, height }
     * @param targetSize - Optional target dimensions to resize the cropped image
     * @returns Cropped (and optionally resized) image buffer
     */
    async cropAndResize(
        input: Buffer | string,
        coordinates: CustomCropOptions,
        targetSize?: { width?: number; height?: number; fit?: ResizeMode },
    ): Promise<Buffer> {
        // First, crop the image
        const croppedBuffer = await this.cropWithCoordinates(
            input,
            coordinates,
        );

        // If target size is specified, resize the cropped image
        if (targetSize && (targetSize.width || targetSize.height)) {
            return await this.resize(croppedBuffer, {
                width: targetSize.width,
                height: targetSize.height,
                fit: targetSize.fit || "inside",
            });
        }

        return croppedBuffer;
    }

    /**
     * Rotate image
     */
    async rotate(
        input: Buffer | string,
        angle: number,
        background?: string,
    ): Promise<Buffer> {
        const instance = this.createSharpInstance(input);

        return await instance
            .rotate(angle, {
                background: background || { r: 255, g: 255, b: 255, alpha: 0 },
            })
            .toBuffer();
    }

    /**
     * Flip image (vertical)
     */
    async flip(input: Buffer | string): Promise<Buffer> {
        const instance = this.createSharpInstance(input);
        return await instance.flip().toBuffer();
    }

    /**
     * Flop image (horizontal)
     */
    async flop(input: Buffer | string): Promise<Buffer> {
        const instance = this.createSharpInstance(input);
        return await instance.flop().toBuffer();
    }

    /**
     * Sharpen image
     */
    async sharpen(
        input: Buffer | string,
        sigma: number = 1,
        flat: number = 1,
        jagged: number = 2,
    ): Promise<Buffer> {
        const instance = this.createSharpInstance(input);
        return await instance.sharpen(sigma, flat, jagged).toBuffer();
    }

    /**
     * Blur image
     */
    async blur(input: Buffer | string, sigma: number = 5): Promise<Buffer> {
        const instance = this.createSharpInstance(input);
        return await instance.blur(sigma).toBuffer();
    }

    /**
     * Convert to grayscale
     */
    async grayscale(input: Buffer | string): Promise<Buffer> {
        const instance = this.createSharpInstance(input);
        return await instance.grayscale().toBuffer();
    }

    /**
     * Normalize image (enhance contrast)
     */
    async normalize(input: Buffer | string): Promise<Buffer> {
        const instance = this.createSharpInstance(input);
        return await instance.normalize().toBuffer();
    }

    /**
     * Add watermark to image
     */
    async addWatermark(
        input: Buffer | string,
        watermark: Buffer | string,
        options?: WatermarkOptions,
    ): Promise<Buffer> {
        const instance = this.createSharpInstance(input);
        const metadata = await instance.metadata();
        const watermarkInstance = this.createSharpInstance(watermark);
        const watermarkMetadata = await watermarkInstance.metadata();

        // Calculate position
        const margin = options?.margin ?? 10;
        let left = 0;
        let top = 0;

        const imageWidth = metadata.width || 0;
        const imageHeight = metadata.height || 0;
        const wmWidth = watermarkMetadata.width || 0;
        const wmHeight = watermarkMetadata.height || 0;

        switch (options?.position || "bottom-right") {
            case "top-left":
                left = margin;
                top = margin;
                break;
            case "top":
                left = Math.floor((imageWidth - wmWidth) / 2);
                top = margin;
                break;
            case "top-right":
                left = imageWidth - wmWidth - margin;
                top = margin;
                break;
            case "left":
                left = margin;
                top = Math.floor((imageHeight - wmHeight) / 2);
                break;
            case "center":
                left = Math.floor((imageWidth - wmWidth) / 2);
                top = Math.floor((imageHeight - wmHeight) / 2);
                break;
            case "right":
                left = imageWidth - wmWidth - margin;
                top = Math.floor((imageHeight - wmHeight) / 2);
                break;
            case "bottom-left":
                left = margin;
                top = imageHeight - wmHeight - margin;
                break;
            case "bottom":
                left = Math.floor((imageWidth - wmWidth) / 2);
                top = imageHeight - wmHeight - margin;
                break;
            case "bottom-right":
                left = imageWidth - wmWidth - margin;
                top = imageHeight - wmHeight - margin;
                break;
        }

        // Prepare watermark with opacity
        let watermarkBuffer = await watermarkInstance.toBuffer();
        if (options?.opacity !== undefined && options.opacity < 1) {
            watermarkBuffer = await sharp(watermarkBuffer)
                .composite([
                    {
                        input: Buffer.from([
                            255,
                            255,
                            255,
                            Math.floor(255 * options.opacity),
                        ]),
                        raw: {
                            width: 1,
                            height: 1,
                            channels: 4,
                        },
                        tile: true,
                        blend: "dest-in",
                    },
                ])
                .toBuffer();
        }

        return await instance
            .composite([
                {
                    input: watermarkBuffer,
                    top,
                    left,
                },
            ])
            .toBuffer();
    }

    /**
     * Optimize image for web (smart compression and format selection)
     */
    async optimizeForWeb(
        input: Buffer | string,
        maxWidth: number = 2048,
        maxHeight: number = 2048,
    ): Promise<{
        jpeg: Buffer;
        webp: Buffer;
        avif: Buffer;
        metadata: ImageMetadata;
    }> {
        const metadata = await this.getMetadata(input);
        let processedInput = input;

        // Resize if image is too large
        if (
            metadata.width &&
            metadata.height &&
            (metadata.width > maxWidth || metadata.height > maxHeight)
        ) {
            processedInput = await this.resize(input, {
                width: maxWidth,
                height: maxHeight,
                fit: "inside",
                withoutEnlargement: true,
            });
        }

        // Generate optimized versions in different formats
        const [jpeg, webp, avif] = await Promise.all([
            this.convertFormat(processedInput, "jpeg", {
                quality: 85,
                progressive: true,
            }),
            this.convertFormat(processedInput, "webp", {
                quality: 85,
                effort: 4,
            }),
            this.convertFormat(processedInput, "avif", {
                quality: 80,
                effort: 4,
            }),
        ]);

        return { jpeg, webp, avif, metadata };
    }

    /**
     * Create a thumbnail with smart cropping (entropy or attention based)
     */
    async createThumbnail(
        input: Buffer | string,
        width: number = 150,
        height: number = 150,
        strategy: "entropy" | "attention" | "center" = "attention",
    ): Promise<Buffer> {
        const instance = this.createSharpInstance(input);

        return await instance
            .resize({
                width,
                height,
                fit: "cover",
                position: strategy,
            })
            .toBuffer();
    }

    /**
     * Extract a region from image
     */
    async extractRegion(
        input: Buffer | string,
        left: number,
        top: number,
        width: number,
        height: number,
    ): Promise<Buffer> {
        const instance = this.createSharpInstance(input);

        return await instance
            .extract({
                left,
                top,
                width,
                height,
            })
            .toBuffer();
    }

    /**
     * Auto-orient image based on EXIF data
     */
    async autoOrient(input: Buffer | string): Promise<Buffer> {
        const instance = this.createSharpInstance(input);
        return await instance.rotate().toBuffer();
    }

    /**
     * Remove alpha channel (transparency)
     */
    async removeAlpha(
        input: Buffer | string,
        background: string = "#FFFFFF",
    ): Promise<Buffer> {
        const instance = this.createSharpInstance(input);

        return await instance.flatten({ background }).toBuffer();
    }

    /**
     * Trim image (remove borders)
     */
    async trim(
        input: Buffer | string,
        threshold: number = 10,
    ): Promise<Buffer> {
        const instance = this.createSharpInstance(input);

        return await instance.trim({ threshold }).toBuffer();
    }

    /**
     * Get dominant color from image
     */
    async getDominantColor(input: Buffer | string): Promise<{
        r: number;
        g: number;
        b: number;
    }> {
        const instance = this.createSharpInstance(input);

        const { dominant } = await instance.stats();
        return dominant;
    }

    /**
     * Batch process multiple images with the same options
     */
    async batchProcess(
        inputs: Array<{ buffer: Buffer; name: string }>,
        options: ProcessImageOptions,
    ): Promise<Array<{ buffer: Buffer; name: string }>> {
        return await Promise.all(
            inputs.map(async ({ buffer, name }) => ({
                buffer: await this.process(buffer, options),
                name,
            })),
        );
    }
}

// Export a singleton instance
export const imageService = new ImageService();
