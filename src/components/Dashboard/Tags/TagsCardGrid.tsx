"use client";

import React, { useCallback, memo } from "react";
import {
    Box,
    Card,
    CardContent,
    CardActionArea,
    Typography,
    Checkbox,
    Chip,
    IconButton,
    Tooltip,
    Skeleton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import { Tag } from "@/types";

interface TagsCardGridProps {
    tags: Tag[];
    isLoading?: boolean;
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
    onEditClick: (tag: Tag) => void;
    onDeleteClick: (tag: Tag) => void;
    onViewClick: (tag: Tag) => void;
}

// Static styles to prevent Emotion re-serialization
const staticStyles = {
    grid: {
        display: "grid",
        gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
            lg: "repeat(4, 1fr)",
        },
        gap: 2,
    },
    emptyState: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 8,
        px: 4,
        bgcolor: "grey.50",
        borderRadius: 2,
        border: "1px dashed",
        borderColor: "grey.300",
    },
    emptyIcon: {
        fontSize: 64,
        color: "grey.400",
        mb: 2,
    },
    cardBase: {
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        transition: "all 0.2s ease",
    },
    checkboxContainer: {
        position: "absolute",
        top: 4,
        left: 4,
        zIndex: 1,
    },
    checkbox: {
        padding: 0.5,
        bgcolor: "background.paper",
        borderRadius: 1,
        "&:hover": {
            bgcolor: "grey.100",
        },
    },
    actionsContainer: {
        position: "absolute",
        top: 4,
        right: 4,
        display: "flex",
        gap: 0.25,
        zIndex: 1,
    },
    actionButton: {
        bgcolor: "background.paper",
        "&:hover": { bgcolor: "grey.100" },
    },
    deleteButton: {
        bgcolor: "background.paper",
        "&:hover": { bgcolor: "error.50" },
    },
    cardActionArea: {
        flexGrow: 1,
        pt: 4,
    },
    tagHeader: {
        display: "flex",
        alignItems: "center",
        gap: 1,
        mb: 1,
    },
    colorDot: {
        width: 16,
        height: 16,
        borderRadius: "50%",
        flexShrink: 0,
    },
    tagIcon: {
        fontSize: 20,
        color: "text.secondary",
    },
    tagName: {
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },
    description: {
        overflow: "hidden",
        textOverflow: "ellipsis",
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        mb: 1,
    },
    aliasContainer: {
        display: "flex",
        gap: 0.5,
        flexWrap: "wrap",
    },
    aliasChip: {
        fontSize: "0.65rem",
        height: 18,
    },
} as const;

// Memoized skeleton component
const TagCardSkeleton = memo(function TagCardSkeleton() {
    return (
        <Card sx={staticStyles.cardBase}>
            <CardContent>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1,
                        mb: 2,
                    }}
                >
                    <Skeleton variant="circular" width={24} height={24} />
                    <Skeleton variant="text" width="60%" height={28} />
                </Box>
                <Skeleton variant="text" width="40%" height={20} />
                <Skeleton
                    variant="text"
                    width="80%"
                    height={20}
                    sx={{ mt: 1 }}
                />
            </CardContent>
        </Card>
    );
});

// Memoized individual tag card
const TagCard = memo(function TagCard({
    tag,
    isSelected,
    onToggleSelect,
    onEditClick,
    onDeleteClick,
    onViewClick,
}: {
    tag: Tag;
    isSelected: boolean;
    onToggleSelect: (tagId: string) => void;
    onEditClick: (tag: Tag) => void;
    onDeleteClick: (tag: Tag) => void;
    onViewClick: (tag: Tag) => void;
}) {
    const handleCheckboxChange = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            onToggleSelect(tag.id);
        },
        [tag.id, onToggleSelect],
    );

    const handleEditClick = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            onEditClick(tag);
        },
        [tag, onEditClick],
    );

    const handleDeleteClick = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            onDeleteClick(tag);
        },
        [tag, onDeleteClick],
    );

    const handleViewClick = useCallback(() => {
        onViewClick(tag);
    }, [tag, onViewClick]);

    return (
        <Card
            sx={{
                ...staticStyles.cardBase,
                border: isSelected ? "2px solid" : "1px solid",
                borderColor: isSelected ? "primary.main" : "divider",
                bgcolor: isSelected ? "primary.50" : "background.paper",
                "&:hover": {
                    boxShadow: 2,
                    borderColor: isSelected ? "primary.main" : "grey.400",
                },
            }}
        >
            {/* Selection Checkbox */}
            <Box
                sx={staticStyles.checkboxContainer}
                onClick={handleCheckboxChange}
            >
                <Checkbox
                    checked={isSelected}
                    size="small"
                    sx={staticStyles.checkbox}
                    onClick={handleCheckboxChange}
                />
            </Box>

            {/* Action Buttons */}
            <Box sx={staticStyles.actionsContainer}>
                <Tooltip title="Edit">
                    <IconButton
                        size="small"
                        onClick={handleEditClick}
                        sx={staticStyles.actionButton}
                    >
                        <EditIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                    <IconButton
                        size="small"
                        onClick={handleDeleteClick}
                        color="error"
                        sx={staticStyles.deleteButton}
                    >
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>

            <CardActionArea
                onClick={handleViewClick}
                sx={staticStyles.cardActionArea}
            >
                <CardContent>
                    {/* Tag Header */}
                    <Box sx={staticStyles.tagHeader}>
                        {tag.color ? (
                            <Box
                                sx={{
                                    ...staticStyles.colorDot,
                                    bgcolor: tag.color,
                                }}
                            />
                        ) : (
                            <LocalOfferIcon sx={staticStyles.tagIcon} />
                        )}
                        <Typography
                            variant="h6"
                            fontWeight="bold"
                            sx={staticStyles.tagName}
                        >
                            {tag.name}
                        </Typography>
                    </Box>

                    {/* Post Count */}
                    <Box sx={{ mb: 1.5 }}>
                        <Chip
                            label={`${tag.count} post${tag.count !== 1 ? "s" : ""}`}
                            size="small"
                            color={tag.count === 0 ? "warning" : "primary"}
                            variant={tag.count === 0 ? "filled" : "outlined"}
                        />
                    </Box>

                    {/* Description */}
                    {tag.description ? (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={staticStyles.description}
                        >
                            {tag.description}
                        </Typography>
                    ) : (
                        <Typography
                            variant="body2"
                            color="text.disabled"
                            fontStyle="italic"
                            sx={{ mb: 1 }}
                        >
                            No description
                        </Typography>
                    )}

                    {/* Aliases */}
                    {tag.aliases && tag.aliases.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
                                gutterBottom
                            >
                                Aliases:
                            </Typography>
                            <Box sx={staticStyles.aliasContainer}>
                                {tag.aliases.slice(0, 3).map((alias) => (
                                    <Chip
                                        key={alias}
                                        label={alias}
                                        size="small"
                                        variant="outlined"
                                        sx={staticStyles.aliasChip}
                                    />
                                ))}
                                {tag.aliases.length > 3 && (
                                    <Chip
                                        label={`+${tag.aliases.length - 3}`}
                                        size="small"
                                        variant="outlined"
                                        sx={staticStyles.aliasChip}
                                    />
                                )}
                            </Box>
                        </Box>
                    )}
                </CardContent>
            </CardActionArea>
        </Card>
    );
});

const TagsCardGrid: React.FC<TagsCardGridProps> = ({
    tags,
    isLoading = false,
    selectedIds,
    onSelectionChange,
    onEditClick,
    onDeleteClick,
    onViewClick,
}) => {
    const handleToggleSelect = useCallback(
        (tagId: string) => {
            if (selectedIds.includes(tagId)) {
                onSelectionChange(selectedIds.filter((id) => id !== tagId));
            } else {
                onSelectionChange([...selectedIds, tagId]);
            }
        },
        [selectedIds, onSelectionChange],
    );

    const isSelected = useCallback(
        (tagId: string) => selectedIds.includes(tagId),
        [selectedIds],
    );

    if (isLoading) {
        return (
            <Box sx={staticStyles.grid}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <TagCardSkeleton key={i} />
                ))}
            </Box>
        );
    }

    if (tags.length === 0) {
        return (
            <Box sx={staticStyles.emptyState}>
                <LocalOfferIcon sx={staticStyles.emptyIcon} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                    No tags found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Create a new tag or adjust your filters
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={staticStyles.grid}>
            {tags.map((tag) => (
                <TagCard
                    key={tag.id}
                    tag={tag}
                    isSelected={isSelected(tag.id)}
                    onToggleSelect={handleToggleSelect}
                    onEditClick={onEditClick}
                    onDeleteClick={onDeleteClick}
                    onViewClick={onViewClick}
                />
            ))}
        </Box>
    );
};

export default memo(TagsCardGrid);
