"use client";
import { Dispatch, SetStateAction, useEffect, useMemo, useRef } from "react";
import ReactQuill, { Quill } from "react-quill-new";
import QuillMarkdown from "quilljs-markdown";
import QuillBlotFormatter from "quill-blot-formatter";
import { toast } from "react-toastify";
import "quilljs-markdown/dist/quilljs-markdown-common-style.css";
import "react-quill-new/dist/quill.snow.css";
import "./EditorOverride.css";
import { buildS3Url, APP_BAR_HEIGHT } from "@/constants";
import { PostMetadata } from "@/types";

interface Props {
    page: PostMetadata;
    setPage: Dispatch<SetStateAction<PostMetadata>>;
    content: string;
    setContent: Dispatch<SetStateAction<string>>;
    setHasUnsavedChanges: Dispatch<SetStateAction<boolean>>;
}

Quill.register("modules/QuillMarkdown", QuillMarkdown, true);
Quill.register("modules/blotFormatter", QuillBlotFormatter, true);

async function uploadFile(file: File): Promise<string> {
    const date = new Date();
    const buf = new Uint8Array(4);
    const randPrefix = Buffer.from(crypto.getRandomValues(buf)).toString("hex");
    const filename = `${randPrefix}_${file.name}`;

    const s3Url = buildS3Url(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
        filename,
    );

    // Check if file already exists
    try {
        const head = await fetch(s3Url, { method: "HEAD" });
        if (head.ok) {
            toast.info(`File ${filename} has already been uploaded.`);
            return s3Url;
        }
    } catch {
        // File doesn't exist, continue with upload
    }

    toast.info(`Uploading ${file.name}...`);

    try {
        const presignedUrlResponse = await fetch(
            `${window.location.origin}/api/v1/assets`,
            {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    name: filename,
                    size: file.size,
                    mime: file.type,
                    date: {
                        year: date.getFullYear(),
                        month: date.getMonth() + 1,
                        day: date.getDate(),
                    },
                }),
            },
        );

        const presignedUrl = await presignedUrlResponse.json();

        const uploadResponse = await fetch(presignedUrl.data, {
            method: "PUT",
            headers: {
                "Content-Length": String(file.size),
            },
            body: file,
        });

        if (!uploadResponse.ok) {
            throw new Error(
                `Upload failed with status ${uploadResponse.status}`,
            );
        }

        toast.success(`File ${file.name} has been successfully uploaded`);
        return s3Url;
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
        const clipboard = event.clipboardData;
        if (!clipboard?.items) return;

        const IMAGE_MIME_REGEX = /^image\/(jpe?g|gif|png|svg|webp)$/i;

        for (let i = 0; i < clipboard.items.length; i++) {
            const item = clipboard.items[i];
            if (IMAGE_MIME_REGEX.test(item.type)) {
                const file = item.getAsFile();
                if (file) {
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    handleImageInsert(file);
                    break;
                }
            }
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
