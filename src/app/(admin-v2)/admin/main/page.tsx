"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    FileText,
    Users,
    Tag,
    TrendingUp,
    Plus,
    Eye,
    Edit,
} from "lucide-react";
import Link from "next/link";
import { useDashboardStats } from "@/hooks/api/useDashboardStats";

export default function Page() {
    const { data: stats, isLoading: loading, error } = useDashboardStats();

    if (loading) {
        return (
            <div className="flex-1 p-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {[...Array(4)].map((_, i) => (
                            <div
                                key={i}
                                className="h-32 bg-gray-200 rounded"
                            ></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 p-6">
                <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-red-600">
                            {error instanceof Error
                                ? error.message
                                : "Failed to load dashboard statistics"}
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex-1 p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <div className="flex space-x-2">
                    <Button asChild>
                        <Link href="/admin/main/posts/new">
                            <Plus className="w-4 h-4 mr-2" />
                            New Post
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Posts
                        </CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats?.total || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            All posts in your blog
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Unpublished
                        </CardTitle>
                        <Edit className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats?.unpublished || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Drafts waiting to be published
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Tags
                        </CardTitle>
                        <Tag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats?.tags?.length || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Categories and topics
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Untagged Posts
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats?.untaggedPosts?.length || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Posts needing categorization
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Posts */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Posts</CardTitle>
                        <CardDescription>
                            Your latest blog posts
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats?.recentPosts?.map((post) => (
                                <div
                                    key={post.id}
                                    className="flex items-start justify-between"
                                >
                                    <div className="space-y-1 flex-1">
                                        <p className="text-sm font-medium leading-none">
                                            {post.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {post.description}
                                        </p>
                                    </div>
                                    <div className="flex space-x-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            asChild
                                        >
                                            <Link
                                                href={`/admin/main/posts/${post.id}`}
                                            >
                                                <Eye className="w-3 h-3" />
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            asChild
                                        >
                                            <Link
                                                href={`/admin/main/posts/${post.id}/edit`}
                                            >
                                                <Edit className="w-3 h-3" />
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {(!stats?.recentPosts ||
                                stats.recentPosts.length === 0) && (
                                <p className="text-sm text-muted-foreground">
                                    No posts found
                                </p>
                            )}
                        </div>
                        <div className="mt-4">
                            <Button
                                variant="outline"
                                className="w-full"
                                asChild
                            >
                                <Link href="/admin/main/posts">
                                    View All Posts
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Popular Tags */}
                <Card>
                    <CardHeader>
                        <CardTitle>Popular Tags</CardTitle>
                        <CardDescription>
                            Most used tags in your content
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {stats?.tags?.slice(0, 8).map((tag) => (
                                <div
                                    key={tag.name}
                                    className="flex items-center justify-between"
                                >
                                    <span className="text-sm font-medium">
                                        {tag.name}
                                    </span>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xs text-muted-foreground">
                                            {tag.count} posts
                                        </span>
                                        <div className="w-12 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full"
                                                style={{
                                                    width: `${Math.min(
                                                        (tag.count /
                                                            (stats?.tags?.[0]
                                                                ?.count || 1)) *
                                                            100,
                                                        100,
                                                    )}%`,
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {(!stats?.tags || stats.tags.length === 0) && (
                                <p className="text-sm text-muted-foreground">
                                    No tags found
                                </p>
                            )}
                        </div>
                        <div className="mt-4">
                            <Button
                                variant="outline"
                                className="w-full"
                                asChild
                            >
                                <Link href="/admin/main/tags">Manage Tags</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Untagged Posts (if any) */}
            {stats?.untaggedPosts && stats.untaggedPosts.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-yellow-600">
                            Posts Without Tags
                        </CardTitle>
                        <CardDescription>
                            These posts could benefit from proper categorization
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {stats.untaggedPosts.slice(0, 5).map((post) => (
                                <div
                                    key={post.id}
                                    className="flex items-start justify-between"
                                >
                                    <div className="space-y-1 flex-1">
                                        <p className="text-sm font-medium">
                                            {post.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground line-clamp-1">
                                            {post.description}
                                        </p>
                                    </div>
                                    <Button variant="outline" size="sm" asChild>
                                        <Link
                                            href={`/admin/main/posts/${post.id}/edit`}
                                        >
                                            Add Tags
                                        </Link>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>
                        Common administrative tasks
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Button
                            variant="outline"
                            className="h-20 flex flex-col"
                            asChild
                        >
                            <Link href="/admin/main/posts">
                                <FileText className="w-6 h-6 mb-2" />
                                Manage Posts
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            className="h-20 flex flex-col"
                            asChild
                        >
                            <Link href="/admin/main/users">
                                <Users className="w-6 h-6 mb-2" />
                                Manage Users
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            className="h-20 flex flex-col"
                            asChild
                        >
                            <Link href="/admin/main/tags">
                                <Tag className="w-6 h-6 mb-2" />
                                Manage Tags
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            className="h-20 flex flex-col"
                            asChild
                        >
                            <Link href="/admin/main/settings">
                                <TrendingUp className="w-6 h-6 mb-2" />
                                Settings
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
