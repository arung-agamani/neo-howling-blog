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
import { Eye, Plus } from "lucide-react";
import { PostsTableProps } from "./types";
import { filterPosts } from "./utils";
import PostCard from "./PostCard";

export default function PostsTable({
    posts,
    searchTerm,
    filterStatus,
}: PostsTableProps) {
    const filteredPosts = filterPosts(posts, searchTerm, filterStatus);
    const activePosts = posts.filter((p) => !p.deleted);

    return (
        <Card>
            <CardHeader>
                <CardTitle>All Posts ({filteredPosts.length})</CardTitle>
                <CardDescription>
                    Showing {filteredPosts.length} of {activePosts.length} posts
                </CardDescription>
            </CardHeader>
            <CardContent>
                {filteredPosts.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Eye className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">
                            No posts found
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            {searchTerm || filterStatus !== "all"
                                ? "Try adjusting your search or filters"
                                : "Get started by creating your first post"}
                        </p>
                        <Button asChild>
                            <Link href="/admin/main/editor?mode=post">
                                <Plus className="w-4 h-4 mr-2" />
                                Create New Post
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredPosts.map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
