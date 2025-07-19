"use client";
import { Divider, Paper, Typography } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import {
    MDXEditor,
    headingsPlugin,
    listsPlugin,
    quotePlugin,
    thematicBreakPlugin,
    markdownShortcutPlugin,
    codeBlockPlugin,
    codeMirrorPlugin,
    toolbarPlugin,
    diffSourcePlugin,
    ConditionalContents,
    ChangeCodeMirrorLanguage,
    InsertCodeBlock,
    UndoRedo,
    BoldItalicUnderlineToggles,
    BlockTypeSelect,
    CodeToggle,
    CreateLink,
    InsertImage,
    ListsToggle,
    Separator,
    MDXEditorMethods,
    frontmatterPlugin,
    InsertFrontmatter,
    linkPlugin,
    ButtonWithTooltip,
    DiffSourceToggleWrapper,
} from "@mdxeditor/editor";

import "@mdxeditor/editor/style.css";
import "../../../../../(user)/post/[id]/github-markdown.css";
import { toast } from "react-toastify";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "@/utils/axios";

const SnippetEditPage = () => {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const editorRef = useRef<MDXEditorMethods>(null);

    const saveHandler = async () => {
        if (!editorRef.current) return;

        const rawMarkdown = editorRef.current.getMarkdown();
        const id = searchParams?.get("id");

        try {
            if (id) {
                // Update existing snippet
                await axios.patch(`/api/v1/snippets/${id}`, {
                    content: rawMarkdown,
                });
                toast.success("Snippet updated");
            } else {
                // Create new snippet
                await axios.post("/api/v1/snippets", {
                    content: rawMarkdown,
                });
                toast.success("Snippet created");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to save snippet");
            if (error.response?.data?.errors) {
                for (const [, value] of Object.entries(error.response.data.errors)) {
                    toast.error(`'${value}'`);
                }
            }
        }
    };

    useEffect(() => {
        (async () => {
            if (!searchParams) return setLoading(false);
            const id = searchParams.get("id");
            if (!id) return setLoading(false);
            if (!editorRef.current) return;

            try {
                const res = await axios.get("/api/v1/snippets/" + id);
                editorRef.current.setMarkdown(res.data.content);
            } catch (error) {
                editorRef.current.setMarkdown(
                    `# Error when retrieving markdown content`
                );
            } finally {
                setLoading(false);
            }
        })();
    }, []);
    return (
        <Paper className="px-4 py-2 w-full h-full">
            <Typography variant="h4">Snippet Editor</Typography>
            <Divider />
            <MDXEditor
                ref={editorRef}
                className="px-2 py-2"
                contentEditableClassName="markdown-body px-2 py-2"
                markdown={""}
                plugins={[
                    headingsPlugin(),
                    listsPlugin(),
                    quotePlugin(),
                    linkPlugin(),
                    thematicBreakPlugin(),
                    markdownShortcutPlugin(),
                    frontmatterPlugin(),
                    diffSourcePlugin(),
                    codeBlockPlugin({ defaultCodeBlockLanguage: "" }),
                    codeMirrorPlugin({
                        codeBlockLanguages: {
                            js: "JavaScript",
                            css: "CSS",
                            txt: "Plain Text",
                            tsx: "TypeScript",
                            html: "HTML",
                            yaml: "YAML",
                            sql: "SQL",
                            "": "Unspecified",
                        },
                    }),
                    toolbarPlugin({
                        toolbarContents: () => (
                            <>
                                <DiffSourceToggleWrapper>
                                    <UndoRedo />
                                    <ButtonWithTooltip
                                        title="Save"
                                        onClick={() => saveHandler()}
                                    >
                                        Save
                                    </ButtonWithTooltip>
                                    <Separator />
                                    <BoldItalicUnderlineToggles />
                                    <CodeToggle />
                                    <ListsToggle />
                                    <BlockTypeSelect />
                                    <Separator />
                                    <CreateLink />
                                    <InsertImage />
                                    <InsertFrontmatter />
                                    <ConditionalContents
                                        options={[
                                            {
                                                when: (editor) =>
                                                    editor?.editorType ===
                                                    "codeblock",
                                                contents: () => (
                                                    <ChangeCodeMirrorLanguage />
                                                ),
                                            },
                                            {
                                                fallback: () => (
                                                    <>
                                                        <InsertCodeBlock />
                                                    </>
                                                ),
                                            },
                                        ]}
                                    />
                                </DiffSourceToggleWrapper>
                            </>
                        ),
                    }),
                ]}
            />
            <Divider />
            <Typography
                variant="caption"
                component="p"
                className="text-center my-2 opacity-60"
            >
                Compose above this line
            </Typography>
        </Paper>
    );
};

export default SnippetEditPage;
