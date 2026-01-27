"use client";

import React, { useCallback, useState } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    IconButton,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    TextField,
    Slider,
    Stack,
    Chip,
    Tooltip,
    Collapse,
    Alert,
    Menu,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider,
    ListItemIcon,
    ListItemText,
    CircularProgress,
} from "@mui/material";
import {
    Add,
    Delete,
    DragIndicator,
    PhotoSizeSelectLarge,
    Compress,
    Transform,
    ArrowUpward,
    ArrowDownward,
    ExpandMore,
    ExpandLess,
    Save,
    BookmarkBorder,
    Bookmark,
    DeleteOutline,
    Star,
    StarBorder,
} from "@mui/icons-material";
import type {
    PostProcessingOperation,
    PostProcessingType,
    ResizeOperation,
    CompressOperation,
    ConvertFormatOperation,
    PostProcessingPreset,
} from "./types";

export interface PostProcessingBuilderProps {
    operations: PostProcessingOperation[];
    onChange: (operations: PostProcessingOperation[]) => void;
    disabled?: boolean;
    /** Whether presets feature is available */
    presetsAvailable?: boolean;
    /** Loading state for presets */
    presetsLoading?: boolean;
    /** List of available preset names */
    presetNames?: string[];
    /** Name of the default preset */
    defaultPresetName?: string | null;
    /** Get a preset by name */
    onGetPreset?: (name: string) => PostProcessingPreset | null;
    /** Save current operations as a preset */
    onSavePreset?: (
        name: string,
        operations: PostProcessingOperation[],
        description?: string,
    ) => Promise<boolean>;
    /** Delete a preset */
    onDeletePreset?: (name: string) => Promise<boolean>;
    /** Set a preset as default */
    onSetDefaultPreset?: (name: string | null) => Promise<boolean>;
}

// Helper to create default operations
export const createDefaultOperation = (
    type: PostProcessingType,
): PostProcessingOperation => {
    switch (type) {
        case "resize":
            return {
                type: "resize",
                config: {
                    width: 1920,
                    height: undefined,
                    fit: "inside",
                },
            };
        case "compress":
            return {
                type: "compress",
                config: {
                    quality: 85,
                },
            };
        case "convertFormat":
            return {
                type: "convertFormat",
                config: {
                    format: "webp",
                    quality: 85,
                },
            };
    }
};

// Operation type labels and icons
const operationInfo: Record<
    PostProcessingType,
    { label: string; description: string; icon: React.ReactNode }
> = {
    resize: {
        label: "Resize",
        description: "Change image dimensions",
        icon: <PhotoSizeSelectLarge fontSize="small" />,
    },
    compress: {
        label: "Compress",
        description: "Reduce file size",
        icon: <Compress fontSize="small" />,
    },
    convertFormat: {
        label: "Convert Format",
        description: "Change image format",
        icon: <Transform fontSize="small" />,
    },
};

// Fit mode labels
const fitModeLabels: Record<string, string> = {
    cover: "Cover (crop to fill)",
    contain: "Contain (fit within)",
    fill: "Fill (stretch)",
    inside: "Inside (fit, no upscale)",
    outside: "Outside (cover, no downscale)",
};

// Format labels
const formatLabels: Record<string, string> = {
    jpeg: "JPEG",
    png: "PNG",
    webp: "WebP",
    avif: "AVIF",
};

interface OperationItemProps {
    operation: PostProcessingOperation;
    index: number;
    totalCount: number;
    onUpdate: (index: number, operation: PostProcessingOperation) => void;
    onRemove: (index: number) => void;
    onMoveUp: (index: number) => void;
    onMoveDown: (index: number) => void;
    disabled?: boolean;
}

const OperationItem: React.FC<OperationItemProps> = ({
    operation,
    index,
    totalCount,
    onUpdate,
    onRemove,
    onMoveUp,
    onMoveDown,
    disabled,
}) => {
    const [expanded, setExpanded] = useState(true);
    const info = operationInfo[operation.type];

    const handleConfigChange = useCallback(
        (key: string, value: any) => {
            const newOperation = {
                ...operation,
                config: {
                    ...operation.config,
                    [key]: value === "" ? undefined : value,
                },
            } as PostProcessingOperation;
            onUpdate(index, newOperation);
        },
        [operation, index, onUpdate],
    );

    return (
        <Card
            variant="outlined"
            sx={{
                mb: 1,
                opacity: disabled ? 0.6 : 1,
                backgroundColor: "background.paper",
            }}
        >
            <CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}>
                {/* Header */}
                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    spacing={1}
                >
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <DragIndicator
                            fontSize="small"
                            sx={{ color: "text.secondary", cursor: "grab" }}
                        />
                        <Chip
                            icon={info.icon as React.ReactElement}
                            label={info.label}
                            size="small"
                            color="primary"
                            variant="outlined"
                        />
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: { xs: "none", sm: "block" } }}
                        >
                            {info.description}
                        </Typography>
                    </Stack>

                    <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Move up">
                            <span>
                                <IconButton
                                    size="small"
                                    onClick={() => onMoveUp(index)}
                                    disabled={disabled || index === 0}
                                >
                                    <ArrowUpward fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Tooltip title="Move down">
                            <span>
                                <IconButton
                                    size="small"
                                    onClick={() => onMoveDown(index)}
                                    disabled={
                                        disabled || index === totalCount - 1
                                    }
                                >
                                    <ArrowDownward fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Tooltip title={expanded ? "Collapse" : "Expand"}>
                            <IconButton
                                size="small"
                                onClick={() => setExpanded(!expanded)}
                            >
                                {expanded ? <ExpandLess /> : <ExpandMore />}
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove">
                            <IconButton
                                size="small"
                                onClick={() => onRemove(index)}
                                disabled={disabled}
                                color="error"
                            >
                                <Delete fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Stack>

                {/* Config */}
                <Collapse in={expanded}>
                    <Box sx={{ mt: 2 }}>
                        {operation.type === "resize" && (
                            <ResizeConfig
                                config={(operation as ResizeOperation).config}
                                onChange={handleConfigChange}
                                disabled={disabled}
                            />
                        )}
                        {operation.type === "compress" && (
                            <CompressConfig
                                config={(operation as CompressOperation).config}
                                onChange={handleConfigChange}
                                disabled={disabled}
                            />
                        )}
                        {operation.type === "convertFormat" && (
                            <ConvertFormatConfig
                                config={
                                    (operation as ConvertFormatOperation).config
                                }
                                onChange={handleConfigChange}
                                disabled={disabled}
                            />
                        )}
                    </Box>
                </Collapse>
            </CardContent>
        </Card>
    );
};

// Resize configuration
const ResizeConfig: React.FC<{
    config: ResizeOperation["config"];
    onChange: (key: string, value: any) => void;
    disabled?: boolean;
}> = ({ config, onChange, disabled }) => (
    <Stack spacing={2}>
        <Stack direction="row" spacing={2}>
            <TextField
                label="Width"
                type="number"
                size="small"
                value={config.width || ""}
                onChange={(e) =>
                    onChange(
                        "width",
                        e.target.value ? parseInt(e.target.value) : undefined,
                    )
                }
                disabled={disabled}
                InputProps={{ inputProps: { min: 1, max: 8000 } }}
                sx={{ flex: 1 }}
                placeholder="Auto"
            />
            <TextField
                label="Height"
                type="number"
                size="small"
                value={config.height || ""}
                onChange={(e) =>
                    onChange(
                        "height",
                        e.target.value ? parseInt(e.target.value) : undefined,
                    )
                }
                disabled={disabled}
                InputProps={{ inputProps: { min: 1, max: 8000 } }}
                sx={{ flex: 1 }}
                placeholder="Auto"
            />
        </Stack>
        <FormControl size="small" fullWidth>
            <InputLabel>Fit Mode</InputLabel>
            <Select
                value={config.fit || "inside"}
                label="Fit Mode"
                onChange={(e) => onChange("fit", e.target.value)}
                disabled={disabled}
            >
                {Object.entries(fitModeLabels).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                        {label}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
        <Typography variant="caption" color="text.secondary">
            Leave width or height empty to maintain aspect ratio
        </Typography>
    </Stack>
);

// Compress configuration
const CompressConfig: React.FC<{
    config: CompressOperation["config"];
    onChange: (key: string, value: any) => void;
    disabled?: boolean;
}> = ({ config, onChange, disabled }) => (
    <Stack spacing={2}>
        <Box>
            <Typography variant="body2" gutterBottom>
                Quality: {config.quality || 85}%
            </Typography>
            <Slider
                value={config.quality || 85}
                onChange={(_, value) => onChange("quality", value as number)}
                min={1}
                max={100}
                step={1}
                disabled={disabled}
                marks={[
                    { value: 1, label: "1" },
                    { value: 50, label: "50" },
                    { value: 100, label: "100" },
                ]}
                valueLabelDisplay="auto"
            />
        </Box>
        <Typography variant="caption" color="text.secondary">
            Lower quality = smaller file size. 85% is recommended for most
            images.
        </Typography>
    </Stack>
);

// Convert format configuration
const ConvertFormatConfig: React.FC<{
    config: ConvertFormatOperation["config"];
    onChange: (key: string, value: any) => void;
    disabled?: boolean;
}> = ({ config, onChange, disabled }) => (
    <Stack spacing={2}>
        <FormControl size="small" fullWidth>
            <InputLabel>Output Format</InputLabel>
            <Select
                value={config.format}
                label="Output Format"
                onChange={(e) => onChange("format", e.target.value)}
                disabled={disabled}
            >
                {Object.entries(formatLabels).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                        {label}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
        <Box>
            <Typography variant="body2" gutterBottom>
                Quality: {config.quality || 85}%
            </Typography>
            <Slider
                value={config.quality || 85}
                onChange={(_, value) => onChange("quality", value as number)}
                min={1}
                max={100}
                step={1}
                disabled={disabled}
                marks={[
                    { value: 1, label: "1" },
                    { value: 50, label: "50" },
                    { value: 100, label: "100" },
                ]}
                valueLabelDisplay="auto"
            />
        </Box>
        <Alert severity="info" sx={{ py: 0.5 }}>
            <Typography variant="caption">
                <strong>WebP</strong> &amp; <strong>AVIF</strong> offer better
                compression. <strong>PNG</strong> for transparency.{" "}
                <strong>JPEG</strong> for compatibility.
            </Typography>
        </Alert>
    </Stack>
);

// Save Preset Dialog
interface SavePresetDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (name: string, description: string) => Promise<void>;
    existingPresetNames: string[];
    isSaving: boolean;
}

const SavePresetDialog: React.FC<SavePresetDialogProps> = ({
    open,
    onClose,
    onSave,
    existingPresetNames,
    isSaving,
}) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        const trimmedName = name.trim();

        if (!trimmedName) {
            setError("Preset name is required");
            return;
        }

        if (existingPresetNames.includes(trimmedName)) {
            setError(
                "A preset with this name already exists. It will be overwritten.",
            );
        }

        await onSave(trimmedName, description.trim());
        setName("");
        setDescription("");
        setError(null);
    };

    const handleClose = () => {
        setName("");
        setDescription("");
        setError(null);
        onClose();
    };

    const isOverwrite = existingPresetNames.includes(name.trim());

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Save as Preset</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField
                        label="Preset Name"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            setError(null);
                        }}
                        fullWidth
                        autoFocus
                        error={!!error && !isOverwrite}
                        helperText={
                            isOverwrite
                                ? "This will overwrite the existing preset"
                                : error
                        }
                        placeholder="e.g., Blog Images, Thumbnails"
                    />
                    <TextField
                        label="Description (optional)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        fullWidth
                        multiline
                        rows={2}
                        placeholder="Brief description of what this preset does"
                    />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={isSaving}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={!name.trim() || isSaving}
                    startIcon={
                        isSaving ? <CircularProgress size={16} /> : <Save />
                    }
                >
                    {isOverwrite ? "Overwrite" : "Save"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// Manage Presets Dialog
interface ManagePresetsDialogProps {
    open: boolean;
    onClose: () => void;
    presetNames: string[];
    defaultPresetName: string | null;
    onGetPreset: (name: string) => PostProcessingPreset | null;
    onDeletePreset: (name: string) => Promise<boolean>;
    onSetDefaultPreset: (name: string | null) => Promise<boolean>;
    onLoadPreset: (name: string) => void;
}

const ManagePresetsDialog: React.FC<ManagePresetsDialogProps> = ({
    open,
    onClose,
    presetNames,
    defaultPresetName,
    onGetPreset,
    onDeletePreset,
    onSetDefaultPreset,
    onLoadPreset,
}) => {
    const [processingPreset, setProcessingPreset] = useState<string | null>(
        null,
    );

    const handleSetDefault = async (name: string) => {
        setProcessingPreset(name);
        const newDefault = defaultPresetName === name ? null : name;
        await onSetDefaultPreset(newDefault);
        setProcessingPreset(null);
    };

    const handleDelete = async (name: string) => {
        if (!confirm(`Are you sure you want to delete the preset "${name}"?`)) {
            return;
        }
        setProcessingPreset(name);
        await onDeletePreset(name);
        setProcessingPreset(null);
    };

    const handleLoad = (name: string) => {
        onLoadPreset(name);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Manage Presets</DialogTitle>
            <DialogContent>
                {presetNames.length === 0 ? (
                    <Typography
                        color="text.secondary"
                        sx={{ py: 2, textAlign: "center" }}
                    >
                        No presets saved yet. Create your first preset by
                        configuring operations and clicking &quot;Save as
                        Preset&quot;.
                    </Typography>
                ) : (
                    <Stack spacing={1} sx={{ mt: 1 }}>
                        {presetNames.map((name) => {
                            const preset = onGetPreset(name);
                            const isDefault = defaultPresetName === name;
                            const isProcessing = processingPreset === name;

                            return (
                                <Card
                                    key={name}
                                    variant="outlined"
                                    sx={{
                                        bgcolor: isDefault
                                            ? "action.selected"
                                            : "background.paper",
                                    }}
                                >
                                    <CardContent
                                        sx={{
                                            py: 1.5,
                                            "&:last-child": { pb: 1.5 },
                                        }}
                                    >
                                        <Stack
                                            direction="row"
                                            alignItems="center"
                                            justifyContent="space-between"
                                        >
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Stack
                                                    direction="row"
                                                    alignItems="center"
                                                    spacing={1}
                                                >
                                                    <Typography
                                                        variant="subtitle2"
                                                        noWrap
                                                    >
                                                        {name}
                                                    </Typography>
                                                    {isDefault && (
                                                        <Chip
                                                            label="Default"
                                                            size="small"
                                                            color="primary"
                                                            icon={
                                                                <Star fontSize="small" />
                                                            }
                                                        />
                                                    )}
                                                </Stack>
                                                {preset?.description && (
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                        noWrap
                                                    >
                                                        {preset.description}
                                                    </Typography>
                                                )}
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                    display="block"
                                                >
                                                    {preset?.operations
                                                        .length || 0}{" "}
                                                    operation(s)
                                                </Typography>
                                            </Box>
                                            <Stack
                                                direction="row"
                                                spacing={0.5}
                                            >
                                                <Tooltip
                                                    title={
                                                        isDefault
                                                            ? "Unset as default"
                                                            : "Set as default"
                                                    }
                                                >
                                                    <IconButton
                                                        size="small"
                                                        onClick={() =>
                                                            handleSetDefault(
                                                                name,
                                                            )
                                                        }
                                                        disabled={isProcessing}
                                                        color={
                                                            isDefault
                                                                ? "primary"
                                                                : "default"
                                                        }
                                                    >
                                                        {isProcessing ? (
                                                            <CircularProgress
                                                                size={16}
                                                            />
                                                        ) : isDefault ? (
                                                            <Star fontSize="small" />
                                                        ) : (
                                                            <StarBorder fontSize="small" />
                                                        )}
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Load preset">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() =>
                                                            handleLoad(name)
                                                        }
                                                        disabled={isProcessing}
                                                    >
                                                        <BookmarkBorder fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete preset">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() =>
                                                            handleDelete(name)
                                                        }
                                                        disabled={isProcessing}
                                                        color="error"
                                                    >
                                                        <DeleteOutline fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </Stack>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export const PostProcessingBuilder: React.FC<PostProcessingBuilderProps> = ({
    operations,
    onChange,
    disabled,
    presetsAvailable = false,
    presetsLoading = false,
    presetNames = [],
    defaultPresetName = null,
    onGetPreset,
    onSavePreset,
    onDeletePreset,
    onSetDefaultPreset,
}) => {
    const [addMenuAnchor, setAddMenuAnchor] = useState<null | HTMLElement>(
        null,
    );
    const [presetMenuAnchor, setPresetMenuAnchor] =
        useState<null | HTMLElement>(null);
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [manageDialogOpen, setManageDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleAddOperation = useCallback(
        (type: PostProcessingType) => {
            const newOperation = createDefaultOperation(type);
            onChange([...operations, newOperation]);
        },
        [operations, onChange],
    );

    const handleUpdateOperation = useCallback(
        (index: number, operation: PostProcessingOperation) => {
            const newOperations = [...operations];
            newOperations[index] = operation;
            onChange(newOperations);
        },
        [operations, onChange],
    );

    const handleRemoveOperation = useCallback(
        (index: number) => {
            const newOperations = operations.filter((_, i) => i !== index);
            onChange(newOperations);
        },
        [operations, onChange],
    );

    const handleMoveUp = useCallback(
        (index: number) => {
            if (index === 0) return;
            const newOperations = [...operations];
            [newOperations[index - 1], newOperations[index]] = [
                newOperations[index],
                newOperations[index - 1],
            ];
            onChange(newOperations);
        },
        [operations, onChange],
    );

    const handleMoveDown = useCallback(
        (index: number) => {
            if (index === operations.length - 1) return;
            const newOperations = [...operations];
            [newOperations[index], newOperations[index + 1]] = [
                newOperations[index + 1],
                newOperations[index],
            ];
            onChange(newOperations);
        },
        [operations, onChange],
    );

    const handleLoadPreset = useCallback(
        (name: string) => {
            if (!onGetPreset) return;
            const preset = onGetPreset(name);
            if (preset) {
                onChange([...preset.operations]);
            }
            setPresetMenuAnchor(null);
        },
        [onGetPreset, onChange],
    );

    const handleSavePreset = useCallback(
        async (name: string, description: string) => {
            if (!onSavePreset) return;
            setIsSaving(true);
            const success = await onSavePreset(name, operations, description);
            setIsSaving(false);
            if (success) {
                setSaveDialogOpen(false);
            }
        },
        [onSavePreset, operations],
    );

    const handleClearOperations = useCallback(() => {
        onChange([]);
    }, [onChange]);

    return (
        <Box>
            {/* Header */}
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 1 }}
            >
                <Typography
                    variant="subtitle2"
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                    Post-Upload Processing
                    {operations.length > 0 && (
                        <Chip
                            label={`${operations.length} step${operations.length > 1 ? "s" : ""}`}
                            size="small"
                            color="primary"
                        />
                    )}
                </Typography>

                {/* Presets dropdown - only shown if presets are available */}
                {presetsAvailable && (
                    <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Load or manage presets">
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={(e) =>
                                    setPresetMenuAnchor(e.currentTarget)
                                }
                                disabled={disabled || presetsLoading}
                                startIcon={
                                    presetsLoading ? (
                                        <CircularProgress size={14} />
                                    ) : (
                                        <Bookmark fontSize="small" />
                                    )
                                }
                                sx={{ minWidth: 0, px: 1 }}
                            >
                                Presets
                            </Button>
                        </Tooltip>

                        {/* Presets Menu */}
                        <Menu
                            anchorEl={presetMenuAnchor}
                            open={Boolean(presetMenuAnchor)}
                            onClose={() => setPresetMenuAnchor(null)}
                            anchorOrigin={{
                                vertical: "bottom",
                                horizontal: "right",
                            }}
                            transformOrigin={{
                                vertical: "top",
                                horizontal: "right",
                            }}
                        >
                            {presetNames.length > 0 && (
                                <>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{
                                            px: 2,
                                            py: 0.5,
                                            display: "block",
                                        }}
                                    >
                                        Load Preset
                                    </Typography>
                                    {presetNames.map((name) => (
                                        <MenuItem
                                            key={name}
                                            onClick={() =>
                                                handleLoadPreset(name)
                                            }
                                        >
                                            <ListItemIcon>
                                                {defaultPresetName === name ? (
                                                    <Star
                                                        fontSize="small"
                                                        color="primary"
                                                    />
                                                ) : (
                                                    <BookmarkBorder fontSize="small" />
                                                )}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={name}
                                                secondary={
                                                    defaultPresetName === name
                                                        ? "Default"
                                                        : undefined
                                                }
                                            />
                                        </MenuItem>
                                    ))}
                                    <Divider />
                                </>
                            )}
                            <MenuItem
                                onClick={() => {
                                    setPresetMenuAnchor(null);
                                    setSaveDialogOpen(true);
                                }}
                                disabled={operations.length === 0}
                            >
                                <ListItemIcon>
                                    <Save fontSize="small" />
                                </ListItemIcon>
                                <ListItemText primary="Save as Preset" />
                            </MenuItem>
                            <MenuItem
                                onClick={() => {
                                    setPresetMenuAnchor(null);
                                    setManageDialogOpen(true);
                                }}
                            >
                                <ListItemIcon>
                                    <Bookmark fontSize="small" />
                                </ListItemIcon>
                                <ListItemText primary="Manage Presets" />
                            </MenuItem>
                        </Menu>
                    </Stack>
                )}
            </Stack>

            <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 2, display: "block" }}
            >
                Add processing steps to modify the original image after upload.
                Operations are applied in order.
                {presetsAvailable &&
                    defaultPresetName &&
                    presetNames.includes(defaultPresetName) && (
                        <Chip
                            label={`Default: ${defaultPresetName}`}
                            size="small"
                            sx={{ ml: 1 }}
                            variant="outlined"
                        />
                    )}
            </Typography>

            {/* Operation list */}
            {operations.length > 0 && (
                <Box sx={{ mb: 2 }}>
                    {operations.map((operation, index) => (
                        <OperationItem
                            key={`${operation.type}-${index}`}
                            operation={operation}
                            index={index}
                            totalCount={operations.length}
                            onUpdate={handleUpdateOperation}
                            onRemove={handleRemoveOperation}
                            onMoveUp={handleMoveUp}
                            onMoveDown={handleMoveDown}
                            disabled={disabled}
                        />
                    ))}
                </Box>
            )}

            {/* Add operation buttons */}
            <Stack
                direction="row"
                spacing={1}
                flexWrap="wrap"
                useFlexGap
                alignItems="center"
            >
                <Button
                    size="small"
                    variant="outlined"
                    startIcon={<PhotoSizeSelectLarge />}
                    onClick={() => handleAddOperation("resize")}
                    disabled={disabled}
                >
                    Resize
                </Button>
                <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Compress />}
                    onClick={() => handleAddOperation("compress")}
                    disabled={disabled}
                >
                    Compress
                </Button>
                <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Transform />}
                    onClick={() => handleAddOperation("convertFormat")}
                    disabled={disabled}
                >
                    Convert
                </Button>

                {operations.length > 0 && (
                    <>
                        <Divider orientation="vertical" flexItem />
                        <Button
                            size="small"
                            color="error"
                            onClick={handleClearOperations}
                            disabled={disabled}
                            startIcon={<Delete />}
                        >
                            Clear All
                        </Button>
                    </>
                )}
            </Stack>

            {operations.length === 0 && (
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: "block" }}
                >
                    No processing steps added. The image will be uploaded as-is.
                </Typography>
            )}

            {/* Save Preset Dialog */}
            {presetsAvailable && onSavePreset && (
                <SavePresetDialog
                    open={saveDialogOpen}
                    onClose={() => setSaveDialogOpen(false)}
                    onSave={handleSavePreset}
                    existingPresetNames={presetNames}
                    isSaving={isSaving}
                />
            )}

            {/* Manage Presets Dialog */}
            {presetsAvailable &&
                onGetPreset &&
                onDeletePreset &&
                onSetDefaultPreset && (
                    <ManagePresetsDialog
                        open={manageDialogOpen}
                        onClose={() => setManageDialogOpen(false)}
                        presetNames={presetNames}
                        defaultPresetName={defaultPresetName}
                        onGetPreset={onGetPreset}
                        onDeletePreset={onDeletePreset}
                        onSetDefaultPreset={onSetDefaultPreset}
                        onLoadPreset={handleLoadPreset}
                    />
                )}
        </Box>
    );
};

export default PostProcessingBuilder;
