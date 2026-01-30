"use client";
import { Dispatch, SetStateAction, useEffect, useMemo, useRef } from "react";
import ReactQuill, { Quill } from "react-quill-new";
import QuillMarkdown from "quilljs-markdown";
import QuillBlotFormatter from "quill-blot-formatter";
import { toast } from "react-toastify";
import "quilljs-markdown/dist/quilljs-markdown-common-style.css";
import "react-quill-new/dist/quill.snow.css";
import "./EditorOverride.css";
import { APP_BAR_HEIGHT } from "@/constants";
import { PostMetadata } from "@/types";
import {
    initiateUpload,
    uploadToPresignedUrl,
    processUpload,
} from "@/components/Dashboard/MediaLibrary/api";
import type { PostProcessingOperation } from "@/components/Dashboard/MediaLibrary/types";

interface Props {
    page: PostMetadata;
    setPage: Dispatch<SetStateAction<PostMetadata>>;
    content: string;
    setContent: Dispatch<SetStateAction<string>>;
    setHasUnsavedChanges: Dispatch<SetStateAction<boolean>>;
}

Quill.register("modules/QuillMarkdown", QuillMarkdown, true);
Quill.register("modules/blotFormatter", QuillBlotFormatter, true);

// Default post-processing: convert to JPEG with quality 100
const DEFAULT_POST_PROCESSINGS: PostProcessingOperation[] = [
    {
        type: "convertFormat",
        config: {
            format: "jpeg",
            quality: 100,
        },
    },
];

// Default tags for media uploaded from editor
const DEFAULT_TAGS = ["post-media"];

/**
 * Check if a string is a valid image URL
 */
function isValidImageUrl(text: string): boolean {
    if (!text) return false;

    try {
        const url = new URL(text);

        // Must be http or https
        if (!["http:", "https:"].includes(url.protocol)) {
            return false;
        }

        // Get pathname without query string
        const pathname = url.pathname.toLowerCase();

        // Check for common image extensions
        const imageExtensions = [
            ".jpg",
            ".jpeg",
            ".png",
            ".gif",
            ".webp",
            ".svg",
            ".bmp",
            ".avif",
            ".ico",
            ".tiff",
            ".tif",
        ];

        return imageExtensions.some((ext) => pathname.endsWith(ext));
    } catch {
        return false;
    }
}

/**
 * Upload file using the /api/v1/media flow with resource tracking and tagging
 */
async function uploadFile(file: File): Promise<string> {
    toast.info(`Uploading ${file.name}...`);

    try {
        // Step 1: Initiate upload to get presigned URL and asset ID
        const initiateResponse = await initiateUpload({
            filename: file.name,
            mimeType: file.type,
            fileSize: file.size,
            tags: DEFAULT_TAGS,
        });

        if (!initiateResponse.success) {
            throw new Error(
                initiateResponse.message || "Failed to initiate upload",
            );
        }

        const { assetId, uploadUrl } = initiateResponse.data;

        // Step 2: Upload file directly to S3 using presigned URL
        await uploadToPresignedUrl(uploadUrl, file);

        // Step 3: Process the uploaded asset with post-processing
        const processResponse = await processUpload(assetId, {
            generateVariants: false,
            postProcessings: DEFAULT_POST_PROCESSINGS,
        });

        if (!processResponse.success) {
            throw new Error(
                processResponse.message || "Failed to process upload",
            );
        }

        toast.success(`File ${file.name} has been successfully uploaded`);

        // Return the final URL from the processed asset (already CDN-rewritten)
        return processResponse.data.url;
    } catch (error) {
        toast.error(`Error when uploading ${file.name}`);
        console.error(error);
        throw new Error("Upload failed. Check logs");
    }
}

const Editor: React.FC<Props> = ({
    content,
    setHasUnsavedChanges,
    setContent,
}) => {
    const quillRef = useRef<ReactQuill | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const imageHandler = () => {
        if (!quillRef.current) return;

        const editor = quillRef.current.getEditor();
        const range = editor.getSelection();
        const value = prompt("Please enter image url");
        if (value && range) {
            editor.insertEmbed(range.index, "image", value, "user");
        }
    };

    const handleImageInsert = async (file: File) => {
        if (!quillRef.current) return;

        const editor = quillRef.current.getEditor();
        const range = editor.getSelection() || { index: editor.getLength() };

        // Insert a placeholder image (loading indicator)
        const placeholderUrl =
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3EUploading...%3C/text%3E%3C/svg%3E";
        editor.insertEmbed(range.index, "image", placeholderUrl, "user");

        try {
            const imageUrl = await uploadFile(file);

            // Find and replace the placeholder with the actual image
            const currentContents = editor.getContents();
            let placeholderIndex = -1;

            // Find the placeholder image
            currentContents.ops.forEach((op, index) => {
                if (
                    typeof op.insert === "object" &&
                    op.insert !== null &&
                    "image" in op.insert &&
                    op.insert.image === placeholderUrl
                ) {
                    // Calculate the actual position in the editor
                    let position = 0;
                    for (let i = 0; i < index; i++) {
                        const insertOp = currentContents.ops[i].insert;
                        if (typeof insertOp === "string") {
                            position += insertOp.length;
                        } else {
                            position += 1;
                        }
                    }
                    placeholderIndex = position;
                }
            });

            if (placeholderIndex !== -1) {
                // Delete the placeholder
                editor.deleteText(placeholderIndex, 1, "silent");
                // Insert the actual image at the same position
                editor.insertEmbed(placeholderIndex, "image", imageUrl, "user");
                // Move cursor after the image
                editor.setSelection(placeholderIndex + 1, 0);
            } else {
                // Fallback: just insert at current position if placeholder not found
                editor.insertEmbed(range.index + 1, "image", imageUrl, "user");
                editor.setSelection(range.index + 2, 0);
            }
        } catch (error) {
            console.error("Failed to upload image:", error);
            // Remove placeholder on error
            const currentContents = editor.getContents();
            let placeholderIndex = -1;

            currentContents.ops.forEach((op, index) => {
                if (
                    typeof op.insert === "object" &&
                    op.insert !== null &&
                    "image" in op.insert &&
                    op.insert.image === placeholderUrl
                ) {
                    let position = 0;
                    for (let i = 0; i < index; i++) {
                        const insertOp = currentContents.ops[i].insert;
                        if (typeof insertOp === "string") {
                            position += insertOp.length;
                        } else {
                            position += 1;
                        }
                    }
                    placeholderIndex = position;
                }
            });

            if (placeholderIndex !== -1) {
                editor.deleteText(placeholderIndex, 1, "silent");
            }
        }
    };

    const handleDrop = (event: DragEvent) => {
        // Prevent all default drop behavior first
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        if (!event.dataTransfer?.files?.length) return;

        const file = event.dataTransfer.files[0];
        if (!file.type.startsWith("image/")) return;

        // Set cursor position at drop location
        if (quillRef.current) {
            const editor = quillRef.current.getEditor();
            if (document.caretRangeFromPoint) {
                const caretRange = document.caretRangeFromPoint(
                    event.clientX,
                    event.clientY,
                );
                if (caretRange) {
                    const selection = document.getSelection();
                    if (selection) {
                        selection.setBaseAndExtent(
                            caretRange.startContainer,
                            caretRange.startOffset,
                            caretRange.startContainer,
                            caretRange.startOffset,
                        );
                    }
                }
            }
            editor.focus();
        }

        handleImageInsert(file);
    };

    const handlePaste = (event: ClipboardEvent) => {
        if (!quillRef.current) return;

        const clipboard = event.clipboardData;
        if (!clipboard) return;

        const IMAGE_MIME_REGEX = /^image\/(jpe?g|gif|png|svg|webp)$/i;

        // Check for image files first (e.g., screenshot paste)
        if (clipboard.items) {
            for (let i = 0; i < clipboard.items.length; i++) {
                const item = clipboard.items[i];
                if (IMAGE_MIME_REGEX.test(item.type)) {
                    const file = item.getAsFile();
                    if (file) {
                        event.preventDefault();
                        event.stopPropagation();
                        event.stopImmediatePropagation();
                        handleImageInsert(file);
                        return;
                    }
                }
            }
        }

        // Check for pasted text that is an image URL
        const pastedText = clipboard.getData("text/plain")?.trim();
        if (pastedText && isValidImageUrl(pastedText)) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            const editor = quillRef.current.getEditor();
            const range = editor.getSelection() || {
                index: editor.getLength(),
            };
            editor.insertEmbed(range.index, "image", pastedText, "user");
            editor.setSelection(range.index + 1, 0);
        }
    };

    // Set up drag-drop and paste handlers
    useEffect(() => {
        if (!quillRef.current) return;

        const editor = quillRef.current.getEditor();
        const editorRoot = editor.root;

        editorRoot.addEventListener("drop", handleDrop as EventListener, true);
        editorRoot.addEventListener(
            "paste",
            handlePaste as EventListener,
            true,
        );

        return () => {
            editorRoot.removeEventListener(
                "drop",
                handleDrop as EventListener,
                true,
            );
            editorRoot.removeEventListener(
                "paste",
                handlePaste as EventListener,
                true,
            );
        };
    }, []);

    const quillModule = useMemo(
        () => ({
            toolbar: {
                container: [
                    [{ header: [1, 2, 3, 4, 5, 6, false] }],
                    ["bold", "italic", "underline", "strike"],
                    ["blockquote", "code-block"],
                    [{ size: ["small", false, "large", "huge"] }],
                    [
                        { list: "ordered" },
                        { list: "bullet" },
                        { indent: "-1" },
                        { indent: "+1" },
                    ],
                    [{ align: [] }],
                    ["link", "image"],
                    ["clean"],
                ],
                handlers: {
                    image: imageHandler,
                },
            },

            QuillMarkdown: {},
            blotFormatter: true,
            syntax: true,
        }),
        [],
    );

    useEffect(() => {
        // Use ref-based approach instead of direct DOM manipulation
        if (!containerRef.current) return;

        const toolbar = containerRef.current.querySelector(".ql-toolbar");
        const qlContainer = containerRef.current.querySelector(
            ".ql-container",
        ) as HTMLDivElement | null;

        if (!toolbar || !qlContainer) return;

        const toolbarHeight = toolbar.clientHeight;
        qlContainer.style.maxHeight = `${
            window.innerHeight - toolbarHeight - APP_BAR_HEIGHT
        }px`;
    }, []);

    return (
        <div ref={containerRef} className="h-full">
            <ReactQuill
                className="bg-white post h-full overflow-y-hidden"
                value={content}
                onChange={(newContent: string) => {
                    setHasUnsavedChanges(true);
                    setContent(newContent);
                }}
                modules={quillModule}
                ref={quillRef}
            />
        </div>
    );
};

export default Editor;
