import type {
    BlockNoteEditor,
    BlockSchema,
    InlineContentSchema,
    PartialBlock,
    StyleSchema,
} from "@blocknote/core";
import { blocksToCleanHtml } from "./blocksToCleanHtml";

/** Version tag stored inside `posts.blogContentDelta`. */
export const BLOCK_DOCUMENT_VERSION = "v2";

export interface EditorSnapshot {
    /** Canonical HTML stored in `posts.blogContent`. */
    blogContent: string;
    /** Block JSON stored in `posts.blogContentDelta`. */
    blogContentDelta: string;
    wordCount: number;
    /** True when the document is a single empty paragraph. */
    isEmpty: boolean;
}

/** Recursively collects text from blocks/inline content without assuming a schema. */
function collectText(node: unknown, parts: string[]): void {
    if (Array.isArray(node)) {
        for (const child of node) collectText(child, parts);
        return;
    }
    if (!node || typeof node !== "object") return;

    const record = node as Record<string, unknown>;
    if (typeof record.text === "string") parts.push(record.text);
    if (Array.isArray(record.content)) collectText(record.content, parts);
    if (Array.isArray(record.children)) collectText(record.children, parts);
}

export function countWords(blocks: unknown): number {
    if (!Array.isArray(blocks)) return 0;
    const parts: string[] = [];
    collectText(blocks, parts);
    const text = parts.join(" ").trim();
    return text ? text.split(/\s+/).length : 0;
}

function isDocumentEmpty(
    document: ReadonlyArray<{ type: string }>,
    wordCount: number,
): boolean {
    return (
        document.length === 1 &&
        document[0]?.type === "paragraph" &&
        wordCount === 0
    );
}

export function buildSnapshot<
    B extends BlockSchema,
    I extends InlineContentSchema,
    S extends StyleSchema,
>(editor: BlockNoteEditor<B, I, S>): EditorSnapshot {
    const blocks = editor.document;
    const wordCount = countWords(blocks);

    return {
        blogContent: blocksToCleanHtml(editor, blocks),
        blogContentDelta: JSON.stringify({
            version: BLOCK_DOCUMENT_VERSION,
            blocks,
        }),
        wordCount,
        isEmpty: isDocumentEmpty(blocks, wordCount),
    };
}

/**
 * Blocks from a stored `blogContentDelta` payload, or null when absent or
 * malformed. BlockNote validates and normalizes block shapes on insert, and
 * callers fall back to HTML if that throws.
 */
export function parseStoredBlocks<
    B extends BlockSchema,
    I extends InlineContentSchema,
    S extends StyleSchema,
>(
    deltaJson: string | null | undefined,
): PartialBlock<B, I, S>[] | null {
    if (!deltaJson) return null;

    let parsed: unknown;
    try {
        parsed = JSON.parse(deltaJson);
    } catch {
        return null;
    }

    if (!parsed || typeof parsed !== "object" || !("blocks" in parsed)) {
        return null;
    }

    const blocks = (parsed as { blocks: unknown }).blocks;
    if (!Array.isArray(blocks) || blocks.length === 0) return null;

    // Trusted enough to attempt: the value round-tripped through this editor.
    return blocks as PartialBlock<B, I, S>[];
}

/**
 * Resolve the content to load for a post: the stored block JSON when present,
 * otherwise the legacy HTML. Returns null when neither yields blocks.
 */
export function resolveInitialBlocks<
    B extends BlockSchema,
    I extends InlineContentSchema,
    S extends StyleSchema,
>(
    editor: BlockNoteEditor<B, I, S>,
    deltaJson: string | null | undefined,
    html: string | null | undefined,
): PartialBlock<B, I, S>[] | null {
    const stored = parseStoredBlocks<B, I, S>(deltaJson);
    if (stored) return stored;

    if (html && html.trim()) {
        const parsed = editor.tryParseHTMLToBlocks(html);
        if (parsed.length > 0) return parsed;
    }

    return null;
}
