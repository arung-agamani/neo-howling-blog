"use client";

import React, { useState } from "react";
import { Descendant } from "slate";
import SlateEditor from "./SlateEditor";
import { useSlateEditor } from "@/hooks/useSlateEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Info } from "lucide-react";

// Test cases for WYSIWYG behaviors
const TEST_SCENARIOS = [
    {
        id: 1,
        name: "Heading Exit Behavior",
        description:
            "Type a heading, press Enter - should create new paragraph BELOW (keeping heading intact)",
        steps: [
            "1. Type: # My Heading",
            "2. Press Enter at the end",
            "3. ✅ Should create new paragraph below",
            "4. ❌ Should NOT convert heading to paragraph",
        ],
    },
    {
        id: 2,
        name: "List Exit with Double Enter",
        description: "Create list, press Enter twice to exit list mode",
        steps: [
            "1. Type: * First item",
            "2. Press Enter (creates new bullet)",
            "3. Press Enter again on empty bullet",
            "4. ✅ Should exit list and create paragraph",
        ],
    },
    {
        id: 3,
        name: "Link Context Exit",
        description:
            "Insert link, continue typing - should not extend the link",
        steps: [
            "1. Click Link button in toolbar",
            "2. Enter text and URL, submit",
            "3. Continue typing after link",
            "4. ✅ New text should be normal (not part of link)",
        ],
    },
    {
        id: 4,
        name: "Undo/Redo Functionality",
        description: "Ctrl+Z should undo actions, Ctrl+Shift+Z should redo",
        steps: [
            "1. Type some text and format it",
            "2. Press Ctrl+Z (or Cmd+Z on Mac)",
            "3. ✅ Should undo the last action",
            "4. Press Ctrl+Shift+Z to redo",
        ],
    },
    {
        id: 5,
        name: "Inline Link Behavior",
        description:
            "Test that links work as inline formatting and don't extend when typing",
        steps: [
            "1. Type: 'Check out this amazing website for info'",
            "2. Select 'amazing website' text",
            "3. ✅ Should see floating toolbar with link option",
            "4. Click link button, enter URL (e.g., https://example.com)",
            "5. ✅ Link should be inline span (blue, underlined)",
            "6. Click RIGHT AFTER the link and type ' here'",
            "7. ✅ Text 'here' should NOT be part of link (not blue)",
            "8. ✅ HTML should be: <p>Check out this <a>amazing website</a> here for info</p>",
        ],
    },
    {
        id: 6,
        name: "Toolbar Link Insert/Edit",
        description:
            "Test toolbar link button for inserting new links and editing existing ones",
        steps: [
            "1. Click the link button in the main toolbar (not floating)",
            "2. Enter 'Example Site' as link text and 'https://example.com' as URL",
            "3. Click 'Insert Link'",
            "4. ✅ Link should be inserted at cursor position",
            "5. Click inside the link text you just created",
            "6. Click the toolbar link button again",
            "7. ✅ Dialog should open with current text and URL populated",
            "8. Change URL to 'https://newsite.com' and click 'Update Link'",
            "9. ✅ Link should be updated with new URL",
            "10. Click 'Remove Link' to test link removal",
        ],
    },
];

const EditorBehaviorTest: React.FC = () => {
    const [testResults, setTestResults] = useState<Record<number, boolean>>({});
    const [currentTest, setCurrentTest] = useState<number | null>(null);

    const { value, setValue, htmlContent, resetEditor, isEmpty } =
        useSlateEditor({
            onContentChange: (content) => {
                console.log("Content changed:", content);
            },
            onHtmlChange: (html) => {
                console.log("HTML output:", html);
            },
        });

    const markTestResult = (testId: number, passed: boolean) => {
        setTestResults((prev) => ({
            ...prev,
            [testId]: passed,
        }));
    };

    const startTest = (testId: number) => {
        setCurrentTest(testId);
        resetEditor();
    };

    const resetAllTests = () => {
        setTestResults({});
        setCurrentTest(null);
        resetEditor();
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">
                    Slate Editor Behavior Tests
                </h1>
                <p className="text-gray-600">
                    Test WYSIWYG behaviors similar to Notion/Logseq
                </p>
                <Button
                    onClick={resetAllTests}
                    variant="outline"
                    className="mt-4"
                >
                    Reset All Tests
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Test Scenarios */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Test Scenarios</h2>
                    {TEST_SCENARIOS.map((test) => (
                        <Card key={test.id} className="relative">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">
                                        {test.name}
                                    </CardTitle>
                                    <div className="flex items-center gap-2">
                                        {testResults[test.id] !== undefined &&
                                            (testResults[test.id] ? (
                                                <CheckCircle className="w-5 h-5 text-green-500" />
                                            ) : (
                                                <XCircle className="w-5 h-5 text-red-500" />
                                            ))}
                                        <Button
                                            size="sm"
                                            onClick={() => startTest(test.id)}
                                            variant={
                                                currentTest === test.id
                                                    ? "default"
                                                    : "outline"
                                            }
                                        >
                                            {currentTest === test.id
                                                ? "Testing..."
                                                : "Start Test"}
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600">
                                    {test.description}
                                </p>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-1">
                                    {test.steps.map((step, index) => (
                                        <div key={index} className="text-sm">
                                            {step}
                                        </div>
                                    ))}
                                </div>
                                {currentTest === test.id && (
                                    <div className="mt-4 flex gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() =>
                                                markTestResult(test.id, true)
                                            }
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            ✅ Pass
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() =>
                                                markTestResult(test.id, false)
                                            }
                                            variant="destructive"
                                        >
                                            ❌ Fail
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Editor Testing Area */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Test Editor</h2>
                        <div className="flex items-center gap-2">
                            {currentTest && (
                                <Badge variant="outline">
                                    Testing:{" "}
                                    {
                                        TEST_SCENARIOS.find(
                                            (t) => t.id === currentTest,
                                        )?.name
                                    }
                                </Badge>
                            )}
                        </div>
                    </div>

                    <Card>
                        <CardContent className="p-0">
                            <SlateEditor
                                value={value}
                                onChange={setValue}
                                placeholder="Follow the test steps here..."
                            />
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">
                                Quick Test Actions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button
                                onClick={() => {
                                    setValue([
                                        {
                                            type: "heading-one",
                                            children: [
                                                { text: "Test Heading" },
                                            ],
                                        },
                                        {
                                            type: "paragraph",
                                            children: [
                                                {
                                                    text: "Cursor here - press Enter to test heading behavior",
                                                },
                                            ],
                                        },
                                    ] as any);
                                }}
                                variant="outline"
                                size="sm"
                                className="w-full"
                            >
                                Setup Heading Test
                            </Button>

                            <Button
                                onClick={() => {
                                    setValue([
                                        {
                                            type: "bulleted-list",
                                            children: [
                                                {
                                                    type: "list-item",
                                                    children: [
                                                        { text: "First item" },
                                                    ],
                                                },
                                                {
                                                    type: "list-item",
                                                    children: [{ text: "" }],
                                                },
                                            ],
                                        },
                                    ] as any);
                                }}
                                variant="outline"
                                size="sm"
                                className="w-full"
                            >
                                Setup List Exit Test
                            </Button>

                            <Button
                                onClick={() => {
                                    setValue([
                                        {
                                            type: "paragraph",
                                            children: [
                                                {
                                                    text: "Type here, format text, then test ",
                                                },
                                                { text: "Ctrl+Z", code: true },
                                                { text: " and " },
                                                {
                                                    text: "Ctrl+Shift+Z",
                                                    code: true,
                                                },
                                            ],
                                        },
                                    ] as any);
                                }}
                                variant="outline"
                                size="sm"
                                className="w-full"
                            >
                                Setup Undo/Redo Test
                            </Button>

                            <Button
                                onClick={() => {
                                    setValue([
                                        {
                                            type: "paragraph",
                                            children: [
                                                {
                                                    text: "Check out this website for more info. Select text to test link creation.",
                                                },
                                            ],
                                        },
                                    ] as any);
                                }}
                                variant="outline"
                                size="sm"
                                className="w-full"
                            >
                                Setup Link Selection Test
                            </Button>

                            <Button
                                onClick={() => {
                                    setValue([
                                        {
                                            type: "paragraph",
                                            children: [
                                                {
                                                    text: "Click the toolbar link button to test insert/edit functionality.",
                                                },
                                            ],
                                        },
                                    ] as any);
                                }}
                                variant="outline"
                                size="sm"
                                className="w-full"
                            >
                                Setup Toolbar Link Test
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Debug Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Info className="w-5 h-5" />
                                Debug Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <strong>Empty:</strong>{" "}
                                    {isEmpty ? "Yes" : "No"}
                                </div>
                                <div>
                                    <strong>Nodes:</strong> {value.length}
                                </div>
                                <details className="mt-2">
                                    <summary className="cursor-pointer font-medium">
                                        View Slate Structure
                                    </summary>
                                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                                        {JSON.stringify(value, null, 2)}
                                    </pre>
                                </details>
                                <details className="mt-2">
                                    <summary className="cursor-pointer font-medium">
                                        View HTML Output
                                    </summary>
                                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                                        {htmlContent || "<p>No content</p>"}
                                    </pre>
                                </details>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Test Results Summary */}
            {Object.keys(testResults).length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Test Results Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {TEST_SCENARIOS.map((test) => (
                                <div key={test.id} className="text-center">
                                    <div className="text-sm font-medium">
                                        {test.name}
                                    </div>
                                    <div className="mt-1">
                                        {testResults[test.id] !== undefined ? (
                                            testResults[test.id] ? (
                                                <Badge className="bg-green-500">
                                                    Passed
                                                </Badge>
                                            ) : (
                                                <Badge variant="destructive">
                                                    Failed
                                                </Badge>
                                            )
                                        ) : (
                                            <Badge variant="outline">
                                                Not Tested
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 text-center">
                            <div className="text-lg font-semibold">
                                Overall Score:{" "}
                                {
                                    Object.values(testResults).filter(Boolean)
                                        .length
                                }{" "}
                                / {Object.keys(testResults).length}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default EditorBehaviorTest;
