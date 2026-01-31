"use client";

import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    Chip,
    IconButton,
    Alert,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    Checkbox,
    FormControlLabel,
    Divider,
    Paper,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import MergeTypeIcon from "@mui/icons-material/MergeType";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Tag, MergeTagsPayload, MergeTagsPreview } from "@/types";

interface MergeTagsDialogProps {
    open: boolean;
    selectedTags: Tag[];
    onClose: () => void;
    onSubmit: (data: MergeTagsPayload) => Promise<void>;
    onPreview: (sourceTags: string[], targetTag: string) => Promise<MergeTagsPreview>;
}

const MergeTagsDialog: React.FC<MergeTagsDialogProps> = ({
    open,
    selectedTags,
    onClose,
    onSubmit,
    onPreview,
}) => {
    const [targetTagName, setTargetTagName] = useState("");
    const [keepAsAliases, setKeepAsAliases] = useState(true);
    const [preview, setPreview] = useState<MergeTagsPreview | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);

    // Initialize target tag name with the first selected tag or the one with highest count
    useEffect(() => {
        if (open && selectedTags.length > 0) {
            // Default to the tag with the highest count
            const sortedByCount = [...selectedTags].sort((a, b) => b.count - a.count);
            setTargetTagName(sortedByCount[0].name);
        }
    }, [open, selectedTags]);

    // Fetch preview when target tag changes
    useEffect(() => {
        if (!open || !targetTagName.trim() || selectedTags.length < 2) {
            setPreview(null);
            return;
        }

        const fetchPreview = async () => {
            setIsLoadingPreview(true);
            setError(null);
            try {
                const sourceTags = selectedTags
                    .map((t) => t.name)
                    .filter((name) => name !== targetTagName.trim().toLowerCase());

                if (sourceTags.length === 0) {
                    setPreview(null);
                    return;
                }

                const result = await onPreview(sourceTags, targetTagName.trim());
                setPreview(result);
            } catch (err: any) {
                setError(err.message || "Failed to load preview");
                setPreview(null);
            } finally {
                setIsLoadingPreview(false);
            }
        };

        const timeoutId = setTimeout(fetchPreview, 300);
        return () => clearTimeout(timeoutId);
    }, [open, targetTagName, selectedTags, onPreview]);

    const handleSubmit = async () => {
        if (!targetTagName.trim()) {
            setError("Target tag name is required");
            return;
        }

        if (selectedTags.length < 2) {
            setError("At least 2 tags are required to merge");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const sourceTags = selectedTags
                .map((t) => t.name)
                .filter((name) => name !== targetTagName.trim().toLowerCase());

            const payload: MergeTagsPayload = {
                sourceTags,
                targetTag: targetTagName.trim().toLowerCase(),
                keepAsAliases,
                deleteSourceTags: true,
            };

            await onSubmit(payload);
            handleClose();
        } catch (err: any) {
            setError(err.message || "Failed to merge tags");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setTargetTagName("");
        setKeepAsAliases(true);
        setPreview(null);
        setError(null);
        setIsSubmitting(false);
        setIsLoadingPreview(false);
        onClose();
    };

    const totalPostCount = selectedTags.reduce((sum, t) => sum + t.count, 0);
    const sourceTags = selectedTags.filter(
        (t) => t.name !== targetTagName.trim().toLowerCase()
    );

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 2 },
            }}
        >
            <DialogTitle
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    pb: 1,
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <MergeTypeIcon color="primary" />
                    <Typography variant="h6" fontWeight="bold">
                        Merge Tags
                    </Typography>
                </Box>
                <IconButton
                    onClick={handleClose}
                    size="small"
                    disabled={isSubmitting}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {error && (
                        <Alert severity="error" onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    {/* Selected Tags Overview */}
                    <Box>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                        >
                            Tags to merge ({selectedTags.length})
                        </Typography>
                        <Box
                            sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 0.5,
                            }}
                        >
                            {selectedTags.map((tag) => (
                                <Chip
                                    key={tag.id}
                                    label={`${tag.name} (${tag.count})`}
                                    size="small"
                                    variant={
                                        tag.name === targetTagName.trim().toLowerCase()
                                            ? "filled"
                                            : "outlined"
                                    }
                                    color={
                                        tag.name === targetTagName.trim().toLowerCase()
                                            ? "primary"
                                            : "default"
                                    }
                                    onClick={() => setTargetTagName(tag.name)}
                                    sx={{ cursor: "pointer" }}
                                />
                            ))}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            Click a tag to set it as the target
                        </Typography>
                    </Box>

                    <Divider />

                    {/* Target Tag Name */}
                    <TextField
                        label="Target Tag Name"
                        value={targetTagName}
                        onChange={(e) => setTargetTagName(e.target.value)}
                        fullWidth
                        required
                        disabled={isSubmitting}
                        placeholder="Enter the name for the merged tag"
                        helperText="All selected tags will be merged into this tag"
                    />

                    {/* Options */}
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={keepAsAliases}
                                onChange={(e) => setKeepAsAliases(e.target.checked)}
                                disabled={isSubmitting}
                            />
                        }
                        label={
                            <Box>
                                <Typography variant="body2">
                                    Keep source tag names as aliases
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Source tag names will be saved as aliases for future
                                    reference
                                </Typography>
                            </Box>
                        }
                    />

                    {/* Preview */}
                    {isLoadingPreview && (
                        <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                            <CircularProgress size={24} />
                        </Box>
                    )}

                    {preview && !isLoadingPreview && (
                        <Paper
                            variant="outlined"
                            sx={{ p: 2, bgcolor: "grey.50" }}
                        >
                            <Typography
                                variant="subtitle2"
                                color="primary"
                                gutterBottom
                            >
                                Merge Preview
                            </Typography>

                            {/* Visual representation */}
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2,
                                    my: 2,
                                    flexWrap: "wrap",
                                }}
                            >
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                    {preview.sourceTags.map((tag) => (
                                        <Chip
                                            key={tag.name}
                                            label={tag.name}
                                            size="small"
                                            variant="outlined"
                                            color="default"
                                        />
                                    ))}
                                </Box>
                                <ArrowForwardIcon color="action" />
                                <Chip
                                    label={preview.targetTag.name}
                                    size="small"
                                    color="primary"
                                    icon={
                                        preview.targetTag.willBeCreated ? undefined : undefined
                                    }
                                />
                                {preview.targetTag.willBeCreated && (
                                    <Typography variant="caption" color="text.secondary">
                                        (new)
                                    </Typography>
                                )}
                            </Box>

                            {/* Summary Stats */}
                            <List dense disablePadding>
                                <ListItem disablePadding sx={{ py: 0.5 }}>
                                    <ListItemText
                                        primary={
                                            <Typography variant="body2">
                                                Posts to update:{" "}
                                                <strong>{preview.summary.postsToUpdate}</strong>
                                            </Typography>
                                        }
                                    />
                                </ListItem>
                                <ListItem disablePadding sx={{ py: 0.5 }}>
                                    <ListItemText
                                        primary={
                                            <Typography variant="body2">
                                                Resulting post count:{" "}
                                                <strong>
                                                    {preview.summary.resultingPostCount}
                                                </strong>
                                            </Typography>
                                        }
                                    />
                                </ListItem>
                                <ListItem disablePadding sx={{ py: 0.5 }}>
                                    <ListItemText
                                        primary={
                                            <Typography variant="body2">
                                                Tags to merge:{" "}
                                                <strong>{preview.summary.tagsToMerge}</strong>
                                            </Typography>
                                        }
                                    />
                                </ListItem>
                            </List>

                            {/* Affected Posts Preview */}
                            {preview.affectedPosts.length > 0 && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        Affected posts:
                                    </Typography>
                                    <Box
                                        sx={{
                                            maxHeight: 120,
                                            overflow: "auto",
                                            mt: 0.5,
                                        }}
                                    >
                                        {preview.affectedPosts
                                            .slice(0, 10)
                                            .map((post) => (
                                                <Typography
                                                    key={post.id}
                                                    variant="body2"
                                                    sx={{
                                                        py: 0.25,
                                                        borderBottom:
                                                            "1px solid",
                                                        borderColor: "divider",
                                                        "&:last-child": {
                                                            borderBottom: "none",
                                                        },
                                                    }}
                                                    noWrap
                                                >
                                                    {post.title}
                                                </Typography>
                                            ))}
                                        {preview.affectedPosts.length > 10 && (
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                            >
                                                ... and{" "}
                                                {preview.affectedPosts.length - 10}{" "}
                                                more
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            )}
                        </Paper>
                    )}

                    {/* Warning */}
                    <Alert severity="warning">
                        <Typography variant="body2">
                            This action will merge {sourceTags.length} tag(s) into "
                            {targetTagName.trim().toLowerCase() || "..."}" and update all
                            associated posts. This action cannot be undone.
                        </Typography>
                    </Alert>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={
                        !targetTagName.trim() ||
                        selectedTags.length < 2 ||
                        isSubmitting ||
                        isLoadingPreview
                    }
                    startIcon={
                        isSubmitting ? (
                            <CircularProgress size={16} color="inherit" />
                        ) : (
                            <MergeTypeIcon />
                        )
                    }
                >
                    {isSubmitting ? "Merging..." : "Merge Tags"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default MergeTagsDialog;
