"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
    ArrowLeft,
    Code,
    ExternalLink,
    Image as ImageIcon,
    Loader2,
    Settings2,
} from "lucide-react";
import { toast } from "react-toastify";
import PostBodyEditor from "@/components/editor/PostBodyEditor";
import TagInput from "@/components/editor/TagInput";
import { useBottomRowFollow } from "@/components/editor/useBottomRowFollow";
import type {
    PostBodyEditorChange,
    PostBodyEditorHandle,
} from "@/components/editor/PostBodyEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useCurrentUser } from "@/hooks/api/useAuth";
import { postsKeys, usePost } from "@/hooks/api/usePosts";

const V1_SNIPPET_EDITOR = "/dashboard/main/snippets/edit";

function slugify(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

const EditorPage: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    const mode = searchParams.get("mode") ?? "post";
    const postId = searchParams.get("id") ?? "";
    const isSnippetMode = mode === "snippet";

    const { data: currentUser } = useCurrentUser();
    const { data: post, isLoading: loadingPost } = usePost(
        postId,
        !!postId && !isSnippetMode,
    );

    const [title, setTitle] = useState("");
    const [excerpt, setExcerpt] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [bannerUrl, setBannerUrl] = useState("");
    const [isPublished, setIsPublished] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [wordCount, setWordCount] = useState(0);
    const [isEmpty, setIsEmpty] = useState(true);
    const [dirty, setDirty] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [editorReady, setEditorReady] = useState(false);
    const [bannerPreviewFailed, setBannerPreviewFailed] = useState(false);

    const bodyRef = useRef<PostBodyEditorHandle>(null);
    const statusBarRef = useRef<HTMLElement>(null);
    const titleRef = useRef<HTMLInputElement>(null);
    const loadedPostRef = useRef<string | null>(null);

    useEffect(() => {
        if (!post || loadedPostRef.current === post.id) return;
        loadedPostRef.current = post.id;
        setTitle(post.title ?? "");
        setExcerpt(post.description ?? "");
        setTags(post.tags ?? []);
        setBannerUrl(post.bannerUrl ?? "");
        setIsPublished(Boolean(post.isPublished));
    }, [post]);

    useEffect(() => {
        if (!dirty) return;
        const warn = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = "";
        };
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [dirty]);

    // Stable callbacks: the observer must not be torn down every render.
    const getEditorElement = useCallback(
        () => bodyRef.current?.getEditorElement() ?? null,
        [],
    );
    const getStatusBarElement = useCallback(() => statusBarRef.current, []);
    const handleEditorReady = useCallback(() => setEditorReady(true), []);

    useBottomRowFollow({
        getEditorElement,
        getStatusBarElement,
        enabled: editorReady,
    });

    const handleBodyChange = useCallback((change: PostBodyEditorChange) => {
        setWordCount(change.wordCount);
        setIsEmpty(change.isEmpty);
        if (change.reason === "edit") setDirty(true);
    }, []);

    const invalidatePosts = useCallback(async () => {
        await queryClient.invalidateQueries({ queryKey: postsKeys.lists() });
        await queryClient.invalidateQueries({
            queryKey: postsKeys.details(),
        });
    }, [queryClient]);

    /**
     * Persist the post and return its id, or null when validation failed.
     * Shared by Save and Publish so publishing a new post saves it first.
     */
    const persist = useCallback(
        async ({ silent = false }: { silent?: boolean } = {}) => {
            if (!currentUser) {
                toast.error("You need to be signed in to save");
                return null;
            }
            if (!title.trim()) {
                titleRef.current?.focus();
                toast.error("Give your post a title first");
                return null;
            }

            const snapshot = bodyRef.current?.getSnapshot();
            if (!snapshot) {
                toast.error("The editor is still loading");
                return null;
            }
            if (snapshot.isEmpty) {
                toast.error("Write something before saving");
                return null;
            }

            setIsSaving(true);
            try {
                const payload = {
                    author: currentUser.username,
                    title: title.trim(),
                    description: excerpt.trim(),
                    tags,
                    bannerUrl: bannerUrl.trim() || undefined,
                    blogContent: snapshot.blogContent,
                    blogContentDelta: snapshot.blogContentDelta,
                };

                const endpoint = postId
                    ? `/api/v1/posts/${postId}`
                    : "/api/v1/posts";
                const method = postId ? "PATCH" : "POST";
                const body = postId
                    ? { id: postId, op: "update", ...payload }
                    : payload;

                const response = await fetch(endpoint, {
                    method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
                const data = await response.json();

                if (!response.ok) {
                    toast.error(data.message || "Could not save the post");
                    return null;
                }

                setDirty(false);
                await invalidatePosts();
                if (!silent) toast.success(postId ? "Saved" : "Draft created");

                const savedId: string | undefined = postId || data.data?.id;
                if (!postId && savedId) {
                    router.replace(
                        `/admin/main/editor?mode=post&id=${savedId}`,
                    );
                }
                return savedId ?? null;
            } catch (error) {
                console.error("Error saving post:", error);
                toast.error("Something went wrong while saving");
                return null;
            } finally {
                setIsSaving(false);
            }
        },
        [
            currentUser,
            title,
            excerpt,
            tags,
            bannerUrl,
            postId,
            router,
            invalidatePosts,
        ],
    );

    const setPublished = useCallback(
        async (publish: boolean, id?: string) => {
            // A freshly created post has no id in this render's closure yet.
            const targetId = id ?? postId;
            if (!targetId) return false;

            setIsPublishing(true);
            try {
                const response = await fetch(`/api/v1/posts/${targetId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        id: targetId,
                        op: "publish",
                        isPublished: publish,
                    }),
                });
                const data = await response.json();
                if (!response.ok) {
                    toast.error(data.message || "Could not update the post");
                    return false;
                }
                setIsPublished(publish);
                await invalidatePosts();
                return true;
            } catch (error) {
                console.error("Error updating publish state:", error);
                toast.error("Something went wrong");
                return false;
            } finally {
                setIsPublishing(false);
            }
        },
        [postId, invalidatePosts],
    );

    const handlePublish = useCallback(async () => {
        const id = await persist({ silent: true });
        if (!id) return;
        if (await setPublished(true, id)) {
            toast.success("Your post is live");
        }
    }, [persist, setPublished]);

    if (isSnippetMode) {
        return (
            <div className="mx-auto max-w-xl px-4 py-16">
                <div className="space-y-4 text-center">
                    <h1 className="text-2xl font-semibold">
                        Snippets live in the classic dashboard
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        This editor is built for writing posts. Code snippets
                        keep their existing MDX format in the v1 dashboard.
                    </p>
                    <div className="flex justify-center gap-2">
                        <Button asChild size="sm">
                            <Link
                                href={
                                    postId
                                        ? `${V1_SNIPPET_EDITOR}?id=${postId}`
                                        : V1_SNIPPET_EDITOR
                                }
                            >
                                Open snippet editor
                                <ExternalLink className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm">
                            <Link href="/admin/main/posts">
                                Back to posts
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (postId && loadingPost) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin" />
            </div>
        );
    }

    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    return (
        <div className="min-h-full">
            {/* Top bar: navigation, state, and the two actions that matter. */}
            <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur">
                <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-2">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/admin/main/posts">
                            <ArrowLeft className="mr-1 h-4 w-4" />
                            Posts
                        </Link>
                    </Button>

                    <Badge
                        variant={isPublished ? "default" : "secondary"}
                        className="ml-1"
                    >
                        {isPublished ? "Published" : "Draft"}
                    </Badge>

                    <span className="ml-auto hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                        <span
                            className={`h-1.5 w-1.5 rounded-full ${
                                dirty ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                        />
                        {isSaving
                            ? "Saving…"
                            : dirty
                              ? "Unsaved changes"
                              : "Saved"}
                    </span>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSettingsOpen(true)}
                    >
                        <Settings2 className="mr-1 h-4 w-4" />
                        Settings
                    </Button>

                    {!isPublished && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => void persist()}
                                disabled={isSaving || isPublishing}
                            >
                                Save
                            </Button>
                            <Button
                                size="sm"
                                onClick={handlePublish}
                                disabled={isSaving || isPublishing}
                            >
                                {isPublishing ? "Publishing…" : "Publish"}
                            </Button>
                        </>
                    )}

                    {isPublished && (
                        <Button
                            size="sm"
                            onClick={() => void persist()}
                            disabled={isSaving}
                        >
                            {isSaving ? "Saving…" : "Save changes"}
                        </Button>
                    )}
                </div>
            </header>

            {/* The document itself: one column, no chrome competing for attention. */}
            <main className="mx-auto w-full max-w-3xl px-4 pt-10">
                <input
                    ref={titleRef}
                    value={title}
                    onChange={(event) => {
                        setTitle(event.target.value);
                        setDirty(true);
                    }}
                    placeholder="Post title"
                    aria-label="Post title"
                    className="w-full border-0 bg-transparent p-0 text-4xl font-bold tracking-tight outline-none placeholder:text-muted-foreground/40"
                />
                <input
                    value={excerpt}
                    onChange={(event) => {
                        setExcerpt(event.target.value);
                        setDirty(true);
                    }}
                    placeholder="Add a short description (optional)"
                    aria-label="Post description"
                    className="mt-3 w-full border-0 bg-transparent p-0 text-lg text-muted-foreground outline-none placeholder:text-muted-foreground/40"
                />

                <div className="mt-8">
                    <PostBodyEditor
                        ref={bodyRef}
                        contentKey={postId || "new"}
                        ready={!postId || !loadingPost}
                        initialDeltaJson={post?.blogContentDelta}
                        initialHtml={post?.blogContent}
                        onChange={handleBodyChange}
                        onEditorReady={handleEditorReady}
                    />
                </div>

                {/*
                 * Sits at the end of the document in normal flow: the
                 * IntersectionObserver in useBottomRowFollow scrolls the page
                 * to keep it visible while writing, so it does not need to be
                 * pinned over the text.
                 */}
                <footer
                    ref={statusBarRef}
                    className="mt-10 border-t pt-3 pb-8"
                >
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="tabular-nums">
                            {wordCount} {wordCount === 1 ? "word" : "words"} ·{" "}
                            {readingTime} min read
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                    dirty ? "bg-amber-500" : "bg-emerald-500"
                                }`}
                            />
                            {isSaving
                                ? "Saving…"
                                : dirty
                                  ? "Unsaved changes"
                                  : "All changes saved"}
                        </span>
                    </div>
                </footer>
            </main>

            {/* Everything that is not writing lives here. */}
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Post settings</DialogTitle>
                        <DialogDescription>
                            These details appear in listings, previews, and
                            metadata. They are optional.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5">
                        <div className="space-y-2">
                            <Label>URL slug</Label>
                            <p className="rounded-md bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
                                /post/{slugify(title) || "…"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Generated from the title when you save.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="settings-tags">
                                Tags
                            </Label>
                            <TagInput
                                id="settings-tags"
                                value={tags}
                                onChange={(nextTags) => {
                                    setTags(nextTags);
                                    setDirty(true);
                                }}
                                placeholder="react, nextjs, tutorial"
                            />
                            <p className="text-xs text-muted-foreground">
                                Used to group and recommend posts. Existing tags
                                suggest as you type.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="settings-banner">
                                Banner image URL
                            </Label>
                            <Input
                                id="settings-banner"
                                value={bannerUrl}
                                onChange={(event) => {
                                    setBannerUrl(event.target.value);
                                    setBannerPreviewFailed(false);
                                    setDirty(true);
                                }}
                                placeholder="https://cdn.howlingmoon.dev/…"
                            />
                            {bannerUrl.trim() && !bannerPreviewFailed ? (
                                <img
                                    key={bannerUrl}
                                    src={bannerUrl}
                                    alt="Banner preview"
                                    onError={() => setBannerPreviewFailed(true)}
                                    className="mt-2 aspect-[2/1] w-full rounded-md border object-cover"
                                />
                            ) : (
                                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <ImageIcon className="h-3.5 w-3.5" />
                                    {bannerPreviewFailed
                                        ? "That image could not be loaded."
                                        : "Shown at the top of the post and in link previews."}
                                </p>
                            )}
                        </div>

                        {isPublished && (
                            <div className="space-y-2 border-t pt-4">
                                <Label>Visibility</Label>
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-xs text-muted-foreground">
                                        This post is publicly visible.
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => void setPublished(false)}
                                        disabled={isPublishing}
                                    >
                                        Unpublish
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="border-t pt-4">
                            <Link
                                href={V1_SNIPPET_EDITOR}
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                            >
                                <Code className="h-3.5 w-3.5" />
                                Writing a code snippet instead?
                            </Link>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default EditorPage;
