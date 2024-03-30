'use client'
import { Divider, Paper, Typography } from '@mui/material'
import React, { useRef } from 'react'
import { MDXEditor,
    headingsPlugin,
    listsPlugin,
    quotePlugin,
    thematicBreakPlugin,
    markdownShortcutPlugin,
    codeBlockPlugin,
    codeMirrorPlugin,
    toolbarPlugin,
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
    ButtonWithTooltip
} from "@mdxeditor/editor"

import '@mdxeditor/editor/style.css'
import '../../../../../(user)/post/[id]/github-markdown.css'
import { processMarkdown } from "@/lib/server-actions/Snippet";
import { toast } from "react-toastify";
// TODO: handle codeblocks

const SnippetEditPage = () => {
    const editorRef = useRef<MDXEditorMethods>(null)

    const saveHandler = async () => {
        if (!editorRef.current) return
        
        const rawMarkdown = editorRef.current.getMarkdown()
        console.log(rawMarkdown)
        const processRes = await processMarkdown(rawMarkdown)
        if (processRes.success) {
            toast.success("Snippet created")
        } else {
            toast.error(processRes.message)
        }
    }
    return (
        <Paper className='px-4 py-2 w-full h-full'>
            <Typography variant='h4'>Edit Snippet</Typography>
            <Divider />
            <MDXEditor ref={editorRef} className='px-2 py-2' contentEditableClassName='markdown-body px-2 py-2' markdown={''} plugins={[
                headingsPlugin(),
                listsPlugin(),
                quotePlugin(),
                linkPlugin(),
                thematicBreakPlugin(),
                markdownShortcutPlugin(),
                frontmatterPlugin(),
                codeBlockPlugin({ defaultCodeBlockLanguage: 'js'}),
                codeMirrorPlugin({ codeBlockLanguages: { js: 'JavaScript'}}),
                toolbarPlugin({ toolbarContents: () => (
                    <>
                    <UndoRedo />
                    <ButtonWithTooltip title='Save' onClick={() => saveHandler()}>Save</ButtonWithTooltip>
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
                            { when: (editor) => editor?.editorType === "codeblock", contents: () => <ChangeCodeMirrorLanguage />},
                            { fallback : () => (<>
                                <InsertCodeBlock />
                            </>)}
                        ]}
                    />
                    </>
                )})
            ]} />
        </Paper>
    )
}

export default SnippetEditPage