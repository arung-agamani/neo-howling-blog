"use client";

import React from "react";
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
    Slide,
    Backdrop,
    useMediaQuery,
    useTheme,
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
    Settings,
} from "@mui/icons-material";

import { MediaGridItem } from "./MediaGridItem";
import { MediaListItem } from "./MediaListItem";
import { MediaDetailPanel } from "./MediaDetailPanel";
import { UploadConfirmDialog } from "./UploadConfirmDialog";
import { MediaCropper } from "./MediaCropper";
import { getAcceptedFileTypes } from "./utils";
import type { MediaLibraryProps, FilterType } from "./types";
import { useMediaLibrary } from "./useMediaLibrary";

/**
 * Main Media Library Component
 * WordPress-style media management interface with grid/list views,
 * search, filtering, upload, and detailed editing capabilities
 * Integrated with /v1/media API
 *
 * Features:
 * - Upload via button, drag & drop, or clipboard (Ctrl/Cmd + V)
 * - Mobile responsive with bottom drawer for detail panel
 * - Simplified state management with custom hook
 */
export const MediaLibrary: React.FC<MediaLibraryProps> = ({
    onSelect,
    selectionMode = "multiple",
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const {
        // Form state
        register,
        setValue,
        searchQuery,
        filterType,

        // View state
        viewMode,
        setViewMode,

        // Selection state
        selectedItems,
        selectedItem,
        setSelectedItem,

        // Data state
        mediaItems,
        totalItems,
        currentPage,
        setCurrentPage,
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
    } = useMediaLibrary({ onSelect, selectionMode });

    // State for mobile detail panel drawer
    const [mobileDetailOpen, setMobileDetailOpen] = React.useState(false);

    // Open mobile drawer when item is selected on mobile
    React.useEffect(() => {
        if (isMobile && selectedItem) {
            setMobileDetailOpen(true);
        }
    }, [isMobile, selectedItem]);

    // Close drawer handler
    const handleCloseMobileDetail = () => {
        setMobileDetailOpen(false);
    };

    // Detail Panel Component (shared between desktop and mobile)
    const DetailPanelContent = () => (
        <MediaDetailPanel
            item={selectedItem}
            onClose={() => {
                setSelectedItem(null);
                if (isMobile) {
                    setMobileDetailOpen(false);
                }
            }}
            onUpdate={handleUpdateItem}
            onDelete={(permanent) => {
                setDialogState({
                    permanentDelete: permanent || false,
                    deleteDialogOpen: true,
                });
            }}
            onDownload={handleDownloadItem}
            onGenerateVariants={handleGenerateVariants}
            onDeleteVariant={handleDeleteVariant}
            onCustomCrop={handleOpenCropper}
            onResize={handleResize}
            onOptimize={handleOptimize}
            onConvert={handleConvert}
            isProcessing={loadingState.isProcessing}
        />
    );

    return (
        <Box
            ref={containerRef}
            sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                bgcolor: "grey.50",
                position: "relative",
                overflow: "hidden",
            }}
            tabIndex={0}
        >
            {/* Header */}
            <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 0, boxShadow: 1 }}>
                {/* Row 1: Title and Action Buttons */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: { xs: 2, md: 3 },
                        flexWrap: { xs: "wrap", md: "nowrap" },
                        gap: 1,
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Typography
                            variant="h4"
                            component="h1"
                            fontWeight="bold"
                            sx={{ fontSize: { xs: "1.5rem", md: "2.125rem" } }}
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
                    <Box
                        sx={{
                            display: "flex",
                            gap: 1,
                            flexWrap: "wrap",
                        }}
                    >
                        <Tooltip title="Refresh">
                            <Button
                                variant="outlined"
                                onClick={fetchMedia}
                                disabled={loadingState.isLoading}
                                size={isMobile ? "small" : "medium"}
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
                                size={isMobile ? "small" : "medium"}
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
                        </Tooltip>
                    </Box>
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

                {/* Row 2: Search Bar, Filter, and View Mode */}
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={2}
                    flexWrap="wrap"
                    alignItems={{ xs: "stretch", md: "center" }}
                    sx={{ gap: 1 }}
                >
                    {/* Search Bar */}
                    <TextField
                        placeholder="Search media..."
                        {...register("search")}
                        size="small"
                        sx={{
                            flexGrow: { xs: 1, md: 0 },
                            minWidth: { md: 300 },
                            maxWidth: { md: 400 },
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search />
                                </InputAdornment>
                            ),
                        }}
                    />

                    {/* Filter */}
                    <FormControl size="small" sx={{ minWidth: 120 }}>
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
                                    xs={6}
                                    sm={4}
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
                            <Table size={isMobile ? "small" : "medium"}>
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
                                        {!isMobile && (
                                            <>
                                                <TableCell>Type</TableCell>
                                                <TableCell>Size</TableCell>
                                                <TableCell>Date</TableCell>
                                            </>
                                        )}
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
                                size={isMobile ? "small" : "medium"}
                            />
                        </Box>
                    )}
                </Box>

                {/* Detail Panel - Desktop: Side panel */}
                {!isMobile && <DetailPanelContent />}
            </Box>

            {/* Mobile: Floating button to open detail panel when item selected */}
            {isMobile && selectedItem && !mobileDetailOpen && (
                <Button
                    variant="contained"
                    onClick={() => setMobileDetailOpen(true)}
                    sx={{
                        position: "absolute",
                        bottom: 16,
                        right: 16,
                        zIndex: 10,
                        borderRadius: "50%",
                        minWidth: "56px",
                        width: "56px",
                        height: "56px",
                        boxShadow: 3,
                    }}
                    aria-label="Open media details"
                >
                    <Settings />
                </Button>
            )}

            {/* Mobile: Inline Bottom Sheet for Detail Panel (confined to container) */}
            {isMobile && (
                <>
                    {/* Backdrop */}
                    <Backdrop
                        open={mobileDetailOpen}
                        onClick={handleCloseMobileDetail}
                        sx={{
                            position: "absolute",
                            zIndex: 20,
                            bgcolor: "rgba(0, 0, 0, 0.5)",
                        }}
                    />
                    {/* Slide-up Panel */}
                    <Slide
                        direction="up"
                        in={mobileDetailOpen}
                        mountOnEnter
                        unmountOnExit
                    >
                        <Box
                            sx={{
                                position: "absolute",
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: "85%",
                                maxHeight: "85%",
                                bgcolor: "white",
                                borderTopLeftRadius: 16,
                                borderTopRightRadius: 16,
                                boxShadow: "0 -4px 20px rgba(0,0,0,0.15)",
                                zIndex: 30,
                                display: "flex",
                                flexDirection: "column",
                                overflow: "hidden",
                            }}
                        >
                            {/* Drag handle indicator */}
                            <Box
                                sx={{
                                    width: "100%",
                                    display: "flex",
                                    justifyContent: "center",
                                    py: 1.5,
                                    backgroundColor: "white",
                                    borderBottom: "1px solid #eee",
                                    flexShrink: 0,
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 40,
                                        height: 4,
                                        backgroundColor: "#ccc",
                                        borderRadius: 2,
                                    }}
                                />
                            </Box>
                            {/* Header with close button */}
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    px: 2,
                                    py: 1,
                                    backgroundColor: "white",
                                    borderBottom: "1px solid #eee",
                                    flexShrink: 0,
                                }}
                            >
                                <Typography fontWeight="bold" fontSize="1.1rem">
                                    Media Details
                                </Typography>
                                <Button
                                    onClick={handleCloseMobileDetail}
                                    sx={{ minWidth: "auto", p: 1 }}
                                >
                                    ✕
                                </Button>
                            </Box>
                            {/* Content */}
                            <Box
                                sx={{
                                    flex: 1,
                                    overflow: "auto",
                                    backgroundColor: "white",
                                }}
                            >
                                <DetailPanelContent />
                            </Box>
                        </Box>
                    </Slide>
                </>
            )}

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
                fullScreen={isMobile}
                PaperProps={{
                    sx: isMobile ? {} : { height: "90vh", maxHeight: 800 },
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
                fullWidth
                maxWidth="xs"
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
