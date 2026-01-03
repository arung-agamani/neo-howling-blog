import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2, Calendar, Tag, User } from "lucide-react";
import { PostCardProps } from "./types";
import {
    formatDate,
    getAuthorDisplayName,
    getDescriptionDisplayText,
} from "./utils";

export default function PostCard({ post }: PostCardProps) {
    return (
        <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{post.title}</h3>
                        <Badge
                            variant={post.isPublished ? "default" : "secondary"}
                        >
                            {post.isPublished ? "Published" : "Draft"}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground line-clamp-2">
                        {getDescriptionDisplayText(post.description)}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {getAuthorDisplayName(post.author)}
                        </div>
                        <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(post.datePosted)}
                        </div>
                        {post.tags && post.tags.length > 0 && (
                            <div className="flex items-center gap-1">
                                <Tag className="w-3 h-3" />
                                <div className="flex gap-1">
                                    {post.tags.slice(0, 3).map((tag) => (
                                        <Badge
                                            key={tag}
                                            variant="outline"
                                            className="text-xs"
                                        >
                                            {tag}
                                        </Badge>
                                    ))}
                                    {post.tags.length > 3 && (
                                        <Badge
                                            variant="outline"
                                            className="text-xs"
                                        >
                                            +{post.tags.length - 3} more
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={`/v2/posts/${post.id}`} target="_blank">
                            <Eye className="w-4 h-4" />
                        </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                        <Link
                            href={`/admin/main/editor?mode=post&id=${post.id}`}
                        >
                            <Edit className="w-4 h-4" />
                        </Link>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
