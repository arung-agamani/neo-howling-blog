"use client";

import React, {
    useState,
    useMemo,
    useCallback,
    useTransition,
    useRef,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
    Box,
    Typography,
    Divider,
    Paper,
    CircularProgress,
    Alert,
} from "@mui/material";
import { MRT_RowSelectionState, MRT_Updater } from "material-react-table";

import {
    TagStatsBar,
    TagFilterBar,
    TagsTable,
    TagsCardGrid,
    CreateTagDialog,
    EditTagDialog,
    MergeTagsDialog,
} from "@/components/Dashboard/Tags";

import {
    Tag,
    TagsListResponse,
    TagStatusFilter,
    TagSortBy,
    TagSortOrder,
    TagViewMode,
    CreateTagPayload,
    UpdateTagPayload,
    MergeTagsPayload,
    MergeTagsPreview,
} from "@/types";

// Debounce hook for search
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    React.useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

export default function TagsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isPending, startTransition] = useTransition();

    // Filter and view state
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<TagStatusFilter>("all");
    const [sortBy, setSortBy] = useState<TagSortBy>("count");
    const [sortOrder, setSortOrder] = useState<TagSortOrder>("desc");
    const [viewMode, setViewMode] = useState<TagViewMode>("table");

    // Debounce search to avoid excessive API calls
    const debouncedSearch = useDebounce(search, 300);

    // Selection state - only track IDs, not full objects
    const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({});

    // Dialog state
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
    const [editingTag, setEditingTag] = useState<Tag | null>(null);

    // Fetch tags with stats - aggressive caching
    const {
        data: tagsResponse,
        isLoading,
        isFetching,
        error,
    } = useQuery<TagsListResponse>({
        queryKey: [
            "tags",
            { search: debouncedSearch, statusFilter, sortBy, sortOrder },
        ],
        queryFn: async () => {
            const params = new URLSearchParams({
                stats: "true",
                sortBy,
                sortOrder,
            });

            if (debouncedSearch) params.append("search", debouncedSearch);
            if (statusFilter !== "all") params.append("status", statusFilter);

            const res = await fetch(`/api/v1/tags?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch tags");
            return res.json();
        },
        staleTime: 30000, // Consider data fresh for 30 seconds
        gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
        refetchOnWindowFocus: false,
    });

    const tags = tagsResponse?.tags || [];
    const stats = tagsResponse?.stats || {
        total: 0,
        active: 0,
        orphaned: 0,
        topTags: [],
    };

    // Compute selected tags from IDs - memoized
    const selectedTags = useMemo(() => {
        const selectedIds = Object.keys(rowSelection);
        if (selectedIds.length === 0) return [];
        return tags.filter((tag) => selectedIds.includes(tag.id));
    }, [rowSelection, tags]);

    const selectedCount = selectedTags.length;

    // Reprocess tags mutation
    const reprocessMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/v1/tags/process", { method: "POST" });
            if (!res.ok) throw new Error("Failed to reprocess tags");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Tags reprocessed successfully!");
            queryClient.invalidateQueries({ queryKey: ["tags"] });
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to reprocess tags");
        },
    });

    // Create tag mutation
    const createTagMutation = useMutation({
        mutationFn: async (payload: CreateTagPayload) => {
            const res = await fetch("/api/v1/tags", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create tag");
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success("Tag created successfully!");
            queryClient.invalidateQueries({ queryKey: ["tags"] });
        },
        onError: (error: Error) => {
            throw error;
        },
    });

    // Update tag mutation
    const updateTagMutation = useMutation({
        mutationFn: async ({
            tagName,
            payload,
        }: {
            tagName: string;
            payload: UpdateTagPayload;
        }) => {
            const res = await fetch(
                `/api/v1/tags/${encodeURIComponent(tagName)}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                },
            );
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update tag");
            }
            return res.json();
        },
        onSuccess: (data) => {
            toast.success(data.message || "Tag updated successfully!");
            queryClient.invalidateQueries({ queryKey: ["tags"] });
        },
        onError: (error: Error) => {
            throw error;
        },
    });

    // Delete tag mutation
    const deleteTagMutation = useMutation({
        mutationFn: async (tagName: string) => {
            const res = await fetch(
                `/api/v1/tags/${encodeURIComponent(tagName)}?removeFromPosts=true`,
                { method: "DELETE" },
            );
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete tag");
            }
            return res.json();
        },
        onSuccess: (data) => {
            toast.success(data.message || "Tag deleted successfully!");
            queryClient.invalidateQueries({ queryKey: ["tags"] });
            setRowSelection({});
        },
        onError: (error: Error) => {
            throw error;
        },
    });

    // Merge tags mutation
    const mergeTagsMutation = useMutation({
        mutationFn: async (payload: MergeTagsPayload) => {
            const res = await fetch("/api/v1/tags/merge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to merge tags");
            }
            return res.json();
        },
        onSuccess: (data) => {
            toast.success(data.message || "Tags merged successfully!");
            queryClient.invalidateQueries({ queryKey: ["tags"] });
            setRowSelection({});
        },
        onError: (error: Error) => {
            throw error;
        },
    });

    // Merge preview function - memoized
    const fetchMergePreview = useCallback(
        async (
            sourceTags: string[],
            targetTag: string,
        ): Promise<MergeTagsPreview> => {
            const params = new URLSearchParams({
                sourceTags: sourceTags.join(","),
                targetTag,
            });
            const res = await fetch(`/api/v1/tags/merge?${params.toString()}`);
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to load preview");
            }
            return res.json();
        },
        [],
    );

    // Handlers - all memoized
    const handleCreateTag = useCallback(
        async (payload: CreateTagPayload) => {
            await createTagMutation.mutateAsync(payload);
        },
        [createTagMutation],
    );

    const handleUpdateTag = useCallback(
        async (tagName: string, payload: UpdateTagPayload) => {
            await updateTagMutation.mutateAsync({ tagName, payload });
        },
        [updateTagMutation],
    );

    const handleDeleteTag = useCallback(
        async (tagName: string) => {
            await deleteTagMutation.mutateAsync(tagName);
        },
        [deleteTagMutation],
    );

    const handleMergeTags = useCallback(
        async (payload: MergeTagsPayload) => {
            await mergeTagsMutation.mutateAsync(payload);
        },
        [mergeTagsMutation],
    );

    const handleEditClick = useCallback((tag: Tag) => {
        setEditingTag(tag);
        setEditDialogOpen(true);
    }, []);

    const handleDeleteClick = useCallback(
        (tag: Tag) => {
            if (
                window.confirm(
                    `Are you sure you want to delete the tag "${tag.name}"?${
                        tag.count > 0
                            ? ` This will remove it from ${tag.count} post(s).`
                            : ""
                    }`,
                )
            ) {
                deleteTagMutation.mutate(tag.name);
            }
        },
        [deleteTagMutation],
    );

    const handleViewClick = useCallback(
        (tag: Tag) => {
            startTransition(() => {
                router.push(
                    `/dashboard/main/tags/${encodeURIComponent(tag.name)}`,
                );
            });
        },
        [router],
    );

    const handleOrphanedClick = useCallback(() => {
        setStatusFilter("orphaned");
    }, []);

    const handleMergeClick = useCallback(() => {
        if (selectedCount >= 2) {
            setMergeDialogOpen(true);
        }
    }, [selectedCount]);

    // Use ref to avoid stale closure in MRT callback
    const rowSelectionRef = useRef(rowSelection);
    rowSelectionRef.current = rowSelection;

    const handleRowSelectionChange = useCallback(
        (updaterOrValue: MRT_Updater<MRT_RowSelectionState>) => {
            if (typeof updaterOrValue === "function") {
                setRowSelection(updaterOrValue(rowSelectionRef.current));
            } else {
                setRowSelection(updaterOrValue);
            }
        },
        [],
    );

    const handleCardSelectionChange = useCallback((ids: string[]) => {
        const newSelection: MRT_RowSelectionState = {};
        ids.forEach((id) => {
            newSelection[id] = true;
        });
        setRowSelection(newSelection);
    }, []);

    const handleCloseEditDialog = useCallback(() => {
        setEditDialogOpen(false);
        setEditingTag(null);
    }, []);

    const handleCloseMergeDialog = useCallback(() => {
        setMergeDialogOpen(false);
    }, []);

    const handleCloseCreateDialog = useCallback(() => {
        setCreateDialogOpen(false);
    }, []);

    const handleOpenCreateDialog = useCallback(() => {
        setCreateDialogOpen(true);
    }, []);

    const handleReprocess = useCallback(() => {
        reprocessMutation.mutate();
    }, [reprocessMutation]);

    // Card selection IDs derived from rowSelection
    const cardSelectionIds = useMemo(
        () => Object.keys(rowSelection),
        [rowSelection],
    );

    // Show loading indicator during navigation or fetching
    const showLoading = isLoading || isPending;
    const showFetching = isFetching && !isLoading;

    return (
        <Box
            sx={{
                bgcolor: "background.paper",
                minHeight: "100%",
                p: 3,
            }}
        >
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Tag Management
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Create, edit, merge, and manage tags for your posts
                </Typography>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {(error as Error).message || "Failed to load tags"}
                </Alert>
            )}

            {/* Stats Bar */}
            <TagStatsBar
                total={stats.total}
                active={stats.active}
                orphaned={stats.orphaned}
                topTags={stats.topTags}
                isLoading={showLoading}
                onOrphanedClick={handleOrphanedClick}
            />

            {/* Filter Bar */}
            <TagFilterBar
                search={search}
                statusFilter={statusFilter}
                sortBy={sortBy}
                sortOrder={sortOrder}
                viewMode={viewMode}
                selectedCount={selectedCount}
                onSearchChange={setSearch}
                onStatusFilterChange={setStatusFilter}
                onSortByChange={setSortBy}
                onSortOrderChange={setSortOrder}
                onViewModeChange={setViewMode}
                onCreateClick={handleOpenCreateDialog}
                onMergeClick={handleMergeClick}
                onReprocessClick={handleReprocess}
                isReprocessing={reprocessMutation.isPending}
            />

            {/* Content */}
            <Paper
                elevation={0}
                sx={{
                    p: viewMode === "card" ? 2 : 0,
                    border: viewMode === "card" ? "1px solid" : "none",
                    borderColor: "divider",
                    borderRadius: 2,
                    position: "relative",
                }}
            >
                {/* Fetching overlay indicator */}
                {showFetching && (
                    <Box
                        sx={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            zIndex: 10,
                        }}
                    >
                        <CircularProgress size={20} />
                    </Box>
                )}

                {showLoading ? (
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            py: 8,
                        }}
                    >
                        <CircularProgress />
                    </Box>
                ) : viewMode === "table" ? (
                    <TagsTable
                        tags={tags}
                        isLoading={false}
                        rowSelection={rowSelection}
                        onRowSelectionChange={handleRowSelectionChange}
                        onEditClick={handleEditClick}
                        onDeleteClick={handleDeleteClick}
                        onViewClick={handleViewClick}
                    />
                ) : (
                    <TagsCardGrid
                        tags={tags}
                        isLoading={false}
                        selectedIds={cardSelectionIds}
                        onSelectionChange={handleCardSelectionChange}
                        onEditClick={handleEditClick}
                        onDeleteClick={handleDeleteClick}
                        onViewClick={handleViewClick}
                    />
                )}
            </Paper>

            {/* Dialogs - only render when needed */}
            {createDialogOpen && (
                <CreateTagDialog
                    open={createDialogOpen}
                    onClose={handleCloseCreateDialog}
                    onSubmit={handleCreateTag}
                />
            )}

            {editDialogOpen && editingTag && (
                <EditTagDialog
                    open={editDialogOpen}
                    tag={editingTag}
                    onClose={handleCloseEditDialog}
                    onSubmit={handleUpdateTag}
                    onDelete={handleDeleteTag}
                />
            )}

            {mergeDialogOpen && selectedTags.length >= 2 && (
                <MergeTagsDialog
                    open={mergeDialogOpen}
                    selectedTags={selectedTags}
                    onClose={handleCloseMergeDialog}
                    onSubmit={handleMergeTags}
                    onPreview={fetchMergePreview}
                />
            )}
        </Box>
    );
}
