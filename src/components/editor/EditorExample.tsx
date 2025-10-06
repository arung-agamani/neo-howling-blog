"use client";

import React, { useState } from "react";
import { Descendant } from "slate";
import SlateEditor from "./SlateEditor";
import { useSlateEditor } from "@/hooks/useSlateEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Example initial content
const EXAMPLE_INITIAL_VALUE: Descendant[] = [
    {
        type: "heading-one",
        children: [{ text: "Welcome to the Slate Editor" }],
    } as any,
    {
        type: "paragraph",
        children: [
            { text: "This is a " },
            { text: "rich text editor", bold: true },
            {
                text: " built with Slate.js. You can format text, create lists, add links, and more!",
            },
        ],
    } as any,
    {
        type: "heading-two",
        children: [{ text: "Features" }],
    } as any,
    {
        type: "bulleted-list",
        children: [
            {
                type: "list-item",
                children: [
                    {
                        text: "Bold, italic, underline, and strikethrough formatting",
                    },
                ],
            } as any,
            {
                type: "list-item",
                children: [{ text: "Multiple heading levels" }],
            } as any,
            {
                type: "list-item",
                children: [{ text: "Bulleted and numbered lists" }],
            } as any,
            {
                type: "list-item",
                children: [{ text: "Blockquotes and code formatting" }],
            } as any,
            {
                type: "list-item",
                children: [{ text: "Links and images" }],
            } as any,
        ],
    } as any,
    {
        type: "heading-three",
        children: [{ text: "Markdown Shortcuts" }],
    } as any,
    {
        type: "paragraph",
        children: [
            { text: "Try typing " },
            { text: "#", code: true },
            { text: " followed by a space to create a heading, or " },
            { text: "*", code: true },
            { text: " for a bullet point!" },
        ],
    } as any,
    {
        type: "block-quote",
        children: [
            { text: "This is a blockquote. You can create one by typing " },
            { text: ">", code: true },
            { text: " followed by a space." },
        ],
    } as any,
    {
        type: "paragraph",
        children: [{ text: "Start editing to see the editor in action!" }],
    } as any,
];

interface EditorExampleProps {
    readOnly?: boolean;
    showOutput?: boolean;
}

const EditorExample: React.FC<EditorExampleProps> = ({
    readOnly = false,
    showOutput = true,
}) => {
    const [showHtml, setShowHtml] = useState(false);

    const { value, setValue, htmlContent, resetEditor, isEmpty } =
        useSlateEditor({
            initialValue: EXAMPLE_INITIAL_VALUE,
            onContentChange: (content) => {
                console.log("Editor content changed:", content);
            },
            onHtmlChange: (html) => {
                console.log("HTML output:", html);
            },
        });

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Slate Editor Example</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                        Try the undo/redo functionality! Type some text, format
                        it, then use Ctrl+Z and Ctrl+Shift+Z
                    </p>
                </CardHeader>
                <CardContent>
                    <SlateEditor
                        value={value}
                        onChange={setValue}
                        placeholder="Start typing..."
                        readOnly={readOnly}
                    />
                </CardContent>
            </Card>

            {showOutput && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button
                                onClick={() => setShowHtml(!showHtml)}
                                variant="outline"
                                className="w-full"
                            >
                                {showHtml
                                    ? "Show Slate Data"
                                    : "Show HTML Output"}
                            </Button>
                            <Button
                                onClick={resetEditor}
                                variant="destructive"
                                className="w-full"
                                disabled={isEmpty}
                            >
                                Reset to Example Content
                            </Button>
                            <div className="text-sm text-gray-600 space-y-1">
                                <p className="font-medium">Test History:</p>
                                <p>• Type and format text</p>
                                <p>• Use Ctrl+Z to undo</p>
                                <p>• Use Ctrl+Shift+Z to redo</p>
                                <p>
                                    • Notice toolbar buttons disable when
                                    unavailable
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Output */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">
                                {showHtml
                                    ? "HTML Output"
                                    : "Slate Data Structure"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-80">
                                <code>
                                    {showHtml
                                        ? htmlContent || "<p>No content</p>"
                                        : JSON.stringify(value, null, 2)}
                                </code>
                            </pre>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default EditorExample;
