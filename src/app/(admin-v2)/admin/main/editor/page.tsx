"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import SlateEditor from "@/components/editor/SlateEditor";
import {
    useSlateEditor,
    getWordCount,
    getReadingTime,
    serializeToPlainText,
} from "@/hooks/useSlateEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Save,
    Eye,
    FileText,
    Clock,
    Type,
    Upload,
    Loader2,
    ArrowLeft,
    Code,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/api/useAuth";
import { usePost } from "@/hooks/api/usePosts";
import { useSnippet } from "@/hooks/api/useSnippets";
import { toast } from "react-toastify";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

type EditorMode = "post" | "snippet";

const EditorPage: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const mode = (searchParams.get("mode") as EditorMode) || "post";
    const postId = searchParams.get("id");

    const { data: currentUser } = useCurrentUser();
    const { data: existingPost, isLoading: loadingPost } = usePost(
        postId || "",
        !!postId && mode === "post",
    );
    const { data: existingSnippet, isLoading: loadingSnippet } = useSnippet(
        postId || "",
        !!postId && mode === "snippet",
    );

    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [excerpt, setExcerpt] = useState("");
    const [tags, setTags] = useState("");
    const [bannerUrl, setBannerUrl] = useState("");
    const [showPreview, setShowPreview] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [isPublished, setIsPublished] = useState(false);

    const {
        value,
        setValue,
        htmlContent,
        setHtmlContent,
        resetEditor,
        isEmpty,
    } = useSlateEditor({
        onContentChange: (content) => {
            // Optional: Auto-save could be implemented here
        },
        onHtmlChange: (html) => {
            // HTML is automatically updated
        },
    });

    const wordCount = getWordCount(value);
    const readingTime = getReadingTime(value);

    // Load existing post data
    useEffect(() => {
        if (existingPost && mode === "post") {
            setTitle(existingPost.title || "");
            setExcerpt(existingPost.description || "");
            setTags(existingPost.tags?.join(", ") || "");
            setBannerUrl(existingPost.bannerUrl || "");
            setIsPublished(existingPost.isPublished || false);

            // TODO: Parse blogContent back to Slate format
            // For now, this is a placeholder
            if (existingPost.blogContent) {
                // You'll need to implement proper HTML/content parsing
                console.log(
                    "Loading existing content:",
                    existingPost.blogContent,
                );
            }
        }
    }, [existingPost, mode]);

    // Load existing snippet data
    useEffect(() => {
        if (existingSnippet && mode === "snippet") {
            setTitle(existingSnippet.title || "");
            setExcerpt(existingSnippet.description || "");

            // Parse frontmatter to extract tags if needed
            if (existingSnippet.content) {
                // Extract tags from frontmatter if present
                const tagMatch =
                    existingSnippet.content.match(/tags:\s*\[(.*?)\]/);
                if (tagMatch) {
                    setTags(tagMatch[1].replace(/['"]/g, "").trim());
                }

                // TODO: Parse content back to Slate format
                console.log(
                    "Loading existing snippet:",
                    existingSnippet.content,
                );
            }
        }
    }, [existingSnippet, mode]);

    const handleSavePost = useCallback(async () => {
        if (!currentUser) {
            toast.error("You must be logged in to save posts");
            return;
        }

        if (!title.trim()) {
            toast.error("Please enter a title");
            return;
        }

        if (isEmpty) {
            toast.error("Please add some content");
            return;
        }

        setIsSaving(true);

        try {
            const payload = {
                author: currentUser.username,
                title: title.trim(),
                description: excerpt.trim(),
                tags: tags
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean),
                bannerUrl: bannerUrl.trim() || undefined,
                blogContent: htmlContent,
            };

            const endpoint = postId
                ? `/api/v1/posts/${postId}`
                : "/api/v1/posts";
            const method = postId ? "PATCH" : "POST";

            const body = postId
                ? {
                      id: postId,
                      op: "update",
                      ...payload,
                  }
                : payload;

            const response = await fetch(endpoint, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(
                    postId
                        ? "Post updated successfully!"
                        : "Post saved as draft!",
                );

                // If this was a new post, redirect to edit mode
                if (!postId && data.data?.id) {
                    router.push(
                        `/admin/main/editor?mode=post&id=${data.data.id}`,
                    );
                }
            } else {
                toast.error(data.message || "Failed to save post");
                console.error("Error:", data);
            }
        } catch (error) {
            console.error("Error saving post:", error);
            toast.error("An error occurred while saving");
        } finally {
            setIsSaving(false);
        }
    }, [
        currentUser,
        title,
        excerpt,
        tags,
        bannerUrl,
        htmlContent,
        isEmpty,
        postId,
        router,
    ]);

    const handlePublishPost = useCallback(async () => {
        if (!postId) {
            toast.error("Please save the post first before publishing");
            return;
        }

        setIsPublishing(true);

        try {
            const response = await fetch(`/api/v1/posts/${postId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: postId,
                    op: "publish",
                    isPublished: !isPublished,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                const newStatus = !isPublished;
                setIsPublished(newStatus);
                toast.success(
                    newStatus ? "Post published!" : "Post unpublished!",
                );
            } else {
                toast.error(data.message || "Failed to publish post");
            }
        } catch (error) {
            console.error("Error publishing post:", error);
            toast.error("An error occurred while publishing");
        } finally {
            setIsPublishing(false);
        }
    }, [postId, isPublished]);

    const handleSaveSnippet = useCallback(async () => {
        if (!currentUser) {
            toast.error("You must be logged in to save snippets");
            return;
        }

        if (!title.trim()) {
            toast.error("Please enter a title");
            return;
        }

        if (isEmpty) {
            toast.error("Please add some content");
            return;
        }

        setIsSaving(true);

        try {
            // Convert to frontmatter format for snippets
            const plainContent = serializeToPlainText(value);
            const frontmatterContent = `---
title: ${title}
description: ${excerpt}
tags: [${tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
                .join(", ")}]
---

${plainContent}`;

            const endpoint = postId
                ? `/api/v1/snippets/${postId}`
                : "/api/v1/snippets";
            const method = postId ? "PATCH" : "POST";

            const response = await fetch(endpoint, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    content: frontmatterContent,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(
                    postId
                        ? "Snippet updated successfully!"
                        : "Snippet created successfully!",
                );

                // If this was a new snippet, redirect to edit mode
                if (!postId && data.data?.id) {
                    router.push(
                        `/admin/main/editor?mode=snippet&id=${data.data.id}`,
                    );
                }
            } else {
                toast.error(data.message || "Failed to save snippet");
                console.error("Error:", data);
            }
        } catch (error) {
            console.error("Error saving snippet:", error);
            toast.error("An error occurred while saving snippet");
        } finally {
            setIsSaving(false);
        }
    }, [currentUser, title, excerpt, tags, value, isEmpty, postId, router]);

    const generateSlugFromTitle = useCallback((title: string) => {
        return title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_-]+/g, "-")
            .replace(/^-+|-+$/g, "");
    }, []);

    const handleTitleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const newTitle = e.target.value;
            setTitle(newTitle);

            // Auto-generate slug if it's empty or matches the previous title's slug
            if (!slug || slug === generateSlugFromTitle(title)) {
                setSlug(generateSlugFromTitle(newTitle));
            }
        },
        [title, slug, generateSlugFromTitle],
    );

    const handleReset = useCallback(() => {
        if (
            confirm(
                "Are you sure you want to reset the editor? All unsaved content will be lost.",
            )
        ) {
            setTitle("");
            setSlug("");
            setExcerpt("");
            setTags("");
            setBannerUrl("");
            resetEditor();
        }
    }, [resetEditor]);

    const handleModeChange = (newMode: string) => {
        if (newMode !== mode) {
            if (
                !isEmpty ||
                title ||
                excerpt ||
                tags ||
                confirm(
                    "Switching modes will clear your current work. Continue?",
                )
            ) {
                router.push(`/admin/main/editor?mode=${newMode}`);
                // Reset form
                setTitle("");
                setSlug("");
                setExcerpt("");
                setTags("");
                setBannerUrl("");
                resetEditor();
            }
        }
    };

    if (loadingPost || loadingSnippet) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="mx-auto py-8 px-4">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/admin/main/posts">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Posts
                            </Link>
                        </Button>
                        <h1 className="text-3xl font-bold">
                            {postId
                                ? `Edit ${mode === "post" ? "Post" : "Snippet"}`
                                : `Create New ${mode === "post" ? "Post" : "Snippet"}`}
                        </h1>
                    </div>
                    <p className="text-gray-600">
                        {mode === "post"
                            ? "Create and edit your blog posts with our rich text editor"
                            : "Create and manage code snippets"}
                    </p>
                </div>

                <Tabs value={mode} onValueChange={handleModeChange}>
                    <TabsList>
                        <TabsTrigger value="post">
                            <FileText className="w-4 h-4 mr-2" />
                            Post
                        </TabsTrigger>
                        <TabsTrigger value="snippet">
                            <Code className="w-4 h-4 mr-2" />
                            Snippet
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Main Editor */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Metadata */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText size={20} />
                                {mode === "post" ? "Post" : "Snippet"} Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={handleTitleChange}
                                    placeholder={`Enter your ${mode} title...`}
                                    className="text-lg"
                                />
                            </div>

                            {mode === "post" && (
                                <>
                                    <div>
                                        <Label htmlFor="slug">Slug</Label>
                                        <Input
                                            id="slug"
                                            value={slug}
                                            onChange={(e) =>
                                                setSlug(e.target.value)
                                            }
                                            placeholder="post-url-slug"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="bannerUrl">
                                            Banner URL
                                        </Label>
                                        <Input
                                            id="bannerUrl"
                                            value={bannerUrl}
                                            onChange={(e) =>
                                                setBannerUrl(e.target.value)
                                            }
                                            placeholder="https://example.com/banner.jpg"
                                        />
                                    </div>
                                </>
                            )}

                            <div>
                                <Label htmlFor="excerpt">
                                    {mode === "post"
                                        ? "Excerpt"
                                        : "Description"}
                                </Label>
                                <Input
                                    id="excerpt"
                                    value={excerpt}
                                    onChange={(e) => setExcerpt(e.target.value)}
                                    placeholder={`Brief description of your ${mode}...`}
                                />
                            </div>

                            <div>
                                <Label htmlFor="tags">
                                    Tags (comma-separated)
                                </Label>
                                <Input
                                    id="tags"
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                    placeholder={
                                        mode === "post"
                                            ? "react, nextjs, tutorial"
                                            : "javascript, react, hooks"
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Editor */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Type size={20} />
                                    Content Editor
                                </span>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            setShowPreview(!showPreview)
                                        }
                                    >
                                        <Eye size={16} className="mr-1" />
                                        {showPreview ? "Edit" : "Preview"}
                                    </Button>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {showPreview ? (
                                <div className="border rounded-lg p-4 min-h-[400px] bg-gray-50">
                                    <h2 className="text-2xl font-bold mb-4">
                                        {title || "Untitled"}
                                    </h2>
                                    {excerpt && (
                                        <p className="text-gray-600 italic mb-4">
                                            {excerpt}
                                        </p>
                                    )}
                                    <div
                                        className="prose max-w-none"
                                        dangerouslySetInnerHTML={{
                                            __html:
                                                htmlContent ||
                                                "<p>No content yet...</p>",
                                        }}
                                    />
                                </div>
                            ) : (
                                <SlateEditor
                                    value={value}
                                    onChange={setValue}
                                    onHtmlChange={setHtmlContent}
                                    placeholder={`Start writing your ${mode}...`}
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Stats */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">
                                Statistics
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                    Words
                                </span>
                                <Badge variant="secondary">{wordCount}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 flex items-center gap-1">
                                    <Clock size={14} />
                                    Reading time
                                </span>
                                <Badge variant="secondary">
                                    {readingTime} min
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                    Status
                                </span>
                                <Badge
                                    variant={
                                        isEmpty
                                            ? "destructive"
                                            : isPublished
                                              ? "default"
                                              : "secondary"
                                    }
                                >
                                    {isEmpty
                                        ? "Empty"
                                        : isPublished
                                          ? "Published"
                                          : "Draft"}
                                </Badge>
                            </div>
                            {postId && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">
                                        Mode
                                    </span>
                                    <Badge variant="outline">
                                        {postId ? "Edit" : "Create"}
                                    </Badge>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button
                                onClick={
                                    mode === "post"
                                        ? handleSavePost
                                        : handleSaveSnippet
                                }
                                className="w-full"
                                disabled={!title.trim() || isEmpty || isSaving}
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save size={16} className="mr-2" />
                                        {postId ? "Update" : "Save"}{" "}
                                        {mode === "post" ? "Draft" : "Snippet"}
                                    </>
                                )}
                            </Button>

                            {mode === "post" && postId && (
                                <Button
                                    onClick={handlePublishPost}
                                    variant={
                                        isPublished ? "outline" : "default"
                                    }
                                    className="w-full"
                                    disabled={isPublishing}
                                >
                                    {isPublishing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Upload
                                                size={16}
                                                className="mr-2"
                                            />
                                            {isPublished
                                                ? "Unpublish Post"
                                                : "Publish Post"}
                                        </>
                                    )}
                                </Button>
                            )}

                            <Separator />

                            <Button
                                onClick={handleReset}
                                variant="destructive"
                                className="w-full"
                                size="sm"
                            >
                                Reset Editor
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Help */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">
                                Editor Guide
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div>
                                <h4 className="font-medium mb-2">
                                    Markdown Shortcuts
                                </h4>
                                <div className="space-y-1 text-xs">
                                    <div>
                                        <kbd className="px-1 py-0.5 bg-gray-100 rounded">
                                            #
                                        </kbd>{" "}
                                        + space = Heading 1
                                    </div>
                                    <div>
                                        <kbd className="px-1 py-0.5 bg-gray-100 rounded">
                                            ##
                                        </kbd>{" "}
                                        + space = Heading 2
                                    </div>
                                    <div>
                                        <kbd className="px-1 py-0.5 bg-gray-100 rounded">
                                            ###
                                        </kbd>{" "}
                                        + space = Heading 3
                                    </div>
                                    <div>
                                        <kbd className="px-1 py-0.5 bg-gray-100 rounded">
                                            *
                                        </kbd>{" "}
                                        + space = Bullet list
                                    </div>
                                    <div>
                                        <kbd className="px-1 py-0.5 bg-gray-100 rounded">
                                            1.
                                        </kbd>{" "}
                                        + space = Numbered list
                                    </div>
                                    <div>
                                        <kbd className="px-1 py-0.5 bg-gray-100 rounded">
                                            {">"}
                                        </kbd>{" "}
                                        + space = Blockquote
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium mb-2">
                                    Keyboard Shortcuts
                                </h4>
                                <div className="space-y-1 text-xs">
                                    <div>
                                        <kbd className="px-1 py-0.5 bg-gray-100 rounded">
                                            Ctrl+B
                                        </kbd>{" "}
                                        = Bold
                                    </div>
                                    <div>
                                        <kbd className="px-1 py-0.5 bg-gray-100 rounded">
                                            Ctrl+I
                                        </kbd>{" "}
                                        = Italic
                                    </div>
                                    <div>
                                        <kbd className="px-1 py-0.5 bg-gray-100 rounded">
                                            Ctrl+U
                                        </kbd>{" "}
                                        = Underline
                                    </div>
                                    <div>
                                        <kbd className="px-1 py-0.5 bg-gray-100 rounded">
                                            Ctrl+`
                                        </kbd>{" "}
                                        = Code
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default EditorPage;
