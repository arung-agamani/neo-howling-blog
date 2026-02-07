import {
    Box,
    Chip,
    CircularProgress,
    Collapse,
    IconButton,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
} from "@mui/material";
import KeyIcon from "@mui/icons-material/Key";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import type { ApiKey, ApiKeyDetailResponse } from "./types";
import {
    formatDate,
    relativeTime,
    isExpired,
    methodColor,
    statusColor,
} from "./utils";

export interface ApiKeyRowProps {
    apiKey: ApiKey;
    expanded: boolean;
    onToggleExpand: () => void;
    onRevoke: () => void;
    onCopy: (key: string) => void;
    detailData?: ApiKeyDetailResponse;
    detailLoading: boolean;
}

export function ApiKeyRow({
    apiKey,
    expanded,
    onToggleExpand,
    onRevoke,
    onCopy,
    detailData,
    detailLoading,
}: ApiKeyRowProps) {
    const expired = isExpired(apiKey.expiresAt);
    const effectivelyInactive = !apiKey.isActive || expired;

    return (
        <>
            <TableRow
                hover
                sx={{
                    opacity: effectivelyInactive ? 0.6 : 1,
                    "& > td": { borderBottom: expanded ? "none" : undefined },
                }}
            >
                <TableCell>
                    <IconButton size="small" onClick={onToggleExpand}>
                        {expanded ? (
                            <ExpandLessIcon fontSize="small" />
                        ) : (
                            <ExpandMoreIcon fontSize="small" />
                        )}
                    </IconButton>
                </TableCell>
                <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                        {apiKey.name}
                    </Typography>
                    {apiKey.description && (
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            noWrap
                            maxWidth={200}
                            title={apiKey.description}
                        >
                            {apiKey.description}
                        </Typography>
                    )}
                </TableCell>
                <TableCell>
                    <Tooltip title="Click to copy prefix">
                        <Chip
                            label={`${apiKey.keyPrefix}...`}
                            size="small"
                            variant="outlined"
                            onClick={() => onCopy(apiKey.keyPrefix)}
                            icon={<KeyIcon sx={{ fontSize: 14 }} />}
                            sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}
                        />
                    </Tooltip>
                </TableCell>
                <TableCell>
                    <Box display="flex" gap={0.5} flexWrap="wrap">
                        {apiKey.scopes.map((scope) => (
                            <Chip
                                key={scope}
                                label={scope}
                                size="small"
                                sx={{
                                    fontFamily: "monospace",
                                    fontSize: "0.7rem",
                                    height: 22,
                                }}
                            />
                        ))}
                    </Box>
                </TableCell>
                <TableCell>
                    {!apiKey.isActive ? (
                        <Chip
                            label="Revoked"
                            size="small"
                            color="error"
                            icon={<CancelIcon />}
                        />
                    ) : expired ? (
                        <Chip
                            label="Expired"
                            size="small"
                            color="warning"
                            icon={<WarningAmberIcon />}
                        />
                    ) : (
                        <Chip
                            label="Active"
                            size="small"
                            color="success"
                            icon={<CheckCircleIcon />}
                        />
                    )}
                </TableCell>
                <TableCell>
                    <Tooltip title={formatDate(apiKey.createdAt)}>
                        <Typography variant="caption">
                            {relativeTime(apiKey.createdAt)}
                        </Typography>
                    </Tooltip>
                </TableCell>
                <TableCell>
                    <Tooltip
                        title={
                            apiKey.lastUsedAt
                                ? formatDate(apiKey.lastUsedAt)
                                : "Never used"
                        }
                    >
                        <Typography variant="caption">
                            {relativeTime(apiKey.lastUsedAt)}
                        </Typography>
                    </Tooltip>
                </TableCell>
                <TableCell align="right">
                    <Typography variant="body2" fontFamily="monospace">
                        {apiKey.usageCount.toLocaleString()}
                    </Typography>
                </TableCell>
                <TableCell>
                    {apiKey.expiresAt ? (
                        <Tooltip title={formatDate(apiKey.expiresAt)}>
                            <Typography
                                variant="caption"
                                color={expired ? "error" : "text.secondary"}
                            >
                                {expired
                                    ? "Expired"
                                    : relativeTime(
                                          new Date(
                                              Date.now() -
                                                  (new Date(
                                                      apiKey.expiresAt
                                                  ).getTime() -
                                                      Date.now())
                                          ).toISOString()
                                      ).replace(" ago", " left")}
                            </Typography>
                        </Tooltip>
                    ) : (
                        <Typography variant="caption" color="text.secondary">
                            Never
                        </Typography>
                    )}
                </TableCell>
                <TableCell align="right">
                    <Box display="flex" justifyContent="flex-end" gap={0.5}>
                        <Tooltip title="View usage logs">
                            <IconButton size="small" onClick={onToggleExpand}>
                                <VisibilityIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        {apiKey.isActive && (
                            <Tooltip title="Revoke key">
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={onRevoke}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                </TableCell>
            </TableRow>

            {/* Expanded detail row */}
            <TableRow>
                <TableCell
                    colSpan={10}
                    sx={{ py: 0, px: 0, border: "none" }}
                >
                    <Collapse in={expanded} timeout="auto" unmountOnExit>
                        <Box sx={{ p: 2, bgcolor: "grey.50" }}>
                            <Stack
                                direction="row"
                                spacing={4}
                                mb={2}
                                flexWrap="wrap"
                            >
                                <Box>
                                    <Typography
                                        variant="overline"
                                        color="text.secondary"
                                    >
                                        Created
                                    </Typography>
                                    <Typography variant="body2">
                                        {formatDate(apiKey.createdAt)}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography
                                        variant="overline"
                                        color="text.secondary"
                                    >
                                        Last Used
                                    </Typography>
                                    <Typography variant="body2">
                                        {apiKey.lastUsedAt
                                            ? formatDate(apiKey.lastUsedAt)
                                            : "Never"}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography
                                        variant="overline"
                                        color="text.secondary"
                                    >
                                        Total Requests
                                    </Typography>
                                    <Typography variant="body2">
                                        {apiKey.usageCount.toLocaleString()}
                                    </Typography>
                                </Box>
                                {apiKey.expiresAt && (
                                    <Box>
                                        <Typography
                                            variant="overline"
                                            color="text.secondary"
                                        >
                                            Expires
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color={
                                                expired
                                                    ? "error"
                                                    : "text.primary"
                                            }
                                        >
                                            {formatDate(apiKey.expiresAt)}
                                            {expired && " (expired)"}
                                        </Typography>
                                    </Box>
                                )}
                                {apiKey.revokedAt && (
                                    <Box>
                                        <Typography
                                            variant="overline"
                                            color="text.secondary"
                                        >
                                            Revoked
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color="error"
                                        >
                                            {formatDate(apiKey.revokedAt)}
                                        </Typography>
                                    </Box>
                                )}
                            </Stack>

                            {apiKey.description && (
                                <Box mb={2}>
                                    <Typography
                                        variant="overline"
                                        color="text.secondary"
                                    >
                                        Description
                                    </Typography>
                                    <Typography variant="body2">
                                        {apiKey.description}
                                    </Typography>
                                </Box>
                            )}

                            <Typography variant="subtitle2" gutterBottom>
                                Recent Usage Logs
                            </Typography>

                            {detailLoading && (
                                <Box display="flex" py={2}>
                                    <CircularProgress size={20} />
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        ml={1}
                                    >
                                        Loading logs...
                                    </Typography>
                                </Box>
                            )}

                            {!detailLoading &&
                                detailData?.data?.usageLogs?.length === 0 && (
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        py={1}
                                    >
                                        No usage logs recorded yet.
                                    </Typography>
                                )}

                            {!detailLoading &&
                                detailData?.data?.usageLogs &&
                                detailData.data.usageLogs.length > 0 && (
                                    <TableContainer
                                        component={Paper}
                                        variant="outlined"
                                        sx={{ maxHeight: 300 }}
                                    >
                                        <Table size="small" stickyHeader>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Time</TableCell>
                                                    <TableCell>
                                                        Method
                                                    </TableCell>
                                                    <TableCell>
                                                        Endpoint
                                                    </TableCell>
                                                    <TableCell>
                                                        Status
                                                    </TableCell>
                                                    <TableCell>
                                                        IP Address
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {detailData.data.usageLogs.map(
                                                    (log) => (
                                                        <TableRow
                                                            key={log.id}
                                                            hover
                                                        >
                                                            <TableCell>
                                                                <Typography variant="caption">
                                                                    {formatDate(
                                                                        log.timestamp
                                                                    )}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                    label={
                                                                        log.method
                                                                    }
                                                                    size="small"
                                                                    color={methodColor(
                                                                        log.method
                                                                    )}
                                                                    sx={{
                                                                        fontFamily:
                                                                            "monospace",
                                                                        fontSize:
                                                                            "0.7rem",
                                                                        height: 22,
                                                                        fontWeight: 700,
                                                                    }}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography
                                                                    variant="caption"
                                                                    fontFamily="monospace"
                                                                >
                                                                    {
                                                                        log.endpoint
                                                                    }
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                    label={
                                                                        log.statusCode
                                                                    }
                                                                    size="small"
                                                                    color={statusColor(
                                                                        log.statusCode
                                                                    )}
                                                                    variant="outlined"
                                                                    sx={{
                                                                        fontFamily:
                                                                            "monospace",
                                                                        fontSize:
                                                                            "0.7rem",
                                                                        height: 22,
                                                                    }}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography
                                                                    variant="caption"
                                                                    fontFamily="monospace"
                                                                >
                                                                    {log.ipAddress ||
                                                                        "—"}
                                                                </Typography>
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}

                            {!detailLoading &&
                                detailData?.pagination &&
                                detailData.pagination.total > 10 && (
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        mt={1}
                                        display="block"
                                    >
                                        Showing 10 of{" "}
                                        {detailData.pagination.total} total
                                        log entries.
                                    </Typography>
                                )}
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
}
