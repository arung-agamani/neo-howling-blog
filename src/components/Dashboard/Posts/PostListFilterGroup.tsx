"use client";

import React from "react";
import {
    Box,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Chip,
    ToggleButton,
    ToggleButtonGroup,
} from "@mui/material";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import ViewListIcon from "@mui/icons-material/ViewList";

type ViewMode = "card" | "table";
type StatusFilter = "all" | "published" | "draft" | "trash";

interface PostListFilterGroupProps {
    viewMode: ViewMode;
    statusFilter: StatusFilter;
    searchTerm: string;
    selectedTags: string[];
    allTags: string[];
    stats: {
        total: number;
        published: number;
        draft: number;
        trash: number;
    };
    onViewModeChange: (mode: ViewMode) => void;
    onStatusFilterChange: (status: StatusFilter) => void;
    onSearchChange: (term: string) => void;
    onTagsChange: (tags: string[]) => void;
}

const PostListFilterGroup: React.FC<PostListFilterGroupProps> = ({
    viewMode,
    statusFilter,
    searchTerm,
    selectedTags,
    allTags,
    stats,
    onViewModeChange,
    onStatusFilterChange,
    onSearchChange,
    onTagsChange,
}) => {
    const handleViewModeChange = (
        _event: React.MouseEvent<HTMLElement>,
        newMode: ViewMode | null,
    ) => {
        if (newMode !== null) {
            onViewModeChange(newMode);
        }
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Status Filter Buttons and View Toggle */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 2,
                }}
            >
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Button
                        variant={
                            statusFilter === "all" ? "contained" : "outlined"
                        }
                        onClick={() => onStatusFilterChange("all")}
                        size="small"
                    >
                        All ({stats.total})
                    </Button>
                    <Button
                        variant={
                            statusFilter === "published"
                                ? "contained"
                                : "outlined"
                        }
                        color="success"
                        onClick={() => onStatusFilterChange("published")}
                        size="small"
                    >
                        Published ({stats.published})
                    </Button>
                    <Button
                        variant={
                            statusFilter === "draft" ? "contained" : "outlined"
                        }
                        color="warning"
                        onClick={() => onStatusFilterChange("draft")}
                        size="small"
                    >
                        Drafts ({stats.draft})
                    </Button>
                    <Button
                        variant={
                            statusFilter === "trash" ? "contained" : "outlined"
                        }
                        color="error"
                        onClick={() => onStatusFilterChange("trash")}
                        size="small"
                    >
                        Trash ({stats.trash})
                    </Button>
                </Box>

                <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={handleViewModeChange}
                    aria-label="view mode"
                    size="small"
                >
                    <ToggleButton value="card" aria-label="card view">
                        <ViewModuleIcon />
                    </ToggleButton>
                    <ToggleButton value="table" aria-label="table view">
                        <ViewListIcon />
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* Search and Tags Filter */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "1fr",
                        md: "1fr 1fr",
                    },
                    gap: 2,
                }}
            >
                <TextField
                    label="Search posts"
                    variant="outlined"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    size="small"
                    fullWidth
                    placeholder="Search by title, description, or author..."
                />

                <FormControl size="small" fullWidth>
                    <InputLabel id="tags-filter-label">
                        Filter by Tags
                    </InputLabel>
                    <Select
                        labelId="tags-filter-label"
                        multiple
                        value={selectedTags}
                        onChange={(e) => {
                            const value = e.target.value;
                            onTagsChange(
                                typeof value === "string"
                                    ? value.split(",")
                                    : value,
                            );
                        }}
                        label="Filter by Tags"
                        renderValue={(selected) => (
                            <Box
                                sx={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 0.5,
                                }}
                            >
                                {selected.map((value) => (
                                    <Chip
                                        key={value}
                                        label={value}
                                        size="small"
                                    />
                                ))}
                            </Box>
                        )}
                    >
                        {allTags.map((tag) => (
                            <MenuItem key={tag} value={tag}>
                                {tag}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>
        </Box>
    );
};

export default PostListFilterGroup;
