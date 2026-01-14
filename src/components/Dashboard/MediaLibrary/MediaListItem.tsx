import React from "react";
import {
    TableRow,
    TableCell,
    Checkbox,
    Box,
    Typography,
    IconButton,
    Tooltip,
    Chip,
    Stack,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import { Download, Visibility } from "@mui/icons-material";
import { MediaListItemProps } from "./types";
import {
    formatFileSize,
    formatDate,
    getFileIcon,
    getThumbnailUrl,
    getMediaTypeColor,
    isImage,
    formatDimensions,
} from "./utils";

/**
 * List view item component for media library
 * Displays media as a table row with thumbnail, metadata, and actions
 * Updated to work with new API types
 */
export const MediaListItem: React.FC<MediaListItemProps> = ({
    item,
    isSelected,
    onSelect,
    onView,
    onDownload,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const Icon = getFileIcon(item.type);
    const thumbnailUrl = isImage(item) ? getThumbnailUrl(item) : null;
    const hasVariants = item.variants && item.variants.length > 0;

    return (
        <TableRow
            hover
            selected={isSelected}
            sx={{
                cursor: "pointer",
                "&:hover": {
                    bgcolor: "action.hover",
                },
            }}
            onClick={() => onView(item)}
        >
            {/* Checkbox */}
            <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                    checked={isSelected}
                    onChange={() => onSelect(item.id)}
                />
            </TableCell>

            {/* File (Thumbnail + Name) */}
            <TableCell>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    {/* Thumbnail */}
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 1,
                            bgcolor: "grey.100",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                            flexShrink: 0,
                        }}
                    >
                        {thumbnailUrl ? (
                            <Box
                                component="img"
                                src={thumbnailUrl}
                                alt={
                                    item.altText || item.title || item.filename
                                }
                                sx={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                }}
                            />
                        ) : (
                            <Icon sx={{ fontSize: 24, color: "grey.500" }} />
                        )}
                    </Box>

                    {/* File Info */}
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                            variant="body2"
                            fontWeight="medium"
                            noWrap
                            title={item.title || item.filename}
                        >
                            {item.title || item.filename}
                        </Typography>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            noWrap
                            title={item.filename}
                        >
                            {item.filename}
                        </Typography>
                        {/* Tags */}
                        {item.tags && item.tags.length > 0 && (
                            <Box
                                sx={{
                                    display: "flex",
                                    gap: 0.5,
                                    mt: 0.5,
                                    flexWrap: "wrap",
                                }}
                            >
                                {item.tags.slice(0, 3).map((tag) => (
                                    <Chip
                                        key={tag}
                                        label={tag}
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                            fontSize: "0.6rem",
                                            height: 16,
                                            "& .MuiChip-label": {
                                                px: 0.5,
                                            },
                                        }}
                                    />
                                ))}
                                {item.tags.length > 3 && (
                                    <Typography
                                        variant="caption"
                                        color="text.disabled"
                                    >
                                        +{item.tags.length - 3}
                                    </Typography>
                                )}
                            </Box>
                        )}
                    </Box>
                </Box>
            </TableCell>

            {/* Type - Hidden on mobile */}
            {!isMobile && (
                <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                            label={item.type}
                            size="small"
                            color={getMediaTypeColor(item.type)}
                            sx={{ fontSize: "0.7rem" }}
                        />
                        {hasVariants && (
                            <Tooltip
                                title={`${item.variants.length} size variants`}
                            >
                                <Chip
                                    label={`${item.variants.length}`}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                        fontSize: "0.65rem",
                                        height: 20,
                                        minWidth: 24,
                                    }}
                                />
                            </Tooltip>
                        )}
                    </Stack>
                </TableCell>
            )}

            {/* Size - Hidden on mobile */}
            {!isMobile && (
                <TableCell>
                    <Typography variant="body2" noWrap>
                        {formatFileSize(item.fileSize)}
                    </Typography>
                    {item.width && item.height && (
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            noWrap
                        >
                            {formatDimensions(item)}
                        </Typography>
                    )}
                </TableCell>
            )}

            {/* Date - Hidden on mobile */}
            {!isMobile && (
                <TableCell>
                    <Typography variant="body2" noWrap>
                        {formatDate(item.uploadedAt)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                        by {item.uploader?.name || "Unknown"}
                    </Typography>
                </TableCell>
            )}

            {/* Actions */}
            <TableCell onClick={(e) => e.stopPropagation()}>
                <Box sx={{ display: "flex", gap: 0.5 }}>
                    <Tooltip title="View details">
                        <IconButton size="small" onClick={() => onView(item)}>
                            <Visibility fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Download">
                        <IconButton
                            size="small"
                            onClick={() => onDownload(item)}
                        >
                            <Download fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </TableCell>
        </TableRow>
    );
};
