"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

import { FilterStatus } from "@/components/admin/posts/types";
import type { Post } from "@/components/admin/posts/types";
import PostsStats from "@/components/admin/posts/PostsStats";
import PostsFilters from "@/components/admin/posts/PostsFilters";
import PostsTable from "@/components/admin/posts/PostsTable";
import PostsLoadingState from "@/components/admin/posts/PostsLoadingState";
import PostsErrorState from "@/components/admin/posts/PostsErrorState";
import {
    usePosts,
    usePurgePost,
    useSetPostDeleted,
    useSetPostPublished,
} from "@/hooks/api/usePosts";

const PAGE_SIZE = 10;

function useDebouncedValue<T>(value: T, delay = 300): T {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debounced;
}

export default function PostsPage() {
    const { toast } = useToast();

    const [searchInput, setSearchInput] = useState("");
    const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [confirmTrash, setConfirmTrash] = useState<Post | null>(null);

    const searchTerm = useDebouncedValue(searchInput);

    const { data, isLoading, isFetching, error } = usePosts({
        page,
        pageSize: PAGE_SIZE,
        status: filterStatus,
        search: searchTerm,
        tags: selectedTags,
        // The admin must be able to see and manage diary posts.
        includeDiary: true,
    });

    const publishMutation = useSetPostPublished();
    const deletedMutation = useSetPostDeleted();
    const purgeMutation = usePurgePost();

    // Reset the page in the handlers instead of an effect: an effect would
    // fire a second query for the stale page after the first one.
    const handleSearchChange = (term: string) => {
        setSearchInput(term);
        setPage(1);
    };

    const handleFilterChange = (status: FilterStatus) => {
        setFilterStatus(status);
        setPage(1);
    };

    const handleTagsChange = (nextTags: string[]) => {
        setSelectedTags(nextTags);
        setPage(1);
    };

    const posts = useMemo(() => data?.data ?? [], [data]);
    const counts = data?.counts ?? {
        all: 0,
        published: 0,
        draft: 0,
        trash: 0,
    };
    const pagination = data?.pagination;

    const busyPostId =
        (publishMutation.isPending
            ? publishMutation.variables?.id
            : undefined) ??
        (deletedMutation.isPending
            ? deletedMutation.variables?.id
            : undefined) ??
        (purgeMutation.isPending ? purgeMutation.variables : undefined) ??
        null;

    const handleTogglePublish = (post: Post) => {
        const next = !post.isPublished;
        publishMutation.mutate(
            { id: post.id, isPublished: next },
            {
                onSuccess: () =>
                    toast({
                        title: next ? "Post published" : "Post unpublished",
                        description: post.title,
                    }),
                onError: (mutationError) =>
                    toast({
                        title: "Could not change publish state",
                        description: mutationError.message,
                        variant: "destructive",
                    }),
            },
        );
    };

    const handleRestore = (post: Post) => {
        deletedMutation.mutate(
            { id: post.id, deleted: false },
            {
                onSuccess: () =>
                    toast({
                        title: "Post restored",
                        description: post.title,
                    }),
                onError: (mutationError) =>
                    toast({
                        title: "Could not restore the post",
                        description: mutationError.message,
                        variant: "destructive",
                    }),
            },
        );
    };

    const handleTrash = (post: Post) => {
        deletedMutation.mutate(
            { id: post.id, deleted: true },
            {
                onSuccess: () =>
                    toast({
                        title: "Moved to trash",
                        description: "Restore it from the Trash filter.",
                    }),
                onError: (mutationError) =>
                    toast({
                        title: "Could not move the post to trash",
                        description: mutationError.message,
                        variant: "destructive",
                    }),
            },
        );
        setConfirmTrash(null);
    };

    const handlePurge = (post: Post) => {
        purgeMutation.mutate(post.id, {
            onSuccess: () =>
                toast({
                    title: "Post deleted permanently",
                    description: post.title,
                }),
            onError: (mutationError) =>
                toast({
                    title: "Could not delete the post",
                    description: mutationError.message,
                    variant: "destructive",
                }),
        });
    };

    // Only the very first load replaces the page. Later fetches keep the
    // current results mounted so the search field never loses focus.
    if (!data && isLoading) {
        return <PostsLoadingState />;
    }

    if (!data && error) {
        return (
            <PostsErrorState
                error={
                    error instanceof Error
                        ? error.message
                        : "Failed to load posts"
                }
            />
        );
    }

    return (
        <div className="flex-1 space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Posts Management</h1>
                    <p className="text-muted-foreground">
                        Manage all your blog posts and content
                    </p>
                </div>
                <Button asChild>
                    <Link href="/admin/main/editor?mode=post">
                        <Plus className="mr-2 h-4 w-4" />
                        Create New Post
                    </Link>
                </Button>
            </div>

            <PostsStats counts={counts} isLoading={isLoading} />

            <PostsFilters
                searchTerm={searchInput}
                filterStatus={filterStatus}
                selectedTags={selectedTags}
                onSearchChange={handleSearchChange}
                onFilterChange={handleFilterChange}
                onTagsChange={handleTagsChange}
            />

            <PostsTable
                posts={posts}
                filterStatus={filterStatus}
                searchTerm={searchTerm}
                isFetching={isFetching}
                busyPostId={busyPostId}
                onTogglePublish={handleTogglePublish}
                onRequestTrash={setConfirmTrash}
                onRestore={handleRestore}
                onRequestPurge={handlePurge}
            />

            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                        Page {pagination.page} of {pagination.totalPages} ·{" "}
                        {pagination.totalCount} matching post
                        {pagination.totalCount === 1 ? "" : "s"}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!pagination.hasPreviousPage || isFetching}
                            onClick={() =>
                                setPage((current) => Math.max(1, current - 1))
                            }
                        >
                            <ChevronLeft className="mr-1 h-4 w-4" />
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!pagination.hasNextPage || isFetching}
                            onClick={() => setPage((current) => current + 1)}
                        >
                            Next
                            <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            <AlertDialog
                open={confirmTrash !== null}
                onOpenChange={(open) => {
                    if (!open) setConfirmTrash(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Move “{confirmTrash?.title}” to trash?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            The post is removed from the public site but can be
                            restored from the Trash filter.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() =>
                                confirmTrash && handleTrash(confirmTrash)
                            }
                        >
                            Move to trash
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
