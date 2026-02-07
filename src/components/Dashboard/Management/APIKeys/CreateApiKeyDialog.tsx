import { useState, useCallback } from "react";
import {
    Alert,
    Box,
    Button,
    Checkbox,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControl,
    FormControlLabel,
    FormGroup,
    FormHelperText,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {
    AVAILABLE_SCOPES,
    getExpirationDate,
    type ExpirationPreset,
} from "./utils";

export interface CreateApiKeyDialogProps {
    open: boolean;
    onClose: () => void;
    onCopyKey: (key: string) => void;
    createdKey: string | null;
    isPending: boolean;
    onSubmit: (payload: {
        name: string;
        description?: string;
        scopes: string[];
        expiresAt?: string | null;
    }) => void;
}

export function CreateApiKeyDialog({
    open,
    onClose,
    onCopyKey,
    createdKey,
    isPending,
    onSubmit,
}: CreateApiKeyDialogProps) {
    const [formName, setFormName] = useState("");
    const [formDescription, setFormDescription] = useState("");
    const [formScopes, setFormScopes] = useState<string[]>([]);
    const [formExpiration, setFormExpiration] =
        useState<ExpirationPreset>("90d");
    const [formCustomExpiry, setFormCustomExpiry] = useState("");
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const resetForm = useCallback(() => {
        setFormName("");
        setFormDescription("");
        setFormScopes([]);
        setFormExpiration("90d");
        setFormCustomExpiry("");
        setFormErrors({});
    }, []);

    const handleScopeToggle = (scope: string) => {
        setFormScopes((prev) =>
            prev.includes(scope)
                ? prev.filter((s) => s !== scope)
                : [...prev, scope],
        );
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};
        if (!formName.trim()) errors.name = "Name is required";
        if (formName.length > 64)
            errors.name = "Name must be 64 characters or less";
        if (formScopes.length === 0)
            errors.scopes = "Select at least one scope";
        if (formDescription.length > 256)
            errors.description = "Description must be 256 characters or less";
        if (formExpiration === "custom" && !formCustomExpiry) {
            errors.expiration = "Select a custom expiration date";
        }
        if (formExpiration === "custom" && formCustomExpiry) {
            const d = new Date(formCustomExpiry);
            if (isNaN(d.getTime()) || d <= new Date()) {
                errors.expiration = "Expiration date must be in the future";
            }
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCreate = () => {
        if (!validateForm()) return;

        let expiresAt: string | null = null;
        if (formExpiration === "custom" && formCustomExpiry) {
            expiresAt = new Date(formCustomExpiry).toISOString();
        } else {
            expiresAt = getExpirationDate(formExpiration);
        }

        onSubmit({
            name: formName.trim(),
            description: formDescription.trim() || undefined,
            scopes: formScopes,
            expiresAt,
        });

        resetForm();
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            {createdKey ? (
                <>
                    <DialogTitle>
                        <Box display="flex" alignItems="center" gap={1}>
                            <CheckCircleIcon color="success" />
                            API Key Created
                        </Box>
                    </DialogTitle>
                    <DialogContent>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            <strong>Copy your API key now.</strong> You
                            won&apos;t be able to see it again. Store it
                            securely.
                        </Alert>
                        <Paper
                            variant="outlined"
                            sx={{
                                p: 2,
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                bgcolor: "grey.50",
                                fontFamily: "monospace",
                                fontSize: "0.9rem",
                                wordBreak: "break-all",
                            }}
                        >
                            <Box flex={1}>{createdKey}</Box>
                            <Tooltip title="Copy to clipboard">
                                <IconButton
                                    onClick={() => onCopyKey(createdKey)}
                                    size="small"
                                >
                                    <ContentCopyIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Paper>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            mt={1}
                        >
                            Use this key in the{" "}
                            <code>Authorization: Bearer {"<key>"}</code> header
                            or the <code>X-API-Key: {"<key>"}</code> header.
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClose} variant="contained">
                            Done
                        </Button>
                    </DialogActions>
                </>
            ) : (
                <>
                    <DialogTitle>Create New API Key</DialogTitle>
                    <DialogContent>
                        <DialogContentText sx={{ mb: 2 }}>
                            API keys allow programmatic access to v2 API
                            endpoints. Choose a descriptive name and the
                            appropriate scopes.
                        </DialogContentText>

                        <TextField
                            autoFocus
                            label="Name"
                            placeholder="e.g., CI/CD Pipeline, Mobile App"
                            fullWidth
                            required
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            error={!!formErrors.name}
                            helperText={formErrors.name}
                            sx={{ mb: 2 }}
                        />

                        <TextField
                            label="Description"
                            placeholder="What will this key be used for?"
                            fullWidth
                            multiline
                            rows={2}
                            value={formDescription}
                            onChange={(e) =>
                                setFormDescription(e.target.value)
                            }
                            error={!!formErrors.description}
                            helperText={
                                formErrors.description ||
                                `${formDescription.length}/256`
                            }
                            sx={{ mb: 2 }}
                        />

                        <Typography variant="subtitle2" gutterBottom>
                            Permissions (Scopes) *
                        </Typography>
                        <FormControl
                            error={!!formErrors.scopes}
                            component="fieldset"
                            sx={{ mb: 2, width: "100%" }}
                        >
                            <FormGroup>
                                {Object.entries(AVAILABLE_SCOPES).map(
                                    ([scope, desc]) => (
                                        <FormControlLabel
                                            key={scope}
                                            control={
                                                <Checkbox
                                                    checked={formScopes.includes(
                                                        scope,
                                                    )}
                                                    onChange={() =>
                                                        handleScopeToggle(scope)
                                                    }
                                                    size="small"
                                                />
                                            }
                                            label={
                                                <Box>
                                                    <Typography
                                                        variant="body2"
                                                        component="span"
                                                        fontFamily="monospace"
                                                    >
                                                        {scope}
                                                    </Typography>
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                        display="block"
                                                    >
                                                        {desc}
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                    ),
                                )}
                            </FormGroup>
                            {formErrors.scopes && (
                                <FormHelperText>
                                    {formErrors.scopes}
                                </FormHelperText>
                            )}
                        </FormControl>

                        <Typography variant="subtitle2" gutterBottom>
                            Expiration
                        </Typography>
                        <FormControl
                            fullWidth
                            sx={{ mb: 2 }}
                            error={!!formErrors.expiration}
                        >
                            <InputLabel id="expiration-label">
                                Expiration
                            </InputLabel>
                            <Select
                                labelId="expiration-label"
                                label="Expiration"
                                value={formExpiration}
                                onChange={(e) =>
                                    setFormExpiration(
                                        e.target.value as ExpirationPreset,
                                    )
                                }
                            >
                                <MenuItem value="30d">30 days</MenuItem>
                                <MenuItem value="90d">90 days</MenuItem>
                                <MenuItem value="180d">180 days</MenuItem>
                                <MenuItem value="365d">1 year</MenuItem>
                                <MenuItem value="never">No expiration</MenuItem>
                                <MenuItem value="custom">Custom date</MenuItem>
                            </Select>
                            {formErrors.expiration && (
                                <FormHelperText>
                                    {formErrors.expiration}
                                </FormHelperText>
                            )}
                        </FormControl>

                        {formExpiration === "custom" && (
                            <TextField
                                type="datetime-local"
                                label="Custom Expiration Date"
                                fullWidth
                                value={formCustomExpiry}
                                onChange={(e) =>
                                    setFormCustomExpiry(e.target.value)
                                }
                                InputLabelProps={{ shrink: true }}
                                sx={{ mb: 2 }}
                            />
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClose}>Cancel</Button>
                        <Button
                            variant="contained"
                            onClick={handleCreate}
                            disabled={isPending}
                            startIcon={
                                isPending ? (
                                    <CircularProgress size={16} />
                                ) : (
                                    <AddIcon />
                                )
                            }
                        >
                            {isPending ? "Creating..." : "Create API Key"}
                        </Button>
                    </DialogActions>
                </>
            )}
        </Dialog>
    );
}
