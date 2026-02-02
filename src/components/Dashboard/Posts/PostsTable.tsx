"use client";

import React, { useMemo } from "react";
import {
    MaterialReactTable,
    type MRT_ColumnDef,
    useMaterialReactTable,
} from "material-react-table";
import { IconButton, Tooltip, Chip, Box, Typography } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import PublishIcon from "@mui/icons-material/Publish";
import UnpublishedIcon from "@mui/icons-material/Unpublished";
import RestoreFromTrashIcon from "@mui/icons-material/RestoreFromTrash";
import Link from "next/link";
import axios from "@/utils/axios";
import { toast } from "react-toastify";

interface PostData {
    id: string;
    title: string;
    author?: string;
    description?: string;
    tags: string[];
    isPublished: boolean;
    deleted?: boolean;
    datePosted: string;
    updatedAt?: string;
    bannerUrl?: string | null;
    link: string | null;
}

interface PostsTableProps {
    posts: PostData[];
    onDelete: (id: string) => Promise<void>;
    onRefresh: () => Promise<void>;
}

const PostsTable: React.FC<PostsTableProps> = ({
    posts,
    onDelete,
    onRefresh,
}) => {
    const handlePublishToggle = async (post: PostData) => {
        try {
            await axios.patch(`/api/v1/posts/${post.id}`, {
                id: post.id,
                isPublished: !post.isPublished,
                op: "publish",
            });
            const msg = post.isPublished
                ? "Post unpublished"
                : "Post published";
            toast.success(msg, {
                position: "top-left",
            });
            await onRefresh();
        } catch (error) {
            console.error("Error when (un)publishing post:", error);
            toast.error("Error when (un)publishing post");
        }
    };

    const handleSoftDelete = async (id: string) => {
        try {
            await axios.delete(`/api/v1/posts/${id}`);
            toast.success("Post moved to trash!", {
                position: "top-left",
            });
            await onRefresh();
        } catch (error) {
            console.error("Error when deleting post:", error);
            toast.error("Error when deleting post");
        }
    };

    const handleRestore = async (id: string) => {
        try {
            await axios.patch(`/api/v1/posts/${id}`, {
                id: id,
                deleted: false,
            });
            toast.success("Post restored!", {
                position: "top-left",
            });
            await onRefresh();
        } catch (error) {
            console.error("Error when restoring post:", error);
            toast.error("Error when restoring post");
        }
    };

    const columns = useMemo<MRT_ColumnDef<PostData>[]>(
        () => [
            {
                accessorKey: "title",
                header: "Title",
                size: 250,
                Cell: ({ row }) => (
                    <Box>
                        <Link
                            href={`/dashboard/main/posts/edit?id=${row.original.id}`}
                            className="text-blue-700"
                        >
                            <Typography
                                variant="body1"
                                sx={{ fontWeight: "bold" }}
                            >
                                {row.original.title}
                            </Typography>
                        </Link>
                        {row.original.description && (
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                }}
                            >
                                {row.original.description}
                            </Typography>
                        )}
                    </Box>
                ),
            },
            {
                accessorKey: "author",
                header: "Author",
                size: 120,
            },
            {
                accessorKey: "tags",
                header: "Tags",
                size: 200,
                Cell: ({ row }) => (
                    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                        {row.original.tags.length === 0 && (
                            <Typography variant="body2" color="text.secondary">
                                No Tags
                            </Typography>
                        )}
                        {row.original.tags.slice(0, 3).map((tag) => (
                            <Chip key={tag} label={tag} size="small" />
                        ))}
                        {row.original.tags.length > 3 && (
                            <Chip
                                label={`+${row.original.tags.length - 3}`}
                                size="small"
                                variant="outlined"
                            />
                        )}
                    </Box>
                ),
            },
            {
                accessorKey: "isPublished",
                header: "Status",
                size: 120,
                Cell: ({ row }) => {
                    if (row.original.deleted) {
                        return (
                            <Chip label="Deleted" color="error" size="small" />
                        );
                    }
                    return (
                        <Chip
                            label={
                                row.original.isPublished ? "Published" : "Draft"
                            }
                            color={
                                row.original.isPublished ? "success" : "warning"
                            }
                            size="small"
                        />
                    );
                },
                filterVariant: "select",
                filterSelectOptions: [
                    { text: "Published", value: "true" },
                    { text: "Draft", value: "false" },
                ],
            },
            {
                accessorKey: "datePosted",
                header: "Date Created",
                size: 150,
                Cell: ({ row }) =>
                    row.original.datePosted
                        ? new Date(row.original.datePosted).toLocaleDateString(
                              "en-US",
                              {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                              },
                          )
                        : "N/A",
                sortingFn: "datetime",
            },
            {
                accessorKey: "updatedAt",
                header: "Last Updated",
                size: 150,
                Cell: ({ row }) =>
                    row.original.updatedAt
                        ? new Date(row.original.updatedAt).toLocaleDateString(
                              "en-US",
                              {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                              },
                          )
                        : "N/A",
                sortingFn: "datetime",
            },
        ],
        [],
    );

    const table = useMaterialReactTable({
        columns,
        data: posts,
        enableRowActions: true,
        enableColumnFilters: false,
        enableGlobalFilter: false,
        enableSorting: true,
        enablePagination: true,
        enableDensityToggle: true,
        initialState: {
            density: "comfortable",
            pagination: {
                pageSize: 20,
                pageIndex: 0,
            },
            sorting: [
                {
                    id: "updatedAt",
                    desc: true,
                },
            ],
        },
        paginationDisplayMode: "pages",
        positionActionsColumn: "last",
        muiPaginationProps: {
            color: "secondary",
            rowsPerPageOptions: [10, 20, 50, 100],
            shape: "rounded",
            variant: "outlined",
        },
        renderRowActions: ({ row }) => (
            <Box sx={{ display: "flex", gap: 1 }}>
                <Tooltip title="Open Post">
                    <Link
                        href={`/v2/post/${row.original.link}`}
                        rel="noopener noreferrer"
                        target="_blank"
                    >
                        <IconButton size="small" color="primary">
                            <OpenInNewIcon fontSize="small" />
                        </IconButton>
                    </Link>
                </Tooltip>

                <Tooltip title="Edit">
                    <Link
                        href={`/dashboard/main/posts/edit?id=${row.original.id}`}
                    >
                        <IconButton size="small" color="primary">
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Link>
                </Tooltip>

                {!row.original.deleted && (
                    <Tooltip
                        title={
                            row.original.isPublished ? "Unpublish" : "Publish"
                        }
                    >
                        <IconButton
                            size="small"
                            color={
                                row.original.isPublished ? "success" : "warning"
                            }
                            onClick={() => handlePublishToggle(row.original)}
                        >
                            {row.original.isPublished ? (
                                <UnpublishedIcon fontSize="small" />
                            ) : (
                                <PublishIcon fontSize="small" />
                            )}
                        </IconButton>
                    </Tooltip>
                )}

                {row.original.deleted ? (
                    <>
                        <Tooltip title="Restore from Trash">
                            <IconButton
                                size="small"
                                color="info"
                                onClick={() => handleRestore(row.original.id)}
                            >
                                <RestoreFromTrashIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Permanently">
                            <IconButton
                                size="small"
                                color="error"
                                onClick={() => onDelete(row.original.id)}
                            >
                                <DeleteForeverIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </>
                ) : (
                    <Tooltip title="Move to Trash">
                        <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleSoftDelete(row.original.id)}
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>
        ),
        muiTablePaperProps: {
            elevation: 2,
            sx: {
                borderRadius: "8px",
            },
        },
        muiTableHeadCellProps: {
            sx: {
                fontWeight: "bold",
                fontSize: "0.875rem",
            },
        },
        muiTableBodyCellProps: {
            sx: {
                fontSize: "0.875rem",
            },
        },
    });

    return <MaterialReactTable table={table} />;
};

export default PostsTable;
