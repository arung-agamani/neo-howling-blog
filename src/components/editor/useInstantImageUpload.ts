import { useEffect, useMemo, useRef } from "react";
import type { BlockNoteEditor } from "@blocknote/core";
import {
    uploadEditorImage,
    type EditorUploadLimits,
} from "./uploadEditorImage";

/**
 * uploadFile with instant visual feedback. Returns a blob: URL synchronously
 * (as a resolved promise) so BlockNote renders the image block immediately,
 * then swaps in the CDN URL once the presigned upload completes.
 *
 * Without this, paste/drop shows nothing until the full
 * initiate -> PUT -> process round-trip finishes.
 *
 * Limits are read through a ref so a late-arriving config does not change
 * `uploadFile` identity and force the editor to be recreated.
 */
export function useInstantImageUpload(limits: EditorUploadLimits) {
    const editorRef = useRef<BlockNoteEditor | null>(null);
    const limitsRef = useRef(limits);

    useEffect(() => {
        limitsRef.current = limits;
    }, [limits]);

    const uploadFile = useMemo(
        () =>
            async (file: File, blockId?: string): Promise<string> => {
                const currentLimits = limitsRef.current;
                if (!currentLimits.enabled) {
                    throw new Error("Editor image uploads are disabled.");
                }

                const previewUrl = URL.createObjectURL(file);
                const editor = editorRef.current;
                void uploadEditorImage(file, currentLimits)
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
