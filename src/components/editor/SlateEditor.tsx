"use client";

import React, {
    useCallback,
    useMemo,
    useState,
    useEffect,
    useRef,
} from "react";
import {
    createEditor,
    Descendant,
    Editor,
    Element as SlateElement,
    Text as SlateText,
    Transforms,
    Range,
    Point,
    BaseEditor,
} from "slate";
import { withReact, Slate, Editable, ReactEditor, useSlate } from "slate-react";
import { withHistory, HistoryEditor } from "slate-history";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Code,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Quote,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Link,
    Image,
    Undo,
    Redo,
} from "lucide-react";
import { canRedo, canUndo } from "./utils";

// Type definitions
declare module "slate" {
    interface CustomTypes {
        Editor: BaseEditor & ReactEditor & HistoryEditor;
        Element: CustomElement;
        Text: CustomText;
    }
}

type CustomElement = {
    type:
        | "paragraph"
        | "heading-one"
        | "heading-two"
        | "heading-three"
        | "block-quote"
        | "bulleted-list"
        | "numbered-list"
        | "list-item"
        | "image";
    align?: string;
    url?: string;
    children: CustomText[];
};

type CustomText = {
    text: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    code?: boolean;
    link?: string; // URL for links
};

// Hotkeys configuration
const HOTKEYS = {
    "mod+b": "bold",
    "mod+i": "italic",
    "mod+u": "underline",
    "mod+s": "strikethrough",
    "mod+`": "code",
} as const;

const LIST_TYPES = ["numbered-list", "bulleted-list"];
const TEXT_ALIGN_TYPES = ["left", "center", "right", "justify"];

interface SlateEditorProps {
    value: Descendant[];
    onChange: (value: Descendant[]) => void;
    onHtmlChange?: (html: string) => void;
    placeholder?: string;
    readOnly?: boolean;
}

// HTML serialization functions
const escapeHtml = (text: string): string => {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
};

const serializeNodeToHtml = (node: any): string => {
    if (SlateText.isText(node)) {
        let text = escapeHtml(node.text);

        if (node.bold) {
            text = `<strong>${text}</strong>`;
        }
        if (node.italic) {
            text = `<em>${text}</em>`;
        }
        if (node.underline) {
            text = `<u>${text}</u>`;
        }
        if (node.strikethrough) {
            text = `<s>${text}</s>`;
        }
        if (node.code) {
            text = `<code>${text}</code>`;
        }
        if (node.link) {
            text = `<a href="${escapeHtml(node.link)}" target="_blank" rel="noopener noreferrer">${text}</a>`;
        }

        return text;
    }

    const children = node.children.map(serializeNodeToHtml).join("");

    switch (node.type) {
        case "paragraph":
            return `<p>${children}</p>`;
        case "heading-one":
            return `<h1>${children}</h1>`;
        case "heading-two":
            return `<h2>${children}</h2>`;
        case "heading-three":
            return `<h3>${children}</h3>`;
        case "block-quote":
            return `<blockquote>${children}</blockquote>`;
        case "bulleted-list":
            return `<ul>${children}</ul>`;
        case "numbered-list":
            return `<ol>${children}</ol>`;
        case "list-item":
            return `<li>${children}</li>`;
        case "image":
            return `<img src="${escapeHtml(node.url)}" alt="" />`;
        default:
            return children;
    }
};

const serializeToHtml = (nodes: Descendant[]): string => {
    return nodes.map(serializeNodeToHtml).join("");
};

// Hotkey detection
const isHotkey = (
    hotkey: string,
    event: KeyboardEvent | React.KeyboardEvent,
): boolean => {
    const keys = hotkey.split("+");
    const modKey = keys.includes("mod");
    const shiftKey = keys.includes("shift");
    const altKey = keys.includes("alt");
    const ctrlKey = keys.includes("ctrl");

    const actualKey = keys.find(
        (key) => !["mod", "shift", "alt", "ctrl"].includes(key),
    );

    const isModPressed = modKey
        ? navigator.platform.match("Mac")
            ? event.metaKey
            : event.ctrlKey
        : true;

    return (
        (!modKey || isModPressed) &&
        (!shiftKey || event.shiftKey) &&
        (!altKey || event.altKey) &&
        (!ctrlKey || event.ctrlKey) &&
        event.key.toLowerCase() === actualKey?.toLowerCase()
    );
};

// Selection Toolbar Component
const SelectionToolbar = () => {
    const editor = useSlate();
    const toolbarRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState("");

    useEffect(() => {
        const { selection } = editor;

        if (
            !selection ||
            Range.isCollapsed(selection) ||
            !ReactEditor.isFocused(editor)
        ) {
            setIsVisible(false);
            return;
        }

        // Check if we have text selected
        const text = Editor.string(editor, selection);
        if (!text.trim()) {
            setIsVisible(false);
            return;
        }

        setIsVisible(true);

        // Position the toolbar
        const domSelection = window.getSelection();
        if (domSelection && domSelection.rangeCount > 0) {
            const domRange = domSelection.getRangeAt(0);
            const rect = domRange.getBoundingClientRect();

            if (toolbarRef.current) {
                const toolbar = toolbarRef.current;
                toolbar.style.top = `${rect.top - toolbar.offsetHeight - 8}px`;
                toolbar.style.left = `${rect.left + rect.width / 2 - toolbar.offsetWidth / 2}px`;
            }
        }
    }, [editor.selection, editor]);

    const handleMakeLink = () => {
        setLinkDialogOpen(true);
    };

    const insertLink = () => {
        if (!linkUrl || !editor.selection) return;

        // Apply link formatting to selected text
        Transforms.setNodes(
            editor,
            { link: linkUrl },
            {
                match: (n) => SlateText.isText(n),
                split: true,
            },
        );

        // Collapse selection to end and remove active marks to prevent extension
        Transforms.collapse(editor, { edge: "end" });

        // Remove all marks including link to prevent extension
        Editor.removeMark(editor, "link");

        setLinkUrl("");
        setLinkDialogOpen(false);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <>
            <div
                ref={toolbarRef}
                className="fixed z-50 bg-gray-900 text-white rounded-lg shadow-lg px-2 py-1 flex items-center gap-1"
                style={{ position: "fixed" }}
            >
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-gray-700 h-8 px-2"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        toggleMark(editor, "bold");
                    }}
                >
                    <Bold size={14} />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-gray-700 h-8 px-2"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        toggleMark(editor, "italic");
                    }}
                >
                    <Italic size={14} />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-gray-700 h-8 px-2"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        handleMakeLink();
                    }}
                >
                    <Link size={14} />
                </Button>
            </div>

            <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Link</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="link-url">URL</Label>
                            <Input
                                id="link-url"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                placeholder="https://example.com"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        insertLink();
                                    }
                                }}
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={insertLink}
                                disabled={!linkUrl.trim()}
                            >
                                Add Link
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setLinkDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

// Editor plugin to handle link context properly
const withLinkHandling = (editor: Editor) => {
    const { insertText } = editor;

    editor.insertText = (text: string) => {
        const { selection } = editor;

        // If we have active link marks and we're typing at the end of a text node,
        // we need to remove the link mark to prevent extension
        if (selection && Range.isCollapsed(selection)) {
            const marks = Editor.marks(editor);

            if (marks && marks.link) {
                // Check if we're at the end of a text node with link formatting
                const [match] = Array.from(
                    Editor.nodes(editor, {
                        at: selection,
                        match: (n) => SlateText.isText(n) && !!(n as any).link,
                    }),
                );

                if (match) {
                    const [node, path] = match;
                    const end = Editor.end(editor, path);

                    // If we're at the end, remove link mark before inserting
                    if (Point.equals(selection.anchor, end)) {
                        Editor.removeMark(editor, "link");
                    }
                }
            }
        }

        insertText(text);
    };

    return editor;
};

// Custom editor with markdown shortcuts
const withMarkdownShortcuts = (editor: Editor) => {
    const { insertBreak, insertText } = editor;

    editor.insertBreak = () => {
        const { selection } = editor;
        if (!selection) return insertBreak();

        const matchNodes = Array.from(
            Editor.nodes(editor, {
                match: (n) =>
                    SlateElement.isElement(n) && Editor.isBlock(editor, n),
            }),
        );

        if (matchNodes.length > 0) {
            const [node, path] = matchNodes[0];

            // Handle heading behavior - create new paragraph below
            if (
                SlateElement.isElement(node) &&
                (node.type === "heading-one" ||
                    node.type === "heading-two" ||
                    node.type === "heading-three")
            ) {
                // Split the node if cursor is in the middle, or just insert below if at end
                const { anchor } = selection;
                const end = Editor.end(editor, path);

                if (Point.equals(anchor, end)) {
                    // Cursor at end - insert new paragraph below
                    Transforms.insertNodes(editor, {
                        type: "paragraph",
                        children: [{ text: "" }],
                    });
                } else {
                    // Cursor in middle - split and convert the second part to paragraph
                    Transforms.splitNodes(editor);
                    Transforms.setNodes(editor, { type: "paragraph" });
                }
                return;
            }

            // Handle list exit behavior
            if (
                SlateElement.isElement(node) &&
                node.type === "list-item" &&
                Editor.string(editor, path) === ""
            ) {
                // Empty list item - check if parent is a list
                const parent = Editor.parent(editor, path);
                if (
                    parent &&
                    SlateElement.isElement(parent[0]) &&
                    LIST_TYPES.includes(parent[0].type as string)
                ) {
                    // Remove the empty list item
                    Transforms.removeNodes(editor, { at: path });

                    // Get the next path after the list
                    const [, parentPath] = parent;
                    const nextPath = [...parentPath];
                    nextPath[nextPath.length - 1] += 1;

                    // Insert a new paragraph after the list
                    Transforms.insertNodes(
                        editor,
                        {
                            type: "paragraph",
                            children: [{ text: "" }],
                        },
                        { at: nextPath },
                    );

                    // Move selection to the new paragraph
                    Transforms.select(editor, nextPath);
                    return;
                }
            }
        }

        insertBreak();
    };

    editor.insertText = (text: string) => {
        const { selection } = editor;

        if (text === " " && selection && Range.isCollapsed(selection)) {
            const { anchor } = selection;
            const block = Editor.above(editor, {
                match: (n) =>
                    SlateElement.isElement(n) && Editor.isBlock(editor, n),
            });
            const path = block ? block[1] : [];
            const start = Editor.start(editor, path);
            const range = { anchor, focus: start };
            const beforeText = Editor.string(editor, range);

            if (
                beforeText === "#" &&
                block &&
                SlateElement.isElement(block[0]) &&
                block[0].type === "paragraph"
            ) {
                Transforms.select(editor, range);
                Transforms.delete(editor);
                Transforms.setNodes(
                    editor,
                    { type: "heading-one" },
                    {
                        match: (n) =>
                            SlateElement.isElement(n) &&
                            Editor.isBlock(editor, n),
                    },
                );
                return;
            }

            if (
                beforeText === "##" &&
                block &&
                SlateElement.isElement(block[0]) &&
                block[0].type === "paragraph"
            ) {
                Transforms.select(editor, range);
                Transforms.delete(editor);
                Transforms.setNodes(
                    editor,
                    { type: "heading-two" },
                    {
                        match: (n) =>
                            SlateElement.isElement(n) &&
                            Editor.isBlock(editor, n),
                    },
                );
                return;
            }

            if (
                beforeText === "###" &&
                block &&
                SlateElement.isElement(block[0]) &&
                block[0].type === "paragraph"
            ) {
                Transforms.select(editor, range);
                Transforms.delete(editor);
                Transforms.setNodes(
                    editor,
                    { type: "heading-three" },
                    {
                        match: (n) =>
                            SlateElement.isElement(n) &&
                            Editor.isBlock(editor, n),
                    },
                );
                return;
            }

            if (beforeText === "*" || beforeText === "-") {
                Transforms.select(editor, range);
                Transforms.delete(editor);
                Transforms.setNodes(
                    editor,
                    { type: "list-item" },
                    {
                        match: (n) =>
                            SlateElement.isElement(n) &&
                            Editor.isBlock(editor, n),
                    },
                );

                Transforms.wrapNodes(editor, {
                    type: "bulleted-list",
                    children: [],
                });
                return;
            }

            if (beforeText === "1.") {
                Transforms.select(editor, range);
                Transforms.delete(editor);
                Transforms.setNodes(
                    editor,
                    { type: "list-item" },
                    {
                        match: (n) =>
                            SlateElement.isElement(n) &&
                            Editor.isBlock(editor, n),
                    },
                );

                Transforms.wrapNodes(editor, {
                    type: "numbered-list",
                    children: [],
                });
                return;
            }

            if (beforeText === ">") {
                Transforms.select(editor, range);
                Transforms.delete(editor);
                Transforms.setNodes(
                    editor,
                    { type: "block-quote" },
                    {
                        match: (n) =>
                            SlateElement.isElement(n) &&
                            Editor.isBlock(editor, n),
                    },
                );
                return;
            }
        }

        insertText(text);
    };

    return editor;
};

const SlateEditor: React.FC<SlateEditorProps> = ({
    value,
    onChange,
    onHtmlChange,
    placeholder = "Start writing...",
    readOnly = false,
}) => {
    const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [mediaUrl, setMediaUrl] = useState("");
    const [linkUrl, setLinkUrl] = useState("");
    const [linkText, setLinkText] = useState("");
    const [isEditingLink, setIsEditingLink] = useState(false);
    const [editingLinkRange, setEditingLinkRange] = useState<Range | null>(
        null,
    );

    const renderElement = useCallback(
        (props: any) => <Element {...props} />,
        [],
    );
    const renderLeaf = useCallback((props: any) => <Leaf {...props} />, []);

    const editor = useMemo(
        () =>
            withHistory(
                withReact(
                    withLinkHandling(withMarkdownShortcuts(createEditor())),
                ),
            ),
        [],
    );

    // Convert Slate value to HTML when it changes
    useEffect(() => {
        if (onHtmlChange) {
            const html = serializeToHtml(value);
            onHtmlChange(html);
        }
    }, [value, onHtmlChange]);

    const handleKeyDown = (event: React.KeyboardEvent) => {
        // Handle undo/redo first for reliability
        if (isHotkey("mod+z", event)) {
            event.preventDefault();
            if ((editor as any).undo) {
                (editor as any).undo();
            }
            return;
        }

        if (isHotkey("mod+shift+z", event)) {
            event.preventDefault();
            if ((editor as any).redo) {
                (editor as any).redo();
            }
            return;
        }

        // Handle other formatting shortcuts
        for (const hotkey in HOTKEYS) {
            if (
                isHotkey(hotkey, event) &&
                hotkey !== "mod+z" &&
                hotkey !== "mod+shift+z"
            ) {
                event.preventDefault();
                const action = HOTKEYS[hotkey as keyof typeof HOTKEYS];
                toggleMark(editor, action);
                return;
            }
        }
    };

    const insertMedia = () => {
        if (!mediaUrl) return;

        const image: CustomElement = {
            type: "image" as const,
            url: mediaUrl,
            children: [{ text: "" }],
        };

        Transforms.insertNodes(editor, image);
        setMediaUrl("");
        setMediaDialogOpen(false);
    };

    const openLinkDialog = () => {
        const { selection } = editor;

        if (selection) {
            // Check if cursor is on an existing link
            const [linkNode] = Array.from(
                Editor.nodes(editor, {
                    at: selection,
                    match: (n) => SlateText.isText(n) && !!(n as any).link,
                }),
            );

            if (linkNode) {
                // Editing existing link
                const [node, path] = linkNode;
                const linkTextContent = Editor.string(editor, path);
                const linkUrlContent = (node as any).link;

                setLinkText(linkTextContent);
                setLinkUrl(linkUrlContent);
                setIsEditingLink(true);
                setEditingLinkRange({
                    anchor: Editor.start(editor, path),
                    focus: Editor.end(editor, path),
                });
            } else {
                // Creating new link
                if (!Range.isCollapsed(selection)) {
                    // Text is selected, use it as link text
                    setLinkText(Editor.string(editor, selection));
                } else {
                    // No selection, clear link text
                    setLinkText("");
                }
                setLinkUrl("");
                setIsEditingLink(false);
                setEditingLinkRange(null);
            }
        } else {
            // No selection, creating new link
            setLinkText("");
            setLinkUrl("");
            setIsEditingLink(false);
            setEditingLinkRange(null);
        }

        // Use setTimeout to ensure the dialog opens after the click event
        setTimeout(() => {
            setLinkDialogOpen(true);
        }, 0);
    };

    const insertLink = () => {
        if (!linkUrl.trim()) return;

        if (isEditingLink && editingLinkRange) {
            // Editing existing link
            Transforms.select(editor, editingLinkRange);

            // Replace the selected text with new link text and URL
            Transforms.insertText(editor, linkText || linkUrl);

            // Apply link formatting to the newly inserted text
            const newSelection = editor.selection;
            if (newSelection) {
                const startPoint = {
                    path: newSelection.anchor.path,
                    offset:
                        newSelection.anchor.offset -
                        (linkText || linkUrl).length,
                };
                const linkRange = {
                    anchor: startPoint,
                    focus: newSelection.anchor,
                };

                Transforms.setNodes(
                    editor,
                    { link: linkUrl },
                    {
                        at: linkRange,
                        match: (n) => SlateText.isText(n),
                        split: true,
                    },
                );
            }

            // Move cursor to end and remove link mark
            Transforms.collapse(editor, { edge: "end" });
            Editor.removeMark(editor, "link");
        } else if (editor.selection) {
            // Creating new link
            if (Range.isCollapsed(editor.selection)) {
                // No selection, insert new link text
                const text = linkText || linkUrl;

                // Insert text with link formatting
                Transforms.insertText(editor, text);

                // Apply link formatting to the inserted text
                const newSelection = editor.selection;
                if (newSelection) {
                    const startPoint = {
                        path: newSelection.anchor.path,
                        offset: newSelection.anchor.offset - text.length,
                    };
                    const linkRange = {
                        anchor: startPoint,
                        focus: newSelection.anchor,
                    };

                    Transforms.setNodes(
                        editor,
                        { link: linkUrl },
                        {
                            at: linkRange,
                            match: (n) => SlateText.isText(n),
                            split: true,
                        },
                    );
                }

                // Remove link mark to prevent extension
                Editor.removeMark(editor, "link");
            } else {
                // Text is selected, apply link to selection
                Transforms.setNodes(
                    editor,
                    { link: linkUrl },
                    {
                        match: (n) => SlateText.isText(n),
                        split: true,
                    },
                );

                // Move cursor to end and remove link mark
                Transforms.collapse(editor, { edge: "end" });
                Editor.removeMark(editor, "link");
            }
        }

        setLinkUrl("");
        setLinkText("");
        setIsEditingLink(false);
        setEditingLinkRange(null);
        setLinkDialogOpen(false);
    };

    const removeLink = () => {
        if (isEditingLink && editingLinkRange) {
            // Remove link formatting from the selected range
            Transforms.setNodes(
                editor,
                { link: undefined },
                {
                    at: editingLinkRange,
                    match: (n) => SlateText.isText(n),
                    split: true,
                },
            );

            // Close dialog and reset state
            setLinkUrl("");
            setLinkText("");
            setIsEditingLink(false);
            setEditingLinkRange(null);
            setLinkDialogOpen(false);
        }
    };

    return (
        <div className="border border-gray-300 rounded-lg overflow-hidden">
            {/* Toolbar */}
            {!readOnly && (
                <div className="border-b border-gray-300 p-2 bg-gray-50 flex flex-wrap gap-1">
                    {/* Undo/Redo */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onMouseDown={(event) => {
                            event.preventDefault();
                            (editor as any).undo();
                        }}
                        disabled={!canUndo(editor)}
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo size={16} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onMouseDown={(event) => {
                            event.preventDefault();
                            (editor as any).redo();
                        }}
                        disabled={!canRedo(editor)}
                        title="Redo (Ctrl+Shift+Z)"
                    >
                        <Redo size={16} />
                    </Button>

                    <div className="w-px h-6 bg-gray-300 mx-1" />

                    {/* Text formatting */}
                    <MarkButton
                        format="bold"
                        icon={<Bold size={16} />}
                        editor={editor}
                    />
                    <MarkButton
                        format="italic"
                        icon={<Italic size={16} />}
                        editor={editor}
                    />
                    <MarkButton
                        format="underline"
                        icon={<Underline size={16} />}
                        editor={editor}
                    />
                    <MarkButton
                        format="strikethrough"
                        icon={<Strikethrough size={16} />}
                        editor={editor}
                    />
                    <MarkButton
                        format="code"
                        icon={<Code size={16} />}
                        editor={editor}
                    />

                    <div className="w-px h-6 bg-gray-300 mx-1" />

                    {/* Headings */}
                    <BlockButton
                        format="heading-one"
                        icon={<Heading1 size={16} />}
                        editor={editor}
                    />
                    <BlockButton
                        format="heading-two"
                        icon={<Heading2 size={16} />}
                        editor={editor}
                    />
                    <BlockButton
                        format="heading-three"
                        icon={<Heading3 size={16} />}
                        editor={editor}
                    />

                    <div className="w-px h-6 bg-gray-300 mx-1" />

                    {/* Lists */}
                    <BlockButton
                        format="bulleted-list"
                        icon={<List size={16} />}
                        editor={editor}
                    />
                    <BlockButton
                        format="numbered-list"
                        icon={<ListOrdered size={16} />}
                        editor={editor}
                    />
                    <BlockButton
                        format="block-quote"
                        icon={<Quote size={16} />}
                        editor={editor}
                    />

                    <div className="w-px h-6 bg-gray-300 mx-1" />

                    {/* Alignment */}
                    <AlignButton
                        format="left"
                        icon={<AlignLeft size={16} />}
                        editor={editor}
                    />
                    <AlignButton
                        format="center"
                        icon={<AlignCenter size={16} />}
                        editor={editor}
                    />
                    <AlignButton
                        format="right"
                        icon={<AlignRight size={16} />}
                        editor={editor}
                    />

                    <div className="w-px h-6 bg-gray-300 mx-1" />

                    {/* Media and Links */}
                    <Dialog
                        open={linkDialogOpen}
                        onOpenChange={setLinkDialogOpen}
                    >
                        <DialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    openLinkDialog();
                                }}
                            >
                                <Link size={16} />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {isEditingLink
                                        ? "Edit Link"
                                        : "Insert Link"}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="link-text">Link Text</Label>
                                    <Input
                                        id="link-text"
                                        value={linkText}
                                        onChange={(e) =>
                                            setLinkText(e.target.value)
                                        }
                                        placeholder="Link text"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="link-url">URL</Label>
                                    <Input
                                        id="link-url"
                                        value={linkUrl}
                                        onChange={(e) =>
                                            setLinkUrl(e.target.value)
                                        }
                                        placeholder="https://example.com"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={insertLink}
                                        disabled={!linkUrl.trim()}
                                    >
                                        {isEditingLink
                                            ? "Update Link"
                                            : "Insert Link"}
                                    </Button>
                                    {isEditingLink && (
                                        <Button
                                            variant="destructive"
                                            onClick={removeLink}
                                        >
                                            Remove Link
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setLinkDialogOpen(false);
                                            setLinkUrl("");
                                            setLinkText("");
                                            setIsEditingLink(false);
                                            setEditingLinkRange(null);
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog
                        open={mediaDialogOpen}
                        onOpenChange={setMediaDialogOpen}
                    >
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <Image size={16} />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Insert Media</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="media-url">Media URL</Label>
                                    <Input
                                        id="media-url"
                                        value={mediaUrl}
                                        onChange={(e) =>
                                            setMediaUrl(e.target.value)
                                        }
                                        placeholder="https://example.com/image.jpg"
                                    />
                                </div>
                                <Button onClick={insertMedia}>
                                    Insert Media
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            )}

            {/* Editor */}
            <Slate
                editor={editor}
                initialValue={value}
                onValueChange={onChange}
            >
                <div className="relative">
                    <Editable
                        renderElement={renderElement}
                        renderLeaf={renderLeaf}
                        placeholder={placeholder}
                        onKeyDown={handleKeyDown}
                        readOnly={readOnly}
                        className="p-4 min-h-[400px] focus:outline-none"
                        spellCheck
                        autoFocus
                    />
                    {!readOnly && <SelectionToolbar />}
                </div>
            </Slate>
        </div>
    );
};

// Element renderer
const Element = ({ attributes, children, element }: any) => {
    const style = { textAlign: element.align };

    switch (element.type) {
        case "block-quote":
            return (
                <blockquote
                    style={style}
                    {...attributes}
                    className="border-l-4 border-gray-300 pl-4 italic my-4"
                >
                    {children}
                </blockquote>
            );
        case "bulleted-list":
            return (
                <ul
                    style={style}
                    {...attributes}
                    className="list-disc list-inside my-4"
                >
                    {children}
                </ul>
            );
        case "heading-one":
            return (
                <h1
                    style={style}
                    {...attributes}
                    className="text-3xl font-bold my-4"
                >
                    {children}
                </h1>
            );
        case "heading-two":
            return (
                <h2
                    style={style}
                    {...attributes}
                    className="text-2xl font-semibold my-3"
                >
                    {children}
                </h2>
            );
        case "heading-three":
            return (
                <h3
                    style={style}
                    {...attributes}
                    className="text-xl font-medium my-2"
                >
                    {children}
                </h3>
            );
        case "list-item":
            return (
                <li {...attributes} className="my-1">
                    {children}
                </li>
            );
        case "numbered-list":
            return (
                <ol
                    style={style}
                    {...attributes}
                    className="list-decimal list-inside my-4"
                >
                    {children}
                </ol>
            );
        case "image":
            return (
                <div {...attributes}>
                    <div contentEditable={false} className="my-4">
                        <img
                            src={element.url}
                            alt=""
                            className="max-w-full h-auto rounded"
                        />
                    </div>
                    {children}
                </div>
            );
        default:
            return (
                <p style={style} {...attributes} className="my-2">
                    {children}
                </p>
            );
    }
};

// Leaf renderer for text formatting
const Leaf = ({ attributes, children, leaf }: any) => {
    if (leaf.bold) {
        children = <strong>{children}</strong>;
    }

    if (leaf.code) {
        children = (
            <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
                {children}
            </code>
        );
    }

    if (leaf.italic) {
        children = <em>{children}</em>;
    }

    if (leaf.underline) {
        children = <u>{children}</u>;
    }

    if (leaf.strikethrough) {
        children = <s>{children}</s>;
    }

    // Handle inline links as text formatting
    if (leaf.link) {
        children = (
            <a
                href={leaf.link}
                className="text-blue-600 underline hover:text-blue-800"
                target="_blank"
                rel="noopener noreferrer"
            >
                {children}
            </a>
        );
    }

    return <span {...attributes}>{children}</span>;
};

// Button components
const MarkButton = ({ format, icon, editor }: any) => {
    return (
        <Button
            variant={isMarkActive(editor, format) ? "default" : "ghost"}
            size="sm"
            onMouseDown={(event) => {
                event.preventDefault();
                toggleMark(editor, format);
            }}
        >
            {icon}
        </Button>
    );
};

const BlockButton = ({ format, icon, editor }: any) => {
    return (
        <Button
            variant={isBlockActive(editor, format) ? "default" : "ghost"}
            size="sm"
            onMouseDown={(event) => {
                event.preventDefault();
                toggleBlock(editor, format);
            }}
        >
            {icon}
        </Button>
    );
};

const AlignButton = ({ format, icon, editor }: any) => {
    return (
        <Button
            variant={
                isBlockActive(editor, format, "align") ? "default" : "ghost"
            }
            size="sm"
            onMouseDown={(event) => {
                event.preventDefault();
                toggleAlign(editor, format);
            }}
        >
            {icon}
        </Button>
    );
};

// Helper functions
const isMarkActive = (editor: Editor, format: string) => {
    const marks = Editor.marks(editor);
    return marks ? (marks as any)[format] === true : false;
};

const toggleMark = (editor: Editor, format: string) => {
    const isActive = isMarkActive(editor, format);

    if (isActive) {
        Editor.removeMark(editor, format);
    } else {
        Editor.addMark(editor, format, true);
    }
};

const isBlockActive = (editor: Editor, format: string, blockType = "type") => {
    const { selection } = editor;
    if (!selection) return false;

    const [match] = Array.from(
        Editor.nodes(editor, {
            at: Editor.unhangRange(editor, selection),
            match: (n) =>
                !Editor.isEditor(n) &&
                SlateElement.isElement(n) &&
                (n as any)[blockType] === format,
        }),
    );

    return !!match;
};

const toggleBlock = (editor: Editor, format: string) => {
    const isActive = isBlockActive(
        editor,
        format,
        TEXT_ALIGN_TYPES.includes(format) ? "align" : "type",
    );
    const isList = LIST_TYPES.includes(format);

    Transforms.unwrapNodes(editor, {
        match: (n) =>
            !Editor.isEditor(n) &&
            SlateElement.isElement(n) &&
            LIST_TYPES.includes((n as any).type) &&
            !TEXT_ALIGN_TYPES.includes(format),
        split: true,
    });

    let newProperties: Partial<SlateElement>;
    if (TEXT_ALIGN_TYPES.includes(format)) {
        newProperties = {
            align: isActive ? undefined : format,
        } as Partial<SlateElement>;
    } else {
        newProperties = {
            type: isActive ? "paragraph" : (format as any),
        } as Partial<SlateElement>;
    }

    Transforms.setNodes<SlateElement>(editor, newProperties);

    if (!isActive && isList) {
        const block = { type: format, children: [] } as SlateElement;
        Transforms.wrapNodes(editor, block);
    }
};

const toggleAlign = (editor: Editor, format: string) => {
    const isActive = isBlockActive(editor, format, "align");
    Transforms.setNodes(
        editor,
        { align: isActive ? undefined : format } as any,
        {
            match: (n) =>
                !Editor.isEditor(n) &&
                SlateElement.isElement(n) &&
                Editor.isBlock(editor, n),
        },
    );
};

export default SlateEditor;
