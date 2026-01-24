"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControlLabel,
    Switch,
    Stack,
    Typography,
    Chip,
    Box,
    Autocomplete,
    Divider,
    Alert,
    Card,
    CardMedia,
    CardContent,
    IconButton,
    Tabs,
    Tab,
    Snackbar,
    Tooltip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from "@mui/material";
import {
    Upload,
    Image as ImageIcon,
    VideoFile,
    AudioFile,
    InsertDriveFile,
    Close,
    Add,
    DeleteOutline,
    ExpandMore,
} from "@mui/icons-material";
import { formatFileSize, getAcceptedFileTypes } from "./utils";
import { PostProcessingBuilder } from "./PostProcessingBuilder";
import type { PostProcessingOperation } from "./types";

export interface FileWithOptions {
    file: File;
    options: UploadOptions;
}

interface UploadConfirmDialogProps {
    open: boolean;
    files: File[];
    onConfirm: (filesWithOptions: FileWithOptions[]) => void;
    onCancel: () => void;
}

interface InternalFile extends File {
    _id: string;
}

export interface UploadOptions {
    title?: string;
    altText?: string;
    caption?: string;
    description?: string;
    folder?: string;
    tags?: string[];
    generateVariants?: boolean;
    postProcessings?: PostProcessingOperation[];
}

interface FileUploadConfig {
    file: File;
    preview?: string;
    options: UploadOptions;
}

interface UploadFormData {
    title: string;
    altText: string;
    caption: string;
    description: string;
    folder: string;
    tags: string[];
    generateVariants: boolean;
}

export const UploadConfirmDialog: React.FC<UploadConfirmDialogProps> = ({
    open,
    files,
    onConfirm,
    onCancel,
}) => {
    const [currentTab, setCurrentTab] = useState(0);
    const [internalFiles, setInternalFiles] = useState<File[]>([]);
    const [filePreviews, setFilePreviews] = useState<string[]>([]);
    const [fileConfigs, setFileConfigs] = useState<FileUploadConfig[]>([]);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dialogRef = useRef<HTMLDivElement>(null);
    const previewUrlsRef = useRef<Set<string>>(new Set());

    const {
        register,
        handleSubmit,
        control,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<UploadFormData>({
        defaultValues: {
            title: "",
            altText: "",
            caption: "",
            description: "",
            folder: "",
            tags: [],
            generateVariants: true,
        },
    });

    // Initialize internal files from props when dialog opens
    useEffect(() => {
        if (open && files.length > 0 && internalFiles.length === 0) {
            // Only initialize on first open
            const previews: string[] = [];
            const configs: FileUploadConfig[] = [];

            files.forEach((file) => {
                // Generate preview URL for images and videos
                if (
                    file.type.startsWith("image/") ||
                    file.type.startsWith("video/")
                ) {
                    const url = URL.createObjectURL(file);
                    previews.push(url);
                    previewUrlsRef.current.add(url);
                } else {
                    previews.push("");
                }

                // Initialize config for each file
                const fileName = file.name.replace(/\.[^/.]+$/, "");
                configs.push({
                    file,
                    preview: "",
                    options: {
                        title: fileName,
                        altText: "",
                        caption: "",
                        description: "",
                        folder: "",
                        tags: [],
                        generateVariants: file.type.startsWith("image/"),
                        postProcessings: [],
                    },
                });
            });

            setInternalFiles(files);
            setFilePreviews(previews);
            setFileConfigs(configs);
            setCurrentTab(0);

            // Set form values for first file
            if (configs.length > 0) {
                const firstConfig = configs[0];
                setValue("title", firstConfig.options.title || "");
                setValue("altText", firstConfig.options.altText || "");
                setValue("caption", firstConfig.options.caption || "");
                setValue("description", firstConfig.options.description || "");
                setValue("folder", firstConfig.options.folder || "");
                setValue("tags", firstConfig.options.tags || []);
                setValue(
                    "generateVariants",
                    firstConfig.options.generateVariants || false,
                );
            }
        } else if (!open) {
            // Cleanup all preview URLs
            previewUrlsRef.current.forEach((url) => {
                URL.revokeObjectURL(url);
            });
            previewUrlsRef.current.clear();

            // Reset when dialog closes
            setInternalFiles([]);
            setFilePreviews([]);
            setFileConfigs([]);
            setCurrentTab(0);
        }
    }, [open, files, internalFiles.length, setValue]);

    // Cleanup all preview URLs on unmount
    useEffect(() => {
        return () => {
            previewUrlsRef.current.forEach((url) => {
                URL.revokeObjectURL(url);
            });
            previewUrlsRef.current.clear();
        };
    }, []);

    // Add more files to the upload queue
    const handleAddMoreFiles = useCallback(
        (newFiles: FileList | File[] | null) => {
            if (!newFiles || newFiles.length === 0) return;

            const newFileArray = Array.from(newFiles);
            const currentFormData = watch();

            // Generate previews for new files
            const newPreviews: string[] = [];
            newFileArray.forEach((file) => {
                if (
                    file.type.startsWith("image/") ||
                    file.type.startsWith("video/")
                ) {
                    const url = URL.createObjectURL(file);
                    newPreviews.push(url);
                    previewUrlsRef.current.add(url);
                } else {
                    newPreviews.push("");
                }
            });

            // Save current tab's data and add new file configs
            setFileConfigs((prev) => {
                const updated = [...prev];
                if (updated[currentTab]) {
                    updated[currentTab].options = {
                        title: currentFormData.title || undefined,
                        altText: currentFormData.altText || undefined,
                        caption: currentFormData.caption || undefined,
                        description: currentFormData.description || undefined,
                        folder: currentFormData.folder || undefined,
                        tags:
                            currentFormData.tags &&
                                currentFormData.tags.length > 0
                                ? currentFormData.tags.filter(
                                    (t): t is string => Boolean(t),
                                )
                                : undefined,
                        generateVariants: currentFormData.generateVariants,
                    };
                }

                // Add new file configs
                const newConfigs = newFileArray.map((file) => {
                    const fileName = file.name.replace(/\.[^/.]+$/, "");
                    return {
                        file,
                        preview: "",
                        options: {
                            title: fileName,
                            altText: "",
                            caption: "",
                            description: "",
                            folder: currentFormData.folder || "",
                            tags: [],
                            generateVariants: file.type.startsWith("image/"),
                        },
                    };
                });

                return [...updated, ...newConfigs];
            });

            // Add to internal files and previews
            setInternalFiles((prev) => [...prev, ...newFileArray]);
            setFilePreviews((prev) => [...prev, ...newPreviews]);

            setSnackbarMessage(
                `Added ${newFileArray.length} file(s) to upload queue`,
            );
        },
        [currentTab, watch],
    );

    // Remove a file from the upload queue
    const handleRemoveFile = useCallback(
        (indexToRemove: number) => {
            const currentFormData = watch();

            // Save current tab's data before removing
            setFileConfigs((prev) => {
                const updated = [...prev];
                if (updated[currentTab]) {
                    updated[currentTab].options = {
                        title: currentFormData.title || undefined,
                        altText: currentFormData.altText || undefined,
                        caption: currentFormData.caption || undefined,
                        description: currentFormData.description || undefined,
                        folder: currentFormData.folder || undefined,
                        tags:
                            currentFormData.tags &&
                                currentFormData.tags.length > 0
                                ? currentFormData.tags.filter(
                                    (t): t is string => Boolean(t),
                                )
                                : undefined,
                        generateVariants: currentFormData.generateVariants,
                    };
                }

                // Remove the file config
                return updated.filter((_, i) => i !== indexToRemove);
            });

            // Cleanup preview URL if exists
            const previewUrl = filePreviews[indexToRemove];
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
                previewUrlsRef.current.delete(previewUrl);
            }

            // Remove from internal files
            setInternalFiles((prev) =>
                prev.filter((_, i) => i !== indexToRemove),
            );

            // Update previews
            setFilePreviews((prev) =>
                prev.filter((_, i) => i !== indexToRemove),
            );

            // Adjust current tab if needed
            setCurrentTab((prevTab) => {
                const newLength = internalFiles.length - 1;
                if (newLength === 0) return 0;
                if (prevTab >= newLength) return newLength - 1;
                if (prevTab > indexToRemove) return prevTab - 1;
                return prevTab;
            });

            setSnackbarMessage("File removed from upload queue");

            // Auto-close dialog if all files are removed
            if (internalFiles.length === 1) {
                setTimeout(() => {
                    handleCancel();
                }, 500);
            }
        },
        [currentTab, watch, filePreviews, internalFiles.length],
    );

    // Handle paste event within dialog
    const handlePaste = useCallback(
        (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            const pastedFiles: File[] = [];
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.kind === "file") {
                    const file = item.getAsFile();
                    if (file) {
                        pastedFiles.push(file);
                    }
                }
            }

            if (pastedFiles.length > 0) {
                e.preventDefault();
                handleAddMoreFiles(pastedFiles);
            }
        },
        [handleAddMoreFiles],
    );

    // Add paste event listener when dialog is open
    useEffect(() => {
        if (!open) return;

        const handlePasteEvent = (e: ClipboardEvent) => handlePaste(e);
        window.addEventListener("paste", handlePasteEvent);

        return () => {
            window.removeEventListener("paste", handlePasteEvent);
        };
    }, [open, handlePaste]);

    // Update current file config when form changes
    useEffect(() => {
        if (fileConfigs.length === 0) return;

        const subscription = watch((formData) => {
            setFileConfigs((prev) => {
                const updated = [...prev];
                if (updated[currentTab]) {
                    updated[currentTab].options = {
                        title: formData.title || undefined,
                        altText: formData.altText || undefined,
                        caption: formData.caption || undefined,
                        description: formData.description || undefined,
                        folder: formData.folder || undefined,
                        tags:
                            formData.tags && formData.tags.length > 0
                                ? formData.tags.filter((t): t is string =>
                                    Boolean(t),
                                )
                                : undefined,
                        generateVariants: formData.generateVariants,
                    };
                }
                return updated;
            });
        });

        return () => subscription.unsubscribe();
    }, [watch, currentTab, fileConfigs.length]);

    // Handle tab change
    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        // Save current form state before switching
        const currentFormData = watch();
        setFileConfigs((prev) => {
            const updated = [...prev];
            if (updated[currentTab]) {
                updated[currentTab].options = {
                    title: currentFormData.title || undefined,
                    altText: currentFormData.altText || undefined,
                    caption: currentFormData.caption || undefined,
                    description: currentFormData.description || undefined,
                    folder: currentFormData.folder || undefined,
                    tags:
                        currentFormData.tags && currentFormData.tags.length > 0
                            ? currentFormData.tags.filter((t): t is string =>
                                Boolean(t),
                            )
                            : undefined,
                    generateVariants: currentFormData.generateVariants,
                };
            }
            return updated;
        });

        // Load new tab's data
        setCurrentTab(newValue);
        if (fileConfigs[newValue]) {
            const config = fileConfigs[newValue];
            setValue("title", config.options.title || "");
            setValue("altText", config.options.altText || "");
            setValue("caption", config.options.caption || "");
            setValue("description", config.options.description || "");
            setValue("folder", config.options.folder || "");
            setValue(
                "tags",
                (config.options.tags || []).filter((t): t is string =>
                    Boolean(t),
                ),
            );
            setValue(
                "generateVariants",
                config.options.generateVariants || false,
            );
        }
    };

    const onSubmit = (data: UploadFormData) => {
        // Save current tab data
        const updatedConfigs = [...fileConfigs];
        if (updatedConfigs[currentTab]) {
            updatedConfigs[currentTab].options = {
                title: data.title || undefined,
                altText: data.altText || undefined,
                caption: data.caption || undefined,
                description: data.description || undefined,
                folder: data.folder || undefined,
                tags:
                    data.tags && data.tags.length > 0
                        ? data.tags.filter((t): t is string => Boolean(t))
                        : undefined,
                generateVariants: data.generateVariants,
                // Preserve postProcessings from the config (managed by PostProcessingBuilder)
                postProcessings:
                    updatedConfigs[currentTab].options.postProcessings,
            };
        }

        // Convert configs to FileWithOptions array
        const filesWithOptions: FileWithOptions[] = updatedConfigs.map(
            (config) => ({
                file: config.file,
                options: config.options,
            }),
        );

        onConfirm(filesWithOptions);
        handleCancel();
    };

    const handleCancel = () => {
        reset();
        setCurrentTab(0);
        setFileConfigs([]);
        setFilePreviews([]);
        onCancel();
    };

    const getFileIcon = (file: File) => {
        if (file.type.startsWith("image/")) return <ImageIcon />;
        if (file.type.startsWith("video/")) return <VideoFile />;
        if (file.type.startsWith("audio/")) return <AudioFile />;
        return <InsertDriveFile />;
    };

    const currentFile = internalFiles[currentTab];
    const currentPreview = filePreviews[currentTab];
    const hasImages = internalFiles.some((f) => f.type.startsWith("image/"));
    const isCurrentFileImage = currentFile?.type.startsWith("image/");
    const isCurrentFileVideo = currentFile?.type.startsWith("video/");
    const totalSize = internalFiles.reduce((acc, file) => acc + file.size, 0);

    return (
        <Dialog
            open={open}
            onClose={handleCancel}
            maxWidth="md"
            fullWidth
            PaperProps={{
                component: "form",
                onSubmit: handleSubmit(onSubmit),
                ref: dialogRef,
            }}
        >
            <DialogTitle>
                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                >
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Upload />
                        <Typography variant="h6">
                            Upload {internalFiles.length}{" "}
                            {internalFiles.length === 1 ? "File" : "Files"}
                        </Typography>
                        <Chip
                            label={formatFileSize(totalSize)}
                            size="small"
                            color="primary"
                            variant="outlined"
                        />
                    </Stack>
                    <Stack direction="row" spacing={1}>
                        <Tooltip title="Add more files (or paste with Ctrl/Cmd+V)">
                            <Button
                                size="small"
                                startIcon={<Add />}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Add Files
                            </Button>
                        </Tooltip>
                        <IconButton onClick={handleCancel} size="small">
                            <Close />
                        </IconButton>
                    </Stack>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        hidden
                        accept={getAcceptedFileTypes()}
                        onChange={(e) => {
                            handleAddMoreFiles(e.target.files);
                            e.target.value = "";
                        }}
                    />
                </Stack>
            </DialogTitle>

            <DialogContent>
                {internalFiles.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                            No files selected. Add files to continue.
                        </Typography>
                        <Button
                            variant="outlined"
                            startIcon={<Add />}
                            onClick={() => fileInputRef.current?.click()}
                            sx={{ mt: 2 }}
                        >
                            Add Files
                        </Button>
                    </Box>
                ) : (
                    <Stack spacing={3}>
                        {/* Tabs for multiple files */}
                        {internalFiles.length > 1 && (
                            <Box
                                sx={{ borderBottom: 1, borderColor: "divider" }}
                            >
                                <Tabs
                                    value={currentTab}
                                    onChange={handleTabChange}
                                    variant="scrollable"
                                    scrollButtons="auto"
                                >
                                    {internalFiles.map((file, index) => (
                                        <Tab
                                            key={index}
                                            label={
                                                <Stack
                                                    direction="row"
                                                    spacing={0.5}
                                                    alignItems="center"
                                                >
                                                    {getFileIcon(file)}
                                                    <Typography
                                                        variant="body2"
                                                        noWrap
                                                        sx={{ maxWidth: 100 }}
                                                    >
                                                        {file.name}
                                                    </Typography>
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveFile(
                                                                index,
                                                            );
                                                        }}
                                                        sx={{
                                                            ml: 0.5,
                                                            p: 0.25,
                                                            "&:hover": {
                                                                color: "error.main",
                                                            },
                                                        }}
                                                    >
                                                        <Close
                                                            sx={{
                                                                fontSize: 16,
                                                            }}
                                                        />
                                                    </IconButton>
                                                </Stack>
                                            }
                                        />
                                    ))}
                                </Tabs>
                            </Box>
                        )}

                        {/* File Preview Card */}
                        {currentFile && (
                            <Card variant="outlined">
                                {currentPreview &&
                                    (isCurrentFileImage || isCurrentFileVideo) ? (
                                    <Box
                                        sx={{
                                            position: "relative",
                                            bgcolor: "grey.100",
                                        }}
                                    >
                                        {isCurrentFileImage ? (
                                            <CardMedia
                                                component="img"
                                                image={currentPreview}
                                                alt={currentFile.name}
                                                sx={{
                                                    maxHeight: 300,
                                                    objectFit: "contain",
                                                    width: "100%",
                                                }}
                                            />
                                        ) : (
                                            <CardMedia
                                                component="video"
                                                src={currentPreview}
                                                controls
                                                sx={{
                                                    maxHeight: 300,
                                                    width: "100%",
                                                }}
                                            />
                                        )}
                                        {internalFiles.length > 1 && (
                                            <Tooltip title="Remove this file">
                                                <IconButton
                                                    size="small"
                                                    onClick={() =>
                                                        handleRemoveFile(
                                                            currentTab,
                                                        )
                                                    }
                                                    sx={{
                                                        position: "absolute",
                                                        top: 8,
                                                        right: 8,
                                                        bgcolor:
                                                            "rgba(0, 0, 0, 0.5)",
                                                        color: "white",
                                                        "&:hover": {
                                                            bgcolor:
                                                                "rgba(255, 0, 0, 0.7)",
                                                        },
                                                    }}
                                                >
                                                    <DeleteOutline fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </Box>
                                ) : (
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            height: 200,
                                            bgcolor: "grey.100",
                                            position: "relative",
                                        }}
                                    >
                                        {getFileIcon(currentFile)}
                                        {internalFiles.length > 1 && (
                                            <Tooltip title="Remove this file">
                                                <IconButton
                                                    size="small"
                                                    onClick={() =>
                                                        handleRemoveFile(
                                                            currentTab,
                                                        )
                                                    }
                                                    sx={{
                                                        position: "absolute",
                                                        top: 8,
                                                        right: 8,
                                                        bgcolor:
                                                            "rgba(0, 0, 0, 0.5)",
                                                        color: "white",
                                                        "&:hover": {
                                                            bgcolor:
                                                                "rgba(255, 0, 0, 0.7)",
                                                        },
                                                    }}
                                                >
                                                    <DeleteOutline fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </Box>
                                )}
                                <CardContent>
                                    <Typography
                                        variant="body1"
                                        fontWeight="medium"
                                        noWrap
                                    >
                                        {currentFile.name}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        {formatFileSize(currentFile.size)} •{" "}
                                        {currentFile.type || "Unknown type"}
                                    </Typography>
                                </CardContent>
                            </Card>
                        )}

                        <Divider />

                        {/* Form Fields */}
                        <Stack spacing={2.5}>
                            {/* Title */}
                            <TextField
                                label="Title"
                                fullWidth
                                {...register("title")}
                                helperText="Display name for this file"
                                size="small"
                            />

                            {/* Alt Text (for images) */}
                            {isCurrentFileImage && (
                                <TextField
                                    label="Alt Text"
                                    fullWidth
                                    {...register("altText")}
                                    helperText="Describe the image for accessibility"
                                    size="small"
                                />
                            )}

                            {/* Caption */}
                            <TextField
                                label="Caption"
                                fullWidth
                                multiline
                                rows={2}
                                {...register("caption")}
                                helperText="Short description displayed with the media"
                                size="small"
                            />

                            {/* Description */}
                            <TextField
                                label="Description"
                                fullWidth
                                multiline
                                rows={2}
                                {...register("description")}
                                helperText="Detailed description for internal reference"
                                size="small"
                            />

                            {/* Folder */}
                            <TextField
                                label="Folder"
                                fullWidth
                                {...register("folder")}
                                helperText="Organize into a folder (e.g., 'blog/2024')"
                                size="small"
                                placeholder="e.g., blog/images"
                            />

                            {/* Tags */}
                            <Controller
                                name="tags"
                                control={control}
                                render={({ field: { onChange, value } }) => (
                                    <Autocomplete
                                        multiple
                                        freeSolo
                                        options={[]}
                                        value={value || []}
                                        onChange={(_, newValue) => {
                                            onChange(newValue);
                                        }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Tags"
                                                helperText="Press Enter to add tags"
                                                size="small"
                                            />
                                        )}
                                        renderTags={(value, getTagProps) =>
                                            value.map((option, index) => (
                                                <Chip
                                                    label={option}
                                                    size="small"
                                                    {...getTagProps({ index })}
                                                    key={index}
                                                />
                                            ))
                                        }
                                    />
                                )}
                            />

                            {/* Generate Variants (for images) */}
                            {isCurrentFileImage && (
                                <FormControlLabel
                                    control={
                                        <Controller
                                            name="generateVariants"
                                            control={control}
                                            render={({ field }) => (
                                                <Switch
                                                    {...field}
                                                    checked={field.value}
                                                />
                                            )}
                                        />
                                    }
                                    label={
                                        <Box>
                                            <Typography variant="body2">
                                                Generate image variants
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                            >
                                                Automatically create thumbnails
                                                and optimized versions
                                            </Typography>
                                        </Box>
                                    }
                                />
                            )}

                            {/* Post-Upload Processing (for images) */}
                            {isCurrentFileImage && (
                                <Accordion
                                    disableGutters
                                    elevation={0}
                                    sx={{
                                        border: 1,
                                        borderColor: "divider",
                                        borderRadius: 1,
                                        "&:before": { display: "none" },
                                    }}
                                >
                                    <AccordionSummary
                                        expandIcon={<ExpandMore />}
                                        sx={{
                                            minHeight: 48,
                                            "& .MuiAccordionSummary-content": {
                                                my: 0,
                                            },
                                        }}
                                    >
                                        <Stack
                                            direction="row"
                                            alignItems="center"
                                            spacing={1}
                                        >
                                            <Typography variant="body2">
                                                Post-Upload Processing
                                            </Typography>
                                            {fileConfigs[currentTab]?.options
                                                .postProcessings &&
                                                fileConfigs[currentTab].options
                                                    .postProcessings!.length >
                                                0 && (
                                                    <Chip
                                                        label={`${fileConfigs[currentTab].options.postProcessings!.length} step${fileConfigs[currentTab].options.postProcessings!.length > 1 ? "s" : ""}`}
                                                        size="small"
                                                        color="primary"
                                                    />
                                                )}
                                        </Stack>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <PostProcessingBuilder
                                            operations={
                                                fileConfigs[currentTab]?.options
                                                    .postProcessings || []
                                            }
                                            onChange={(operations) => {
                                                setFileConfigs((prev) => {
                                                    const updated = [...prev];
                                                    if (updated[currentTab]) {
                                                        updated[
                                                            currentTab
                                                        ].options.postProcessings =
                                                            operations;
                                                    }
                                                    return updated;
                                                });
                                            }}
                                        />
                                    </AccordionDetails>
                                </Accordion>
                            )}
                        </Stack>

                        {/* Navigation hint for multiple files */}
                        {internalFiles.length > 1 && (
                            <Alert
                                severity="info"
                                sx={{ fontSize: "0.875rem" }}
                            >
                                Configuring file {currentTab + 1} of{" "}
                                {internalFiles.length}. Use the tabs above to
                                configure each file individually.
                            </Alert>
                        )}
                    </Stack>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={handleCancel} color="inherit">
                    Cancel
                </Button>
                <Button
                    type="submit"
                    variant="contained"
                    startIcon={<Upload />}
                    disabled={internalFiles.length === 0}
                >
                    Upload All Files
                </Button>
            </DialogActions>

            {/* Snackbar for notifications */}
            <Snackbar
                open={Boolean(snackbarMessage)}
                autoHideDuration={3000}
                onClose={() => setSnackbarMessage("")}
                message={snackbarMessage}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            />
        </Dialog>
    );
};
