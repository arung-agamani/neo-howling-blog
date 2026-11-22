import React from "react";
import Link from "next/link";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Loader2, Plus } from "lucide-react";
import { PostsTableProps } from "./types";
import PostCard from "./PostCard";

const EMPTY_COPY: Record<
    PostsTableProps["filterStatus"],
    { title: string; body: string }
> = {
    all: {
        title: "No posts yet",
        body: "Get started by creating your first post.",
    },
    published: {
        title: "No published posts",
        body: "Publish a draft to see it here.",
    },
    draft: {
        title: "No drafts",
        body: "Posts you save without publishing appear here.",
    },
    trash: {
        title: "Trash is empty",
        body: "Posts you move to trash stay here until permanently deleted.",
    },
};

export default function PostsTable({
    posts,
    filterStatus,
    searchTerm,
    isFetching = false,
    busyPostId,
    onTogglePublish,
    onRequestTrash,
    onRestore,
    onRequestPurge,
}: PostsTableProps) {
    const emptyCopy = searchTerm
        ? {
              title: "No posts match your search",
              body: "Try a different title, description, or author.",
          }
        : EMPTY_COPY[filterStatus];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    {filterStatus === "trash" ? "Trash" : "All Posts"} (
                    {posts.length})
                    {isFetching && (
                        <Loader2
                            className="h-3.5 w-3.5 animate-spin text-muted-foreground"
                            aria-label="Updating results"
                        />
                    )}
                </CardTitle>
                <CardDescription>
                    {posts.length === 0
                        ? "Nothing to show"
                        : "Post actions apply immediately; destructive actions ask for confirmation."}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {posts.length === 0 ? (
                    <div className="py-12 text-center">
                        <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
                            <Eye className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <h3 className="mb-2 text-lg font-semibold">
                            {emptyCopy.title}
                        </h3>
                        <p className="mb-4 text-muted-foreground">
                            {emptyCopy.body}
                        </p>
                        {filterStatus === "all" && !searchTerm && (
                            <Button asChild>
                                <Link href="/admin/main/editor?mode=post">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create New Post
                                </Link>
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {posts.map((post) => (
                            <PostCard
                                key={post.id}
                                post={post}
                                busy={busyPostId === post.id}
                                onTogglePublish={onTogglePublish}
                                onRequestTrash={onRequestTrash}
                                onRestore={onRestore}
                                onRequestPurge={onRequestPurge}
                            />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
