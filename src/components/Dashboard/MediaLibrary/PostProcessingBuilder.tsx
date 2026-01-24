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
} from "@mui/icons-material";
import type {
    PostProcessingOperation,
    PostProcessingType,
    ResizeOperation,
    CompressOperation,
    ConvertFormatOperation,
} from "./types";

interface PostProcessingBuilderProps {
    operations: PostProcessingOperation[];
    onChange: (operations: PostProcessingOperation[]) => void;
    disabled?: boolean;
}

// Helper to create default operations
const createDefaultOperation = (
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

export const PostProcessingBuilder: React.FC<PostProcessingBuilderProps> = ({
    operations,
    onChange,
    disabled,
}) => {
    const [addMenuAnchor, setAddMenuAnchor] = useState<null | HTMLElement>(
        null,
    );

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

    return (
        <Box>
            <Typography
                variant="subtitle2"
                sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}
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

            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: "block" }}>
                Add processing steps to modify the original image after upload.
                Operations are applied in order.
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
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
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
        </Box>
    );
};

export default PostProcessingBuilder;
