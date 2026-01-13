"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import {
    Cropper,
    CropperRef,
    CropperPreview,
    CropperPreviewRef,
} from "react-advanced-cropper";
import "react-advanced-cropper/dist/style.css";
import {
    Box,
    Button,
    TextField,
    Stack,
    Typography,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Slider,
    IconButton,
    Tooltip,
    Paper,
    CircularProgress,
} from "@mui/material";
import {
    RotateLeft,
    RotateRight,
    FlipRounded,
    AspectRatio,
    Refresh,
    ZoomIn,
    ZoomOut,
} from "@mui/icons-material";

// Types for crop coordinates that match react-advanced-cropper output
export interface CropCoordinates {
    left: number;
    top: number;
    width: number;
    height: number;
}

// Image transforms from react-advanced-cropper (flip and rotation)
export interface ImageTransforms {
    rotate: number; // 0, 90, 180, 270
    flipHorizontal: boolean;
    flipVertical: boolean;
}

// Props for the MediaCropper component
export interface MediaCropperProps {
    /**
     * Asset ID to load the image from (uses proxy endpoint)
     */
    assetId: string;
    /**
     * Initial variant name
     */
    initialVariantName?: string;
    /**
     * Callback when crop is confirmed with coordinates and transforms
     */
    onCropConfirm: (
        variantName: string,
        coordinates: CropCoordinates,
        transforms: ImageTransforms,
    ) => void;
    /**
     * Callback when crop is cancelled
     */
    onCancel: () => void;
    /**
     * Whether the cropper is currently processing
     */
    isProcessing?: boolean;
    /**
     * Optional existing variant names to validate against
     */
    existingVariantNames?: string[];
    /**
     * Original image dimensions for display
     */
    originalDimensions?: { width: number; height: number };
}

// Common aspect ratio presets
const ASPECT_RATIO_PRESETS = [
    { label: "Free", value: undefined },
    { label: "1:1 (Square)", value: 1 },
    { label: "4:3", value: 4 / 3 },
    { label: "3:4", value: 3 / 4 },
    { label: "16:9", value: 16 / 9 },
    { label: "9:16", value: 9 / 16 },
    { label: "3:2", value: 3 / 2 },
    { label: "2:3", value: 2 / 3 },
] as const;

/**
 * MediaCropper - A standalone image cropping component using react-advanced-cropper
 *
 * This component provides:
 * - Interactive image cropping with drag and resize
 * - Aspect ratio presets
 * - Zoom and rotation controls
 * - Live preview of the cropped area
 * - Variant naming for custom crop variants
 *
 * It returns the crop coordinates (not the actual cropped image) which can then
 * be sent to the backend API for server-side cropping using Sharp.
 */
export const MediaCropper: React.FC<MediaCropperProps> = ({
    assetId,
    initialVariantName = "",
    onCropConfirm,
    onCancel,
    isProcessing = false,
    existingVariantNames = [],
    originalDimensions,
}) => {
    const cropperRef = useRef<CropperRef>(null);
    const previewRef = useRef<CropperPreviewRef>(null);

    // State
    const [variantName, setVariantName] = useState(initialVariantName);
    const [aspectRatio, setAspectRatio] = useState<number | undefined>(
        undefined,
    );
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [flipHorizontal, setFlipHorizontal] = useState(false);
    const [flipVertical, setFlipVertical] = useState(false);
    const [cropDimensions, setCropDimensions] = useState<{
        width: number;
        height: number;
    } | null>(null);
    const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
    const [isLoadingImage, setIsLoadingImage] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Load image and convert to data URL to avoid CORS issues
    useEffect(() => {
        let cancelled = false;

        const loadImage = async () => {
            setIsLoadingImage(true);
            setLoadError(null);

            try {
                // Use proxy endpoint to bypass CORS
                const proxyUrl = `/api/v1/media/${assetId}/proxy`;
                const response = await fetch(proxyUrl, {
                    credentials: "include",
                });

                if (!response.ok) {
                    throw new Error(
                        `Failed to load image: ${response.statusText}`,
                    );
                }

                const blob = await response.blob();

                if (cancelled) return;

                // Convert blob to data URL
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (!cancelled) {
                        setImageDataUrl(reader.result as string);
                        setIsLoadingImage(false);
                    }
                };
                reader.onerror = () => {
                    if (!cancelled) {
                        setLoadError("Failed to read image data");
                        setIsLoadingImage(false);
                    }
                };
                reader.readAsDataURL(blob);
            } catch (error) {
                if (!cancelled) {
                    console.error("Error loading image:", error);
                    setLoadError(
                        error instanceof Error
                            ? error.message
                            : "Failed to load image",
                    );
                    setIsLoadingImage(false);
                }
            }
        };

        loadImage();

        return () => {
            cancelled = true;
        };
    }, [assetId]);

    // Validation
    const variantNameError = (() => {
        if (!variantName.trim()) {
            return "Variant name is required";
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(variantName)) {
            return "Only letters, numbers, underscores, and hyphens allowed";
        }
        if (variantName.length > 100) {
            return "Variant name must be at most 100 characters";
        }
        if (
            existingVariantNames
                .map((n) => n.toLowerCase())
                .includes(variantName.toLowerCase())
        ) {
            return "A variant with this name already exists (will be replaced)";
        }
        return null;
    })();

    const isValidName =
        variantNameError === null ||
        variantNameError ===
            "A variant with this name already exists (will be replaced)";

    // Handle cropper changes
    const handleChange = useCallback(() => {
        const cropper = cropperRef.current;
        if (cropper) {
            const coords = cropper.getCoordinates();
            if (coords) {
                setCropDimensions({
                    width: Math.round(coords.width),
                    height: Math.round(coords.height),
                });
            }

            // Update preview
            if (previewRef.current) {
                previewRef.current.refresh();
            }
        }
    }, []);

    // Handle confirm
    const handleConfirm = useCallback(() => {
        const cropper = cropperRef.current;
        if (!cropper || !isValidName) return;

        const coords = cropper.getCoordinates();
        if (!coords) return;

        const coordinates: CropCoordinates = {
            left: Math.round(coords.left),
            top: Math.round(coords.top),
            width: Math.round(coords.width),
            height: Math.round(coords.height),
        };

        const transforms: ImageTransforms = {
            rotate: rotation,
            flipHorizontal,
            flipVertical,
        };

        onCropConfirm(variantName.trim(), coordinates, transforms);
    }, [
        variantName,
        isValidName,
        onCropConfirm,
        rotation,
        flipHorizontal,
        flipVertical,
    ]);

    // Zoom controls
    const handleZoomIn = useCallback(() => {
        const cropper = cropperRef.current;
        if (cropper) {
            cropper.zoomImage(1.25);
            setZoom((prev) => Math.min(prev * 1.25, 5));
        }
    }, []);

    const handleZoomOut = useCallback(() => {
        const cropper = cropperRef.current;
        if (cropper) {
            cropper.zoomImage(0.8);
            setZoom((prev) => Math.max(prev * 0.8, 0.1));
        }
    }, []);

    const handleZoomChange = useCallback(
        (_: Event, value: number | number[]) => {
            const cropper = cropperRef.current;
            const newZoom = value as number;
            if (cropper && zoom !== newZoom) {
                const ratio = newZoom / zoom;
                cropper.zoomImage(ratio);
                setZoom(newZoom);
            }
        },
        [zoom],
    );

    // Rotation controls
    const handleRotateLeft = useCallback(() => {
        const cropper = cropperRef.current;
        if (cropper) {
            cropper.rotateImage(-90);
            setRotation((prev) => (prev - 90 + 360) % 360);
        }
    }, []);

    const handleRotateRight = useCallback(() => {
        const cropper = cropperRef.current;
        if (cropper) {
            cropper.rotateImage(90);
            setRotation((prev) => (prev + 90) % 360);
        }
    }, []);

    // Flip controls
    const handleFlipHorizontal = useCallback(() => {
        const cropper = cropperRef.current;
        if (cropper) {
            cropper.flipImage(true, false);
            setFlipHorizontal((prev) => !prev);
        }
    }, []);

    const handleFlipVertical = useCallback(() => {
        const cropper = cropperRef.current;
        if (cropper) {
            cropper.flipImage(false, true);
            setFlipVertical((prev) => !prev);
        }
    }, []);

    // Reset cropper
    const handleReset = useCallback(() => {
        const cropper = cropperRef.current;
        if (cropper) {
            cropper.reset();
            setZoom(1);
            setRotation(0);
            setFlipHorizontal(false);
            setFlipVertical(false);
        }
    }, []);

    // Handle aspect ratio change
    const handleAspectRatioChange = useCallback(
        (event: { target: { value: unknown } }) => {
            const value = event.target.value;
            setAspectRatio(value === "" ? undefined : (value as number));
        },
        [],
    );

    return (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {/* Loading or Error State */}
            {(isLoadingImage || loadError) && (
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: 400,
                        flex: 1,
                    }}
                >
                    {isLoadingImage ? (
                        <Stack spacing={2} alignItems="center">
                            <CircularProgress />
                            <Typography color="text.secondary">
                                Loading image...
                            </Typography>
                        </Stack>
                    ) : loadError ? (
                        <Alert severity="error" sx={{ maxWidth: 400 }}>
                            {loadError}
                        </Alert>
                    ) : null}
                </Box>
            )}

            {/* Main content area */}
            {!isLoadingImage && !loadError && imageDataUrl && (
                <Box sx={{ display: "flex", gap: 2, flex: 1, minHeight: 0 }}>
                    {/* Cropper area */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Paper
                            variant="outlined"
                            sx={{
                                height: "100%",
                                minHeight: 400,
                                bgcolor: "grey.900",
                                overflow: "hidden",
                                borderRadius: 1,
                            }}
                        >
                            <Cropper
                                ref={cropperRef}
                                src={imageDataUrl}
                                onChange={handleChange}
                                stencilProps={{
                                    aspectRatio: aspectRatio,
                                    grid: true,
                                }}
                                style={{
                                    height: "100%",
                                    width: "100%",
                                }}
                            />
                        </Paper>
                    </Box>

                    {/* Controls sidebar */}
                    <Box sx={{ width: 280, flexShrink: 0 }}>
                        <Stack spacing={2}>
                            {/* Variant name input */}
                            <TextField
                                label="Variant Name"
                                value={variantName}
                                onChange={(e) => setVariantName(e.target.value)}
                                error={
                                    !!variantNameError &&
                                    variantNameError !==
                                        "A variant with this name already exists (will be replaced)"
                                }
                                helperText={
                                    variantNameError ||
                                    "e.g., hero-banner, thumbnail-square"
                                }
                                size="small"
                                fullWidth
                                disabled={isProcessing}
                            />

                            {/* Aspect ratio selector */}
                            <FormControl size="small" fullWidth>
                                <InputLabel>Aspect Ratio</InputLabel>
                                <Select
                                    value={aspectRatio ?? ""}
                                    onChange={handleAspectRatioChange}
                                    label="Aspect Ratio"
                                    disabled={isProcessing}
                                >
                                    {ASPECT_RATIO_PRESETS.map((preset) => (
                                        <MenuItem
                                            key={preset.label}
                                            value={preset.value ?? ""}
                                        >
                                            {preset.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Zoom control */}
                            <Box>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    gutterBottom
                                >
                                    Zoom: {Math.round(zoom * 100)}%
                                </Typography>
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                    }}
                                >
                                    <IconButton
                                        size="small"
                                        onClick={handleZoomOut}
                                        disabled={isProcessing}
                                    >
                                        <ZoomOut fontSize="small" />
                                    </IconButton>
                                    <Slider
                                        value={zoom}
                                        onChange={handleZoomChange}
                                        min={0.1}
                                        max={5}
                                        step={0.1}
                                        size="small"
                                        disabled={isProcessing}
                                    />
                                    <IconButton
                                        size="small"
                                        onClick={handleZoomIn}
                                        disabled={isProcessing}
                                    >
                                        <ZoomIn fontSize="small" />
                                    </IconButton>
                                </Box>
                            </Box>

                            {/* Transform controls */}
                            <Box>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    gutterBottom
                                >
                                    Transform
                                </Typography>
                                <Box
                                    sx={{
                                        display: "flex",
                                        gap: 0.5,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <Tooltip title="Rotate Left 90°">
                                        <IconButton
                                            size="small"
                                            onClick={handleRotateLeft}
                                            disabled={isProcessing}
                                        >
                                            <RotateLeft />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Rotate Right 90°">
                                        <IconButton
                                            size="small"
                                            onClick={handleRotateRight}
                                            disabled={isProcessing}
                                        >
                                            <RotateRight />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Flip Horizontal">
                                        <IconButton
                                            size="small"
                                            onClick={handleFlipHorizontal}
                                            disabled={isProcessing}
                                        >
                                            <FlipRounded />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Flip Vertical">
                                        <IconButton
                                            size="small"
                                            onClick={handleFlipVertical}
                                            disabled={isProcessing}
                                            sx={{
                                                transform: "rotate(90deg)",
                                            }}
                                        >
                                            <FlipRounded />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Reset">
                                        <IconButton
                                            size="small"
                                            onClick={handleReset}
                                            disabled={isProcessing}
                                        >
                                            <Refresh />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </Box>

                            {/* Crop info */}
                            <Paper variant="outlined" sx={{ p: 1.5 }}>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    gutterBottom
                                >
                                    <AspectRatio
                                        fontSize="small"
                                        sx={{
                                            mr: 0.5,
                                            verticalAlign: "middle",
                                        }}
                                    />
                                    Crop Dimensions
                                </Typography>
                                {cropDimensions ? (
                                    <Typography
                                        variant="body2"
                                        fontWeight="medium"
                                    >
                                        {cropDimensions.width} ×{" "}
                                        {cropDimensions.height} px
                                    </Typography>
                                ) : (
                                    <Typography
                                        variant="body2"
                                        color="text.disabled"
                                    >
                                        Drag to select crop area
                                    </Typography>
                                )}
                                {originalDimensions && (
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        display="block"
                                        sx={{ mt: 0.5 }}
                                    >
                                        Original: {originalDimensions.width} ×{" "}
                                        {originalDimensions.height} px
                                    </Typography>
                                )}
                            </Paper>

                            {/* Preview */}
                            <Box>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    gutterBottom
                                >
                                    Preview
                                </Typography>
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        height: 150,
                                        bgcolor: "grey.100",
                                        overflow: "hidden",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <CropperPreview
                                        ref={previewRef}
                                        cropper={cropperRef}
                                        style={{
                                            maxWidth: "100%",
                                            maxHeight: "100%",
                                        }}
                                    />
                                </Paper>
                            </Box>

                            {/* Warning for existing variant */}
                            {variantNameError ===
                                "A variant with this name already exists (will be replaced)" && (
                                <Alert severity="warning" variant="outlined">
                                    This will replace the existing variant
                                </Alert>
                            )}
                        </Stack>
                    </Box>
                </Box>
            )}

            {/* Action buttons */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 1,
                    mt: 2,
                    pt: 2,
                    borderTop: 1,
                    borderColor: "divider",
                }}
            >
                <Button onClick={onCancel} disabled={isProcessing}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleConfirm}
                    disabled={
                        !isValidName ||
                        !cropDimensions ||
                        isProcessing ||
                        isLoadingImage ||
                        !!loadError
                    }
                    startIcon={
                        isProcessing ? (
                            <CircularProgress size={16} color="inherit" />
                        ) : undefined
                    }
                >
                    {isProcessing ? "Creating Variant..." : "Create Variant"}
                </Button>
            </Box>
        </Box>
    );
};

export default MediaCropper;
