"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import {
    Box,
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Checkbox,
    Paper,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    InputAdornment,
    ToggleButton,
    ToggleButtonGroup,
    Pagination,
    CircularProgress,
    Alert,
    Tooltip,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Snackbar,
    Chip,
    LinearProgress,
} from "@mui/material";
import {
    Upload,
    GridView,
    ViewList,
    Search,
    FilterList,
    Delete,
    InsertDriveFile,
    Refresh,
} from "@mui/icons-material";

import { MediaGridItem } from "./MediaGridItem";
import { MediaListItem } from "./MediaListItem";
import { MediaDetailPanel } from "./MediaDetailPanel";
import {
    UploadConfirmDialog,
    type FileWithOptions,
} from "./UploadConfirmDialog";
import {
    MediaCropper,
    type CropCoordinates,
    type ImageTransforms,
} from "./MediaCropper";
import {
    listMedia,
    uploadMedia,
    updateMedia,
    deleteMedia,
    bulkDeleteMedia,
    generateVariants,
    resizeMedia,
    optimizeMedia,
    convertMedia,
    downloadMedia,
    cropCustomVariant,
} from "./api";
import {
    formatFileSize,
    getAcceptedFileTypes,
    validateFileSize,
    getFileValidationError,
} from "./utils";
import type {
    MediaItem,
    ViewMode,
    FilterType,
    MediaLibraryProps,
    MediaUpdateParams,
    VariantPreset,
    ResizeFit,
    ImageFormat,
    MediaType,
} from "./types";

// Form data interface for react-hook-form
interface MediaFilterForm {
    search: string;
    filterType: FilterType;
}

/**
 * Main Media Library Component
 * WordPress-style media management interface with grid/list views,
 * search, filtering, upload, and detailed editing capabilities
 * Integrated with /v1/media API
 *
 * Features:
 * - Upload via button, drag & drop, or clipboard (Ctrl/Cmd + V)
 * - Simplified state management with react-hook-form
 */
export const MediaLibrary: React.FC<MediaLibraryProps> = ({
    onSelect,
    selectionMode = "multiple",
}) => {
    // Form state management with react-hook-form
    const { register, watch, setValue } = useForm<MediaFilterForm>({
        defaultValues: {
            search: "",
            filterType: "all",
        },
    });

    const searchQuery = watch("search");
    const filterType = watch("filterType");

    // View state
    const [viewMode, setViewMode] = useState<ViewMode>("grid");

    // Selection state
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

    // Data state
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Loading state grouped
    const [loadingState, setLoadingState] = useState({
        isLoading: true,
        isUploading: false,
        isProcessing: false,
    });

    const [uploadProgress, setUploadProgress] = useState<number[]>([]);
    const [error, setError] = useState<string | null>(null);

    // File input key for resetting file input after upload
    const [fileInputKey, setFileInputKey] = useState(0);

    // Dialog state grouped
    const [dialogState, setDialogState] = useState({
        deleteDialogOpen: false,
        permanentDelete: false,
    });

    // Upload dialog state
    const [uploadDialogState, setUploadDialogState] = useState<{
        open: boolean;
        files: File[];
    }>({
        open: false,
        files: [],
    });

    // Cropper dialog state
    const [cropperDialogState, setCropperDialogState] = useState<{
        open: boolean;
        mediaItem: MediaItem | null;
    }>({
        open: false,
        mediaItem: null,
    });

    // Snackbar state
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: "success" | "error" | "info" | "warning";
    }>({ open: false, message: "", severity: "info" });

    // Ref for the main container to attach paste listener
    const containerRef = useRef<HTMLDivElement>(null);

    // Fetch media items
    const fetchMedia = useCallback(async () => {
        setLoadingState((prev) => ({ ...prev, isLoading: true }));
        setError(null);

        try {
            const response = await listMedia({
                type:
                    filterType === "all"
                        ? undefined
                        : (filterType as MediaType),
                search: searchQuery || undefined,
                limit: itemsPerPage,
                offset: (currentPage - 1) * itemsPerPage,
                orderBy: "uploadedAt",
                orderDirection: "desc",
            });

            setMediaItems(response.data);
            setTotalItems(response.pagination.total);
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Failed to load media";
            setError(message);
            setSnackbar({
                open: true,
                message,
                severity: "error",
            });
        } finally {
            setLoadingState((prev) => ({ ...prev, isLoading: false }));
        }
    }, [filterType, searchQuery, currentPage, itemsPerPage]);

    // Initial load and refetch on filter/page change
    useEffect(() => {
        fetchMedia();
    }, [fetchMedia]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            setCurrentPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Pagination
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Show upload dialog
    const handleShowUploadDialog = useCallback(
        (files: FileList | File[] | null) => {
            if (!files || files.length === 0) return;

            const fileArray = Array.from(files);
            setUploadDialogState({
                open: true,
                files: fileArray,
            });
        },
        [],
    );

    // File upload handler with individual file options
    const handleFileUpload = useCallback(
        async (filesWithOptions: FileWithOptions[]) => {
            if (!filesWithOptions || filesWithOptions.length === 0) return;

            // Close upload dialog
            setUploadDialogState({ open: false, files: [] });

            setLoadingState((prev) => ({ ...prev, isUploading: true }));
            setUploadProgress(new Array(filesWithOptions.length).fill(0));

            const uploadResults: {
                success: boolean;
                filename: string;
                error?: string;
            }[] = [];

            for (let i = 0; i < filesWithOptions.length; i++) {
                const { file, options } = filesWithOptions[i];

                // Validate file size
                const validationError = getFileValidationError(file, 50);
                if (validationError) {
                    uploadResults.push({
                        success: false,
                        filename: file.name,
                        error: validationError,
                    });
                    continue;
                }

                try {
                    // Upload with individual file options
                    const response = await uploadMedia({
                        file,
                        ...options,
                    });

                    uploadResults.push({
                        success: true,
                        filename: file.name,
                    });

                    // Update progress
                    setUploadProgress((prev) => {
                        const newProgress = [...prev];
                        newProgress[i] = 100;
                        return newProgress;
                    });
                } catch (err) {
                    uploadResults.push({
                        success: false,
                        filename: file.name,
                        error:
                            err instanceof Error
                                ? err.message
                                : "Upload failed",
                    });
                }
            }

            setLoadingState((prev) => ({ ...prev, isUploading: false }));
            setUploadProgress([]);

            // Reset file input to allow re-uploading the same files
            setFileInputKey((prev) => prev + 1);

            // Show result summary
            const successCount = uploadResults.filter((r) => r.success).length;
            const failCount = uploadResults.filter((r) => !r.success).length;

            if (successCount > 0) {
                setSnackbar({
                    open: true,
                    message: `${successCount} file(s) uploaded successfully${failCount > 0 ? `, ${failCount} failed` : ""}`,
                    severity: failCount > 0 ? "warning" : "success",
                });
                fetchMedia();
            } else {
                setSnackbar({
                    open: true,
                    message: "All uploads failed",
                    severity: "error",
                });
            }
        },
        [fetchMedia],
    );

    // Clipboard paste handler for file upload
    const handlePaste = useCallback(
        (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            const files: File[] = [];
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.kind === "file") {
                    const file = item.getAsFile();
                    if (file) {
                        files.push(file);
                    }
                }
            }

            if (files.length > 0) {
                e.preventDefault();
                handleShowUploadDialog(files);
                setSnackbar({
                    open: true,
                    message: `Pasted ${files.length} file(s) from clipboard`,
                    severity: "info",
                });
            }
        },
        [handleShowUploadDialog],
    );

    // Add paste event listener
    useEffect(() => {
        const handlePasteEvent = (e: ClipboardEvent) => handlePaste(e);
        window.addEventListener("paste", handlePasteEvent);
        return () => {
            window.removeEventListener("paste", handlePasteEvent);
        };
    }, [handlePaste]);

    // Drag and drop handlers
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            handleShowUploadDialog(e.dataTransfer.files);
        },
        [handleShowUploadDialog],
    );

    // Selection handlers
    const handleSelectItem = useCallback((id: string) => {
        setSelectedItems((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }, []);

    const handleSelectAll = useCallback(() => {
        if (selectedItems.size === mediaItems.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(mediaItems.map((item) => item.id)));
        }
    }, [selectedItems, mediaItems]);

    // Delete handlers
    const handleDeleteSelected = useCallback(async () => {
        if (selectedItems.size === 0 && !selectedItem) return;

        setLoadingState((prev) => ({ ...prev, isProcessing: true }));

        try {
            if (selectedItems.size > 0) {
                const result = await bulkDeleteMedia(
                    Array.from(selectedItems),
                    dialogState.permanentDelete,
                );
                setSnackbar({
                    open: true,
                    message: `${result.success} item(s) deleted${result.failed > 0 ? `, ${result.failed} failed` : ""}`,
                    severity: result.failed > 0 ? "warning" : "success",
                });
            } else if (selectedItem) {
                await deleteMedia(selectedItem.id, dialogState.permanentDelete);
                setSnackbar({
                    open: true,
                    message: dialogState.permanentDelete
                        ? "Media permanently deleted"
                        : "Media moved to trash",
                    severity: "success",
                });
                setSelectedItem(null);
            }

            setSelectedItems(new Set());
            setDialogState((prev) => ({ ...prev, deleteDialogOpen: false }));
            fetchMedia();
        } catch (err) {
            setSnackbar({
                open: true,
                message: err instanceof Error ? err.message : "Delete failed",
                severity: "error",
            });
        } finally {
            setLoadingState((prev) => ({ ...prev, isProcessing: false }));
        }
    }, [selectedItems, selectedItem, dialogState.permanentDelete, fetchMedia]);

    // Update handler
    const handleUpdateItem = useCallback(
        async (id: string, updates: MediaUpdateParams) => {
            setLoadingState((prev) => ({ ...prev, isProcessing: true }));

            try {
                const response = await updateMedia(id, updates);
                setMediaItems((prev) =>
                    prev.map((item) => (item.id === id ? response.data : item)),
                );
                if (selectedItem?.id === id) {
                    setSelectedItem(response.data);
                }
                setSnackbar({
                    open: true,
                    message: "Media updated successfully",
                    severity: "success",
                });
            } catch (err) {
                setSnackbar({
                    open: true,
                    message:
                        err instanceof Error ? err.message : "Update failed",
                    severity: "error",
                });
                throw err;
            } finally {
                setLoadingState((prev) => ({ ...prev, isProcessing: false }));
            }
        },
        [selectedItem],
    );

    // Download handler
    const handleDownloadItem = useCallback((item: MediaItem) => {
        downloadMedia(item);
    }, []);

    // Generate variants handler
    const handleGenerateVariants = useCallback(
        async (presets?: VariantPreset[]) => {
            if (!selectedItem) return;

            setLoadingState((prev) => ({ ...prev, isProcessing: true }));

            try {
                const response = await generateVariants(
                    selectedItem.id,
                    presets,
                );
                // Refresh the selected item to get updated variants
                const updatedItem = {
                    ...selectedItem,
                    variants: response.data,
                };
                setSelectedItem(updatedItem);
                setMediaItems((prev) =>
                    prev.map((item) =>
                        item.id === selectedItem.id ? updatedItem : item,
                    ),
                );
                setSnackbar({
                    open: true,
                    message: `${response.data.length} variant(s) generated`,
                    severity: "success",
                });
            } catch (err) {
                setSnackbar({
                    open: true,
                    message:
                        err instanceof Error
                            ? err.message
                            : "Variant generation failed",
                    severity: "error",
                });
            } finally {
                setLoadingState((prev) => ({ ...prev, isProcessing: false }));
            }
        },
        [selectedItem],
    );

    // Resize handler
    const handleResize = useCallback(
        async (width?: number, height?: number, fit?: ResizeFit) => {
            if (!selectedItem) return;

            setLoadingState((prev) => ({ ...prev, isProcessing: true }));

            try {
                const response = await resizeMedia(
                    selectedItem.id,
                    width,
                    height,
                    fit,
                );
                setSelectedItem(response.data);
                setMediaItems((prev) =>
                    prev.map((item) =>
                        item.id === selectedItem.id ? response.data : item,
                    ),
                );
                setSnackbar({
                    open: true,
                    message: "Image resized successfully",
                    severity: "success",
                });
            } catch (err) {
                setSnackbar({
                    open: true,
                    message:
                        err instanceof Error ? err.message : "Resize failed",
                    severity: "error",
                });
            } finally {
                setLoadingState((prev) => ({ ...prev, isProcessing: false }));
            }
        },
        [selectedItem],
    );

    // Optimize handler
    const handleOptimize = useCallback(
        async (quality?: number) => {
            if (!selectedItem) return;

            setLoadingState((prev) => ({ ...prev, isProcessing: true }));

            try {
                const response = await optimizeMedia(selectedItem.id, quality);
                setSelectedItem(response.data);
                setMediaItems((prev) =>
                    prev.map((item) =>
                        item.id === selectedItem.id ? response.data : item,
                    ),
                );
                const sizeSaved =
                    selectedItem.fileSize - response.data.fileSize;
                setSnackbar({
                    open: true,
                    message: `Image optimized - saved ${formatFileSize(sizeSaved)}`,
                    severity: "success",
                });
            } catch (err) {
                setSnackbar({
                    open: true,
                    message:
                        err instanceof Error
                            ? err.message
                            : "Optimization failed",
                    severity: "error",
                });
            } finally {
                setLoadingState((prev) => ({ ...prev, isProcessing: false }));
            }
        },
        [selectedItem],
    );

    // Convert handler
    const handleConvert = useCallback(
        async (format: ImageFormat, quality?: number) => {
            if (!selectedItem) return;

            setLoadingState((prev) => ({ ...prev, isProcessing: true }));

            try {
                const response = await convertMedia(
                    selectedItem.id,
                    format,
                    quality,
                );
                setSelectedItem(response.data);
                setMediaItems((prev) =>
                    prev.map((item) =>
                        item.id === selectedItem.id ? response.data : item,
                    ),
                );
                setSnackbar({
                    open: true,
                    message: `Image converted to ${format.toUpperCase()}`,
                    severity: "success",
                });
            } catch (err) {
                setSnackbar({
                    open: true,
                    message:
                        err instanceof Error
                            ? err.message
                            : "Conversion failed",
                    severity: "error",
                });
            } finally {
                setLoadingState((prev) => ({ ...prev, isProcessing: false }));
            }
        },
        [selectedItem],
    );

    // View item handler
    const handleViewItem = useCallback(
        (item: MediaItem) => {
            setSelectedItem(item);
            if (onSelect && selectionMode === "single") {
                onSelect(item);
            }
        },
        [onSelect, selectionMode],
    );

    // Open cropper dialog handler
    const handleOpenCropper = useCallback((item: MediaItem) => {
        setCropperDialogState({
            open: true,
            mediaItem: item,
        });
    }, []);

    // Handle custom crop variant creation
    const handleCustomCrop = useCallback(
        async (
            variantName: string,
            coordinates: CropCoordinates,
            transforms: ImageTransforms,
        ) => {
            const mediaItem = cropperDialogState.mediaItem;
            if (!mediaItem) return;

            setLoadingState((prev) => ({ ...prev, isProcessing: true }));

            try {
                const response = await cropCustomVariant(
                    mediaItem.id,
                    variantName,
                    coordinates,
                    transforms,
                );

                // Update the selected item with the new variant
                const updatedVariants = [
                    ...mediaItem.variants.filter((v) => v.name !== variantName),
                    response.data,
                ];
                const updatedItem = {
                    ...mediaItem,
                    variants: updatedVariants,
                };

                setSelectedItem(updatedItem);
                setMediaItems((prev) =>
                    prev.map((item) =>
                        item.id === mediaItem.id ? updatedItem : item,
                    ),
                );

                setCropperDialogState({ open: false, mediaItem: null });

                setSnackbar({
                    open: true,
                    message: `Custom variant "${variantName}" created successfully`,
                    severity: "success",
                });
            } catch (err) {
                setSnackbar({
                    open: true,
                    message:
                        err instanceof Error
                            ? err.message
                            : "Failed to create custom variant",
                    severity: "error",
                });
            } finally {
                setLoadingState((prev) => ({ ...prev, isProcessing: false }));
            }
        },
        [cropperDialogState.mediaItem],
    );

    return (
        <Box
            ref={containerRef}
            sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                bgcolor: "grey.50",
            }}
            tabIndex={0}
        >
            {/* Header */}
            <Paper sx={{ p: 3, borderRadius: 0, boxShadow: 1 }}>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 3,
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Typography
                            variant="h4"
                            component="h1"
                            fontWeight="bold"
                        >
                            Media Library
                        </Typography>
                        {totalItems > 0 && (
                            <Chip
                                label={`${totalItems} items`}
                                size="small"
                                color="primary"
                                variant="outlined"
                            />
                        )}
                    </Box>
                    <Stack direction="row" spacing={1}>
                        <Tooltip title="Refresh">
                            <Button
                                variant="outlined"
                                onClick={fetchMedia}
                                disabled={loadingState.isLoading}
                            >
                                <Refresh />
                            </Button>
                        </Tooltip>
                        <Tooltip title="Upload files via button, drag & drop, or paste (Ctrl/Cmd+V)">
                            <Button
                                variant="contained"
                                startIcon={<Upload />}
                                component="label"
                                disabled={loadingState.isUploading}
                            >
                                Upload Files
                                <input
                                    key={fileInputKey}
                                    type="file"
                                    multiple
                                    hidden
                                    onChange={(e) => {
                                        handleShowUploadDialog(e.target.files);
                                        // Reset the input value to allow selecting the same file again
                                        e.target.value = "";
                                    }}
                                    accept={getAcceptedFileTypes()}
                                />
                            </Button>
                        </Tooltip>
                    </Stack>
                </Box>

                {/* Upload Progress */}
                {loadingState.isUploading && uploadProgress.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                        >
                            Uploading {uploadProgress.length} file(s)...
                        </Typography>
                        <LinearProgress
                            variant="determinate"
                            value={
                                uploadProgress.reduce((a, b) => a + b, 0) /
                                uploadProgress.length
                            }
                        />
                    </Box>
                )}

                {/* Toolbar */}
                <Stack
                    direction="row"
                    spacing={2}
                    flexWrap="wrap"
                    alignItems="center"
                >
                    {/* Search */}
                    <TextField
                        placeholder="Search media..."
                        {...register("search")}
                        size="small"
                        sx={{ minWidth: 250, flexGrow: 1, maxWidth: 400 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search />
                                </InputAdornment>
                            ),
                        }}
                    />

                    {/* Filter */}
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Filter</InputLabel>
                        <Select
                            value={filterType}
                            label="Filter"
                            onChange={(e) => {
                                setValue(
                                    "filterType",
                                    e.target.value as FilterType,
                                );
                                setCurrentPage(1);
                            }}
                            startAdornment={
                                <FilterList sx={{ ml: 1, mr: -0.5 }} />
                            }
                        >
                            <MenuItem value="all">All Media</MenuItem>
                            <MenuItem value="Image">Images</MenuItem>
                            <MenuItem value="Video">Videos</MenuItem>
                            <MenuItem value="Audio">Audio</MenuItem>
                            <MenuItem value="Document">Documents</MenuItem>
                        </Select>
                    </FormControl>

                    {/* View Mode Toggle */}
                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={(_, newMode) =>
                            newMode && setViewMode(newMode)
                        }
                        size="small"
                    >
                        <ToggleButton value="grid">
                            <Tooltip title="Grid view">
                                <GridView />
                            </Tooltip>
                        </ToggleButton>
                        <ToggleButton value="list">
                            <Tooltip title="List view">
                                <ViewList />
                            </Tooltip>
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Stack>

                {/* Bulk Actions */}
                {selectedItems.size > 0 && (
                    <Alert
                        severity="info"
                        sx={{ mt: 2 }}
                        action={
                            <Stack direction="row" spacing={1}>
                                <Button size="small" onClick={handleSelectAll}>
                                    {selectedItems.size === mediaItems.length
                                        ? "Deselect All"
                                        : "Select All"}
                                </Button>
                                <Button
                                    size="small"
                                    color="error"
                                    startIcon={<Delete />}
                                    onClick={() => {
                                        setDialogState({
                                            permanentDelete: false,
                                            deleteDialogOpen: true,
                                        });
                                    }}
                                >
                                    Delete
                                </Button>
                            </Stack>
                        }
                    >
                        {selectedItems.size} item(s) selected
                    </Alert>
                )}
            </Paper>

            {/* Main Content with Split Pane */}
            <Box
                sx={{
                    display: "flex",
                    flexGrow: 1,
                    overflow: "hidden",
                    gap: 2,
                    p: 2,
                }}
            >
                {/* Media Grid/List Section */}
                <Box
                    sx={{
                        flex: 1,
                        overflow: "auto",
                        display: "flex",
                        flexDirection: "column",
                    }}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    {/* Loading State */}
                    {loadingState.isLoading && (
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                py: 8,
                            }}
                        >
                            <CircularProgress />
                        </Box>
                    )}

                    {/* Error State */}
                    {error && !loadingState.isLoading && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                            <Button
                                size="small"
                                onClick={fetchMedia}
                                sx={{ ml: 2 }}
                            >
                                Retry
                            </Button>
                        </Alert>
                    )}

                    {/* Upload Indicator */}
                    {loadingState.isUploading && (
                        <Alert
                            severity="info"
                            icon={<CircularProgress size={20} />}
                            sx={{ mb: 2 }}
                        >
                            Uploading files...
                        </Alert>
                    )}

                    {/* Empty State */}
                    {!loadingState.isLoading &&
                    !error &&
                    mediaItems.length === 0 ? (
                        <Box sx={{ textAlign: "center", py: 8 }}>
                            <InsertDriveFile
                                sx={{ fontSize: 64, color: "grey.400", mb: 2 }}
                            />
                            <Typography
                                variant="h6"
                                color="text.secondary"
                                gutterBottom
                            >
                                No media found
                            </Typography>
                            <Typography variant="body2" color="text.disabled">
                                {searchQuery || filterType !== "all"
                                    ? "Try adjusting your search or filter"
                                    : "Upload files via button, drag & drop, or paste (Ctrl/Cmd+V)"}
                            </Typography>
                            <Button
                                variant="outlined"
                                startIcon={<Upload />}
                                component="label"
                                sx={{ mt: 2 }}
                            >
                                Upload Files
                                <input
                                    key={fileInputKey}
                                    type="file"
                                    multiple
                                    hidden
                                    onChange={(e) => {
                                        handleShowUploadDialog(e.target.files);
                                        e.target.value = "";
                                    }}
                                    accept={getAcceptedFileTypes()}
                                />
                            </Button>
                        </Box>
                    ) : !loadingState.isLoading && viewMode === "grid" ? (
                        <Grid container spacing={2}>
                            {mediaItems.map((item) => (
                                <Grid
                                    item
                                    xs={12}
                                    sm={6}
                                    md={4}
                                    lg={3}
                                    xl={2.4}
                                    key={item.id}
                                >
                                    <MediaGridItem
                                        item={item}
                                        isSelected={selectedItems.has(item.id)}
                                        onSelect={handleSelectItem}
                                        onView={handleViewItem}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    ) : !loadingState.isLoading && viewMode === "list" ? (
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={
                                                    selectedItems.size ===
                                                        mediaItems.length &&
                                                    mediaItems.length > 0
                                                }
                                                onChange={handleSelectAll}
                                                indeterminate={
                                                    selectedItems.size > 0 &&
                                                    selectedItems.size <
                                                        mediaItems.length
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>File</TableCell>
                                        <TableCell>Type</TableCell>
                                        <TableCell>Size</TableCell>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {mediaItems.map((item) => (
                                        <MediaListItem
                                            key={item.id}
                                            item={item}
                                            isSelected={selectedItems.has(
                                                item.id,
                                            )}
                                            onSelect={handleSelectItem}
                                            onView={handleViewItem}
                                            onDownload={handleDownloadItem}
                                        />
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : null}

                    {/* Pagination */}
                    {!loadingState.isLoading && totalPages > 1 && (
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "center",
                                mt: 4,
                            }}
                        >
                            <Pagination
                                count={totalPages}
                                page={currentPage}
                                onChange={(_, page) => setCurrentPage(page)}
                                color="primary"
                            />
                        </Box>
                    )}
                </Box>

                {/* Detail Panel - Always Visible */}
                <MediaDetailPanel
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                    onUpdate={handleUpdateItem}
                    onDelete={(permanent) => {
                        setDialogState({
                            permanentDelete: permanent || false,
                            deleteDialogOpen: true,
                        });
                    }}
                    onDownload={handleDownloadItem}
                    onGenerateVariants={handleGenerateVariants}
                    onCustomCrop={handleOpenCropper}
                    onResize={handleResize}
                    onOptimize={handleOptimize}
                    onConvert={handleConvert}
                    isProcessing={loadingState.isProcessing}
                />
            </Box>

            {/* Upload Confirmation Dialog */}
            <UploadConfirmDialog
                open={uploadDialogState.open}
                files={uploadDialogState.files}
                onConfirm={handleFileUpload}
                onCancel={() =>
                    setUploadDialogState({ open: false, files: [] })
                }
            />

            {/* Custom Crop Dialog */}
            <Dialog
                open={cropperDialogState.open}
                onClose={() =>
                    setCropperDialogState({ open: false, mediaItem: null })
                }
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: { height: "90vh", maxHeight: 800 },
                }}
            >
                <DialogTitle>
                    Create Custom Crop Variant
                    {cropperDialogState.mediaItem && (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            component="span"
                            sx={{ ml: 1 }}
                        >
                            - {cropperDialogState.mediaItem.filename}
                        </Typography>
                    )}
                </DialogTitle>
                <DialogContent
                    sx={{ p: 3, display: "flex", flexDirection: "column" }}
                >
                    {cropperDialogState.mediaItem && (
                        <MediaCropper
                            assetId={cropperDialogState.mediaItem.id}
                            onCropConfirm={handleCustomCrop}
                            onCancel={() =>
                                setCropperDialogState({
                                    open: false,
                                    mediaItem: null,
                                })
                            }
                            isProcessing={loadingState.isProcessing}
                            existingVariantNames={cropperDialogState.mediaItem.variants.map(
                                (v) => v.name,
                            )}
                            originalDimensions={
                                cropperDialogState.mediaItem.width &&
                                cropperDialogState.mediaItem.height
                                    ? {
                                          width: cropperDialogState.mediaItem
                                              .width,
                                          height: cropperDialogState.mediaItem
                                              .height,
                                      }
                                    : undefined
                            }
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={dialogState.deleteDialogOpen}
                onClose={() =>
                    setDialogState((prev) => ({
                        ...prev,
                        deleteDialogOpen: false,
                    }))
                }
            >
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to{" "}
                        {dialogState.permanentDelete
                            ? "permanently delete"
                            : "move to trash"}{" "}
                        {selectedItems.size > 0
                            ? `${selectedItems.size} item(s)`
                            : "this item"}
                        ?
                        {dialogState.permanentDelete && (
                            <Typography
                                color="error"
                                variant="body2"
                                sx={{ mt: 1 }}
                            >
                                This action cannot be undone. All files and
                                variants will be removed from storage.
                            </Typography>
                        )}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() =>
                            setDialogState((prev) => ({
                                ...prev,
                                deleteDialogOpen: false,
                            }))
                        }
                        disabled={loadingState.isProcessing}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteSelected}
                        color="error"
                        variant="contained"
                        disabled={loadingState.isProcessing}
                        startIcon={
                            loadingState.isProcessing ? (
                                <CircularProgress size={16} />
                            ) : (
                                <Delete />
                            )
                        }
                    >
                        {dialogState.permanentDelete
                            ? "Delete Permanently"
                            : "Move to Trash"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={5000}
                onClose={() =>
                    setSnackbar((prev) => ({ ...prev, open: false }))
                }
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    onClose={() =>
                        setSnackbar((prev) => ({ ...prev, open: false }))
                    }
                    severity={snackbar.severity}
                    variant="filled"
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};
