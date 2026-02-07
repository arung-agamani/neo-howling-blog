import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import DeleteIcon from "@mui/icons-material/Delete";
import type { ApiKey } from "./types";

export interface RevokeApiKeyDialogProps {
    open: boolean;
    onClose: () => void;
    apiKey: ApiKey | null;
    isPending: boolean;
    onConfirm: (id: string) => void;
}

export function RevokeApiKeyDialog({
    open,
    onClose,
    apiKey,
    isPending,
    onConfirm,
}: RevokeApiKeyDialogProps) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>
                <Box display="flex" alignItems="center" gap={1}>
                    <WarningAmberIcon color="warning" />
                    Revoke API Key
                </Box>
            </DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Are you sure you want to revoke the API key{" "}
                    <strong>&ldquo;{apiKey?.name}&rdquo;</strong> (
                    <code>{apiKey?.keyPrefix}...</code>)? This action cannot be
                    undone. Any applications using this key will immediately lose
                    access.
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    color="error"
                    variant="contained"
                    onClick={() => apiKey && onConfirm(apiKey.id)}
                    disabled={isPending}
                    startIcon={
                        isPending ? (
                            <CircularProgress size={16} />
                        ) : (
                            <DeleteIcon />
                        )
                    }
                >
                    {isPending ? "Revoking..." : "Revoke Key"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
