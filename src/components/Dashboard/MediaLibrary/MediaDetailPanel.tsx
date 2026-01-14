import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    Stack,
    Divider,
    IconButton,
    Chip,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Tooltip,
    Collapse,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Alert,
} from "@mui/material";
import {
    Close,
    Download,
    Delete,
    ContentCopy,
    ExpandMore,
    ExpandLess,
    Image as ImageIcon,
    Compress,
    Transform,
    AutoFixHigh,
    Link as LinkIcon,
    Crop,
    OpenInNew,
} from "@mui/icons-material";
import {
    MediaDetailPanelProps,
    MediaItem,
    MediaUpdateParams,
    VariantPreset,
    ResizeFit,
    ImageFormat,
} from "./types";
import {
    formatFileSize,
    formatDate,
    getFileIcon,
    formatDimensions,
    formatDuration,
    getVariantsInfo,
    isImage,
    supportsImageProcessing,
    supportsVariants,
    copyToClipboard,
    downloadFile,
    formatVariantName,
} from "./utils";

/**
 * Helper component for displaying info rows in the detail panel
 */
const InfoRow: React.FC<{ label: string; value: string | React.ReactNode }> = ({
    label,
    value,
}) => (
    <Box
        sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
        }}
    >
        <Typography variant="body2" color="text.secondary">
            {label}:
        </Typography>
        <Typography variant="body2" fontWeight="medium" component="div">
            {value}
        </Typography>
    </Box>
);

/**
 * Media detail panel component
 * Shows detailed information, edit form, variants, and image processing actions
 * Always visible as a side panel - displays placeholder when no item selected
 */
export const MediaDetailPanel: React.FC<MediaDetailPanelProps> = ({
    item,
    onClose,
    onUpdate,
    onDelete,
    onDownload,
    onGenerateVariants,
    onDeleteVariant,
    onCustomCrop,
    onResize,
    onOptimize,
    onConvert,
    isProcessing = false,
}) => {
    // Form state
    const [title, setTitle] = useState("");
    const [altText, setAltText] = useState("");
    const [caption, setCaption] = useState("");
    const [description, setDescription] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // UI state
    const [variantsExpanded, setVariantsExpanded] = useState(true);
    const [processingExpanded, setProcessingExpanded] = useState(false);
    const [urlCopied, setUrlCopied] = useState(false);

    // Dialog state
    const [resizeDialogOpen, setResizeDialogOpen] = useState(false);
    const [optimizeDialogOpen, setOptimizeDialogOpen] = useState(false);
    const [convertDialogOpen, setConvertDialogOpen] = useState(false);
    const [variantsDialogOpen, setVariantsDialogOpen] = useState(false);

    // Processing form state
    const [resizeWidth, setResizeWidth] = useState<number | "">("");
    const [resizeHeight, setResizeHeight] = useState<number | "">("");
    const [resizeFit, setResizeFit] = useState<ResizeFit>("inside");
    const [optimizeQuality, setOptimizeQuality] = useState<number>(85);
    const [convertFormat, setConvertFormat] = useState<ImageFormat>("webp");
    const [convertQuality, setConvertQuality] = useState<number>(85);
    const [selectedPresets, setSelectedPresets] = useState<VariantPreset[]>([
        "thumbnail",
        "medium",
        "large",
    ]);

    // Reset form when item changes
    useEffect(() => {
        if (item) {
            setTitle(item.title || "");
            setAltText(item.altText || "");
            setCaption(item.caption || "");
            setDescription(item.description || "");
            setTags(item.tags || []);
            setIsEditing(false);
        }
    }, [item]);

    const handleSave = async () => {
        if (!item) return;

        setIsSaving(true);
        try {
            const updates: MediaUpdateParams = {
                title: title || undefined,
                altText: altText || undefined,
                caption: caption || undefined,
                description: description || undefined,
                tags,
            };
            await onUpdate(item.id, updates);
            setIsEditing(false);
        } catch {
            // Error handled by parent
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddTag = () => {
        if (newTag.trim() && !tags.includes(newTag.trim())) {
            setTags([...tags, newTag.trim()]);
            setNewTag("");
            setIsEditing(true);
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter((tag) => tag !== tagToRemove));
        setIsEditing(true);
    };

    const handleCopyUrl = async (url: string) => {
        const success = await copyToClipboard(url);
        if (success) {
            setUrlCopied(true);
            setTimeout(() => setUrlCopied(false), 2000);
        }
    };

    const handleResize = async () => {
        const width = resizeWidth || undefined;
        const height = resizeHeight || undefined;

        if (!width && !height) return;

        await onResize(width, height, resizeFit);
        setResizeDialogOpen(false);
    };

    const handleOptimize = async () => {
        await onOptimize(optimizeQuality);
        setOptimizeDialogOpen(false);
    };

    const handleConvert = async () => {
        await onConvert(convertFormat, convertQuality);
        setConvertDialogOpen(false);
    };

    const handleGenerateVariants = async () => {
        await onGenerateVariants(selectedPresets);
        setVariantsDialogOpen(false);
    };

    // If no item is selected, show empty state
    if (!item) {
        return (
            <Box
                sx={{
                    width: 400,
                    bgcolor: "white",
                    borderLeft: 1,
                    borderColor: "divider",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 2,
                }}
            >
                <Typography color="text.secondary" align="center">
                    Select a media item to view details
                </Typography>
            </Box>
        );
    }

    const Icon = getFileIcon(item.type);
    const variantsInfo = getVariantsInfo(item);

    return (
        <Box
            sx={{
                width: 400,
                bgcolor: "white",
                borderLeft: 1,
                borderColor: "divider",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    p: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: 1,
                    borderColor: "divider",
                }}
            >
                <Typography variant="h6" fontWeight="bold">
                    Media Details
                </Typography>
                <IconButton onClick={onClose}>
                    <Close />
                </IconButton>
            </Box>

            {/* Processing indicator */}
            {isProcessing && (
                <Alert severity="info" icon={<CircularProgress size={20} />}>
                    Processing...
                </Alert>
            )}

            {/* Content */}
            <Box sx={{ p: 3, overflowY: "auto", flex: 1 }}>
                <Stack spacing={3}>
                    {/* Preview - Fixed Height */}
                    <Paper
                        variant="outlined"
                        sx={{ overflow: "hidden", height: 200 }}
                    >
                        {isImage(item) && item.url ? (
                            <Box
                                component="img"
                                src={item.url}
                                alt={
                                    item.altText || item.title || item.filename
                                }
                                sx={{
                                    width: "100%",
                                    height: "100%",
                                    display: "block",
                                    objectFit: "contain",
                                    bgcolor: "grey.100",
                                }}
                            />
                        ) : (
                            <Box
                                sx={{
                                    height: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    bgcolor: "grey.100",
                                }}
                            >
                                <Icon
                                    sx={{ fontSize: 80, color: "grey.400" }}
                                />
                            </Box>
                        )}
                    </Paper>

                    {/* URL with copy and open in new tab buttons */}
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            bgcolor: "grey.50",
                            p: 1,
                            borderRadius: 1,
                        }}
                    >
                        <LinkIcon fontSize="small" color="action" />
                        <Typography
                            variant="caption"
                            sx={{
                                flex: 1,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {item.url}
                        </Typography>
                        <Tooltip title="Open in new tab">
                            <IconButton
                                size="small"
                                onClick={() => window.open(item.url, "_blank")}
                            >
                                <OpenInNew fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={urlCopied ? "Copied!" : "Copy URL"}>
                            <IconButton
                                size="small"
                                onClick={() => handleCopyUrl(item.url)}
                            >
                                <ContentCopy fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    {/* Form */}
                    <Stack spacing={2}>
                        <TextField
                            label="Title"
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value);
                                setIsEditing(true);
                            }}
                            fullWidth
                            size="small"
                        />

                        {isImage(item) && (
                            <TextField
                                label="Alt Text"
                                value={altText}
                                onChange={(e) => {
                                    setAltText(e.target.value);
                                    setIsEditing(true);
                                }}
                                fullWidth
                                size="small"
                                helperText="Describe the image for accessibility"
                            />
                        )}

                        <TextField
                            label="Caption"
                            value={caption}
                            onChange={(e) => {
                                setCaption(e.target.value);
                                setIsEditing(true);
                            }}
                            fullWidth
                            multiline
                            rows={2}
                            size="small"
                        />

                        <TextField
                            label="Description"
                            value={description}
                            onChange={(e) => {
                                setDescription(e.target.value);
                                setIsEditing(true);
                            }}
                            fullWidth
                            multiline
                            rows={3}
                            size="small"
                        />

                        {/* Tags */}
                        <Box>
                            <Typography
                                variant="subtitle2"
                                gutterBottom
                                color="text.secondary"
                            >
                                Tags
                            </Typography>
                            <Box
                                sx={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 0.5,
                                    mb: 1,
                                }}
                            >
                                {tags.map((tag) => (
                                    <Chip
                                        key={tag}
                                        label={tag}
                                        size="small"
                                        onDelete={() => handleRemoveTag(tag)}
                                    />
                                ))}
                            </Box>
                            <Box sx={{ display: "flex", gap: 1 }}>
                                <TextField
                                    size="small"
                                    placeholder="Add tag"
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleAddTag();
                                        }
                                    }}
                                    sx={{ flex: 1 }}
                                />
                                <Button
                                    size="small"
                                    onClick={handleAddTag}
                                    disabled={!newTag.trim()}
                                >
                                    Add
                                </Button>
                            </Box>
                        </Box>

                        {isEditing && (
                            <Button
                                variant="contained"
                                onClick={handleSave}
                                fullWidth
                                disabled={isSaving}
                                startIcon={
                                    isSaving ? (
                                        <CircularProgress size={16} />
                                    ) : null
                                }
                            >
                                {isSaving ? "Saving..." : "Save Changes"}
                            </Button>
                        )}
                    </Stack>

                    <Divider />

                    {/* Variants Section (Images Only) */}
                    {supportsVariants(item) && (
                        <>
                            <Box>
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        cursor: "pointer",
                                    }}
                                    onClick={() =>
                                        setVariantsExpanded(!variantsExpanded)
                                    }
                                >
                                    <Typography
                                        variant="subtitle2"
                                        fontWeight="bold"
                                    >
                                        Image Variants ({item.variants.length})
                                    </Typography>
                                    {variantsExpanded ? (
                                        <ExpandLess />
                                    ) : (
                                        <ExpandMore />
                                    )}
                                </Box>
                                <Collapse in={variantsExpanded}>
                                    <List dense disablePadding sx={{ mt: 1 }}>
                                        {variantsInfo.length > 0 ? (
                                            variantsInfo.map((variant) => (
                                                <ListItem
                                                    key={variant.name}
                                                    disableGutters
                                                    sx={{ py: 0.5 }}
                                                >
                                                    <ListItemText
                                                        primary={variant.label}
                                                        secondary={`${variant.dimensions} • ${variant.size}`}
                                                        primaryTypographyProps={{
                                                            variant: "body2",
                                                        }}
                                                        secondaryTypographyProps={{
                                                            variant: "caption",
                                                        }}
                                                    />
                                                    <ListItemSecondaryAction>
                                                        <Tooltip title="Open in new tab">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() =>
                                                                    window.open(
                                                                        variant.url,
                                                                        "_blank",
                                                                    )
                                                                }
                                                            >
                                                                <OpenInNew fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Copy URL">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() =>
                                                                    handleCopyUrl(
                                                                        variant.url,
                                                                    )
                                                                }
                                                            >
                                                                <ContentCopy fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Download">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() =>
                                                                    downloadFile(
                                                                        variant.url,
                                                                        `${item.filename}-${variant.name}`,
                                                                    )
                                                                }
                                                            >
                                                                <Download fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Delete variant">
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() =>
                                                                    onDeleteVariant(
                                                                        variant.name,
                                                                    )
                                                                }
                                                                disabled={
                                                                    isProcessing
                                                                }
                                                            >
                                                                <Delete fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </ListItemSecondaryAction>
                                                </ListItem>
                                            ))
                                        ) : (
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ py: 1 }}
                                            >
                                                No variants generated yet
                                            </Typography>
                                        )}
                                    </List>
                                    <Stack spacing={1} sx={{ mt: 1 }}>
                                        <Button
                                            size="small"
                                            startIcon={<ImageIcon />}
                                            onClick={() =>
                                                setVariantsDialogOpen(true)
                                            }
                                            fullWidth
                                            disabled={isProcessing}
                                        >
                                            Generate Variants
                                        </Button>
                                        <Button
                                            size="small"
                                            startIcon={<Crop />}
                                            onClick={() => onCustomCrop(item)}
                                            fullWidth
                                            disabled={isProcessing}
                                            variant="outlined"
                                        >
                                            Custom Crop Variant
                                        </Button>
                                    </Stack>
                                </Collapse>
                            </Box>
                            <Divider />
                        </>
                    )}

                    {/* Image Processing Section */}
                    {supportsImageProcessing(item) && (
                        <>
                            <Box>
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        cursor: "pointer",
                                    }}
                                    onClick={() =>
                                        setProcessingExpanded(
                                            !processingExpanded,
                                        )
                                    }
                                >
                                    <Typography
                                        variant="subtitle2"
                                        fontWeight="bold"
                                    >
                                        Image Processing
                                    </Typography>
                                    {processingExpanded ? (
                                        <ExpandLess />
                                    ) : (
                                        <ExpandMore />
                                    )}
                                </Box>
                                <Collapse in={processingExpanded}>
                                    <Stack spacing={1} sx={{ mt: 2 }}>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            startIcon={<Transform />}
                                            onClick={() =>
                                                setResizeDialogOpen(true)
                                            }
                                            fullWidth
                                            disabled={isProcessing}
                                        >
                                            Resize Image
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            startIcon={<Compress />}
                                            onClick={() =>
                                                setOptimizeDialogOpen(true)
                                            }
                                            fullWidth
                                            disabled={isProcessing}
                                        >
                                            Optimize / Compress
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            startIcon={<AutoFixHigh />}
                                            onClick={() =>
                                                setConvertDialogOpen(true)
                                            }
                                            fullWidth
                                            disabled={isProcessing}
                                        >
                                            Convert Format
                                        </Button>
                                    </Stack>
                                </Collapse>
                            </Box>
                            <Divider />
                        </>
                    )}

                    {/* File Info */}
                    <Box>
                        <Typography
                            variant="subtitle2"
                            fontWeight="bold"
                            gutterBottom
                        >
                            File Information
                        </Typography>
                        <Stack spacing={1.5} sx={{ mt: 2 }}>
                            <InfoRow label="Filename" value={item.filename} />
                            <InfoRow label="File type" value={item.mimeType} />
                            <InfoRow
                                label="File size"
                                value={formatFileSize(item.fileSize)}
                            />
                            {item.width && item.height && (
                                <InfoRow
                                    label="Dimensions"
                                    value={formatDimensions(item)}
                                />
                            )}
                            {item.duration && (
                                <InfoRow
                                    label="Duration"
                                    value={formatDuration(item.duration)}
                                />
                            )}
                            <InfoRow
                                label="Uploaded"
                                value={formatDate(item.uploadedAt)}
                            />
                            <InfoRow
                                label="Uploaded by"
                                value={item.uploader?.name || "Unknown"}
                            />
                            {item.usageCount > 0 && (
                                <InfoRow
                                    label="Usage count"
                                    value={String(item.usageCount)}
                                />
                            )}
                        </Stack>
                    </Box>

                    <Divider />

                    {/* Actions */}
                    <Stack spacing={1}>
                        <Button
                            variant="outlined"
                            startIcon={<Download />}
                            onClick={() => onDownload(item)}
                            fullWidth
                        >
                            Download Original
                        </Button>
                        <Button
                            variant="outlined"
                            color="warning"
                            startIcon={<Delete />}
                            onClick={() => onDelete(false)}
                            fullWidth
                        >
                            Move to Trash
                        </Button>
                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<Delete />}
                            onClick={() => onDelete(true)}
                            fullWidth
                        >
                            Delete Permanently
                        </Button>
                    </Stack>
                </Stack>
            </Box>

            {/* Resize Dialog */}
            <Dialog
                open={resizeDialogOpen}
                onClose={() => setResizeDialogOpen(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>Resize Image</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            Current size: {formatDimensions(item)}
                        </Typography>
                        <TextField
                            label="Width (px)"
                            type="number"
                            value={resizeWidth}
                            onChange={(e) =>
                                setResizeWidth(
                                    e.target.value
                                        ? parseInt(e.target.value)
                                        : "",
                                )
                            }
                            fullWidth
                            size="small"
                        />
                        <TextField
                            label="Height (px)"
                            type="number"
                            value={resizeHeight}
                            onChange={(e) =>
                                setResizeHeight(
                                    e.target.value
                                        ? parseInt(e.target.value)
                                        : "",
                                )
                            }
                            fullWidth
                            size="small"
                        />
                        <FormControl fullWidth size="small">
                            <InputLabel>Fit Mode</InputLabel>
                            <Select
                                value={resizeFit}
                                label="Fit Mode"
                                onChange={(e) =>
                                    setResizeFit(e.target.value as ResizeFit)
                                }
                            >
                                <MenuItem value="inside">
                                    Inside (maintain aspect ratio)
                                </MenuItem>
                                <MenuItem value="cover">
                                    Cover (crop to fit)
                                </MenuItem>
                                <MenuItem value="contain">
                                    Contain (letterbox)
                                </MenuItem>
                                <MenuItem value="fill">
                                    Fill (may distort)
                                </MenuItem>
                            </Select>
                        </FormControl>
                        <Alert severity="warning" variant="outlined">
                            This will modify the original image
                        </Alert>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setResizeDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleResize}
                        variant="contained"
                        disabled={!resizeWidth && !resizeHeight}
                    >
                        Resize
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Optimize Dialog */}
            <Dialog
                open={optimizeDialogOpen}
                onClose={() => setOptimizeDialogOpen(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>Optimize Image</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            Current size: {formatFileSize(item.fileSize)}
                        </Typography>
                        <TextField
                            label="Quality (%)"
                            type="number"
                            value={optimizeQuality}
                            onChange={(e) =>
                                setOptimizeQuality(
                                    Math.min(
                                        100,
                                        Math.max(
                                            1,
                                            parseInt(e.target.value) || 85,
                                        ),
                                    ),
                                )
                            }
                            inputProps={{ min: 1, max: 100 }}
                            fullWidth
                            size="small"
                            helperText="Lower quality = smaller file size. Recommended: 80-90"
                        />
                        <Alert severity="warning" variant="outlined">
                            This will modify the original image
                        </Alert>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOptimizeDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleOptimize} variant="contained">
                        Optimize
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Convert Dialog */}
            <Dialog
                open={convertDialogOpen}
                onClose={() => setConvertDialogOpen(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>Convert Format</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            Current format: {item.mimeType}
                        </Typography>
                        <FormControl fullWidth size="small">
                            <InputLabel>Target Format</InputLabel>
                            <Select
                                value={convertFormat}
                                label="Target Format"
                                onChange={(e) =>
                                    setConvertFormat(
                                        e.target.value as ImageFormat,
                                    )
                                }
                            >
                                <MenuItem value="jpeg">
                                    JPEG (best for photos)
                                </MenuItem>
                                <MenuItem value="png">
                                    PNG (lossless, supports transparency)
                                </MenuItem>
                                <MenuItem value="webp">
                                    WebP (modern, smaller size)
                                </MenuItem>
                                <MenuItem value="avif">
                                    AVIF (newest, best compression)
                                </MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            label="Quality (%)"
                            type="number"
                            value={convertQuality}
                            onChange={(e) =>
                                setConvertQuality(
                                    Math.min(
                                        100,
                                        Math.max(
                                            1,
                                            parseInt(e.target.value) || 85,
                                        ),
                                    ),
                                )
                            }
                            inputProps={{ min: 1, max: 100 }}
                            fullWidth
                            size="small"
                        />
                        <Alert severity="warning" variant="outlined">
                            This will replace the original file
                        </Alert>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConvertDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleConvert} variant="contained">
                        Convert
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Generate Variants Dialog */}
            <Dialog
                open={variantsDialogOpen}
                onClose={() => setVariantsDialogOpen(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>Generate Variants</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            Select image size presets to generate:
                        </Typography>
                        {(
                            [
                                "thumbnail",
                                "medium",
                                "medium_large",
                                "large",
                                "2048x2048",
                            ] as VariantPreset[]
                        ).map((preset) => (
                            <Box
                                key={preset}
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                }}
                            >
                                <Chip
                                    label={formatVariantName(preset)}
                                    color={
                                        selectedPresets.includes(preset)
                                            ? "primary"
                                            : "default"
                                    }
                                    variant={
                                        selectedPresets.includes(preset)
                                            ? "filled"
                                            : "outlined"
                                    }
                                    onClick={() => {
                                        if (selectedPresets.includes(preset)) {
                                            setSelectedPresets(
                                                selectedPresets.filter(
                                                    (p) => p !== preset,
                                                ),
                                            );
                                        } else {
                                            setSelectedPresets([
                                                ...selectedPresets,
                                                preset,
                                            ]);
                                        }
                                    }}
                                    sx={{
                                        flex: 1,
                                        justifyContent: "flex-start",
                                    }}
                                />
                            </Box>
                        ))}
                        {item.variants.length > 0 && (
                            <Alert severity="info" variant="outlined">
                                Existing variants will be replaced
                            </Alert>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setVariantsDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleGenerateVariants}
                        variant="contained"
                        disabled={selectedPresets.length === 0}
                    >
                        Generate {selectedPresets.length} Variant(s)
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
