import { useEffect, useMemo, useRef } from "react";

/**
 * The slice of a BlockNote editor this hook touches. Structural, so it accepts
 * editors created with any schema (the v2 schema adds custom blocks).
 */
export interface MediaBlockEditor {
    updateBlock(id: string, update: { props: { url: string } }): unknown;
    removeBlocks(ids: string[]): unknown;
}
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
    const editorRef = useRef<MediaBlockEditor | null>(null);
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
