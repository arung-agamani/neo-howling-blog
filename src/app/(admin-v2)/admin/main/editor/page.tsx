"use client";

import React, { useState, useCallback } from "react";
import { Descendant } from "slate";
import SlateEditor from "@/components/editor/SlateEditor";
import {
    useSlateEditor,
    getWordCount,
    getReadingTime,
} from "@/hooks/useSlateEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Save, Eye, FileText, Clock, Type } from "lucide-react";

const EditorPage: React.FC = () => {
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [excerpt, setExcerpt] = useState("");
    const [tags, setTags] = useState("");
    const [showPreview, setShowPreview] = useState(false);

    const {
        value,
        setValue,
        htmlContent,
        setHtmlContent,
        resetEditor,
        isEmpty,
    } = useSlateEditor({
        onContentChange: (content) => {
            console.log("Content changed:", content);
        },
        onHtmlChange: (html) => {
            console.log("HTML changed:", html);
        },
    });

    const wordCount = getWordCount(value);
    const readingTime = getReadingTime(value);

    const handleSave = useCallback(() => {
        const postData = {
            title,
            slug,
            excerpt,
            tags: tags
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean),
            content: value,
            htmlContent,
            wordCount,
            readingTime,
        };

        console.log("Saving post:", postData);
        // TODO: Implement actual save functionality
        alert(
            "Post saved! (This is a placeholder - implement actual save logic)",
        );
    }, [
        title,
        slug,
        excerpt,
        tags,
        value,
        htmlContent,
        wordCount,
        readingTime,
    ]);

    const handlePublish = useCallback(() => {
        // TODO: Implement publish functionality
        console.log("Publishing post...");
        alert(
            "Post published! (This is a placeholder - implement actual publish logic)",
        );
    }, []);

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
                "Are you sure you want to reset the editor? All content will be lost.",
            )
        ) {
            setTitle("");
            setSlug("");
            setExcerpt("");
            setTags("");
            resetEditor();
        }
    }, [resetEditor]);

    return (
        <div className="container mx-auto py-8 px-4 max-w-7xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Blog Post Editor</h1>
                <p className="text-gray-600">
                    Create and edit your blog posts with our rich text editor
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Main Editor */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Post Metadata */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText size={20} />
                                Post Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={handleTitleChange}
                                    placeholder="Enter your post title..."
                                    className="text-lg"
                                />
                            </div>

                            <div>
                                <Label htmlFor="slug">Slug</Label>
                                <Input
                                    id="slug"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    placeholder="post-url-slug"
                                />
                            </div>

                            <div>
                                <Label htmlFor="excerpt">Excerpt</Label>
                                <Input
                                    id="excerpt"
                                    value={excerpt}
                                    onChange={(e) => setExcerpt(e.target.value)}
                                    placeholder="Brief description of your post..."
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
                                    placeholder="react, nextjs, tutorial"
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
                                        {title || "Untitled Post"}
                                    </h2>
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
                                    placeholder="Start writing your blog post..."
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
                                        isEmpty ? "destructive" : "default"
                                    }
                                >
                                    {isEmpty ? "Empty" : "Draft"}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button
                                onClick={handleSave}
                                className="w-full"
                                disabled={!title.trim() || isEmpty}
                            >
                                <Save size={16} className="mr-2" />
                                Save Draft
                            </Button>

                            <Button
                                onClick={handlePublish}
                                variant="default"
                                className="w-full"
                                disabled={!title.trim() || isEmpty}
                            >
                                Publish Post
                            </Button>

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
                                <div className="space-y-1">
                                    <div>
                                        <kbd>#</kbd> + space = Heading 1
                                    </div>
                                    <div>
                                        <kbd>##</kbd> + space = Heading 2
                                    </div>
                                    <div>
                                        <kbd>###</kbd> + space = Heading 3
                                    </div>
                                    <div>
                                        <kbd>*</kbd> + space = Bullet list
                                    </div>
                                    <div>
                                        <kbd>1.</kbd> + space = Numbered list
                                    </div>
                                    <div>
                                        <kbd>{">"}</kbd> + space = Blockquote
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium mb-2">
                                    Keyboard Shortcuts
                                </h4>
                                <div className="space-y-1">
                                    <div>
                                        <kbd>Ctrl+B</kbd> = Bold
                                    </div>
                                    <div>
                                        <kbd>Ctrl+I</kbd> = Italic
                                    </div>
                                    <div>
                                        <kbd>Ctrl+U</kbd> = Underline
                                    </div>
                                    <div>
                                        <kbd>Ctrl+`</kbd> = Code
                                    </div>
                                    <div>
                                        <kbd>Ctrl+Z</kbd> = Undo
                                    </div>
                                    <div>
                                        <kbd>Ctrl+Shift+Z</kbd> = Redo
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium mb-2">
                                    Smart Behaviors
                                </h4>
                                <div className="space-y-1 text-xs text-gray-600">
                                    <div>
                                        • Press Enter in headings to exit to
                                        normal text
                                    </div>
                                    <div>
                                        • Press Enter twice in lists to exit
                                        list mode
                                    </div>
                                    <div>
                                        • Select text to show floating toolbar
                                        with link option
                                    </div>
                                    <div>
                                        • Links are inline and auto-exit
                                        formatting context
                                    </div>
                                    <div>
                                        • Undo/Redo with full history tracking
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
