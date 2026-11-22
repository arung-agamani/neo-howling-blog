import React, { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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
import {
    Calendar,
    Edit,
    Eye,
    EyeOff,
    Send,
    Tag,
    Trash2,
    Undo2,
    User,
} from "lucide-react";
import { PostCardProps } from "./types";
import {
    formatDate,
    getAuthorDisplayName,
    getDescriptionDisplayText,
} from "./utils";

export default function PostCard({
    post,
    busy = false,
    onTogglePublish,
    onRequestTrash,
    onRestore,
    onRequestPurge,
}: PostCardProps) {
    const [confirmPurge, setConfirmPurge] = useState(false);
    const inTrash = Boolean(post.deleted);

    return (
        <div className="rounded-lg border p-4 transition-colors hover:bg-muted/40">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold">
                            {post.title}
                        </h3>
                        <Badge
                            variant={
                                inTrash
                                    ? "outline"
                                    : post.isPublished
                                      ? "default"
                                      : "secondary"
                            }
                        >
                            {inTrash
                                ? "Trashed"
                                : post.isPublished
                                  ? "Published"
                                  : "Draft"}
                        </Badge>
                    </div>

                    <p className="line-clamp-2 text-muted-foreground">
                        {getDescriptionDisplayText(post.description)}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {getAuthorDisplayName(post.author)}
                        </div>
                        <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(post.datePosted)}
                        </div>
                        {post.tags && post.tags.length > 0 && (
                            <div className="flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                <div className="flex flex-wrap gap-1">
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

                <div className="flex shrink-0 items-center gap-1">
                    {!inTrash && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                asChild
                            >
                                <Link
                                    href={`/post/${post.link}`}
                                    target="_blank"
                                    aria-label={`View ${post.title}`}
                                    title="View post"
                                >
                                    <Eye className="h-4 w-4" />
                                </Link>
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                asChild
                            >
                                <Link
                                    href={`/admin/main/editor?mode=post&id=${post.id}`}
                                    aria-label={`Edit ${post.title}`}
                                    title="Edit post"
                                >
                                    <Edit className="h-4 w-4" />
                                </Link>
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={busy}
                                onClick={() => onTogglePublish(post)}
                                aria-label={
                                    post.isPublished
                                        ? `Unpublish ${post.title}`
                                        : `Publish ${post.title}`
                                }
                                title={
                                    post.isPublished
                                        ? "Unpublish"
                                        : "Publish"
                                }
                            >
                                {post.isPublished ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                disabled={busy}
                                onClick={() => onRequestTrash(post)}
                                aria-label={`Move ${post.title} to trash`}
                                title="Move to trash"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </>
                    )}

                    {inTrash && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={busy}
                                onClick={() => onRestore(post)}
                                aria-label={`Restore ${post.title}`}
                                title="Restore from trash"
                            >
                                <Undo2 className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                disabled={busy}
                                onClick={() => setConfirmPurge(true)}
                                aria-label={`Delete ${post.title} permanently`}
                                title="Delete permanently"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <AlertDialog open={confirmPurge} onOpenChange={setConfirmPurge}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete “{post.title}” permanently?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This cannot be undone. Restore it first if you only
                            want it off the public site.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                setConfirmPurge(false);
                                onRequestPurge(post);
                            }}
                        >
                            Delete forever
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
