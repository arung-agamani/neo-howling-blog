"use client";

import { useEffect, useMemo, useState } from "react";
import { BlockNoteEditor } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";
import "./editor.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Film, Music, Youtube } from "lucide-react";
import InsertMediaDialog, { nameFromUrl } from "./InsertMediaDialog";
import type { MediaKind } from "./InsertMediaDialog";
import { useInstantImageUpload } from "./useInstantImageUpload";
import { OPTIMISTIC_UPLOAD_LIMITS } from "./uploadEditorImage";
import { useEditorUploadConfig } from "@/hooks/api/useEditorUploadConfig";
import { blocksToCleanHtml } from "./blocksToCleanHtml";
import PostContentRenderer from "@/components/PostContentRenderer";
import InsertYouTubeDialog from "./InsertYouTubeDialog";
import type { YouTubeVideo } from "./youtube/parseYouTubeUrl";
import { editorSchema } from "./schema";

/**
 * Quill-shaped sample HTML mirroring what v1 stores in posts.blogContent.
 * PoC input for the v1 HTML -> v2 blocks import path.
 */
const SAMPLE_V1_HTML = `<h1>Title of section</h1><p>Normal paragraph text with <strong>bold</strong> and <em>italic</em> text.</p><blockquote>A quote block.</blockquote><pre class="ql-syntax" spellcheck="false">const x = 1;
const y = 2;</pre><ul><li>Item one</li><li>Item two</li></ul><ol><li data-list="ordered">First item</li></ol><p class="ql-align-center">Centered text</p><p><a href="https://example.com">A link</a></p>`;

interface BlockNotePocProps {
    initialHtml?: string;
}

const BlockNotePoc: React.FC<BlockNotePocProps> = ({
    initialHtml = SAMPLE_V1_HTML,
}) => {
    const [blockJson, setBlockJson] = useState<string>("[]");
    const [exportedHtml, setExportedHtml] = useState<string>("");
    const [fullHtml, setFullHtml] = useState<string>("");
    const [blockCount, setBlockCount] = useState<number>(0);
    const [importError, setImportError] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [mediaKind, setMediaKind] = useState<MediaKind | null>(null);
    const [youtubeOpen, setYoutubeOpen] = useState(false);

    const { data: uploadConfig } = useEditorUploadConfig();
    // Optimistic defaults until config loads; the server enforces the real
    // limits, and a failed config fetch must not disable pasting.
    const limits = useMemo(
        () =>
            uploadConfig
                ? {
                      enabled: uploadConfig.config.enabled,
                      maxBytes: uploadConfig.config.maxBytes,
                      allowedMimeTypes: uploadConfig.config.allowedMimeTypes,
                  }
                : OPTIMISTIC_UPLOAD_LIMITS,
        [uploadConfig],
    );

    const { editorRef, uploadFile } = useInstantImageUpload(limits);

    const editor = useMemo(
        () => BlockNoteEditor.create({ schema: editorSchema, uploadFile }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );

    useEffect(() => {
        editorRef.current = editor;
    }, [editor, editorRef]);

    const syncOutputs = (ed: typeof editor) => {
        const doc = ed.document;
        setBlockCount(doc.length);
        // v2 schema payload: what would be stored in posts.blogContentDelta
        setBlockJson(
            JSON.stringify({ version: "v2", blocks: doc }, null, 2),
        );
        // canonical HTML: what would be stored in posts.blogContent
        setExportedHtml(blocksToCleanHtml(ed, doc));
        setFullHtml(ed.blocksToFullHTML(doc));
    };

    const handleLoadSample = () => {
        setImportError(null);
        try {
            const blocks = editor.tryParseHTMLToBlocks(initialHtml);
            editor.replaceBlocks(editor.document, blocks);
            syncOutputs(editor);
        } catch (error) {
            setImportError(
                error instanceof Error ? error.message : "HTML parse failed",
            );
        }
    };

    useEffect(() => {
        handleLoadSample();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editor]);

    useEffect(() => {
        const onError = (event: PromiseRejectionEvent) => {
            const reason = event.reason;
            const message =
                reason instanceof Error ? reason.message : String(reason);
            if (/upload|image|media|presigned/i.test(message)) {
                setUploadError(message);
            }
        };
        window.addEventListener("unhandledrejection", onError);
        return () => window.removeEventListener("unhandledrejection", onError);
    }, []);

    const insertBlockAtCursor = (
        block: Parameters<typeof editor.insertBlocks>[0][number],
    ) => {
        try {
            const cursor = editor.getTextCursorPosition().block;
            const isEmptyParagraph =
                Array.isArray(cursor.content) && cursor.content.length === 0;
            if (isEmptyParagraph) {
                editor.updateBlock(cursor.id, block);
            } else {
                editor.insertBlocks([block], cursor, "after");
            }
        } catch {
            const lastBlock = editor.document[editor.document.length - 1];
            editor.insertBlocks([block], lastBlock, "after");
        }
    };

    const handleInsertMedia = (kind: MediaKind, url: string) => {
        const name = nameFromUrl(url);
        insertBlockAtCursor(
            kind === "video"
                ? { type: "video", props: { url, name } }
                : { type: "audio", props: { url, name } },
        );
        setMediaKind(null);
    };

    const handleInsertYouTube = (video: YouTubeVideo) => {
        insertBlockAtCursor({
            type: "youtube",
            props: { url: video.watchUrl, videoId: video.videoId },
        });
        setYoutubeOpen(false);
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold">
                    BlockNote PoC (Gutenberg feel)
                </h1>
                <Badge variant="secondary">{blockCount} blocks</Badge>
                <div className="flex-1" />
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLoadSample}
                >
                    Reload sample v1 HTML
                </Button>
            </div>
            {importError && (
                <Card className="border-destructive">
                    <CardContent className="pt-4 text-sm text-destructive">
                        Import failed: {importError}
                    </CardContent>
                </Card>
            )}

            {uploadError && (
                <Card className="border-destructive">
                    <CardContent className="pt-4 text-sm text-destructive">
                        Upload failed: {uploadError}
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                            <CardTitle className="text-lg">
                                Editor — slash menu (/), drag handles, side menu
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Paste, drag-n-drop, or use the image block (+)
                                to upload — JPEG/PNG/GIF/WebP/AVIF/SVG, max
                                10 MiB. Audio and video are inserted by URL.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setMediaKind("video")}
                            >
                                <Film className="mr-1 h-4 w-4" />
                                Video
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setMediaKind("audio")}
                            >
                                <Music className="mr-1 h-4 w-4" />
                                Audio
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setYoutubeOpen(true)}
                            >
                                <Youtube className="mr-1 h-4 w-4" />
                                YouTube
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <BlockNoteView
                        editor={editor}
                        onChange={() => syncOutputs(editor)}
                    />
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">
                            v2 block JSON → blogContentDelta
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-96">
                            {blockJson}
                        </pre>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">
                            Canonical HTML → blogContent
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-96 whitespace-pre-wrap">
                            {exportedHtml || "No content yet."}
                        </pre>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg">
                            Public preview — PostDetailPage renderer
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="p-6 bg-white/85 dark:bg-slate-800/55 shadow rounded">
                            <PostContentRenderer html={exportedHtml} />
                        </div>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg">
                            Raw blocksToFullHTML (editor chrome)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-96 whitespace-pre-wrap">
                            {fullHtml || "No content yet."}
                        </pre>
                    </CardContent>
                </Card>
            </div>

            <InsertMediaDialog
                kind={mediaKind}
                onOpenChange={(open) => {
                    if (!open) setMediaKind(null);
                }}
                onInsert={handleInsertMedia}
            />

            <InsertYouTubeDialog
                open={youtubeOpen}
                onOpenChange={setYoutubeOpen}
                onInsert={handleInsertYouTube}
            />
        </div>
    );
};

export default BlockNotePoc;
