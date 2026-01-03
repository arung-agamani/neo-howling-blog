"use client";

import axios from "@/utils/axios";
import Link from "next/link";
import React, { useRef, useState } from "react";
import { toast } from "react-toastify";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import OpenInNew from "@mui/icons-material/OpenInNew";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PublishIcon from "@mui/icons-material/Publish";
import Tooltip from "@mui/material/Tooltip";
interface PostData {
    title: string;
    link: string | null;
    tags: string[];
    description: string;
    bannerUrl: string | null;
    isBannerDark: boolean | null;
    isPublished: boolean | null;
    datePosted: Date;
    id: string;
    updatedAt?: Date;
    deleted?: boolean;
    deletedAt?: Date;
}

interface Props {
    post: PostData;
    reloadPosts?: () => Promise<void>;
    interaction?: "direct" | "modal";
    onDeleteModal?: (id: string) => Promise<void>;
}

const PostItem: React.FC<Props> = ({
    post,
    reloadPosts,
    interaction = "direct",
    onDeleteModal,
}) => {
    const deleteHandler = async (id: string) => {
        try {
            await axios.delete(`/api/v1/posts/${id}`);
            toast.success("Post moved to trash!", {
                position: "top-left",
            });
            if (reloadPosts) {
                await reloadPosts();
            }
        } catch (error) {
            console.error("Error when deleting post:", error);
            toast.error("Error when deleting post");
        }
    };

    const hardDeleteHandler = async (id: string) => {
        if (interaction === "modal" && onDeleteModal) {
            return onDeleteModal(id);
        }
        try {
            await axios.delete(`/api/v1/posts/${id}?hard=true`);
            toast.success("Post permanently deleted!", {
                position: "top-left",
            });
            if (reloadPosts) {
                await reloadPosts();
            }
        } catch (error) {
            console.error("Error when permanently deleting post:", error);
            toast.error("Error when permanently deleting post");
        }
    };

    const publishHandler = async () => {
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
            if (reloadPosts) {
                await reloadPosts();
            }
        } catch (error) {
            console.error("Error when (un)publishing post:", error);
            toast.error("Error when (un)publishing post");
        }
    };

    return (
        <Card
            className="flex flex-col bg-gray-100"
            sx={{
                "& .MuiSvgIcon-root": {
                    color: "#947EB0",
                },
                backgroundColor: "rgb(243 244 246)",
                height: "100%",
            }}
        >
            <CardContent className="flex-grow">
                <Typography
                    color="text.secondary"
                    gutterBottom
                    variant="caption"
                >
                    {post.updatedAt
                        ? new Date(post.updatedAt).toLocaleString()
                        : "No update record"}
                </Typography>
                <Typography
                    variant="h6"
                    component="div"
                    color="text.primary"
                    gutterBottom
                >
                    {post.title}
                </Typography>
                {post.description && (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            marginTop: "0.5rem",
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                        }}
                    >
                        {post.description}
                    </Typography>
                )}
                {post.tags && post.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                        {post.tags.slice(0, 3).map((tag) => (
                            <Chip
                                key={tag}
                                label={tag}
                                size="small"
                                variant="outlined"
                            />
                        ))}
                        {post.tags.length > 3 && (
                            <Chip
                                label={`+${post.tags.length - 3}`}
                                size="small"
                                variant="outlined"
                            />
                        )}
                    </div>
                )}
            </CardContent>
            <CardActions disableSpacing className="align-bottom">
                <Link
                    href={`/post/${post.id}`}
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    <Tooltip title="Open">
                        <IconButton size="small">
                            <OpenInNew />
                        </IconButton>
                    </Tooltip>
                </Link>
                <Link
                    href={{
                        pathname: "/dashboard/main/posts/edit",
                        query: {
                            id: post.id,
                        },
                    }}
                >
                    <Tooltip title="Edit">
                        <IconButton size="small">
                            <EditIcon />
                        </IconButton>
                    </Tooltip>
                </Link>
                {!post.deleted && (
                    <Tooltip title={post.isPublished ? "Unpublish" : "Publish"}>
                        <IconButton
                            size="small"
                            onClick={publishHandler}
                            color={post.isPublished ? "success" : "warning"}
                        >
                            <PublishIcon />
                        </IconButton>
                    </Tooltip>
                )}
                <Tooltip
                    title={
                        post.deleted ? "Delete Permanently" : "Move to Trash"
                    }
                >
                    <IconButton
                        size="small"
                        onClick={() => {
                            if (post.deleted) {
                                hardDeleteHandler(post.id);
                            } else {
                                deleteHandler(post.id);
                            }
                        }}
                        color="error"
                    >
                        <DeleteIcon />
                    </IconButton>
                </Tooltip>
                <div className="flex-grow" />
                <Chip
                    label={
                        post.deleted
                            ? "Deleted"
                            : post.isPublished
                              ? "Published"
                              : "Draft"
                    }
                    color={
                        post.deleted
                            ? "error"
                            : post.isPublished
                              ? "success"
                              : "warning"
                    }
                    size="small"
                />
            </CardActions>
        </Card>
    );
};

export default PostItem;
