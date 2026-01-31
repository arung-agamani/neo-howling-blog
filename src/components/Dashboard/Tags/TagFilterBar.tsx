"use client";

import React from "react";
import {
    Box,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    ToggleButton,
    ToggleButtonGroup,
    Button,
    InputAdornment,
    Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import ViewListIcon from "@mui/icons-material/ViewList";
import AddIcon from "@mui/icons-material/Add";
import MergeIcon from "@mui/icons-material/MergeType";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
    TagStatusFilter,
    TagSortBy,
    TagSortOrder,
    TagViewMode,
} from "@/types";

interface TagFilterBarProps {
    search: string;
    statusFilter: TagStatusFilter;
    sortBy: TagSortBy;
    sortOrder: TagSortOrder;
    viewMode: TagViewMode;
    selectedCount: number;
    onSearchChange: (value: string) => void;
    onStatusFilterChange: (value: TagStatusFilter) => void;
    onSortByChange: (value: TagSortBy) => void;
    onSortOrderChange: (value: TagSortOrder) => void;
    onViewModeChange: (value: TagViewMode) => void;
    onCreateClick: () => void;
    onMergeClick: () => void;
    onReprocessClick: () => void;
    isReprocessing?: boolean;
}

const TagFilterBar: React.FC<TagFilterBarProps> = ({
    search,
    statusFilter,
    sortBy,
    sortOrder,
    viewMode,
    selectedCount,
    onSearchChange,
    onStatusFilterChange,
    onSortByChange,
    onSortOrderChange,
    onViewModeChange,
    onCreateClick,
    onMergeClick,
    onReprocessClick,
    isReprocessing = false,
}) => {
    const handleViewModeChange = (
        _event: React.MouseEvent<HTMLElement>,
        newMode: TagViewMode | null,
    ) => {
        if (newMode !== null) {
            onViewModeChange(newMode);
        }
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3 }}>
            {/* Top Row: Actions and View Toggle */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 2,
                }}
            >
                {/* Left Side: Action Buttons */}
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={onCreateClick}
                        size="small"
                    >
                        New Tag
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<MergeIcon />}
                        onClick={onMergeClick}
                        disabled={selectedCount < 2}
                        size="small"
                    >
                        Merge {selectedCount > 0 ? `(${selectedCount})` : ""}
                    </Button>
                    <Tooltip title="Reprocess tags from all posts">
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={onReprocessClick}
                            disabled={isReprocessing}
                            size="small"
                            color="secondary"
                        >
                            {isReprocessing ? "Processing..." : "Reprocess"}
                        </Button>
                    </Tooltip>
                </Box>

                {/* Right Side: View Toggle */}
                <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={handleViewModeChange}
                    aria-label="view mode"
                    size="small"
                >
                    <ToggleButton value="table" aria-label="table view">
                        <Tooltip title="Table View">
                            <ViewListIcon />
                        </Tooltip>
                    </ToggleButton>
                    <ToggleButton value="card" aria-label="card view">
                        <Tooltip title="Card View">
                            <ViewModuleIcon />
                        </Tooltip>
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* Bottom Row: Search and Filters */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "1fr",
                        sm: "1fr 1fr",
                        md: "2fr 1fr 1fr 1fr",
                    },
                    gap: 2,
                }}
            >
                {/* Search */}
                <TextField
                    placeholder="Search tags..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    size="small"
                    fullWidth
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                    }}
                />

                {/* Status Filter */}
                <FormControl size="small" fullWidth>
                    <InputLabel id="status-filter-label">Status</InputLabel>
                    <Select
                        labelId="status-filter-label"
                        value={statusFilter}
                        onChange={(e) =>
                            onStatusFilterChange(e.target.value as TagStatusFilter)
                        }
                        label="Status"
                    >
                        <MenuItem value="all">All Tags</MenuItem>
                        <MenuItem value="active">Active (has posts)</MenuItem>
                        <MenuItem value="orphaned">Orphaned (no posts)</MenuItem>
                    </Select>
                </FormControl>

                {/* Sort By */}
                <FormControl size="small" fullWidth>
                    <InputLabel id="sort-by-label">Sort By</InputLabel>
                    <Select
                        labelId="sort-by-label"
                        value={sortBy}
                        onChange={(e) =>
                            onSortByChange(e.target.value as TagSortBy)
                        }
                        label="Sort By"
                    >
                        <MenuItem value="count">Post Count</MenuItem>
                        <MenuItem value="name">Name</MenuItem>
                        <MenuItem value="createdAt">Date Created</MenuItem>
                    </Select>
                </FormControl>

                {/* Sort Order */}
                <FormControl size="small" fullWidth>
                    <InputLabel id="sort-order-label">Order</InputLabel>
                    <Select
                        labelId="sort-order-label"
                        value={sortOrder}
                        onChange={(e) =>
                            onSortOrderChange(e.target.value as TagSortOrder)
                        }
                        label="Order"
                    >
                        <MenuItem value="desc">Descending</MenuItem>
                        <MenuItem value="asc">Ascending</MenuItem>
                    </Select>
                </FormControl>
            </Box>
        </Box>
    );
};

export default TagFilterBar;
