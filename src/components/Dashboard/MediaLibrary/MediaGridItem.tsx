import React from "react";
import {
    Card,
    CardActionArea,
    CardContent,
    CardMedia,
    Box,
    Typography,
    Checkbox,
    Chip,
    Stack,
} from "@mui/material";
import { MediaItemComponentProps } from "./types";
import {
    formatFileSize,
    getFileIcon,
    getThumbnailUrl,
    getMediaTypeColor,
    isImage,
} from "./utils";

/**
 * Grid view item component for media library
 * Displays media as a card with thumbnail, checkbox, and basic info
 * Updated to work with new API types and display variant indicators
 */
export const MediaGridItem: React.FC<MediaItemComponentProps> = React.memo(({
    item,
    isSelected,
    onSelect,
    onView,
}) => {
    const Icon = getFileIcon(item.type);
    const thumbnailUrl = isImage(item) ? getThumbnailUrl(item) : null;
    const hasVariants = item.variants && item.variants.length > 0;

    return (
        <Card
            sx={{
                position: "relative",
                border: 2,
                borderColor: isSelected ? "primary.main" : "transparent",
                transition: "border-color 0.2s, box-shadow 0.2s",
                "&:hover": {
                    borderColor: isSelected ? "primary.main" : "grey.300",
                    boxShadow: 2,
                },
            }}
        >
            {/* Checkbox */}
            <Checkbox
                checked={isSelected}
                onChange={() => onSelect(item.id)}
                sx={{
                    position: "absolute",
                    top: 8,
                    left: 8,
                    zIndex: 1,
                    bgcolor: "rgba(255, 255, 255, 0.9)",
                    borderRadius: 1,
                    "&:hover": {
                        bgcolor: "rgba(255, 255, 255, 1)",
                    },
                }}
                onClick={(e) => e.stopPropagation()}
            />

            {/* Type Badge */}
            <Chip
                label={item.type}
                size="small"
                color={getMediaTypeColor(item.type)}
                sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    zIndex: 1,
                    fontSize: "0.65rem",
                    height: 20,
                }}
            />

            <CardActionArea onClick={() => onView(item)}>
                {/* Thumbnail */}
                <Box
                    sx={{
                        aspectRatio: "1",
                        bgcolor: "grey.100",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        overflow: "hidden",
                    }}
                >
                    {thumbnailUrl ? (
                        <CardMedia
                            component="img"
                            image={thumbnailUrl}
                            alt={item.altText || item.title || item.filename}
                            sx={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                            }}
                        />
                    ) : (
                        <Icon sx={{ fontSize: 64, color: "grey.400" }} />
                    )}

                    {/* Variants indicator */}
                    {hasVariants && (
                        <Chip
                            label={`${item.variants.length} sizes`}
                            size="small"
                            sx={{
                                position: "absolute",
                                bottom: 8,
                                left: 8,
                                fontSize: "0.65rem",
                                height: 20,
                                bgcolor: "rgba(0, 0, 0, 0.6)",
                                color: "white",
                            }}
                        />
                    )}
                </Box>

                <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                    <Typography
                        variant="body2"
                        fontWeight="medium"
                        noWrap
                        title={item.title || item.filename}
                    >
                        {item.title || item.filename}
                    </Typography>
                    <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ mt: 0.5 }}
                    >
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            noWrap
                        >
                            {formatFileSize(item.fileSize)}
                        </Typography>
                        {item.width && item.height && (
                            <Typography
                                variant="caption"
                                color="text.disabled"
                                noWrap
                            >
                                {item.width}×{item.height}
                            </Typography>
                        )}
                    </Stack>
                    {/* Tags preview */}
                    {item.tags && item.tags.length > 0 && (
                        <Box
                            sx={{
                                display: "flex",
                                gap: 0.5,
                                mt: 0.5,
                                flexWrap: "wrap",
                            }}
                        >
                            {item.tags.slice(0, 2).map((tag) => (
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
                            {item.tags.length > 2 && (
                                <Typography
                                    variant="caption"
                                    color="text.disabled"
                                >
                                    +{item.tags.length - 2}
                                </Typography>
                            )}
                        </Box>
                    )}
                </CardContent>
            </CardActionArea>
        </Card>
    );
});

MediaGridItem.displayName = "MediaGridItem";
