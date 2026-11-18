import { useMemo, useRef } from "react";
import type { BlockNoteEditor } from "@blocknote/core";
import { uploadEditorImage } from "./uploadEditorImage";

/**
 * uploadFile with instant visual feedback. Returns a blob: URL synchronously
 * (as a resolved promise) so BlockNote renders the image block immediately,
 * then swaps in the CDN URL once the presigned upload completes.
 *
 * Without this, paste/drop shows nothing until the full
 * initiate -> PUT -> process round-trip finishes.
 */
export function useInstantImageUpload() {
    const editorRef = useRef<BlockNoteEditor | null>(null);

    const uploadFile = useMemo(
        () =>
            async (file: File, blockId?: string): Promise<string> => {
                const previewUrl = URL.createObjectURL(file);
                const editor = editorRef.current;
                void uploadEditorImage(file)
                    .then((cdnUrl) => {
                        URL.revokeObjectURL(previewUrl);
                        if (editor && blockId) {
                            try {
                                editor.updateBlock(blockId, {
                                    props: { url: cdnUrl },
                                });
                            } catch {
                                // Block removed mid-upload; nothing to swap.
                            }
                        }
                    })
                    .catch(() => {
                        URL.revokeObjectURL(previewUrl);
                        if (editor && blockId) {
                            try {
                                editor.removeBlocks([blockId]);
                            } catch {
                                // Already gone; nothing to clean up.
                            }
                        }
                    });
                return previewUrl;
            },
        [],
    );

    return { editorRef, uploadFile };
}
