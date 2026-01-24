"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import {
    listMedia,
    uploadMedia,
    updateMedia,
    deleteMedia,
    bulkDeleteMedia,
    generateVariants,
    deleteVariant,
    resizeMedia,
    optimizeMedia,
    convertMedia,
    downloadMedia,
    cropCustomVariant,
} from "./api";
import { formatFileSize, getFileValidationError } from "./utils";
import type {
    MediaItem,
    ViewMode,
    FilterType,
    MediaUpdateParams,
    VariantPreset,
    ResizeFit,
    ImageFormat,
    MediaType,
    MediaLibraryProps,
} from "./types";
import type { CropCoordinates, ImageTransforms } from "./MediaCropper";
import type { FileWithOptions } from "./UploadConfirmDialog";

// Form data interface for react-hook-form
export interface MediaFilterForm {
    search: string;
    filterType: FilterType;
}

export interface LoadingState {
    isLoading: boolean;
    isUploading: boolean;
    isProcessing: boolean;
}

export interface DialogState {
    deleteDialogOpen: boolean;
    permanentDelete: boolean;
}

export interface UploadDialogState {
    open: boolean;
    files: File[];
}

export interface CropperDialogState {
    open: boolean;
    mediaItem: MediaItem | null;
}

export interface SnackbarState {
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
}

export interface UseMediaLibraryOptions {
    onSelect?: MediaLibraryProps["onSelect"];
    selectionMode?: MediaLibraryProps["selectionMode"];
    itemsPerPage?: number;
}

export interface UseMediaLibraryReturn {
    // Form state
    register: ReturnType<typeof useForm<MediaFilterForm>>["register"];
    watch: ReturnType<typeof useForm<MediaFilterForm>>["watch"];
    setValue: ReturnType<typeof useForm<MediaFilterForm>>["setValue"];
    searchQuery: string;
    filterType: FilterType;

    // View state
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;

    // Selection state
    selectedItems: Set<string>;
    setSelectedItems: React.Dispatch<React.SetStateAction<Set<string>>>;
    selectedItem: MediaItem | null;
    setSelectedItem: React.Dispatch<React.SetStateAction<MediaItem | null>>;

    // Data state
    mediaItems: MediaItem[];
    totalItems: number;
    currentPage: number;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
    itemsPerPage: number;
    totalPages: number;

    // Loading state
    loadingState: LoadingState;
    uploadProgress: number[];
    error: string | null;

    // File input key
    fileInputKey: number;

    // Dialog states
    dialogState: DialogState;
    setDialogState: React.Dispatch<React.SetStateAction<DialogState>>;
    uploadDialogState: UploadDialogState;
    setUploadDialogState: React.Dispatch<
        React.SetStateAction<UploadDialogState>
    >;
    cropperDialogState: CropperDialogState;
    setCropperDialogState: React.Dispatch<
        React.SetStateAction<CropperDialogState>
    >;

    // Snackbar state
    snackbar: SnackbarState;
    setSnackbar: React.Dispatch<React.SetStateAction<SnackbarState>>;

    // Container ref
    containerRef: React.RefObject<HTMLDivElement | null>;

    // Handlers
    fetchMedia: () => Promise<void>;
    handleShowUploadDialog: (files: FileList | File[] | null) => void;
    handleFileUpload: (filesWithOptions: FileWithOptions[]) => Promise<void>;
    handleDragOver: (e: React.DragEvent) => void;
    handleDrop: (e: React.DragEvent) => void;
    handleSelectItem: (id: string) => void;
    handleSelectAll: () => void;
    handleDeleteSelected: () => Promise<void>;
    handleUpdateItem: (id: string, updates: MediaUpdateParams) => Promise<void>;
    handleDownloadItem: (item: MediaItem) => void;
    handleGenerateVariants: (presets?: VariantPreset[]) => Promise<void>;
    handleDeleteVariant: (variantName: string) => Promise<void>;
    handleResize: (
        width?: number,
        height?: number,
        fit?: ResizeFit,
    ) => Promise<void>;
    handleOptimize: (quality?: number) => Promise<void>;
    handleConvert: (format: ImageFormat, quality?: number) => Promise<void>;
    handleViewItem: (item: MediaItem) => void;
    handleOpenCropper: (item: MediaItem) => void;
    handleCustomCrop: (
        variantName: string,
        coordinates: CropCoordinates,
        transforms: ImageTransforms,
    ) => Promise<void>;
}

export function useMediaLibrary(
    options: UseMediaLibraryOptions = {},
): UseMediaLibraryReturn {
    const {
        onSelect,
        selectionMode = "multiple",
        itemsPerPage: itemsPerPageOption = 20,
    } = options;

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
    const itemsPerPage = itemsPerPageOption;

    // Loading state grouped
    const [loadingState, setLoadingState] = useState<LoadingState>({
        isLoading: true,
        isUploading: false,
        isProcessing: false,
    });

    const [uploadProgress, setUploadProgress] = useState<number[]>([]);
    const [error, setError] = useState<string | null>(null);

    // File input key for resetting file input after upload
    const [fileInputKey, setFileInputKey] = useState(0);

    // Dialog state grouped
    const [dialogState, setDialogState] = useState<DialogState>({
        deleteDialogOpen: false,
        permanentDelete: false,
    });

    // Upload dialog state
    const [uploadDialogState, setUploadDialogState] =
        useState<UploadDialogState>({
            open: false,
            files: [],
        });

    // Cropper dialog state
    const [cropperDialogState, setCropperDialogState] =
        useState<CropperDialogState>({
            open: false,
            mediaItem: null,
        });

    // Snackbar state
    const [snackbar, setSnackbar] = useState<SnackbarState>({
        open: false,
        message: "",
        severity: "info",
    });

    // Ref for the main container to attach paste listener
    const containerRef = useRef<HTMLDivElement>(null);

    // Pagination
    const totalPages = Math.ceil(totalItems / itemsPerPage);

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
    // Uses presigned URL flow: initiate -> upload to S3 -> process
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

                // Validate file size (increased limit to 500MB for presigned uploads)
                const validationError = getFileValidationError(file, 500);
                if (validationError) {
                    uploadResults.push({
                        success: false,
                        filename: file.name,
                        error: validationError,
                    });
                    continue;
                }

                try {
                    // Upload with individual file options using presigned URL flow
                    // The uploadMedia function now handles the 3-step process:
                    // 1. Initiate upload (get presigned URL)
                    // 2. Upload to S3 directly
                    // 3. Process the uploaded asset
                    await uploadMedia({
                        file,
                        ...options,
                        onProgress: (progress) => {
                            setUploadProgress((prev) => {
                                const newProgress = [...prev];
                                newProgress[i] = progress;
                                return newProgress;
                            });
                        },
                    });

                    uploadResults.push({
                        success: true,
                        filename: file.name,
                    });

                    // Ensure progress shows 100% on completion
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

    // Delete variant handler
    const handleDeleteVariant = useCallback(
        async (variantName: string) => {
            if (!selectedItem) return;

            setLoadingState((prev) => ({ ...prev, isProcessing: true }));

            try {
                await deleteVariant(selectedItem.id, variantName);
                // Update the selected item to remove the deleted variant
                const updatedItem = {
                    ...selectedItem,
                    variants: selectedItem.variants.filter(
                        (v) => v.name !== variantName,
                    ),
                };
                setSelectedItem(updatedItem);
                setMediaItems((prev) =>
                    prev.map((item) =>
                        item.id === selectedItem.id ? updatedItem : item,
                    ),
                );
                setSnackbar({
                    open: true,
                    message: `Variant "${variantName}" deleted successfully`,
                    severity: "success",
                });
            } catch (err) {
                setSnackbar({
                    open: true,
                    message:
                        err instanceof Error
                            ? err.message
                            : "Failed to delete variant",
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

    return {
        // Form state
        register,
        watch,
        setValue,
        searchQuery,
        filterType,

        // View state
        viewMode,
        setViewMode,

        // Selection state
        selectedItems,
        setSelectedItems,
        selectedItem,
        setSelectedItem,

        // Data state
        mediaItems,
        totalItems,
        currentPage,
        setCurrentPage,
        itemsPerPage,
        totalPages,

        // Loading state
        loadingState,
        uploadProgress,
        error,

        // File input key
        fileInputKey,

        // Dialog states
        dialogState,
        setDialogState,
        uploadDialogState,
        setUploadDialogState,
        cropperDialogState,
        setCropperDialogState,

        // Snackbar state
        snackbar,
        setSnackbar,

        // Container ref
        containerRef,

        // Handlers
        fetchMedia,
        handleShowUploadDialog,
        handleFileUpload,
        handleDragOver,
        handleDrop,
        handleSelectItem,
        handleSelectAll,
        handleDeleteSelected,
        handleUpdateItem,
        handleDownloadItem,
        handleGenerateVariants,
        handleDeleteVariant,
        handleResize,
        handleOptimize,
        handleConvert,
        handleViewItem,
        handleOpenCropper,
        handleCustomCrop,
    };
}
