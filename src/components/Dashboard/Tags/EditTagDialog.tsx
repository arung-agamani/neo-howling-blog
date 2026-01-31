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
    Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import WarningIcon from "@mui/icons-material/Warning";
import { Tag, UpdateTagPayload } from "@/types";

// Predefined color options
const COLOR_OPTIONS = [
    { name: "Red", value: "#ef4444" },
    { name: "Orange", value: "#f97316" },
    { name: "Yellow", value: "#eab308" },
    { name: "Green", value: "#22c55e" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Purple", value: "#a855f7" },
    { name: "Pink", value: "#ec4899" },
    { name: "Gray", value: "#6b7280" },
];

interface EditTagDialogProps {
    open: boolean;
    tag: Tag | null;
    onClose: () => void;
    onSubmit: (tagName: string, data: UpdateTagPayload) => Promise<void>;
    onDelete?: (tagName: string) => Promise<void>;
}

const EditTagDialog: React.FC<EditTagDialogProps> = ({
    open,
    tag,
    onClose,
    onSubmit,
    onDelete,
}) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [color, setColor] = useState<string | null>(null);
    const [aliasInput, setAliasInput] = useState("");
    const [aliases, setAliases] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Populate form when tag changes
    useEffect(() => {
        if (tag) {
            setName(tag.name);
            setDescription(tag.description || "");
            setColor(tag.color || null);
            setAliases(tag.aliases || []);
        }
    }, [tag]);

    const hasNameChanged = tag && name.trim().toLowerCase() !== tag.name;

    const handleAddAlias = () => {
        const trimmedAlias = aliasInput.trim().toLowerCase();
        if (trimmedAlias && !aliases.includes(trimmedAlias) && trimmedAlias !== name.toLowerCase()) {
            setAliases([...aliases, trimmedAlias]);
            setAliasInput("");
        }
    };

    const handleRemoveAlias = (aliasToRemove: string) => {
        setAliases(aliases.filter((a) => a !== aliasToRemove));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAddAlias();
        }
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            setError("Tag name is required");
            return;
        }

        if (!tag) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const payload: UpdateTagPayload = {};

            // Only include changed fields
            const newName = name.trim().toLowerCase();
            if (newName !== tag.name) {
                payload.name = newName;
            }

            const newDescription = description.trim() || null;
            if (newDescription !== tag.description) {
                payload.description = newDescription;
            }

            if (color !== tag.color) {
                payload.color = color;
            }

            const normalizedAliases = aliases.map((a) => a.toLowerCase());
            const currentAliases = tag.aliases || [];
            if (
                normalizedAliases.length !== currentAliases.length ||
                !normalizedAliases.every((a) => currentAliases.includes(a))
            ) {
                payload.aliases = normalizedAliases;
            }

            // Only submit if there are changes
            if (Object.keys(payload).length > 0) {
                await onSubmit(tag.name, payload);
            }
            handleClose();
        } catch (err: any) {
            setError(err.message || "Failed to update tag");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!tag || !onDelete) return;

        setIsDeleting(true);
        setError(null);

        try {
            await onDelete(tag.name);
            handleClose();
        } catch (err: any) {
            setError(err.message || "Failed to delete tag");
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleClose = () => {
        setName("");
        setDescription("");
        setColor(null);
        setAliasInput("");
        setAliases([]);
        setError(null);
        setIsSubmitting(false);
        setIsDeleting(false);
        setShowDeleteConfirm(false);
        onClose();
    };

    if (!tag) return null;

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
                <Typography variant="h6" fontWeight="bold">
                    Edit Tag
                </Typography>
                <IconButton
                    onClick={handleClose}
                    size="small"
                    disabled={isSubmitting || isDeleting}
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

                    {/* Tag Stats */}
                    <Box
                        sx={{
                            display: "flex",
                            gap: 2,
                            p: 2,
                            bgcolor: "grey.100",
                            borderRadius: 1,
                        }}
                    >
                        <Box>
                            <Typography variant="caption" color="text.secondary">
                                Posts
                            </Typography>
                            <Typography variant="h6" fontWeight="bold">
                                {tag.count}
                            </Typography>
                        </Box>
                        <Divider orientation="vertical" flexItem />
                        <Box>
                            <Typography variant="caption" color="text.secondary">
                                ID
                            </Typography>
                            <Typography
                                variant="body2"
                                fontFamily="monospace"
                                sx={{ wordBreak: "break-all" }}
                            >
                                {tag.id}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Tag Name */}
                    <TextField
                        label="Tag Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        fullWidth
                        required
                        disabled={isSubmitting || isDeleting}
                        placeholder="e.g., javascript"
                        helperText={
                            hasNameChanged
                                ? `Renaming will update ${tag.count} post(s)`
                                : "Tag names are automatically lowercased"
                        }
                        color={hasNameChanged ? "warning" : undefined}
                    />

                    {hasNameChanged && (
                        <Alert severity="warning" icon={<WarningIcon />}>
                            Renaming this tag will update all {tag.count} associated
                            posts. This action cannot be undone.
                        </Alert>
                    )}

                    {/* Description */}
                    <TextField
                        label="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        fullWidth
                        multiline
                        rows={2}
                        disabled={isSubmitting || isDeleting}
                        placeholder="Optional description for this tag"
                    />

                    {/* Color Selection */}
                    <Box>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                        >
                            Color (optional)
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                            {COLOR_OPTIONS.map((option) => (
                                <Box
                                    key={option.value}
                                    onClick={() =>
                                        !isSubmitting &&
                                        !isDeleting &&
                                        setColor(
                                            color === option.value
                                                ? null
                                                : option.value,
                                        )
                                    }
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: "50%",
                                        bgcolor: option.value,
                                        cursor:
                                            isSubmitting || isDeleting
                                                ? "not-allowed"
                                                : "pointer",
                                        border:
                                            color === option.value
                                                ? "3px solid #000"
                                                : "2px solid transparent",
                                        transition: "all 0.2s ease",
                                        "&:hover": {
                                            transform:
                                                isSubmitting || isDeleting
                                                    ? "none"
                                                    : "scale(1.1)",
                                        },
                                    }}
                                    title={option.name}
                                />
                            ))}
                            {color && (
                                <Button
                                    size="small"
                                    onClick={() => setColor(null)}
                                    disabled={isSubmitting || isDeleting}
                                    sx={{ ml: 1 }}
                                >
                                    Clear
                                </Button>
                            )}
                        </Box>
                    </Box>

                    {/* Aliases */}
                    <Box>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                        >
                            Aliases (optional)
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                            <TextField
                                size="small"
                                value={aliasInput}
                                onChange={(e) => setAliasInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Add alias and press Enter"
                                fullWidth
                                disabled={isSubmitting || isDeleting}
                            />
                            <Button
                                variant="outlined"
                                onClick={handleAddAlias}
                                disabled={
                                    !aliasInput.trim() || isSubmitting || isDeleting
                                }
                            >
                                Add
                            </Button>
                        </Box>
                        {aliases.length > 0 && (
                            <Box
                                sx={{
                                    display: "flex",
                                    gap: 0.5,
                                    flexWrap: "wrap",
                                }}
                            >
                                {aliases.map((alias) => (
                                    <Chip
                                        key={alias}
                                        label={alias}
                                        size="small"
                                        onDelete={() =>
                                            !isSubmitting &&
                                            !isDeleting &&
                                            handleRemoveAlias(alias)
                                        }
                                        disabled={isSubmitting || isDeleting}
                                    />
                                ))}
                            </Box>
                        )}
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mt: 0.5, display: "block" }}
                        >
                            Aliases are alternative names that will map to this tag
                        </Typography>
                    </Box>

                    {/* Delete Section */}
                    {onDelete && (
                        <Box
                            sx={{
                                mt: 2,
                                pt: 2,
                                borderTop: "1px solid",
                                borderColor: "divider",
                            }}
                        >
                            <Typography
                                variant="body2"
                                color="error"
                                gutterBottom
                                fontWeight="medium"
                            >
                                Danger Zone
                            </Typography>
                            {!showDeleteConfirm ? (
                                <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    disabled={isSubmitting || isDeleting}
                                    size="small"
                                >
                                    Delete Tag
                                </Button>
                            ) : (
                                <Box
                                    sx={{
                                        p: 2,
                                        bgcolor: "error.light",
                                        borderRadius: 1,
                                    }}
                                >
                                    <Typography
                                        variant="body2"
                                        color="error.contrastText"
                                        gutterBottom
                                    >
                                        Are you sure you want to delete "{tag.name}"?
                                        {tag.count > 0 &&
                                            ` This tag is used by ${tag.count} post(s).`}
                                    </Typography>
                                    <Box
                                        sx={{ display: "flex", gap: 1, mt: 1 }}
                                    >
                                        <Button
                                            variant="contained"
                                            color="error"
                                            onClick={handleDelete}
                                            disabled={isDeleting}
                                            size="small"
                                            startIcon={
                                                isDeleting ? (
                                                    <CircularProgress
                                                        size={16}
                                                        color="inherit"
                                                    />
                                                ) : null
                                            }
                                        >
                                            {isDeleting
                                                ? "Deleting..."
                                                : "Yes, Delete"}
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            onClick={() =>
                                                setShowDeleteConfirm(false)
                                            }
                                            disabled={isDeleting}
                                            size="small"
                                            sx={{
                                                borderColor: "error.contrastText",
                                                color: "error.contrastText",
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose} disabled={isSubmitting || isDeleting}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={!name.trim() || isSubmitting || isDeleting}
                    startIcon={
                        isSubmitting ? (
                            <CircularProgress size={16} color="inherit" />
                        ) : null
                    }
                >
                    {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditTagDialog;
