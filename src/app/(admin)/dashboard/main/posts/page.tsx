"use client";

/**
 * Posts Management Page - Consolidated View
 *
 * This page consolidates all post management functionality previously split across
 * /posts, /posts/draft, and /posts/trash into a single unified interface.
 *
 * Features:
 * - Toggle between Card and Table views
 * - Filter by status: All, Published, Draft, Trash
 * - Search by title, description, or author
 * - Filter by tags (multi-select)
 * - Real-time stats dashboard
 * - Pagination for card view
 * - Advanced table with sorting and built-in pagination
 *
 * The old draft and trash pages now redirect here automatically.
 */

import Link from "next/link";
import axios from "@/utils/axios";
import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/AddBox";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Modal from "@mui/material/Modal";
import CircularProgress from "@mui/material/CircularProgress";
import { useQueryClient } from "@tanstack/react-query";
import { usePostsQuery } from "../../queries";
import PostsTable from "@/components/Dashboard/Posts/PostsTable";
import PostItem from "@/components/Dashboard/Posts/PostItem";
import PostListStats from "@/components/Dashboard/Posts/PostListStats";
import PostListFilterGroup from "@/components/Dashboard/Posts/PostListFilterGroup";

const PAGE_SIZE = 12;

const modalStyle = {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    bgcolor: "background.paper",
    border: "2px solid #000",
    boxShadow: 24,
    p: 4,
};

type ViewMode = "card" | "table";
type StatusFilter = "all" | "published" | "draft" | "trash";

export default function Page() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState<number>(1);
    const [viewMode, setViewMode] = useState<ViewMode>("table");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [selectedPostId, setSelectedPostId] = useState<string>("");
    const [modalOpen, setModalOpen] = useState<boolean>(false);

    const { data, isFetching } = usePostsQuery();

    // Extract all unique tags from posts
    const allTags = useMemo(() => {
        if (!data) return [];
        const tagsSet = new Set<string>();
        data.forEach((post: any) => {
            post.tags?.forEach((tag: string) => tagsSet.add(tag));
        });
        return Array.from(tagsSet).sort();
    }, [data]);

    // Filter posts based on all criteria
    const filteredPosts = useMemo(() => {
        if (!data) return [];

        let filtered = [...data];

        // Status filter
        switch (statusFilter) {
            case "published":
                filtered = filtered.filter(
                    (post: any) => post.isPublished === true && !post.deleted,
                );
                break;
            case "draft":
                filtered = filtered.filter(
                    (post: any) => post.isPublished === false && !post.deleted,
                );
                break;
            case "trash":
                filtered = filtered.filter(
                    (post: any) => post.deleted === true,
                );
                break;
            case "all":
            default:
                filtered = filtered.filter((post: any) => !post.deleted);
                break;
        }

        // Search filter
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (post: any) =>
                    post.title?.toLowerCase().includes(term) ||
                    post.description?.toLowerCase().includes(term) ||
                    post.author?.toLowerCase().includes(term),
            );
        }

        // Tags filter
        if (selectedTags.length > 0) {
            filtered = filtered.filter((post: any) =>
                selectedTags.some((tag) => post.tags?.includes(tag)),
            );
        }

        return filtered;
    }, [data, statusFilter, searchTerm, selectedTags]);

    // Paginated posts for card view
    const paginatedPosts = useMemo(() => {
        const startIndex = (page - 1) * PAGE_SIZE;
        return filteredPosts.slice(startIndex, startIndex + PAGE_SIZE);
    }, [filteredPosts, page]);

    const totalPages = Math.ceil(filteredPosts.length / PAGE_SIZE);

    // Stats
    const stats = useMemo(() => {
        if (!data) return { total: 0, published: 0, draft: 0, trash: 0 };
        return {
            total: data.filter((p: any) => !p.deleted).length,
            published: data.filter(
                (p: any) => p.isPublished === true && !p.deleted,
            ).length,
            draft: data.filter(
                (p: any) => p.isPublished === false && !p.deleted,
            ).length,
            trash: data.filter((p: any) => p.deleted === true).length,
        };
    }, [data]);

    // Modal handlers
    const handleClose = () => {
        setModalOpen(false);
        setSelectedPostId("");
    };

    const deleteModal = async (id: string) => {
        setSelectedPostId(id);
        setModalOpen(true);
    };

    const hardDeleteHandler = async () => {
        const id = selectedPostId;
        try {
            await axios.delete(`/api/v1/posts/${id}?hard=true`);
            toast.success("Post permanently deleted!", {
                position: "top-left",
            });
            await fetchPosts();
        } catch (error) {
            console.error("Error when deleting post:", error);
            toast.error("Error when deleting post");
        } finally {
            handleClose();
        }
    };

    const fetchPosts = async () => {
        await queryClient.invalidateQueries({ queryKey: ["posts"] });
    };

    const handleViewModeChange = (newMode: ViewMode) => {
        setViewMode(newMode);
    };

    const handleStatusFilterChange = (newStatus: StatusFilter) => {
        setStatusFilter(newStatus);
        setPage(1);
    };

    const handleSearchChange = (term: string) => {
        setSearchTerm(term);
        setPage(1);
    };

    const handleTagsChange = (tags: string[]) => {
        setSelectedTags(tags);
        setPage(1);
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    if (isFetching)
        return (
            <Grid
                container
                spacing={0}
                direction="column"
                alignItems="center"
                justifyContent="center"
                sx={{
                    minHeight: "100vh",
                    backgroundColor: "white",
                }}
            >
                <CircularProgress color="primary" />
            </Grid>
        );

    return (
        <>
            {/* Delete Confirmation Modal */}
            <Modal open={modalOpen} onClose={handleClose}>
                <Box sx={modalStyle}>
                    <Typography variant="h6" gutterBottom>
                        Delete Post Permanently
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        ID: {selectedPostId}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 2, mb: 3 }}>
                        Title:{" "}
                        {selectedPostId &&
                            data?.find((x: any) => x.id === selectedPostId)
                                ?.title}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 3 }}>
                        <strong>Warning:</strong> This action cannot be undone.
                    </Typography>
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 2,
                        }}
                    >
                        <Button
                            variant="outlined"
                            color="inherit"
                            onClick={handleClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={hardDeleteHandler}
                        >
                            Delete Permanently
                        </Button>
                    </Box>
                </Box>
            </Modal>

            {/* Main Content */}
            <Box
                sx={{ display: "flex", flexDirection: "column", gap: 3, pb: 6 }}
            >
                {/* Header Section */}
                <Box sx={{ px: 2, pt: 2 }}>
                    <Link href="/dashboard/main/posts/edit">
                        <Paper elevation={3} sx={{ p: 0, overflow: "hidden" }}>
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2,
                                    p: 2,
                                    backgroundColor: "white",
                                }}
                            >
                                <IconButton
                                    sx={{
                                        backgroundColor: "primary.main",
                                        color: "white",
                                        "&:hover": {
                                            backgroundColor: "primary.dark",
                                        },
                                    }}
                                >
                                    <AddIcon />
                                </IconButton>
                                <Typography variant="h5" color="primary.main">
                                    Create New Post
                                </Typography>
                            </Box>
                        </Paper>
                    </Link>
                </Box>

                {/* Stats and Filters Combined in One Card */}
                <Box sx={{ px: 2 }}>
                    <Paper elevation={2} sx={{ p: 3 }}>
                        {/* Stats Section */}
                        <Box sx={{ mb: 4 }}>
                            <PostListStats stats={stats} />
                        </Box>

                        {/* Divider */}
                        <Box
                            sx={{
                                height: 1,
                                backgroundColor: "divider",
                                mb: 4,
                            }}
                        />

                        {/* Filters Section */}
                        <PostListFilterGroup
                            viewMode={viewMode}
                            statusFilter={statusFilter}
                            searchTerm={searchTerm}
                            selectedTags={selectedTags}
                            allTags={allTags}
                            stats={stats}
                            onViewModeChange={handleViewModeChange}
                            onStatusFilterChange={handleStatusFilterChange}
                            onSearchChange={handleSearchChange}
                            onTagsChange={handleTagsChange}
                        />

                        {/* Results count */}
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 3 }}
                        >
                            Showing {filteredPosts.length} post
                            {filteredPosts.length !== 1 ? "s" : ""}
                            {(searchTerm || selectedTags.length > 0) &&
                                " (filtered)"}
                        </Typography>
                    </Paper>
                </Box>

                {/* Content Section - Card View */}
                {viewMode === "card" ? (
                    <>
                        {filteredPosts.length === 0 ? (
                            <Box
                                sx={{
                                    px: 2,
                                    textAlign: "center",
                                    py: 8,
                                }}
                            >
                                <Typography variant="h6" color="text.secondary">
                                    No posts found
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Try adjusting your filters
                                </Typography>
                            </Box>
                        ) : (
                            <>
                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: {
                                            xs: "1fr",
                                            sm: "repeat(2, 1fr)",
                                            md: "repeat(3, 1fr)",
                                            lg: "repeat(4, 1fr)",
                                        },
                                        gap: 2,
                                        px: 2,
                                    }}
                                >
                                    {paginatedPosts.map((post: any) => (
                                        <PostItem
                                            key={post.id}
                                            post={post}
                                            reloadPosts={fetchPosts}
                                            interaction="modal"
                                            onDeleteModal={deleteModal}
                                        />
                                    ))}
                                </Box>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <Box
                                        sx={{
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            gap: 2,
                                            px: 2,
                                            mt: 4,
                                        }}
                                    >
                                        <Button
                                            variant="outlined"
                                            disabled={page === 1}
                                            onClick={() =>
                                                handlePageChange(page - 1)
                                            }
                                        >
                                            Previous
                                        </Button>
                                        <Typography variant="body2">
                                            Page {page} of {totalPages}
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            disabled={page === totalPages}
                                            onClick={() =>
                                                handlePageChange(page + 1)
                                            }
                                        >
                                            Next
                                        </Button>
                                    </Box>
                                )}
                            </>
                        )}
                    </>
                ) : (
                    /* Table View */
                    <Box sx={{ px: 2 }}>
                        {filteredPosts.length === 0 ? (
                            <Paper
                                elevation={2}
                                sx={{
                                    p: 4,
                                    textAlign: "center",
                                }}
                            >
                                <Typography variant="h6" color="text.secondary">
                                    No posts found
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Try adjusting your filters
                                </Typography>
                            </Paper>
                        ) : (
                            <PostsTable
                                posts={filteredPosts}
                                onDelete={deleteModal}
                                onRefresh={fetchPosts}
                            />
                        )}
                    </Box>
                )}
            </Box>
        </>
    );
}
