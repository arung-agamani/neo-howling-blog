"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import axios from "@/utils/axios";
import Link from "next/link";

import { Post, FilterStatus } from "@/components/admin/posts/types";
import PostsStats from "@/components/admin/posts/PostsStats";
import PostsFilters from "@/components/admin/posts/PostsFilters";
import PostsTable from "@/components/admin/posts/PostsTable";
import PostsLoadingState from "@/components/admin/posts/PostsLoadingState";
import PostsErrorState from "@/components/admin/posts/PostsErrorState";

export default function PostsPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

    useEffect(() => {
        async function fetchPosts() {
            try {
                const response = await axios.get("/api/v1/posts");
                setPosts(response.data.data || []);
            } catch (err) {
                setError("Failed to load posts");
                console.error("Posts fetch error:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchPosts();
    }, []);

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
        return <PostsErrorState error={error} />;
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
