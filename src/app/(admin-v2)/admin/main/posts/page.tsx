"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

import { FilterStatus } from "@/components/admin/posts/types";
import PostsStats from "@/components/admin/posts/PostsStats";
import PostsFilters from "@/components/admin/posts/PostsFilters";
import PostsTable from "@/components/admin/posts/PostsTable";
import PostsLoadingState from "@/components/admin/posts/PostsLoadingState";
import PostsErrorState from "@/components/admin/posts/PostsErrorState";
import { usePosts } from "@/hooks/api/usePosts";

export default function PostsPage() {
    const { data: posts = [], isLoading: loading, error } = usePosts();
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

    const handleSearchChange = (term: string) => {
        setSearchTerm(term);
    };

    const handleFilterChange = (status: FilterStatus) => {
        setFilterStatus(status);
    };

    if (loading) {
        return <PostsLoadingState />;
    }

    if (error) {
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
        <div className="flex-1 p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Posts Management</h1>
                    <p className="text-muted-foreground">
                        Manage all your blog posts and content
                    </p>
                </div>
                <Button asChild>
                    <Link href="/admin/main/posts/new">
                        <Plus className="w-4 h-4 mr-2" />
                        Create New Post
                    </Link>
                </Button>
            </div>

            {/* Statistics */}
            <PostsStats posts={posts} />

            {/* Filters and Search */}
            <PostsFilters
                searchTerm={searchTerm}
                filterStatus={filterStatus}
                onSearchChange={handleSearchChange}
                onFilterChange={handleFilterChange}
            />

            {/* Posts Table */}
            <PostsTable
                posts={posts}
                searchTerm={searchTerm}
                filterStatus={filterStatus}
            />
        </div>
    );
}
