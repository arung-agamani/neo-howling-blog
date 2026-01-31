"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import {
    Box,
    Typography,
    Paper,
    Divider,
    Button,
    Chip,
    IconButton,
    Tooltip,
    CircularProgress,
    Alert,
    Breadcrumbs,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import ArticleIcon from "@mui/icons-material/Article";
import PublishIcon from "@mui/icons-material/Publish";
import DraftsIcon from "@mui/icons-material/Drafts";
import LinkIcon from "@mui/icons-material/Link";

import { EditTagDialog } from "@/components/Dashboard/Tags";
import { Tag, UpdateTagPayload } from "@/types";

interface PostDetail {
    id: string;
    title: string;
    description?: string;
    datePosted: string;
    updatedAt?: string;
    isPublished: boolean;
    deleted: boolean;
    tags: string[];
}

interface TagDetailResponse {
    id: string;
    name: string;
    count: number;
    description?: string | null;
    color?: string | null;
    aliases?: string[];
    posts: PostDetail[];
    relatedTags?: {
        name: string;
        coOccurrences: number;
    }[];
    stats?: {
        totalPosts: number;
        publishedPosts: number;
        draftPosts: number;
        deletedPosts: number;
    };
}

export default function TagDetailPage() {
    const router = useRouter();
    const params = useParams();
    const queryClient = useQueryClient();
    const tagName = decodeURIComponent(params.name as string);

    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Fetch tag details with caching
    const {
        data: tagData,
        isLoading,
        error,
    } = useQuery<TagDetailResponse>({
        queryKey: ["tag", tagName],
        queryFn: async () => {
            const res = await fetch(
                `/api/v1/tags/${encodeURIComponent(tagName)}`,
            );
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to fetch tag");
            }
            return res.json();
        },
        placeholderData: { posts: [], id: "", name: "", count: 0 },
        staleTime: 30000, // Consider fresh for 30 seconds
        gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
        refetchOnWindowFocus: false,
    });

    const paginatedPosts: PostDetail[] = useMemo(() => {
        if (!tagData) return [];
        return tagData.posts.slice(
            page * rowsPerPage,
            page * rowsPerPage + rowsPerPage,
        );
    }, [tagData, page, rowsPerPage]);

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
            queryClient.invalidateQueries({ queryKey: ["tag"] });
            queryClient.invalidateQueries({ queryKey: ["tags"] });
            // If tag was renamed, redirect to new URL
            if (data.tag && data.tag.name !== tagName) {
                router.replace(
                    `/dashboard/main/tags/${encodeURIComponent(data.tag.name)}`,
                );
            }
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
        onSuccess: () => {
            toast.success("Tag deleted successfully!");
            queryClient.invalidateQueries({ queryKey: ["tags"] });
            router.push("/dashboard/main/tags");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to delete tag");
        },
    });

    const handleUpdateTag = useCallback(
        async (name: string, payload: UpdateTagPayload) => {
            await updateTagMutation.mutateAsync({ tagName: name, payload });
        },
        [updateTagMutation],
    );

    const handleDeleteTag = useCallback(
        async (name: string) => {
            await deleteTagMutation.mutateAsync(name);
        },
        [deleteTagMutation],
    );

    const handleDeleteClick = useCallback(() => {
        if (!tagData) return;
        if (
            window.confirm(
                `Are you sure you want to delete the tag "${tagData.name}"?${
                    tagData.count > 0
                        ? ` This will remove it from ${tagData.count} post(s).`
                        : ""
                }`,
            )
        ) {
            deleteTagMutation.mutate(tagData.name);
        }
    }, [tagData, deleteTagMutation]);

    const handleChangePage = useCallback((_event: unknown, newPage: number) => {
        setPage(newPage);
    }, []);

    const handleChangeRowsPerPage = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
        },
        [],
    );

    const handleCloseEditDialog = useCallback(() => {
        setEditDialogOpen(false);
    }, []);

    const handleOpenEditDialog = useCallback(() => {
        setEditDialogOpen(true);
    }, []);

    const handleNavigateToRelatedTag = useCallback(
        (relatedTagName: string) => {
            router.push(
                `/dashboard/main/tags/${encodeURIComponent(relatedTagName)}`,
            );
        },
        [router],
    );

    if (isLoading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "50vh",
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (error || !tagData) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">
                    {(error as Error)?.message || "Tag not found"}
                </Alert>
                <Button
                    component={Link}
                    href="/dashboard/main/tags"
                    startIcon={<ArrowBackIcon />}
                    sx={{ mt: 2 }}
                >
                    Back to Tags
                </Button>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                bgcolor: "background.paper",
                minHeight: "100%",
                p: 3,
            }}
        >
            {/* Breadcrumbs */}
            <Breadcrumbs sx={{ mb: 2 }}>
                <Link
                    href="/dashboard/main/tags"
                    style={{ textDecoration: "none" }}
                >
                    <Typography
                        color="text.secondary"
                        sx={{ "&:hover": { color: "primary.main" } }}
                    >
                        Tags
                    </Typography>
                </Link>
                <Typography color="text.primary" fontWeight="medium">
                    {tagData.name}
                </Typography>
            </Breadcrumbs>

            {/* Header */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 3,
                    flexWrap: "wrap",
                    gap: 2,
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <IconButton
                        component={Link}
                        href="/dashboard/main/tags"
                        sx={{ bgcolor: "grey.100" }}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <Box>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                            }}
                        >
                            {tagData.color ? (
                                <Box
                                    sx={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: "50%",
                                        bgcolor: tagData.color,
                                    }}
                                />
                            ) : (
                                <LocalOfferIcon
                                    sx={{
                                        fontSize: 28,
                                        color: "text.secondary",
                                    }}
                                />
                            )}
                            <Typography variant="h4" fontWeight="bold">
                                {tagData.name}
                            </Typography>
                        </Box>
                        {tagData.description && (
                            <Typography
                                variant="body1"
                                color="text.secondary"
                                sx={{ mt: 0.5 }}
                            >
                                {tagData.description}
                            </Typography>
                        )}
                    </Box>
                </Box>

                <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={handleOpenEditDialog}
                    >
                        Edit
                    </Button>
                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={handleDeleteClick}
                        disabled={deleteTagMutation.isPending}
                    >
                        Delete
                    </Button>
                </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Stats and Info Grid */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                    gap: 3,
                    mb: 3,
                }}
            >
                {/* Stats Card */}
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Statistics
                    </Typography>
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, 1fr)",
                            gap: 2,
                            mt: 2,
                        }}
                    >
                        <Box
                            sx={{
                                p: 2,
                                bgcolor: "primary.50",
                                borderRadius: 1,
                                textAlign: "center",
                            }}
                        >
                            <ArticleIcon
                                color="primary"
                                sx={{ fontSize: 32 }}
                            />
                            <Typography
                                variant="h4"
                                fontWeight="bold"
                                color="primary"
                            >
                                {tagData.stats?.totalPosts || tagData.count}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Total Posts
                            </Typography>
                        </Box>
                        <Box
                            sx={{
                                p: 2,
                                bgcolor: "success.50",
                                borderRadius: 1,
                                textAlign: "center",
                            }}
                        >
                            <PublishIcon
                                color="success"
                                sx={{ fontSize: 32 }}
                            />
                            <Typography
                                variant="h4"
                                fontWeight="bold"
                                color="success.main"
                            >
                                {tagData.stats?.publishedPosts || 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Published
                            </Typography>
                        </Box>
                        <Box
                            sx={{
                                p: 2,
                                bgcolor: "warning.50",
                                borderRadius: 1,
                                textAlign: "center",
                            }}
                        >
                            <DraftsIcon color="warning" sx={{ fontSize: 32 }} />
                            <Typography
                                variant="h4"
                                fontWeight="bold"
                                color="warning.main"
                            >
                                {tagData.stats?.draftPosts || 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Drafts
                            </Typography>
                        </Box>
                        <Box
                            sx={{
                                p: 2,
                                bgcolor: "grey.100",
                                borderRadius: 1,
                                textAlign: "center",
                            }}
                        >
                            <LinkIcon color="action" sx={{ fontSize: 32 }} />
                            <Typography variant="h4" fontWeight="bold">
                                {tagData.aliases?.length || 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Aliases
                            </Typography>
                        </Box>
                    </Box>
                </Paper>

                {/* Info Card */}
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Information
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                        <Box sx={{ mb: 2 }}>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                gutterBottom
                            >
                                ID
                            </Typography>
                            <Typography
                                variant="body1"
                                fontFamily="monospace"
                                sx={{
                                    bgcolor: "grey.100",
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: 1,
                                    display: "inline-block",
                                }}
                            >
                                {tagData.id}
                            </Typography>
                        </Box>

                        {tagData.aliases && tagData.aliases.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    gutterBottom
                                >
                                    Aliases
                                </Typography>
                                <Box
                                    sx={{
                                        display: "flex",
                                        gap: 0.5,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    {tagData.aliases.map((alias) => (
                                        <Chip
                                            key={alias}
                                            label={alias}
                                            size="small"
                                            variant="outlined"
                                        />
                                    ))}
                                </Box>
                            </Box>
                        )}

                        {tagData.relatedTags &&
                            tagData.relatedTags.length > 0 && (
                                <Box>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        gutterBottom
                                    >
                                        Related Tags (often used together)
                                    </Typography>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            gap: 0.5,
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        {tagData.relatedTags.map((related) => (
                                            <Chip
                                                key={related.name}
                                                label={`${related.name} (${related.coOccurrences})`}
                                                size="small"
                                                onClick={() =>
                                                    handleNavigateToRelatedTag(
                                                        related.name,
                                                    )
                                                }
                                                sx={{ cursor: "pointer" }}
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            )}
                    </Box>
                </Paper>
            </Box>

            {/* Posts Table */}
            <Paper variant="outlined" sx={{ borderRadius: 2 }}>
                <Box
                    sx={{
                        p: 2,
                        borderBottom: "1px solid",
                        borderColor: "divider",
                    }}
                >
                    <Typography variant="h6" fontWeight="bold">
                        Posts with this tag ({tagData.posts.length})
                    </Typography>
                </Box>

                {tagData.posts.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: "center" }}>
                        <ArticleIcon
                            sx={{ fontSize: 48, color: "grey.400", mb: 1 }}
                        />
                        <Typography color="text.secondary">
                            No posts are using this tag
                        </Typography>
                    </Box>
                ) : (
                    <>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Title</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Date Posted</TableCell>
                                        <TableCell>Other Tags</TableCell>
                                        <TableCell align="right">
                                            Actions
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paginatedPosts.map((post: PostDetail) => (
                                        <TableRow
                                            key={post.id}
                                            hover
                                            sx={{
                                                "&:last-child td": {
                                                    borderBottom: 0,
                                                },
                                            }}
                                        >
                                            <TableCell>
                                                <Typography
                                                    variant="body2"
                                                    fontWeight="medium"
                                                    sx={{
                                                        maxWidth: 300,
                                                        overflow: "hidden",
                                                        textOverflow:
                                                            "ellipsis",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {post.title}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={
                                                        post.isPublished
                                                            ? "Published"
                                                            : "Draft"
                                                    }
                                                    size="small"
                                                    color={
                                                        post.isPublished
                                                            ? "success"
                                                            : "warning"
                                                    }
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                >
                                                    {new Date(
                                                        post.datePosted,
                                                    ).toLocaleDateString()}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        gap: 0.5,
                                                        flexWrap: "wrap",
                                                    }}
                                                >
                                                    {post.tags
                                                        .filter(
                                                            (t: string) =>
                                                                t.toLowerCase() !==
                                                                tagData.name.toLowerCase(),
                                                        )
                                                        .slice(0, 3)
                                                        .map((tag: string) => (
                                                            <Chip
                                                                key={tag}
                                                                label={tag}
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{
                                                                    fontSize:
                                                                        "0.7rem",
                                                                    height: 20,
                                                                }}
                                                            />
                                                        ))}
                                                    {post.tags.filter(
                                                        (t: string) =>
                                                            t.toLowerCase() !==
                                                            tagData.name.toLowerCase(),
                                                    ).length > 3 && (
                                                        <Chip
                                                            label={`+${
                                                                post.tags.filter(
                                                                    (
                                                                        t: string,
                                                                    ) =>
                                                                        t.toLowerCase() !==
                                                                        tagData.name.toLowerCase(),
                                                                ).length - 3
                                                            }`}
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{
                                                                fontSize:
                                                                    "0.7rem",
                                                                height: 20,
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Tooltip title="Edit Post">
                                                    <IconButton
                                                        size="small"
                                                        component={Link}
                                                        href={`/dashboard/main/posts/edit?id=${post.id}`}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25, 50]}
                            component="div"
                            count={tagData.posts.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                        />
                    </>
                )}
            </Paper>

            {/* Edit Dialog - only render when open */}
            {editDialogOpen && (
                <EditTagDialog
                    open={editDialogOpen}
                    tag={tagData as unknown as Tag}
                    onClose={handleCloseEditDialog}
                    onSubmit={handleUpdateTag}
                    onDelete={handleDeleteTag}
                />
            )}
        </Box>
    );
}
