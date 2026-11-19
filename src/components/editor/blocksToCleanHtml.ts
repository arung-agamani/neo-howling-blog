import type {
    Block,
    BlockNoteEditor,
    BlockSchema,
    InlineContentSchema,
    StyleSchema,
} from "@blocknote/core";

/**
 * Serialize blocks to clean, semantic HTML for storage in posts.blogContent.
 *
 * Uses BlockNote's lossy external-HTML exporter (per-spec `toExternalHTML`:
 * plain <h1>/<p>/<ul>/<pre>/<img>, no editor DOM) then strips residual
 * `class` / `style` / `data-*` attributes so the output is a stable contract
 * for the public rehype pipeline (rehypeParse -> componentMap) rather than
 * a snapshot of editor internals.
 *
 * Structural exceptions (kept, allowlisted):
 * - <pre data-language="x"> on code blocks (language survives hljs; harmless to componentMap)
 * - <input type="checkbox"> checked state on checkListItem
 * - colspan/rowspan on <td>/<th>
 *
 * Semantic exceptions (kept, required for rendering):
 * - href/src/alt/title on <a>/<img>
 *
 * Everything else (bn-* wrappers, data-id/data-node-type, alignment spans,
 * color spans, highlight.js classes) is removed or unwrapped.
 */
export function blocksToCleanHtml<
    BSchema extends BlockSchema,
    ISchema extends InlineContentSchema,
    SSchema extends StyleSchema,
>(
    editor: BlockNoteEditor<BSchema, ISchema, SSchema>,
    blocks?: Block<BSchema, ISchema, SSchema>[],
): string {
    // ProseMirror trailing-break placeholder (U+FFFC OBJECT REPLACEMENT
    // CHARACTER). BlockNote's lossy exporter leaks it into empty blocks
    // (`<p>￼</p>`), which would render as a visible glyph. Never content.
    const raw = editor
        .blocksToHTMLLossy(blocks ?? editor.document)
        .replace(/￼/g, "");
    if (!raw.trim()) return "";

    const doc = new DOMParser().parseFromString(raw, "text/html");
    cleanNode(doc.body);
    return doc.body.innerHTML.trim();
}

const KEEP_ATTRS: Record<string, Record<string, true>> = {
    a: { href: true, title: true },
    img: { src: true, alt: true, title: true },
    pre: { "data-language": true },
    iframe: {
        src: true,
        title: true,
        allow: true,
        allowfullscreen: true,
        loading: true,
        referrerpolicy: true,
        width: true,
        height: true,
    },
    td: { colspan: true, rowspan: true },
    th: { colspan: true, rowspan: true },
};

const UNWRAP_TAGS: Record<string, true> = {
    span: true,
    font: true,
    div: true,
};
function cleanNode(root: ParentNode): void {
    const walker = root.ownerDocument!.createTreeWalker(
        root as Node,
        NodeFilter.SHOW_ELEMENT,
    );
    const elements: Element[] = [];
    let current = walker.nextNode() as Element | null;
    while (current) {
        elements.push(current);
        current = walker.nextNode() as Element | null;
    }
    // Innermost first so unwrapping never orphans processed children.
    for (let i = elements.length - 1; i >= 0; i--) {
        cleanElement(elements[i]);
    }
    pruneEmptyBlocks(root);
}

const PRUNE_TAGS: Record<string, true> = {
    p: true,
    h1: true,
    h2: true,
    h3: true,
    h4: true,
    h5: true,
    h6: true,
    li: true,
    blockquote: true,
};

function pruneEmptyBlocks(root: ParentNode): void {
    for (const el of [...root.children]) {
        if (!(el instanceof Element)) continue;
        const tag = el.tagName.toLowerCase();
        if (PRUNE_TAGS[tag] && el.textContent?.trim() === "") {
            el.remove();
        }
    }
}

function cleanElement(el: Element): void {
    const tag = el.tagName.toLowerCase();

    // Blob/data URLs are transient upload previews, never persisted content.
    // Drop the element so a mid-upload save can't store an unresolvable URL.
    if (
        (tag === "img" || tag === "video" || tag === "audio") &&
        /^(blob:|data:)/i.test(el.getAttribute("src") ?? "")
    ) {
        el.remove();
        return;
    }
    if (tag === "a" && /^(blob:|data:)/i.test(el.getAttribute("href") ?? "")) {
        el.replaceWith(...[...el.childNodes]);
        return;
    }
    if (tag === "input") {
        const input = el as HTMLInputElement;
        if (input.type === "checkbox") {
            // Normalize to bare checked/unchecked; drop disabled/classes.
            const checked = input.checked;
            for (const attr of [...el.attributes]) {
                el.removeAttribute(attr.name);
            }
            el.setAttribute("type", "checkbox");
            el.setAttribute("disabled", "");
            if (checked) el.setAttribute("checked", "");
            return;
        }
    }

    if (UNWRAP_TAGS[tag]) {
        // Drop pure styling wrappers, keep content (bn spans, color spans).
        // Keep spans carrying semantic attrs (e.g. <span id="anchor">).
        if (el.attributes.length === 0) {
            el.replaceWith(...[...el.childNodes]);
            return;
        }
    }

    const keep = KEEP_ATTRS[tag];
    for (const attr of [...el.attributes]) {
        const name = attr.name.toLowerCase();
        if (
            name === "class" ||
            name === "style" ||
            name.startsWith("data-")
        ) {
            if (!keep?.[name]) el.removeAttribute(attr.name);
            continue;
        }
        if (name.startsWith("on")) el.removeAttribute(attr.name);
        if (keep && !keep[name]) el.removeAttribute(attr.name);
    }
}
