"use client";

import { useState } from "react";
import axios from "@/utils/axios";
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Divider,
    IconButton,
    Paper,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import KeyIcon from "@mui/icons-material/Key";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
    SummaryStats,
    ApiKeyRow,
    CreateApiKeyDialog,
    RevokeApiKeyDialog,
} from "@/components/Dashboard/Management/APIKeys";
import type {
    ApiKey,
    ApiKeyListResponse,
    ApiKeyDetailResponse,
    CreateApiKeyResponse,
} from "@/components/Dashboard/Management/APIKeys";

export default function ApiKeysPage() {
    const queryClient = useQueryClient();

    // ── State ──────────────────────────────────────────────────

    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
    const [keyToRevoke, setKeyToRevoke] = useState<ApiKey | null>(null);
    const [createdKey, setCreatedKey] = useState<string | null>(null);
    const [copySnackOpen, setCopySnackOpen] = useState(false);
    const [expandedKeyId, setExpandedKeyId] = useState<string | null>(null);

    // ── Queries ────────────────────────────────────────────────

    const {
        data: apiKeysData,
        isLoading,
        error,
        refetch,
    } = useQuery<ApiKeyListResponse>({
        queryKey: ["api-keys"],
        queryFn: async () => {
            const { data } = await axios.get("/api/v1/api-keys");
            return data;
        },
    });

    const apiKeys = apiKeysData?.data ?? [];

    const { data: detailData, isLoading: detailLoading } =
        useQuery<ApiKeyDetailResponse>({
            queryKey: ["api-keys", expandedKeyId, "detail"],
            queryFn: async () => {
                const { data } = await axios.get(
                    `/api/v1/api-keys/${expandedKeyId}?limit=10`,
                );
                return data;
            },
            enabled: !!expandedKeyId,
        });

    // ── Mutations ──────────────────────────────────────────────

    const createMutation = useMutation({
        mutationFn: async (payload: {
            name: string;
            description?: string;
            scopes: string[];
            expiresAt?: string | null;
        }) => {
            const { data } = await axios.post<CreateApiKeyResponse>(
                "/api/v1/api-keys",
                payload,
            );
            return data;
        },
        onSuccess: (data) => {
            setCreatedKey(data.data.key);
            toast.success("API key created successfully");
            queryClient.invalidateQueries({ queryKey: ["api-keys"] });
        },
        onError: (err: any) => {
            const message =
                err?.response?.data?.message ||
                err?.message ||
                "Failed to create API key";
            toast.error(message);
        },
    });

    const revokeMutation = useMutation({
        mutationFn: async (id: string) => {
            const { data } = await axios.delete(`/api/v1/api-keys?id=${id}`);
            return data;
        },
        onSuccess: () => {
            toast.success("API key revoked");
            queryClient.invalidateQueries({ queryKey: ["api-keys"] });
            setRevokeDialogOpen(false);
            if (expandedKeyId === keyToRevoke?.id) {
                setExpandedKeyId(null);
            }
            setKeyToRevoke(null);
        },
        onError: (err: any) => {
            const message =
                err?.response?.data?.message ||
                err?.message ||
                "Failed to revoke API key";
            toast.error(message);
        },
    });

    // ── Handlers ───────────────────────────────────────────────

    const handleOpenCreate = () => {
        setCreatedKey(null);
        setCreateDialogOpen(true);
    };

    const handleCloseCreate = () => {
        setCreateDialogOpen(false);
        setCreatedKey(null);
    };

    const handleCopyKey = async (key: string) => {
        try {
            await navigator.clipboard.writeText(key);
            setCopySnackOpen(true);
        } catch {
            const textarea = document.createElement("textarea");
            textarea.value = key;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            setCopySnackOpen(true);
        }
    };

    const handleOpenRevoke = (key: ApiKey) => {
        setKeyToRevoke(key);
        setRevokeDialogOpen(true);
    };

    const handleToggleExpand = (id: string) => {
        setExpandedKeyId((prev) => (prev === id ? null : id));
    };

    // ── Render ─────────────────────────────────────────────────

    return (
        <Paper sx={{ padding: "2rem" }}>
            {/* Header */}
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={1}
            >
                <Box>
                    <Typography variant="h4">API Keys</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Create and manage API keys for programmatic access to
                        the v2 API endpoints. Keys support scoped permissions
                        and usage tracking.
                    </Typography>
                </Box>
                <Box display="flex" gap={1}>
                    <Tooltip title="Refresh">
                        <IconButton onClick={() => refetch()} size="small">
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleOpenCreate}
                    >
                        Create API Key
                    </Button>
                </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Summary stats */}
            <SummaryStats apiKeys={apiKeys} />

            {/* Loading / Error */}
            {isLoading && (
                <Box display="flex" justifyContent="center" py={6}>
                    <CircularProgress />
                </Box>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    Failed to load API keys. Please try again.
                </Alert>
            )}

            {/* Empty state */}
            {!isLoading && apiKeys.length === 0 && (
                <Box textAlign="center" py={6}>
                    <KeyIcon
                        sx={{ fontSize: 64, color: "text.disabled", mb: 2 }}
                    />
                    <Typography
                        variant="h6"
                        color="text.secondary"
                        gutterBottom
                    >
                        No API keys yet
                    </Typography>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 3 }}
                    >
                        Create your first API key to access v2 endpoints
                        programmatically.
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleOpenCreate}
                    >
                        Create Your First API Key
                    </Button>
                </Box>
            )}

            {/* Keys Table */}
            {!isLoading && apiKeys.length > 0 && (
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell width={40} />
                                <TableCell>Name</TableCell>
                                <TableCell>Key</TableCell>
                                <TableCell>Scopes</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Created</TableCell>
                                <TableCell>Last Used</TableCell>
                                <TableCell align="right">Usage</TableCell>
                                <TableCell>Expires</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {apiKeys.map((key) => (
                                <ApiKeyRow
                                    key={key.id}
                                    apiKey={key}
                                    expanded={expandedKeyId === key.id}
                                    onToggleExpand={() =>
                                        handleToggleExpand(key.id)
                                    }
                                    onRevoke={() => handleOpenRevoke(key)}
                                    onCopy={handleCopyKey}
                                    detailData={
                                        expandedKeyId === key.id
                                            ? detailData
                                            : undefined
                                    }
                                    detailLoading={
                                        expandedKeyId === key.id &&
                                        detailLoading
                                    }
                                />
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Create Dialog */}
            <CreateApiKeyDialog
                open={createDialogOpen}
                onClose={handleCloseCreate}
                onCopyKey={handleCopyKey}
                createdKey={createdKey}
                isPending={createMutation.isPending}
                onSubmit={(payload) => createMutation.mutate(payload)}
            />

            {/* Revoke Confirmation Dialog */}
            <RevokeApiKeyDialog
                open={revokeDialogOpen}
                onClose={() => setRevokeDialogOpen(false)}
                apiKey={keyToRevoke}
                isPending={revokeMutation.isPending}
                onConfirm={(id) => revokeMutation.mutate(id)}
            />

            {/* Copy snackbar */}
            <Snackbar
                open={copySnackOpen}
                autoHideDuration={2000}
                onClose={() => setCopySnackOpen(false)}
                message="Copied to clipboard"
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            />
        </Paper>
    );
}
