import { Descendant, Element, Text } from "slate";

// Default empty editor value
export const EMPTY_EDITOR_VALUE: Descendant[] = [
    {
        type: "paragraph",
        children: [{ text: "" }],
    },
];

// Editor element types
export const ELEMENT_TYPES = {
    PARAGRAPH: "paragraph",
    HEADING_ONE: "heading-one",
    HEADING_TWO: "heading-two",
    HEADING_THREE: "heading-three",
    BLOCK_QUOTE: "block-quote",
    BULLETED_LIST: "bulleted-list",
    NUMBERED_LIST: "numbered-list",
    LIST_ITEM: "list-item",
    LINK: "link",
    IMAGE: "image",
    CODE_BLOCK: "code-block",
} as const;

// Text formatting marks
export const TEXT_MARKS = {
    BOLD: "bold",
    ITALIC: "italic",
    UNDERLINE: "underline",
    STRIKETHROUGH: "strikethrough",
    CODE: "code",
} as const;

// Text alignment options
export const TEXT_ALIGNMENTS = {
    LEFT: "left",
    CENTER: "center",
    RIGHT: "right",
    JUSTIFY: "justify",
} as const;

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
    BOLD: "mod+b",
    ITALIC: "mod+i",
    UNDERLINE: "mod+u",
    CODE: "mod+`",
    STRIKETHROUGH: "mod+shift+x",
    UNDO: "mod+z",
    REDO: "mod+shift+z",
} as const;

// Markdown shortcuts
export const MARKDOWN_SHORTCUTS = {
    HEADING_ONE: "#",
    HEADING_TWO: "##",
    HEADING_THREE: "###",
    BULLETED_LIST: ["*", "-"],
    NUMBERED_LIST: "1.",
    BLOCK_QUOTE: ">",
} as const;

// Helper function to check if a value is empty
export const isEditorEmpty = (value: Descendant[]): boolean => {
    if (!value || value.length === 0) return true;

    if (value.length === 1) {
        const firstNode = value[0];
        if (Element.isElement(firstNode) && firstNode.type === "paragraph") {
            if (firstNode.children.length === 1) {
                const firstChild = firstNode.children[0];
                if (Text.isText(firstChild)) {
                    return !firstChild.text || firstChild.text.trim() === "";
                }
            }
        }
    }

    return false;
};

// Helper function to get plain text from editor value
export const getPlainText = (value: Descendant[]): string => {
    return value
        .map((node) => {
            if (Text.isText(node)) {
                return node.text;
            }
            if (Element.isElement(node)) {
                return getPlainText(node.children as Descendant[]);
            }
            return "";
        })
        .join("\n");
};

// Helper function to count words in editor content
export const countWords = (value: Descendant[]): number => {
    const text = getPlainText(value);
    if (!text.trim()) return 0;

    return text
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0).length;
};

// Helper function to estimate reading time (words per minute)
export const estimateReadingTime = (
    value: Descendant[],
    wordsPerMinute: number = 200,
): number => {
    const wordCount = countWords(value);
    return Math.ceil(wordCount / wordsPerMinute);
};

// Helper function to truncate text for excerpts
export const truncateText = (text: string, maxLength: number = 150): string => {
    if (text.length <= maxLength) return text;

    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(" ");

    if (lastSpace > 0) {
        return truncated.substring(0, lastSpace) + "...";
    }

    return truncated + "...";
};

// Helper function to generate excerpt from editor content
export const generateExcerpt = (
    value: Descendant[],
    maxLength: number = 150,
): string => {
    const plainText = getPlainText(value);
    return truncateText(plainText, maxLength);
};

// Helper function to validate URL
export const isValidUrl = (url: string): boolean => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

// Helper function to check if URL is an image
export const isImageUrl = (url: string): boolean => {
    if (!isValidUrl(url)) return false;

    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i;
    return imageExtensions.test(url.toLowerCase());
};

// Helper function to check if URL is a video
export const isVideoUrl = (url: string): boolean => {
    if (!isValidUrl(url)) return false;

    const videoExtensions = /\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv)$/i;
    const videoHosts = /(youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com)/i;

    return videoExtensions.test(url.toLowerCase()) || videoHosts.test(url);
};

// Helper function to sanitize filename for slugs
export const sanitizeSlug = (text: string): string => {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
};

// Helper function to create initial value from HTML string
export const createValueFromHtml = (html: string): Descendant[] => {
    if (!html || html.trim() === "") {
        return EMPTY_EDITOR_VALUE;
    }

    // Basic HTML to Slate conversion
    // In a production app, you'd want to use a proper HTML parser
    const lines = html.split("\n").filter((line) => line.trim());

    if (lines.length === 0) {
        return EMPTY_EDITOR_VALUE;
    }

    return lines.map((line) => ({
        type: "paragraph",
        children: [{ text: line.trim() }],
    }));
};

// Helper function to create initial value from markdown string
export const createValueFromMarkdown = (markdown: string): Descendant[] => {
    if (!markdown || markdown.trim() === "") {
        return EMPTY_EDITOR_VALUE;
    }

    // Basic markdown to Slate conversion
    // In a production app, you'd want to use a proper markdown parser
    const lines = markdown.split("\n");
    const result: Descendant[] = [];

    for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed) {
            result.push({
                type: "paragraph",
                children: [{ text: "" }],
            });
            continue;
        }

        // Headers
        if (trimmed.startsWith("### ")) {
            result.push({
                type: "heading-three",
                children: [{ text: trimmed.substring(4) }],
            });
        } else if (trimmed.startsWith("## ")) {
            result.push({
                type: "heading-two",
                children: [{ text: trimmed.substring(3) }],
            });
        } else if (trimmed.startsWith("# ")) {
            result.push({
                type: "heading-one",
                children: [{ text: trimmed.substring(2) }],
            });
        }
        // Blockquote
        else if (trimmed.startsWith("> ")) {
            result.push({
                type: "block-quote",
                children: [{ text: trimmed.substring(2) }],
            });
        }
        // Lists (basic)
        else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
            result.push({
                type: "list-item",
                children: [{ text: trimmed.substring(2) }],
            });
        }
        // Default paragraph
        else {
            result.push({
                type: "paragraph",
                children: [{ text: trimmed }],
            });
        }
    }

    return result.length > 0 ? result : EMPTY_EDITOR_VALUE;
};

// History-related utility functions
export const canUndo = (editor: any): boolean => {
    return editor.history && editor.history.undos.length > 0;
};

export const canRedo = (editor: any): boolean => {
    return editor.history && editor.history.redos.length > 0;
};

// Helper function to get history state
export const getHistoryState = (editor: any) => {
    return {
        canUndo: canUndo(editor),
        canRedo: canRedo(editor),
        undoCount: editor.history?.undos?.length || 0,
        redoCount: editor.history?.redos?.length || 0,
    };
};

// Export types for TypeScript
export type ElementType = (typeof ELEMENT_TYPES)[keyof typeof ELEMENT_TYPES];
export type TextMark = (typeof TEXT_MARKS)[keyof typeof TEXT_MARKS];
export type TextAlignment =
    (typeof TEXT_ALIGNMENTS)[keyof typeof TEXT_ALIGNMENTS];
