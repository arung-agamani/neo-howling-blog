"use client";

import React, { useState } from "react";
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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { CreateTagPayload } from "@/types";

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

interface CreateTagDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: CreateTagPayload) => Promise<void>;
}

const CreateTagDialog: React.FC<CreateTagDialogProps> = ({
    open,
    onClose,
    onSubmit,
}) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [color, setColor] = useState<string | null>(null);
    const [aliasInput, setAliasInput] = useState("");
    const [aliases, setAliases] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddAlias = () => {
        const trimmedAlias = aliasInput.trim().toLowerCase();
        if (trimmedAlias && !aliases.includes(trimmedAlias)) {
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

        setIsSubmitting(true);
        setError(null);

        try {
            const payload: CreateTagPayload = {
                name: name.trim().toLowerCase(),
                description: description.trim() || undefined,
                color: color || undefined,
                aliases: aliases.length > 0 ? aliases : undefined,
            };

            await onSubmit(payload);
            handleClose();
        } catch (err: any) {
            setError(err.message || "Failed to create tag");
        } finally {
            setIsSubmitting(false);
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
        onClose();
    };

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
                    Create New Tag
                </Typography>
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

                    {/* Tag Name */}
                    <TextField
                        label="Tag Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        fullWidth
                        required
                        disabled={isSubmitting}
                        placeholder="e.g., javascript"
                        helperText="Tag names are automatically lowercased"
                        autoFocus
                    />

                    {/* Description */}
                    <TextField
                        label="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        fullWidth
                        multiline
                        rows={2}
                        disabled={isSubmitting}
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
                                        cursor: isSubmitting
                                            ? "not-allowed"
                                            : "pointer",
                                        border:
                                            color === option.value
                                                ? "3px solid #000"
                                                : "2px solid transparent",
                                        transition: "all 0.2s ease",
                                        "&:hover": {
                                            transform: isSubmitting
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
                                    disabled={isSubmitting}
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
                                disabled={isSubmitting}
                            />
                            <Button
                                variant="outlined"
                                onClick={handleAddAlias}
                                disabled={!aliasInput.trim() || isSubmitting}
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
                                            handleRemoveAlias(alias)
                                        }
                                        disabled={isSubmitting}
                                    />
                                ))}
                            </Box>
                        )}
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mt: 0.5, display: "block" }}
                        >
                            Aliases are alternative names that will map to this
                            tag
                        </Typography>
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={!name.trim() || isSubmitting}
                    startIcon={
                        isSubmitting ? (
                            <CircularProgress size={16} color="inherit" />
                        ) : null
                    }
                >
                    {isSubmitting ? "Creating..." : "Create Tag"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateTagDialog;
