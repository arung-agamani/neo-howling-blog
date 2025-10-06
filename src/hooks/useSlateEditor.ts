"use client";

import { useState, useCallback, useMemo } from "react";
import { Descendant, Element as SlateElement, Text } from "slate";

export interface UseSlateEditorOptions {
    initialValue?: Descendant[];
    onContentChange?: (content: Descendant[]) => void;
    onHtmlChange?: (html: string) => void;
}

export interface UseSlateEditorReturn {
    value: Descendant[];
    setValue: (value: Descendant[]) => void;
    htmlContent: string;
    setHtmlContent: (html: string) => void;
    resetEditor: () => void;
    isEmpty: boolean;
}

const DEFAULT_INITIAL_VALUE: Descendant[] = [
    {
        type: "paragraph",
        children: [{ text: "" }],
    },
];

export const useSlateEditor = (
    options: UseSlateEditorOptions = {},
): UseSlateEditorReturn => {
    const {
        initialValue = DEFAULT_INITIAL_VALUE,
        onContentChange,
        onHtmlChange,
    } = options;

    const [value, setValue] = useState<Descendant[]>(initialValue);
    const [htmlContent, setHtmlContent] = useState<string>("");

    const handleValueChange = useCallback(
        (newValue: Descendant[]) => {
            setValue(newValue);
            onContentChange?.(newValue);
        },
        [onContentChange],
    );

    const handleHtmlChange = useCallback(
        (html: string) => {
            setHtmlContent(html);
            onHtmlChange?.(html);
        },
        [onHtmlChange],
    );

    const resetEditor = useCallback(() => {
        setValue(DEFAULT_INITIAL_VALUE);
        setHtmlContent("");
    }, []);

    const isEmpty = useMemo(() => {
        if (value.length === 0) return true;
        if (value.length === 1) {
            const firstNode = value[0];
            if (
                SlateElement.isElement(firstNode) &&
                firstNode.type === "paragraph" &&
                firstNode.children.length === 1
            ) {
                const firstChild = firstNode.children[0];
                return (
                    Text.isText(firstChild) &&
                    (!firstChild.text || firstChild.text.trim() === "")
                );
            }
        }
        return false;
    }, [value]);

    return {
        value,
        setValue: handleValueChange,
        htmlContent,
        setHtmlContent: handleHtmlChange,
        resetEditor,
        isEmpty,
    };
};

// Helper function to create initial value from HTML or markdown
export const createInitialValueFromHtml = (html: string): Descendant[] => {
    // This is a basic implementation - you might want to use a proper HTML parser
    if (!html || html.trim() === "") {
        return DEFAULT_INITIAL_VALUE;
    }

    // For now, return a simple paragraph with the HTML as text
    // In a real implementation, you'd want to parse the HTML properly
    return [
        {
            type: "paragraph",
            children: [{ text: html }],
        },
    ];
};

// Helper function to serialize Slate value to plain text
export const serializeToPlainText = (nodes: Descendant[]): string => {
    return nodes
        .map((n) => {
            if (Text.isText(n)) {
                return n.text;
            }
            if (SlateElement.isElement(n)) {
                return serializeToPlainText(n.children as Descendant[]);
            }
            return "";
        })
        .join("");
};

// Helper function to get word count
export const getWordCount = (nodes: Descendant[]): number => {
    const text = serializeToPlainText(nodes);
    if (!text.trim()) return 0;
    return text.trim().split(/\s+/).length;
};

// Helper function to estimate reading time (average 200 words per minute)
export const getReadingTime = (nodes: Descendant[]): number => {
    const wordCount = getWordCount(nodes);
    return Math.ceil(wordCount / 200);
};
