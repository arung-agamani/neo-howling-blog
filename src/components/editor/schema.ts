import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { YouTubeBlock } from "./youtube/YouTubeBlock";

/**
 * The v2 editor's schema. Every editor instance must be created with this
 * schema: documents may contain `youtube` blocks, and an editor without the
 * spec cannot load them.
 *
 * Adding block types here is additive for existing content. Removing one is a
 * breaking change for anything already stored.
 */
export const editorSchema = BlockNoteSchema.create({
    blockSpecs: {
        ...defaultBlockSpecs,
        youtube: YouTubeBlock,
    },
});
