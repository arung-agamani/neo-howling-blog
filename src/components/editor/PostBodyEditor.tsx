"use client";

import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from "react";
import { BlockNoteEditor } from "@blocknote/core";
import type { PartialBlock } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";
import "./editor.css";
import { AlertCircle, Film, Music, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditorUploadConfig } from "@/hooks/api/useEditorUploadConfig";
import { useInstantImageUpload } from "./useInstantImageUpload";
import { OPTIMISTIC_UPLOAD_LIMITS } from "./uploadEditorImage";
import { editorSchema } from "./schema";
import InsertMediaDialog, { nameFromUrl } from "./InsertMediaDialog";
import type { MediaKind } from "./InsertMediaDialog";
import InsertYouTubeDialog from "./InsertYouTubeDialog";
import type { YouTubeVideo } from "./youtube/parseYouTubeUrl";
import {
    buildSnapshot,
    countWords,
    resolveInitialBlocks,
} from "./postEditorUtils";
import type { EditorSnapshot } from "./postEditorUtils";

export interface PostBodyEditorChange {
    wordCount: number;
    isEmpty: boolean;
    /** `load` marks the initial hydration, so it must not mark the post dirty. */
    reason: "edit" | "load";
}

export interface PostBodyEditorHandle {
    /** Serialize the current document for saving; null before load. */
    getSnapshot: () => EditorSnapshot | null;
    /** The contenteditable element, for caret/scroll coordination. */
    getEditorElement: () => HTMLElement | null;
}

interface PostBodyEditorProps {
    /** Changes when a different post is opened; controls initial loading. */
    contentKey: string;
    /** False while the post query is still in flight. */
    ready: boolean;
    initialDeltaJson?: string | null;
    initialHtml?: string | null;
    onChange?: (change: PostBodyEditorChange) => void;
    /** Fires once the editor's DOM exists and is safe to measure. */
    onEditorReady?: () => void;
}

type InsertableBlock = PartialBlock<
    typeof editorSchema.blockSchema,
    typeof editorSchema.inlineContentSchema,
    typeof editorSchema.styleSchema
>;

const PostBodyEditor = forwardRef<PostBodyEditorHandle, PostBodyEditorProps>(
    function PostBodyEditor(
        {
            contentKey,
            ready,
            initialDeltaJson,
            initialHtml,
            onChange,
            onEditorReady,
        },
        ref,
    ) {
        const [uploadError, setUploadError] = useState<string | null>(null);
        const [mediaKind, setMediaKind] = useState<MediaKind | null>(null);
        const [youtubeOpen, setYoutubeOpen] = useState(false);

        const { data: uploadConfig } = useEditorUploadConfig();
        const limits = useMemo(
            () =>
                uploadConfig
                    ? {
                          enabled: uploadConfig.config.enabled,
                          maxBytes: uploadConfig.config.maxBytes,
                          allowedMimeTypes:
                              uploadConfig.config.allowedMimeTypes,
                      }
                    : OPTIMISTIC_UPLOAD_LIMITS,
            [uploadConfig],
        );

        const { editorRef, uploadFile } = useInstantImageUpload(limits);

        const editor = useMemo(
            () =>
                BlockNoteEditor.create({
                    schema: editorSchema,
                    uploadFile,
                }),
            // eslint-disable-next-line react-hooks/exhaustive-deps
            [],
        );

        useEffect(() => {
            editorRef.current = editor;
        }, [editor, editorRef]);

        // BlockNoteView assigns `editor.domElement` during mount; wait a frame
        // so measurements and observers have a real element.
        useEffect(() => {
            const frame = requestAnimationFrame(() => {
                onEditorReady?.();
            });
            return () => cancelAnimationFrame(frame);
        }, [editor, onEditorReady]);

        useImperativeHandle(
            ref,
            () => ({
                getSnapshot: () => buildSnapshot(editor),
                getEditorElement: () => editor.domElement ?? null,
            }),
            [editor],
        );

        // Load once per post key, after the query resolves.
        const loadedKeyRef = useRef<string | null>(null);
        const suppressChangeRef = useRef(false);
        useEffect(() => {
            if (!ready || loadedKeyRef.current === contentKey) return;
            loadedKeyRef.current = contentKey;

            const blocks = resolveInitialBlocks(
                editor,
                initialDeltaJson,
                initialHtml,
            );
            if (!blocks) return;

            suppressChangeRef.current = true;
            try {
                editor.replaceBlocks(editor.document, blocks);
            } catch (error) {
                console.error("Failed to load stored block content", error);
                setUploadError(
                    "Stored block content could not be loaded; the HTML was used as a fallback.",
                );
                if (initialHtml?.trim()) {
                    editor.replaceBlocks(
                        editor.document,
                        editor.tryParseHTMLToBlocks(initialHtml),
                    );
                }
            }
            // Clear after the change events from the replace have fired.
            setTimeout(() => {
                suppressChangeRef.current = false;
            }, 0);
        }, [editor, ready, contentKey, initialDeltaJson, initialHtml]);

        useEffect(() => {
            const onRejected = (event: PromiseRejectionEvent) => {
                const reason = event.reason;
                const message =
                    reason instanceof Error ? reason.message : String(reason);
                if (/upload|image|media|presigned/i.test(message)) {
                    setUploadError(message);
                }
            };
            window.addEventListener("unhandledrejection", onRejected);
            return () =>
                window.removeEventListener("unhandledrejection", onRejected);
        }, []);

        // Newly inserted media can land below the fold; bring it into view so
        // the writer sees what was added.
        const revealBlock = (blockId: string) => {
            const reduceMotion = window.matchMedia(
                "(prefers-reduced-motion: reduce)",
            ).matches;
            requestAnimationFrame(() => {
                editor.domElement
                    ?.querySelector(`[data-id="${blockId}"]`)
                    ?.scrollIntoView({
                        behavior: reduceMotion ? "auto" : "smooth",
                        block: "center",
                    });
            });
        };

        const insertBlockAtCursor = (block: InsertableBlock) => {
            let insertedId: string | undefined;
            try {
                const cursor = editor.getTextCursorPosition().block;
                const isEmptyParagraph =
                    Array.isArray(cursor.content) &&
                    cursor.content.length === 0;
                insertedId = isEmptyParagraph
                    ? editor.updateBlock(cursor.id, block).id
                    : editor.insertBlocks([block], cursor, "after")[0]?.id;
            } catch {
                const lastBlock =
                    editor.document[editor.document.length - 1];
                insertedId = editor.insertBlocks(
                    [block],
                    lastBlock,
                    "after",
                )[0]?.id;
            }
            if (insertedId) revealBlock(insertedId);
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

        const handleChange = () => {
            const blocks = editor.document;
            const words = countWords(blocks);
            onChange?.({
                wordCount: words,
                isEmpty:
                    blocks.length === 1 &&
                    blocks[0]?.type === "paragraph" &&
                    words === 0,
                reason: suppressChangeRef.current ? "load" : "edit",
            });
        };

        return (
            <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs font-normal text-muted-foreground"
                        onClick={() => setMediaKind("video")}
                    >
                        <Film className="mr-1.5 h-3.5 w-3.5" />
                        Video
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs font-normal text-muted-foreground"
                        onClick={() => setMediaKind("audio")}
                    >
                        <Music className="mr-1.5 h-3.5 w-3.5" />
                        Audio
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs font-normal text-muted-foreground"
                        onClick={() => setYoutubeOpen(true)}
                    >
                        <Youtube className="mr-1.5 h-3.5 w-3.5" />
                        YouTube
                    </Button>
                    <span className="ml-auto hidden text-xs text-muted-foreground sm:inline">
                        Type / for blocks · paste or drop images to upload
                    </span>
                </div>

                {uploadError && (
                    <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span className="flex-1">{uploadError}</span>
                        <button
                            type="button"
                            className="underline"
                            onClick={() => setUploadError(null)}
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                <BlockNoteView
                    editor={editor}
                    onChange={handleChange}
                    className="min-h-[50vh]"
                />

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
    },
);

export default PostBodyEditor;
